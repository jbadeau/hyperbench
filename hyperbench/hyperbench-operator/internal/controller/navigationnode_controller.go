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

// NavigationNodeReconciler reconciles a NavigationNode object
type NavigationNodeReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=navigationnodes,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=navigationnodes/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=navigationnodes/finalizers,verbs=update

// Reconcile validates the NavigationNode spec and updates its status.
func (r *NavigationNodeReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	nn := &portalv1alpha1.NavigationNode{}
	if err := r.Get(ctx, req.NamespacedName, nn); err != nil {
		if errors.IsNotFound(err) {
			log.Info("NavigationNode resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling NavigationNode", "name", nn.Name)

	// Validate the spec
	if err := r.validateSpec(nn); err != nil {
		meta.SetStatusCondition(&nn.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: nn.Generation,
		})
		nn.Status.Phase = "Failed"
		if statusErr := r.Status().Update(ctx, nn); statusErr != nil {
			log.Error(statusErr, "Failed to update NavigationNode status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	// Update status to Ready
	meta.SetStatusCondition(&nn.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "NavigationNode configuration is valid",
		ObservedGeneration: nn.Generation,
	})
	nn.Status.Phase = "Ready"
	if err := r.Status().Update(ctx, nn); err != nil {
		log.Error(err, "Failed to update NavigationNode status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled NavigationNode", "name", nn.Name, "phase", nn.Status.Phase)
	return ctrl.Result{}, nil
}

var validNavigationNodeTypes = map[string]bool{
	"group": true,
	"page":  true,
	"alias": true,
	"link":  true,
}

// validateSpec performs basic validation on the NavigationNodeSpec.
func (r *NavigationNodeReconciler) validateSpec(nn *portalv1alpha1.NavigationNode) error {
	if nn.Spec.Title == "" {
		return fmt.Errorf("spec.title is required")
	}
	if nn.Spec.Type == "" {
		return fmt.Errorf("spec.type is required")
	}
	if !validNavigationNodeTypes[nn.Spec.Type] {
		return fmt.Errorf("spec.type must be one of: group, page, alias, link")
	}
	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *NavigationNodeReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.NavigationNode{}).
		Named("navigationnode").
		Complete(r)
}
