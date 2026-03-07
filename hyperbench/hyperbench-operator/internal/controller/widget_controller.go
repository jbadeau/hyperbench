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
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	portalv1alpha1 "github.com/hyperbench/hyperbench-operator/api/v1alpha1"
)

// WidgetReconciler reconciles a Widget object
type WidgetReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=widgets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=widgets/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=widgets/finalizers,verbs=update

// Reconcile validates the Widget spec and updates its status.
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	widget := &portalv1alpha1.Widget{}
	if err := r.Get(ctx, req.NamespacedName, widget); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Widget resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling Widget", "name", widget.Name)

	// Validate the spec
	if err := r.validateSpec(widget); err != nil {
		meta.SetStatusCondition(&widget.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: widget.Generation,
		})
		widget.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, widget); statusErr != nil {
			log.Error(statusErr, "Failed to update Widget status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	// Update status to Ready
	meta.SetStatusCondition(&widget.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "Widget configuration is valid",
		ObservedGeneration: widget.Generation,
	})
	widget.Status.Phase = "Ready"
	if err := r.Status().Update(ctx, widget); err != nil {
		log.Error(err, "Failed to update Widget status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled Widget", "name", widget.Name, "phase", widget.Status.Phase)
	return ctrl.Result{}, nil
}

var validWidgetTypes = map[string]bool{
	"server": true,
	"iframe": true,
	"client": true,
}

// validateSpec performs basic validation on the WidgetSpec.
func (r *WidgetReconciler) validateSpec(widget *portalv1alpha1.Widget) error {
	if widget.Spec.Title == "" {
		return fmt.Errorf("spec.title is required")
	}
	if widget.Spec.Type == "" {
		return fmt.Errorf("spec.type is required")
	}
	if !validWidgetTypes[widget.Spec.Type] {
		return fmt.Errorf("spec.type must be one of: server, iframe, client")
	}
	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *WidgetReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.Widget{}).
		Named("widget").
		Complete(r)
}
