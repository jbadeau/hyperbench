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
	"fmt"
	"sort"
	"strings"

	portalv1alpha1 "github.com/hyperbench/hyperbench-operator/api/v1alpha1"
)

// --- Resolved output types (for JSON serialization into ConfigMap) ---

// portalConfig is the top-level resolved configuration written to the ConfigMap.
type portalConfig struct {
	Title       string                      `json:"title"`
	Port        int32                       `json:"port,omitempty"`
	Branding    portalv1alpha1.BrandingSpec `json:"branding,omitempty"`
	Theme       portalv1alpha1.ThemeSpec    `json:"theme,omitempty"`
	Header      resolvedHeader              `json:"header,omitempty"`
	ContextBar  resolvedContextBar          `json:"contextBar,omitempty"`
	DefaultPage string                      `json:"defaultPage"`
	Services    []resolvedService           `json:"services"`
	Navigation  []*resolvedNavNode          `json:"navigation"`
	Widgets     map[string]resolvedWidget   `json:"widgets"`
	Actions     map[string]resolvedAction   `json:"actions"`
}

type resolvedHeader struct {
	Search        resolvedHeaderFeature       `json:"search,omitempty"`
	Notifications resolvedHeaderFeature       `json:"notifications,omitempty"`
	Settings      resolvedHeaderFeature       `json:"settings,omitempty"`
	UserMenu      portalv1alpha1.UserMenuSpec `json:"userMenu,omitempty"`
}

type resolvedHeaderFeature struct {
	Enabled bool            `json:"enabled,omitempty"`
	Widget  *resolvedWidget `json:"widget,omitempty"`
}

type resolvedContextBar struct {
	Enabled bool            `json:"enabled,omitempty"`
	Widget  *resolvedWidget `json:"widget,omitempty"`
}

type resolvedService struct {
	Name        string                         `json:"name"`
	DisplayName string                         `json:"displayName"`
	Frontend    portalv1alpha1.EndpointSpec    `json:"frontend,omitempty"`
	Api         portalv1alpha1.EndpointSpec    `json:"api,omitempty"`
	Proxy       []portalv1alpha1.ProxyRule     `json:"proxy"`
	HealthCheck portalv1alpha1.HealthCheckSpec `json:"healthCheck,omitempty"`
}

type resolvedNavNode struct {
	Name     string                   `json:"name"`
	Type     string                   `json:"type"`
	Title    string                   `json:"title"`
	Icon     string                   `json:"icon,omitempty"`
	Page     *resolvedPage            `json:"page,omitempty"`
	Alias    *resolvedAlias           `json:"alias,omitempty"`
	Link     *portalv1alpha1.LinkSpec `json:"link,omitempty"`
	Children []*resolvedNavNode       `json:"children,omitempty"`
}

type resolvedAlias struct {
	Target *resolvedNavNode `json:"target,omitempty"`
}

type resolvedPage struct {
	Description string         `json:"description,omitempty"`
	Path        string         `json:"path"`
	Layout      resolvedLayout `json:"layout,omitempty"`
}

type resolvedLayout struct {
	Type      string         `json:"type"`
	Columns   string         `json:"columns,omitempty"`
	Rows      string         `json:"rows,omitempty"`
	Gap       string         `json:"gap,omitempty"`
	Areas     []string       `json:"areas,omitempty"`
	Slots     []resolvedSlot `json:"slots,omitempty"`
	Direction string         `json:"direction,omitempty"`
	Ratio     string         `json:"ratio,omitempty"`
}

type resolvedSlot struct {
	Name   string          `json:"name"`
	Widget *resolvedWidget `json:"widget,omitempty"`
	Area   string          `json:"area,omitempty"`
	Pane   string          `json:"pane,omitempty"`
	Label  string          `json:"label,omitempty"`
}

type resolvedWidget struct {
	Name        string                           `json:"name"`
	Type        string                           `json:"type"`
	Title       string                           `json:"title"`
	Description string                           `json:"description,omitempty"`
	Context     *portalv1alpha1.ContextContract  `json:"context,omitempty"`
	Server      *portalv1alpha1.ServerWidgetSpec `json:"server,omitempty"`
	Iframe      *portalv1alpha1.IframeWidgetSpec `json:"iframe,omitempty"`
	Client      *portalv1alpha1.ClientWidgetSpec `json:"client,omitempty"`
	Actions     map[string]resolvedAction        `json:"actions,omitempty"`
}

type resolvedAction struct {
	Name       string                         `json:"name"`
	Type       string                         `json:"type"`
	SetContext *portalv1alpha1.SetContextSpec `json:"setContext,omitempty"`
	Navigate   *portalv1alpha1.NavigateSpec   `json:"navigate,omitempty"`
	OpenDrawer *resolvedOpenDrawer            `json:"openDrawer,omitempty"`
	OpenModal  *resolvedOpenModal             `json:"openModal,omitempty"`
	Rest       *resolvedRest                  `json:"rest,omitempty"`
}

type resolvedOpenDrawer struct {
	Widget   *resolvedWidget `json:"widget,omitempty"`
	Position string          `json:"position,omitempty"`
	Width    string          `json:"width,omitempty"`
	Title    string          `json:"title,omitempty"`
}

type resolvedOpenModal struct {
	Widget *resolvedWidget `json:"widget,omitempty"`
	Size   string          `json:"size,omitempty"`
	Title  string          `json:"title,omitempty"`
}

type resolvedRest struct {
	Endpoint  string            `json:"endpoint"`
	Method    string            `json:"method"`
	Headers   map[string]string `json:"headers,omitempty"`
	Body      string            `json:"body,omitempty"`
	OnSuccess *resolvedAction   `json:"onSuccess,omitempty"`
	OnError   *resolvedAction   `json:"onError,omitempty"`
}

// --- Resolver ---

type resolver struct {
	widgets  map[string]portalv1alpha1.Widget
	actions  map[string]portalv1alpha1.Action
	navNodes map[string]portalv1alpha1.NavigationNode
	services map[string]portalv1alpha1.ServiceProxy

	resolvedWidgetCache map[string]*resolvedWidget
	resolvedActionCache map[string]*resolvedAction

	errors []string
}

func newResolver(
	widgets []portalv1alpha1.Widget,
	actions []portalv1alpha1.Action,
	navNodes []portalv1alpha1.NavigationNode,
	services []portalv1alpha1.ServiceProxy,
) *resolver {
	r := &resolver{
		widgets:             make(map[string]portalv1alpha1.Widget),
		actions:             make(map[string]portalv1alpha1.Action),
		navNodes:            make(map[string]portalv1alpha1.NavigationNode),
		services:            make(map[string]portalv1alpha1.ServiceProxy),
		resolvedWidgetCache: make(map[string]*resolvedWidget),
		resolvedActionCache: make(map[string]*resolvedAction),
	}
	for _, w := range widgets {
		r.widgets[w.Name] = w
	}
	for _, a := range actions {
		r.actions[a.Name] = a
	}
	for _, n := range navNodes {
		r.navNodes[n.Name] = n
	}
	for _, s := range services {
		r.services[s.Name] = s
	}
	return r
}

func (r *resolver) resolve(workbench *portalv1alpha1.Workbench) (*portalConfig, error) {
	config := &portalConfig{
		Title:       workbench.Spec.Title,
		Port:        workbench.Spec.Port,
		Branding:    workbench.Spec.Branding,
		Theme:       workbench.Spec.Theme,
		DefaultPage: workbench.Spec.DefaultPage,
	}

	// Resolve all actions (populates cache, detects cycles)
	allActions := make(map[string]resolvedAction)
	for name := range r.actions {
		visited := make(map[string]bool)
		ra := r.resolveAction(name, visited)
		if ra != nil {
			allActions[name] = *ra
		}
	}
	config.Actions = allActions

	// Resolve all widgets (uses action cache)
	allWidgets := make(map[string]resolvedWidget)
	for name := range r.widgets {
		visited := make(map[string]bool)
		rw := r.resolveWidget(name, visited)
		if rw != nil {
			allWidgets[name] = *rw
		}
	}
	config.Widgets = allWidgets

	// Resolve header and context bar
	config.Header = r.resolveHeader(workbench.Spec.Header)
	config.ContextBar = r.resolveContextBarSpec(workbench.Spec.ContextBar)

	// Resolve services
	config.Services = r.resolveServices()

	// Resolve navigation tree
	config.Navigation = r.resolveNavTree()

	if len(r.errors) > 0 {
		return nil, fmt.Errorf("resolution errors:\n%s", strings.Join(r.errors, "\n"))
	}
	return config, nil
}

func (r *resolver) resolveAction(name string, visited map[string]bool) *resolvedAction {
	if cached, ok := r.resolvedActionCache[name]; ok {
		return cached
	}
	action, ok := r.actions[name]
	if !ok {
		r.errors = append(r.errors, fmt.Sprintf("action %q not found", name))
		return nil
	}
	if visited[name] {
		r.errors = append(r.errors, fmt.Sprintf("circular action reference detected involving %q", name))
		return nil
	}
	visited[name] = true
	defer func() { visited[name] = false }()

	ra := &resolvedAction{
		Name:       name,
		Type:       action.Spec.Type,
		SetContext: action.Spec.SetContext,
		Navigate:   action.Spec.Navigate,
	}

	if action.Spec.OpenDrawer != nil {
		ra.OpenDrawer = &resolvedOpenDrawer{
			Position: action.Spec.OpenDrawer.Position,
			Width:    action.Spec.OpenDrawer.Width,
			Title:    action.Spec.OpenDrawer.Title,
		}
		if action.Spec.OpenDrawer.WidgetRef != "" {
			wVisited := make(map[string]bool)
			ra.OpenDrawer.Widget = r.resolveWidget(action.Spec.OpenDrawer.WidgetRef, wVisited)
		}
	}

	if action.Spec.OpenModal != nil {
		ra.OpenModal = &resolvedOpenModal{
			Size:  action.Spec.OpenModal.Size,
			Title: action.Spec.OpenModal.Title,
		}
		if action.Spec.OpenModal.WidgetRef != "" {
			wVisited := make(map[string]bool)
			ra.OpenModal.Widget = r.resolveWidget(action.Spec.OpenModal.WidgetRef, wVisited)
		}
	}

	if action.Spec.Rest != nil {
		ra.Rest = &resolvedRest{
			Endpoint: action.Spec.Rest.Endpoint,
			Method:   action.Spec.Rest.Method,
			Headers:  action.Spec.Rest.Headers,
			Body:     action.Spec.Rest.Body,
		}
		if action.Spec.Rest.OnSuccess != nil && action.Spec.Rest.OnSuccess.ActionRef != "" {
			ra.Rest.OnSuccess = r.resolveAction(action.Spec.Rest.OnSuccess.ActionRef, visited)
		}
		if action.Spec.Rest.OnError != nil && action.Spec.Rest.OnError.ActionRef != "" {
			ra.Rest.OnError = r.resolveAction(action.Spec.Rest.OnError.ActionRef, visited)
		}
	}

	r.resolvedActionCache[name] = ra
	return ra
}

func (r *resolver) resolveWidget(name string, visited map[string]bool) *resolvedWidget {
	if cached, ok := r.resolvedWidgetCache[name]; ok {
		return cached
	}
	widget, ok := r.widgets[name]
	if !ok {
		r.errors = append(r.errors, fmt.Sprintf("widget %q not found", name))
		return nil
	}
	if visited[name] {
		r.errors = append(r.errors, fmt.Sprintf("circular widget reference detected involving %q", name))
		return nil
	}
	visited[name] = true
	defer func() { visited[name] = false }()

	rw := &resolvedWidget{
		Name:        name,
		Type:        widget.Spec.Type,
		Title:       widget.Spec.Title,
		Description: widget.Spec.Description,
		Context:     widget.Spec.Context,
		Server:      widget.Spec.Server,
		Iframe:      widget.Spec.Iframe,
		Client:      widget.Spec.Client,
	}

	if len(widget.Spec.ActionRefs) > 0 {
		rw.Actions = make(map[string]resolvedAction)
		for _, mapping := range widget.Spec.ActionRefs {
			aVisited := make(map[string]bool)
			ra := r.resolveAction(mapping.ActionRef, aVisited)
			if ra != nil {
				rw.Actions[mapping.Id] = *ra
			}
		}
	}

	r.resolvedWidgetCache[name] = rw
	return rw
}

func (r *resolver) resolveNavTree() []*resolvedNavNode {
	// Build parent → children index
	childrenOf := make(map[string][]string)
	for name, node := range r.navNodes {
		childrenOf[node.Spec.Parent] = append(childrenOf[node.Spec.Parent], name)
	}
	// Sort children by name for deterministic output
	for parent := range childrenOf {
		sort.Strings(childrenOf[parent])
	}

	var buildNode func(name string, aliasVisited map[string]bool) *resolvedNavNode
	buildNode = func(name string, aliasVisited map[string]bool) *resolvedNavNode {
		node, ok := r.navNodes[name]
		if !ok {
			r.errors = append(r.errors, fmt.Sprintf("navigation node %q not found", name))
			return nil
		}

		rn := &resolvedNavNode{
			Name:  name,
			Type:  node.Spec.Type,
			Title: node.Spec.Title,
			Icon:  node.Spec.Icon,
		}

		switch node.Spec.Type {
		case "page":
			if node.Spec.Page != nil {
				rn.Page = r.resolvePageSpec(node.Spec.Page)
			}
		case "alias":
			if node.Spec.Alias != nil {
				if aliasVisited[name] {
					r.errors = append(r.errors, fmt.Sprintf("circular alias detected involving %q", name))
					return rn
				}
				aliasVisited[name] = true
				target := buildNode(node.Spec.Alias.TargetRef, aliasVisited)
				if target != nil {
					rn.Alias = &resolvedAlias{Target: target}
				}
			}
		case "link":
			rn.Link = node.Spec.Link
		}

		// Resolve children
		for _, childName := range childrenOf[name] {
			child := buildNode(childName, aliasVisited)
			if child != nil {
				rn.Children = append(rn.Children, child)
			}
		}

		return rn
	}

	roots := childrenOf[""]
	result := make([]*resolvedNavNode, 0, len(roots))
	for _, rootName := range roots {
		aliasVisited := make(map[string]bool)
		node := buildNode(rootName, aliasVisited)
		if node != nil {
			result = append(result, node)
		}
	}
	return result
}

func (r *resolver) resolvePageSpec(page *portalv1alpha1.PageSpec) *resolvedPage {
	rp := &resolvedPage{
		Description: page.Description,
		Path:        page.Path,
		Layout: resolvedLayout{
			Type:      page.Layout.Type,
			Columns:   page.Layout.Columns,
			Rows:      page.Layout.Rows,
			Gap:       page.Layout.Gap,
			Areas:     page.Layout.Areas,
			Direction: page.Layout.Direction,
			Ratio:     page.Layout.Ratio,
		},
	}
	for _, slot := range page.Layout.Slots {
		rs := resolvedSlot{
			Name:  slot.Name,
			Area:  slot.Area,
			Pane:  slot.Pane,
			Label: slot.Label,
		}
		if slot.WidgetRef != "" {
			visited := make(map[string]bool)
			rs.Widget = r.resolveWidget(slot.WidgetRef, visited)
		}
		rp.Layout.Slots = append(rp.Layout.Slots, rs)
	}
	return rp
}

func (r *resolver) resolveHeader(header portalv1alpha1.HeaderSpec) resolvedHeader {
	return resolvedHeader{
		Search:        r.resolveHeaderFeature(header.Search),
		Notifications: r.resolveHeaderFeature(header.Notifications),
		Settings:      r.resolveHeaderFeature(header.Settings),
		UserMenu:      header.UserMenu,
	}
}

func (r *resolver) resolveHeaderFeature(feature portalv1alpha1.HeaderFeature) resolvedHeaderFeature {
	rf := resolvedHeaderFeature{Enabled: feature.Enabled}
	if feature.WidgetRef != "" && feature.Enabled {
		visited := make(map[string]bool)
		rf.Widget = r.resolveWidget(feature.WidgetRef, visited)
	}
	return rf
}

func (r *resolver) resolveContextBarSpec(cb portalv1alpha1.ContextBarSpec) resolvedContextBar {
	rc := resolvedContextBar{Enabled: cb.Enabled}
	if cb.WidgetRef != "" && cb.Enabled {
		visited := make(map[string]bool)
		rc.Widget = r.resolveWidget(cb.WidgetRef, visited)
	}
	return rc
}

func (r *resolver) resolveServices() []resolvedService {
	names := make([]string, 0, len(r.services))
	for name := range r.services {
		names = append(names, name)
	}
	sort.Strings(names)

	services := make([]resolvedService, 0, len(names))
	for _, name := range names {
		sp := r.services[name]
		services = append(services, resolvedService{
			Name:        name,
			DisplayName: sp.Spec.DisplayName,
			Frontend:    sp.Spec.Frontend,
			Api:         sp.Spec.Api,
			Proxy:       sp.Spec.Proxy,
			HealthCheck: sp.Spec.HealthCheck,
		})
	}
	return services
}
