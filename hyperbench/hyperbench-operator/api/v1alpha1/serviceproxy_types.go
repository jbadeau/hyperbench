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

// ServiceProxySpec defines the desired state of ServiceProxy.
type ServiceProxySpec struct {
	// DisplayName is the human-readable name of the service.
	DisplayName string `json:"displayName"`

	// Frontend configures the frontend endpoint.
	// +optional
	Frontend EndpointSpec `json:"frontend,omitempty"`

	// Api configures the backend API endpoint.
	// +optional
	Api EndpointSpec `json:"api,omitempty"`

	// Proxy defines the routing rules for the service.
	Proxy []ProxyRule `json:"proxy"`

	// HealthCheck configures the health check endpoint.
	// +optional
	HealthCheck HealthCheckSpec `json:"healthCheck,omitempty"`
}

// EndpointSpec defines a service endpoint.
type EndpointSpec struct {
	// BaseUrl is the base URL for the endpoint.
	BaseUrl string `json:"baseUrl"`
}

// ProxyRule defines a single proxy routing rule.
type ProxyRule struct {
	// PathPrefix is the URL path prefix to match.
	PathPrefix string `json:"pathPrefix"`

	// Target is the endpoint to proxy to ("frontend" or "api").
	Target string `json:"target"`
}

// HealthCheckSpec defines the health check configuration.
type HealthCheckSpec struct {
	// Path is the health check endpoint path.
	// +optional
	Path string `json:"path,omitempty"`

	// Target is the endpoint to health check ("frontend" or "api").
	// +optional
	Target string `json:"target,omitempty"`
}

// ServiceProxyStatus defines the observed state of ServiceProxy.
type ServiceProxyStatus struct {
	// Phase represents the current lifecycle phase of the ServiceProxy.
	// +optional
	Phase string `json:"phase,omitempty"`

	// Conditions represent the latest available observations of the ServiceProxy's state.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="DisplayName",type=string,JSONPath=`.spec.displayName`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// ServiceProxy is the Schema for the serviceproxies API.
type ServiceProxy struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ServiceProxySpec   `json:"spec,omitempty"`
	Status ServiceProxyStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ServiceProxyList contains a list of ServiceProxy.
type ServiceProxyList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ServiceProxy `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ServiceProxy{}, &ServiceProxyList{})
}
