/*
Copyright 2026.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controller

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	portalv1alpha1 "github.com/hyperbench/hyperbench-operator/api/v1alpha1"
)

// WorkbenchReconciler reconciles a Workbench object
type WorkbenchReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=workbenches,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=workbenches/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=workbenches/finalizers,verbs=update
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=widgets,verbs=get;list;watch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=actions,verbs=get;list;watch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=navigationnodes,verbs=get;list;watch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=serviceproxies,verbs=get;list;watch

// Reconcile reads the Workbench CR and validates all cross-references to other CRDs
// (Widgets, Actions, NavigationNodes, ServiceProxies). The dashboard queries K8s
// APIs directly for the resolved configuration.
func (r *WorkbenchReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	// Fetch the Workbench CR
	workbench := &portalv1alpha1.Workbench{}
	if err := r.Get(ctx, req.NamespacedName, workbench); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Workbench resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling Workbench", "name", workbench.Name)

	// Validate the spec
	if err := r.validateSpec(workbench); err != nil {
		meta.SetStatusCondition(&workbench.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: workbench.Generation,
		})
		workbench.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, workbench); statusErr != nil {
			log.Error(statusErr, "Failed to update Workbench status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	// List all CRs in the same namespace
	namespace := workbench.Namespace

	widgetList := &portalv1alpha1.WidgetList{}
	if err := r.List(ctx, widgetList, client.InNamespace(namespace)); err != nil {
		return ctrl.Result{}, fmt.Errorf("failed to list Widgets: %w", err)
	}

	actionList := &portalv1alpha1.ActionList{}
	if err := r.List(ctx, actionList, client.InNamespace(namespace)); err != nil {
		return ctrl.Result{}, fmt.Errorf("failed to list Actions: %w", err)
	}

	navNodeList := &portalv1alpha1.NavigationNodeList{}
	if err := r.List(ctx, navNodeList, client.InNamespace(namespace)); err != nil {
		return ctrl.Result{}, fmt.Errorf("failed to list NavigationNodes: %w", err)
	}

	serviceList := &portalv1alpha1.ServiceProxyList{}
	if err := r.List(ctx, serviceList, client.InNamespace(namespace)); err != nil {
		return ctrl.Result{}, fmt.Errorf("failed to list ServiceProxies: %w", err)
	}

	// Resolve all cross-references (validates that referenced CRs exist)
	res := newResolver(widgetList.Items, actionList.Items, navNodeList.Items, serviceList.Items)
	if _, err := res.resolve(workbench); err != nil {
		meta.SetStatusCondition(&workbench.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ResolutionFailed",
			Message:            err.Error(),
			ObservedGeneration: workbench.Generation,
		})
		workbench.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, workbench); statusErr != nil {
			log.Error(statusErr, "Failed to update Workbench status")
		}
		// Don't requeue — watches on the missing CRs will trigger reconciliation
		return ctrl.Result{}, nil
	}

	// Update status to Ready
	meta.SetStatusCondition(&workbench.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "Workbench configuration is up to date",
		ObservedGeneration: workbench.Generation,
	})
	workbench.Status.Phase = "Ready"
	if err := r.Status().Update(ctx, workbench); err != nil {
		log.Error(err, "Failed to update Workbench status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled Workbench", "name", workbench.Name, "phase", workbench.Status.Phase)
	return ctrl.Result{}, nil
}

// validateSpec performs basic validation on the WorkbenchSpec.
func (r *WorkbenchReconciler) validateSpec(workbench *portalv1alpha1.Workbench) error {
	if workbench.Spec.Title == "" {
		return fmt.Errorf("spec.title is required")
	}
	if workbench.Spec.DefaultPage == "" {
		return fmt.Errorf("spec.defaultPage is required")
	}
	return nil
}

// findWorkbenchForNamespace maps any CR change to the Workbench(es) in the same namespace.
func (r *WorkbenchReconciler) findWorkbenchForNamespace(ctx context.Context, obj client.Object) []reconcile.Request {
	workbenchList := &portalv1alpha1.WorkbenchList{}
	if err := r.List(ctx, workbenchList, client.InNamespace(obj.GetNamespace())); err != nil {
		return nil
	}
	requests := make([]reconcile.Request, 0, len(workbenchList.Items))
	for _, wb := range workbenchList.Items {
		requests = append(requests, reconcile.Request{
			NamespacedName: types.NamespacedName{
				Name:      wb.Name,
				Namespace: wb.Namespace,
			},
		})
	}
	return requests
}

// SetupWithManager sets up the controller with the Manager.
// Watches all CR types so that changes to any referenced resource trigger reconciliation.
func (r *WorkbenchReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.Workbench{}).
		Watches(&portalv1alpha1.Widget{}, handler.EnqueueRequestsFromMapFunc(r.findWorkbenchForNamespace)).
		Watches(&portalv1alpha1.Action{}, handler.EnqueueRequestsFromMapFunc(r.findWorkbenchForNamespace)).
		Watches(&portalv1alpha1.NavigationNode{}, handler.EnqueueRequestsFromMapFunc(r.findWorkbenchForNamespace)).
		Watches(&portalv1alpha1.ServiceProxy{}, handler.EnqueueRequestsFromMapFunc(r.findWorkbenchForNamespace)).
		Named("workbench").
		Complete(r)
}
