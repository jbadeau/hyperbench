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

// ActionReconciler reconciles an Action object
type ActionReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=actions,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=actions/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=actions/finalizers,verbs=update

// Reconcile validates the Action spec and updates its status.
func (r *ActionReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	action := &portalv1alpha1.Action{}
	if err := r.Get(ctx, req.NamespacedName, action); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Action resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling Action", "name", action.Name)

	// Validate the spec
	if err := r.validateSpec(action); err != nil {
		meta.SetStatusCondition(&action.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: action.Generation,
		})
		action.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, action); statusErr != nil {
			log.Error(statusErr, "Failed to update Action status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	// Update status to Ready
	meta.SetStatusCondition(&action.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "Action configuration is valid",
		ObservedGeneration: action.Generation,
	})
	action.Status.Phase = "Ready"
	if err := r.Status().Update(ctx, action); err != nil {
		log.Error(err, "Failed to update Action status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled Action", "name", action.Name, "phase", action.Status.Phase)
	return ctrl.Result{}, nil
}

var validActionTypes = map[string]bool{
	"setContext": true,
	"navigate":   true,
	"openDrawer": true,
	"openModal":  true,
	"rest":       true,
}

// validateSpec performs basic validation on the ActionSpec.
func (r *ActionReconciler) validateSpec(action *portalv1alpha1.Action) error {
	if action.Spec.Type == "" {
		return fmt.Errorf("spec.type is required")
	}
	if !validActionTypes[action.Spec.Type] {
		return fmt.Errorf("spec.type must be one of: setContext, navigate, openDrawer, openModal, rest")
	}
	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *ActionReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.Action{}).
		Named("action").
		Complete(r)
}
