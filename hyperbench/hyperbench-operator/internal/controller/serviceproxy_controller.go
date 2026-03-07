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

// ServiceProxyReconciler reconciles a ServiceProxy object
type ServiceProxyReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=serviceproxies,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=serviceproxies/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=serviceproxies/finalizers,verbs=update

// Reconcile validates the ServiceProxy spec and updates its status.
func (r *ServiceProxyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	sp := &portalv1alpha1.ServiceProxy{}
	if err := r.Get(ctx, req.NamespacedName, sp); err != nil {
		if errors.IsNotFound(err) {
			log.Info("ServiceProxy resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling ServiceProxy", "name", sp.Name)

	// Validate the spec
	if err := r.validateSpec(sp); err != nil {
		meta.SetStatusCondition(&sp.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: sp.Generation,
		})
		sp.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, sp); statusErr != nil {
			log.Error(statusErr, "Failed to update ServiceProxy status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	// Update status to Ready
	meta.SetStatusCondition(&sp.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "ServiceProxy configuration is valid",
		ObservedGeneration: sp.Generation,
	})
	sp.Status.Phase = "Ready"
	if err := r.Status().Update(ctx, sp); err != nil {
		log.Error(err, "Failed to update ServiceProxy status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled ServiceProxy", "name", sp.Name, "phase", sp.Status.Phase)
	return ctrl.Result{}, nil
}

// validateSpec performs basic validation on the ServiceProxySpec.
func (r *ServiceProxyReconciler) validateSpec(sp *portalv1alpha1.ServiceProxy) error {
	if sp.Spec.DisplayName == "" {
		return fmt.Errorf("spec.displayName is required")
	}
	if len(sp.Spec.Proxy) == 0 {
		return fmt.Errorf("spec.proxy must contain at least one rule")
	}
	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *ServiceProxyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.ServiceProxy{}).
		Named("serviceproxy").
		Complete(r)
}
