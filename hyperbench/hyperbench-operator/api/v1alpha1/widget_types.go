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

// WidgetSpec defines the desired state of Widget.
type WidgetSpec struct {
	// Type is the widget type: server, iframe, or client.
	Type string `json:"type"`

	// Title is the display title of the widget.
	Title string `json:"title"`

	// Description is an optional description of the widget.
	// +optional
	Description string `json:"description,omitempty"`

	// Context defines the context keys this widget subscribes to and publishes.
	// +optional
	Context *ContextContract `json:"context,omitempty"`

	// Server configures a server-rendered widget (HTMX).
	// +optional
	Server *ServerWidgetSpec `json:"server,omitempty"`

	// Iframe configures an iframe-embedded widget.
	// +optional
	Iframe *IframeWidgetSpec `json:"iframe,omitempty"`

	// Client configures a client-side rendered widget.
	// +optional
	Client *ClientWidgetSpec `json:"client,omitempty"`

	// ActionRefs maps action IDs to Action CR references.
	// +optional
	ActionRefs []ActionMapping `json:"actionRefs,omitempty"`
}

// ContextContract defines the context keys a widget interacts with.
type ContextContract struct {
	// Subscribes lists context keys the widget reads from.
	// +optional
	Subscribes []ContextKey `json:"subscribes,omitempty"`

	// Publishes lists context keys the widget writes to.
	// +optional
	Publishes []ContextKey `json:"publishes,omitempty"`
}

// ContextKey defines a single context key.
type ContextKey struct {
	// Key is the context key name.
	Key string `json:"key"`

	// Required indicates whether this context key must be present.
	// +optional
	Required bool `json:"required,omitempty"`
}

// ServerWidgetSpec configures a server-rendered HTMX widget.
type ServerWidgetSpec struct {
	// Endpoint is the URL to fetch the widget HTML from.
	Endpoint string `json:"endpoint"`

	// Swap is the HTMX swap strategy.
	// +optional
	Swap string `json:"swap,omitempty"`

	// Trigger is the HTMX trigger configuration.
	// +optional
	Trigger string `json:"trigger,omitempty"`
}

// IframeWidgetSpec configures an iframe-embedded widget.
type IframeWidgetSpec struct {
	// Src is the iframe source URL.
	Src string `json:"src"`

	// Sandbox is the iframe sandbox attribute value.
	// +optional
	Sandbox string `json:"sandbox,omitempty"`

	// Height is the iframe height.
	// +optional
	Height string `json:"height,omitempty"`
}

// ClientWidgetSpec configures a client-side rendered widget.
type ClientWidgetSpec struct {
	// Component is the component name (e.g. React component).
	// +optional
	Component string `json:"component,omitempty"`

	// Element is the custom element tag name.
	// +optional
	Element string `json:"element,omitempty"`

	// Props are static properties passed to the widget.
	// +optional
	Props map[string]string `json:"props,omitempty"`

	// PropsFromContext maps prop names to context keys for dynamic binding.
	// +optional
	PropsFromContext map[string]string `json:"propsFromContext,omitempty"`
}

// ActionMapping maps an action ID to an Action CR reference.
type ActionMapping struct {
	// Id is the action identifier within the widget.
	Id string `json:"id"`

	// ActionRef references an Action CR by name.
	ActionRef string `json:"actionRef"`
}

// WidgetStatus defines the observed state of Widget.
type WidgetStatus struct {
	// Phase represents the current lifecycle phase of the Widget.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations of the Widget's state.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Title",type=string,JSONPath=`.spec.title`
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Widget is the Schema for the widgets API.
type Widget struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   WidgetSpec   `json:"spec,omitempty"`
	Status WidgetStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// WidgetList contains a list of Widget.
type WidgetList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Widget `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Widget{}, &WidgetList{})
}
