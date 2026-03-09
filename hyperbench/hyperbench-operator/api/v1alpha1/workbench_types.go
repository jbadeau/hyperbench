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

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// WorkbenchSpec defines the desired state of Workbench.
type WorkbenchSpec struct {
	// Title is the display title of the workbench portal.
	Title string `json:"title"`

	// Port is the port the dashboard gateway listens on.
	// +optional
	Port int32 `json:"port,omitempty"`

	// Branding configures logo and favicon.
	// +optional
	Branding BrandingSpec `json:"branding,omitempty"`

	// Theme configures color scheme.
	// +optional
	Theme ThemeSpec `json:"theme,omitempty"`

	// Header configures the top header bar features.
	// +optional
	Header HeaderSpec `json:"header,omitempty"`

	// ContextBar configures the context/selection bar below the header.
	// +optional
	ContextBar ContextBarSpec `json:"contextBar,omitempty"`

	// DefaultPage is the page to navigate to on initial load.
	DefaultPage string `json:"defaultPage"`
}

// BrandingSpec configures visual branding assets.
type BrandingSpec struct {
	// Logo URL or path for the workbench logo.
	// +optional
	Logo string `json:"logo,omitempty"`

	// Favicon URL or path for the browser favicon.
	// +optional
	Favicon string `json:"favicon,omitempty"`
}

// ThemeSpec configures the color theme.
type ThemeSpec struct {
	// Primary color (CSS value).
	// +optional
	Primary string `json:"primary,omitempty"`

	// HeaderBg is the header background color (CSS value).
	// +optional
	HeaderBg string `json:"headerBg,omitempty"`
}

// HeaderSpec configures the top header bar.
type HeaderSpec struct {
	// Search configures the search feature in the header.
	// +optional
	Search HeaderFeature `json:"search,omitempty"`

	// Notifications configures the notifications feature in the header.
	// +optional
	Notifications HeaderFeature `json:"notifications,omitempty"`

	// Settings configures the settings feature in the header.
	// +optional
	Settings HeaderFeature `json:"settings,omitempty"`

	// UserMenu configures the user menu in the header.
	// +optional
	UserMenu UserMenuSpec `json:"userMenu,omitempty"`
}

// HeaderFeature configures an individual header feature.
type HeaderFeature struct {
	// Enabled controls whether this feature is shown.
	// +optional
	Enabled bool `json:"enabled,omitempty"`

	// WidgetRef references a Widget CR that renders this feature.
	// +optional
	WidgetRef string `json:"widgetRef,omitempty"`
}

// UserMenuSpec configures the user menu in the header.
type UserMenuSpec struct {
	// Enabled controls whether the user menu is shown.
	// +optional
	Enabled bool `json:"enabled,omitempty"`

	// Avatar URL for the user avatar image.
	// +optional
	Avatar string `json:"avatar,omitempty"`

	// Label is the display text for the user menu.
	// +optional
	Label string `json:"label,omitempty"`

	// Email is the user's email address displayed below the label.
	// +optional
	Email string `json:"email,omitempty"`
}

// ContextBarSpec configures the context bar below the header.
type ContextBarSpec struct {
	// Enabled controls whether the context bar is shown.
	// +optional
	Enabled bool `json:"enabled,omitempty"`

	// WidgetRef references a Widget CR that renders the context bar.
	// +optional
	WidgetRef string `json:"widgetRef,omitempty"`
}

// WorkbenchStatus defines the observed state of Workbench.
type WorkbenchStatus struct {
	// Phase represents the current lifecycle phase of the Workbench.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations of the Workbench's state.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Title",type=string,JSONPath=`.spec.title`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Workbench is the Schema for the workbenches API.
type Workbench struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   WorkbenchSpec   `json:"spec,omitempty"`
	Status WorkbenchStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// WorkbenchList contains a list of Workbench.
type WorkbenchList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Workbench `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Workbench{}, &WorkbenchList{})
}
