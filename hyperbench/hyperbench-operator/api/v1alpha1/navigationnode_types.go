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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// NavigationNodeSpec defines the desired state of NavigationNode.
type NavigationNodeSpec struct {
	// Type is the kind of navigation node: group, page, alias, or link.
	Type string `json:"type"`

	// Title is the display title of the navigation node.
	Title string `json:"title"`

	// Ordinal controls the display order of the navigation node (lower values appear first).
	// +optional
	Ordinal int `json:"ordinal,omitempty"`

	// Icon is an optional icon identifier for the navigation node.
	// +optional
	Icon string `json:"icon,omitempty"`

	// Parent references the parent NavigationNode CR name for nesting.
	// +optional
	Parent string `json:"parent,omitempty"`

	// Page configures this node as a page with layout and widgets.
	// +optional
	Page *PageSpec `json:"page,omitempty"`

	// Alias configures this node as an alias to another navigation node.
	// +optional
	Alias *AliasSpec `json:"alias,omitempty"`

	// Link configures this node as an external link.
	// +optional
	Link *LinkSpec `json:"link,omitempty"`
}

// PageSpec defines a page with a path and layout.
type PageSpec struct {
	// Description is an optional description of the page.
	// +optional
	Description string `json:"description,omitempty"`

	// Path is the URL path for the page.
	Path string `json:"path"`

	// Layout defines how widgets are arranged on the page.
	// +optional
	Layout LayoutSpec `json:"layout,omitempty"`
}

// LayoutSpec defines the layout configuration for a page.
type LayoutSpec struct {
	// Type is the layout type: grid, single, split, or tabs.
	Type string `json:"type"`

	// Columns defines the CSS grid-template-columns value.
	// +optional
	Columns string `json:"columns,omitempty"`

	// Rows defines the CSS grid-template-rows value.
	// +optional
	Rows string `json:"rows,omitempty"`

	// Gap defines the CSS gap value.
	// +optional
	Gap string `json:"gap,omitempty"`

	// Areas defines CSS grid-template-areas values.
	// +optional
	Areas []string `json:"areas,omitempty"`

	// Slots maps named positions to widget references.
	// +optional
	Slots []SlotSpec `json:"slots,omitempty"`

	// Direction is the split direction (split layout only).
	// +optional
	Direction string `json:"direction,omitempty"`

	// Ratio is the split ratio (split layout only).
	// +optional
	Ratio string `json:"ratio,omitempty"`
}

// SlotSpec maps a named slot to a widget reference.
type SlotSpec struct {
	// Name is the slot identifier.
	Name string `json:"name"`

	// WidgetRef references a Widget CR by name.
	WidgetRef string `json:"widgetRef"`

	// Area is the CSS grid area name (grid layout).
	// +optional
	Area string `json:"area,omitempty"`

	// Pane specifies left or right pane (split layout).
	// +optional
	Pane string `json:"pane,omitempty"`

	// Label is the tab label (tabs layout).
	// +optional
	Label string `json:"label,omitempty"`
}

// AliasSpec configures an alias to another navigation node.
type AliasSpec struct {
	// TargetRef references the target NavigationNode CR name.
	TargetRef string `json:"targetRef"`
}

// LinkSpec configures an external link.
type LinkSpec struct {
	// Url is the external URL.
	Url string `json:"url"`

	// Target is the link target (e.g. "_blank").
	// +optional
	Target string `json:"target,omitempty"`
}

// NavigationNodeStatus defines the observed state of NavigationNode.
type NavigationNodeStatus struct {
	// Phase represents the current lifecycle phase of the NavigationNode.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations of the NavigationNode's state.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Title",type=string,JSONPath=`.spec.title`
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`
// +kubebuilder:printcolumn:name="Parent",type=string,JSONPath=`.spec.parent`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// NavigationNode is the Schema for the navigationnodes API.
type NavigationNode struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   NavigationNodeSpec   `json:"spec,omitempty"`
	Status NavigationNodeStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// NavigationNodeList contains a list of NavigationNode.
type NavigationNodeList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []NavigationNode `json:"items"`
}

func init() {
	SchemeBuilder.Register(&NavigationNode{}, &NavigationNodeList{})
}
