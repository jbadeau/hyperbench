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

package v1alpha1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DesignSpec is a json-render UI tree that has been locked down.
//
// A Design is the durable half of the playground loop: authors iterate on a
// spec in the browser, where it is session state and never touches the cluster,
// and save it here once they are happy. Only at that point does it become
// platform configuration — versioned, RBAC-controlled and reconciled by GitOps
// like every other resource. Per-user or in-progress specs must not be written
// here; etcd is the wrong store for state that changes on every keystroke.
type DesignSpec struct {
	// Title is the human-readable name of the design.
	Title string `json:"title"`

	// Description records what the design is for.
	// +optional
	Description string `json:"description,omitempty"`

	// Prompt is the natural-language prompt the design was generated from,
	// kept so an author can see how a design came about and re-generate from it.
	// +optional
	Prompt string `json:"prompt,omitempty"`

	// TargetWidget names a Widget this design renders in place of.
	//
	// When set, the portal renders this design wherever that Widget is mounted,
	// replacing whatever the Widget would have rendered itself. The binding is
	// a field on the Design rather than on the Widget so that authoring an
	// override needs write access to Designs only — a design author can re-skin
	// a section without being able to re-point it at a different backend.
	//
	// A design with no TargetWidget is unbound: saved content that renders
	// nowhere until something references it.
	// +optional
	TargetWidget string `json:"targetWidget,omitempty"`

	// Catalog names the component catalog this spec was authored against.
	// A spec is only meaningful relative to a catalog, and a renderer with a
	// different one may not have the components the spec references.
	// +optional
	Catalog string `json:"catalog,omitempty"`

	// Spec is the json-render spec: a root element key and a flat map of
	// elements. It is free-form by design — the shape is owned by json-render,
	// not by this CRD — so it is stored unvalidated by the API server and
	// checked by the admission webhook against the deployed catalog instead.
	//
	// +kubebuilder:pruning:PreserveUnknownFields
	Spec apiextensionsv1.JSON `json:"spec"`
}

// DesignStatus defines the observed state of Design.
type DesignStatus struct {
	// Phase represents the current lifecycle phase of the Design.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`

	// Components lists the distinct component types the spec references,
	// so operators can see a design's catalog surface without reading the spec.
	// +optional
	Components []string `json:"components,omitempty"`

	// ElementCount is the number of elements in the spec.
	// +optional
	ElementCount int `json:"elementCount,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Title",type=string,JSONPath=`.spec.title`
// +kubebuilder:printcolumn:name="Target",type=string,JSONPath=`.spec.targetWidget`
// +kubebuilder:printcolumn:name="Elements",type=integer,JSONPath=`.status.elementCount`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Design is a saved json-render UI tree.
type Design struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   DesignSpec   `json:"spec,omitempty"`
	Status DesignStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// DesignList contains a list of Design.
type DesignList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Design `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Design{}, &DesignList{})
}
