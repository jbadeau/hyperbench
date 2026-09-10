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
	"encoding/json"
	"fmt"
	"sort"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	portalv1alpha1 "github.com/hyperbench/hyperbench-operator/api/v1alpha1"
)

// DesignReconciler reconciles a Design object
type DesignReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=designs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=designs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=designs/finalizers,verbs=update
// +kubebuilder:rbac:groups=portal.hyperbench.com,resources=widgets,verbs=get;list;watch

// designTree is the shape the controller needs out of the free-form spec.
//
// DesignSpec.Spec is deliberately unvalidated by the API server — its schema
// belongs to json-render, not to this CRD — so the controller parses only the
// two fields it reports on and ignores everything else it finds.
type designTree struct {
	Root     string `json:"root"`
	Elements map[string]struct {
		Type string `json:"type"`
	} `json:"elements"`
}

// Reconcile validates the Design spec and reports what the spec contains.
//
// The status is what makes a design inspectable without reading its JSON: how
// many elements it has, which component types it depends on, and whether the
// widget it claims to render in place of actually exists.
func (r *DesignReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	design := &portalv1alpha1.Design{}
	if err := r.Get(ctx, req.NamespacedName, design); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Design resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	log.Info("Reconciling Design", "name", design.Name)

	tree, err := r.parseSpec(design)
	if err != nil {
		design.Status.Phase = "Failed"
		design.Status.ElementCount = 0
		design.Status.Components = nil
		meta.SetStatusCondition(&design.Status.Conditions, metav1.Condition{
			Type:               "Ready",
			Status:             metav1.ConditionFalse,
			Reason:             "ValidationFailed",
			Message:            err.Error(),
			ObservedGeneration: design.Generation,
		})
		if statusErr := r.Status().Update(ctx, design); statusErr != nil {
			log.Error(statusErr, "Failed to update Design status")
			return ctrl.Result{}, statusErr
		}
		return ctrl.Result{}, nil
	}

	design.Status.ElementCount = len(tree.Elements)
	design.Status.Components = componentTypes(tree)

	// A design bound to a widget that does not exist renders nowhere. That is
	// not a broken design — the widget may arrive later — so it reports Ready
	// with a distinct reason rather than Failed, and stays visible as a
	// dangling binding instead of looking healthy.
	reason := "Reconciled"
	message := "Design spec is valid"
	if target := design.Spec.TargetWidget; target != "" {
		widget := &portalv1alpha1.Widget{}
		err := r.Get(ctx, client.ObjectKey{Namespace: design.Namespace, Name: target}, widget)
		switch {
		case errors.IsNotFound(err):
			reason = "TargetWidgetMissing"
			message = fmt.Sprintf("spec.targetWidget %q does not exist in this namespace", target)
		case err != nil:
			return ctrl.Result{}, err
		default:
			message = fmt.Sprintf("Design spec is valid and bound to widget %q", target)
		}
	}

	design.Status.Phase = "Ready"
	meta.SetStatusCondition(&design.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		Reason:             reason,
		Message:            message,
		ObservedGeneration: design.Generation,
	})

	if err := r.Status().Update(ctx, design); err != nil {
		log.Error(err, "Failed to update Design status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled Design",
		"name", design.Name, "elements", design.Status.ElementCount, "phase", design.Status.Phase)
	return ctrl.Result{}, nil
}

// parseSpec checks the parts of the tree the portal relies on to render at all.
//
// It deliberately stops at structural checks: whether a component type exists
// in the deployed catalog is the renderer's business, and duplicating that
// judgement here would let the two disagree.
func (r *DesignReconciler) parseSpec(design *portalv1alpha1.Design) (*designTree, error) {
	if design.Spec.Title == "" {
		return nil, fmt.Errorf("spec.title is required")
	}
	if len(design.Spec.Spec.Raw) == 0 {
		return nil, fmt.Errorf("spec.spec is required")
	}

	tree := &designTree{}
	if err := json.Unmarshal(design.Spec.Spec.Raw, tree); err != nil {
		return nil, fmt.Errorf("spec.spec is not a valid json-render tree: %w", err)
	}
	if tree.Root == "" {
		return nil, fmt.Errorf("spec.spec.root is required")
	}
	if len(tree.Elements) == 0 {
		return nil, fmt.Errorf("spec.spec.elements must not be empty")
	}
	if _, ok := tree.Elements[tree.Root]; !ok {
		return nil, fmt.Errorf("spec.spec.root %q is not present in elements", tree.Root)
	}
	return tree, nil
}

// componentTypes lists the distinct component types the tree references, sorted
// so that an unchanged spec produces an unchanged status and does not churn
// resourceVersion on every reconcile.
func componentTypes(tree *designTree) []string {
	seen := make(map[string]struct{}, len(tree.Elements))
	for _, el := range tree.Elements {
		if el.Type != "" {
			seen[el.Type] = struct{}{}
		}
	}
	types := make([]string, 0, len(seen))
	for t := range seen {
		types = append(types, t)
	}
	sort.Strings(types)
	return types
}

// SetupWithManager sets up the controller with the Manager.
func (r *DesignReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&portalv1alpha1.Design{}).
		Named("design").
		Complete(r)
}
