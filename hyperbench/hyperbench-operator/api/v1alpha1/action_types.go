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

// ActionSpec defines the desired state of Action.
type ActionSpec struct {
	// Type is the action type: setContext, navigate, openDrawer, openModal, or rest.
	Type string `json:"type"`

	// SetContext configures a context-setting action.
	// +optional
	SetContext *SetContextSpec `json:"setContext,omitempty"`

	// Navigate configures a navigation action.
	// +optional
	Navigate *NavigateSpec `json:"navigate,omitempty"`

	// OpenDrawer configures a drawer-opening action.
	// +optional
	OpenDrawer *OpenDrawerSpec `json:"openDrawer,omitempty"`

	// OpenModal configures a modal-opening action.
	// +optional
	OpenModal *OpenModalSpec `json:"openModal,omitempty"`

	// Rest configures a REST API call action.
	// +optional
	Rest *RestSpec `json:"rest,omitempty"`
}

// SetContextSpec defines parameters for a setContext action.
type SetContextSpec struct {
	// Params maps context key names to values or expressions.
	Params map[string]string `json:"params"`
}

// NavigateSpec defines parameters for a navigate action.
type NavigateSpec struct {
	// Path is the navigation target path.
	Path string `json:"path"`

	// Target is the navigation target (e.g. "_blank").
	// +optional
	Target string `json:"target,omitempty"`

	// Swap is the HTMX swap strategy.
	// +optional
	Swap string `json:"swap,omitempty"`

	// PushUrl controls whether to push the URL to browser history.
	// +optional
	PushUrl bool `json:"pushUrl,omitempty"`
}

// OpenDrawerSpec defines parameters for an openDrawer action.
type OpenDrawerSpec struct {
	// WidgetRef references a Widget CR to render in the drawer.
	WidgetRef string `json:"widgetRef"`

	// Position is the drawer position (e.g. "left", "right").
	// +optional
	Position string `json:"position,omitempty"`

	// Width is the drawer width.
	// +optional
	Width string `json:"width,omitempty"`

	// Title is the drawer title.
	// +optional
	Title string `json:"title,omitempty"`
}

// OpenModalSpec defines parameters for an openModal action.
type OpenModalSpec struct {
	// WidgetRef references a Widget CR to render in the modal.
	WidgetRef string `json:"widgetRef"`

	// Size is the modal size (e.g. "small", "medium", "large").
	// +optional
	Size string `json:"size,omitempty"`

	// Title is the modal title.
	// +optional
	Title string `json:"title,omitempty"`
}

// RestSpec defines parameters for a REST API call action.
type RestSpec struct {
	// Endpoint is the REST endpoint URL.
	Endpoint string `json:"endpoint"`

	// Method is the HTTP method (GET, POST, PUT, DELETE, etc.).
	Method string `json:"method"`

	// Headers are additional HTTP headers.
	// +optional
	Headers map[string]string `json:"headers,omitempty"`

	// Body is the request body template.
	// +optional
	Body string `json:"body,omitempty"`

	// OnSuccess is the action to chain on success.
	// +optional
	OnSuccess *ActionChain `json:"onSuccess,omitempty"`

	// OnError is the action to chain on error.
	// +optional
	OnError *ActionChain `json:"onError,omitempty"`
}

// ActionChain references another Action CR to chain after completion.
type ActionChain struct {
	// ActionRef references an Action CR by name.
	ActionRef string `json:"actionRef"`
}

// ActionStatus defines the observed state of Action.
type ActionStatus struct {
	// Phase represents the current lifecycle phase of the Action.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations of the Action's state.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Action is the Schema for the actions API.
type Action struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ActionSpec   `json:"spec,omitempty"`
	Status ActionStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ActionList contains a list of Action.
type ActionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Action `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Action{}, &ActionList{})
}
