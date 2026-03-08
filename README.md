# HyperBench

HyperBench is a **Kubernetes-native micro-frontend portal** built on pure hypermedia principles. The entire UI — navigation, pages, widgets, routing — is defined as Kubernetes Custom Resources. A Go operator reconciles them, and a Node.js dashboard gateway watches the CRDs in real-time to serve a dynamic shell. Backend services speak [hal-schema-forms](https://github.com/jbadeau/hal-schema-forms), and HTMX handles all interactivity with zero client-side routing or state management.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Shell (HTML + Tailwind + Shoelace + HTMX)                         │  │
│  │  ┌──────────┐  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Sidebar   │  │  #content (HTMX fragment target)             │   │  │
│  │  │ nav from  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │  │
│  │  │ Navigat-  │  │  │ Widget  │ │ Widget  │ │ Widget  │       │   │  │
│  │  │ ionNode   │  │  │ (hx-get)│ │ (hx-get)│ │ (hx-get)│       │   │  │
│  │  │ CRs       │  │  └─────────┘ └─────────┘ └─────────┘       │   │  │
│  │  └──────────┘  └──────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                        │ HTMX requests + X-Context-* headers             │
└────────────────────────┼─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Kubernetes Cluster (kind-hyperbench)                                    │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  Dashboard Gateway  (Express :3000)                           │       │
│  │  • Loads CRDs on startup, watches for live updates            │       │
│  │  • Builds in-memory indexes: pageIndex, proxyIndex            │       │
│  │  • Serves shell HTML on browser requests                      │       │
│  │  • Serves page layouts (grid/tabs/split) on HTMX requests     │       │
│  │  • Dynamic reverse proxy via ServiceProxy CRs                 │       │
│  └───────────────┬───────────────────────────────────────────────┘       │
│                   │ proxy (longest-prefix match from proxyIndex)          │
│                   ▼                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Todos           │  │  Clients         │  │  Onboarding      │          │
│  │  Express :3001   │  │  Express :3002   │  │  Express :3003   │          │
│  │                  │  │                  │  │                  │          │
│  │  Fetches HAL     │  │  Search, table,  │  │  Catch-all       │          │
│  │  from API,       │  │  context bar,    │  │  proxy to        │          │
│  │  renders HTML    │  │  favorites       │  │  Spring Boot     │          │
│  │  via shared      │  │                  │  │  API + shared    │          │
│  │  renderer        │  │                  │  │  renderer        │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                    │
│           ▼                     ▼                      ▼                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Spring Boot     │  │  Spring Boot     │  │  Spring Boot     │          │
│  │  Todos API       │  │  Clients API     │  │  Onboarding API  │          │
│  │  :8081           │  │  :8083           │  │  :8082           │          │
│  │  H2 database     │  │  H2 database     │  │  H2 database     │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  HyperBench Operator (Go)                                     │       │
│  │  Reconciles: Workbench, NavigationNode, Widget, ServiceProxy,  │       │
│  │              Action CRDs                                       │       │
│  └───────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

## Custom Resource Definitions

The operator manages five CRDs in the `portal.hyperbench.com/v1alpha1` API group:

| CRD | Purpose |
|-----|---------|
| **Workbench** | Portal configuration — title, theme, header (search, notifications, user menu), context bar, default page |
| **NavigationNode** | Navigation tree — pages (with layout + widgets), groups, links, aliases. Parent/child hierarchy via `spec.parent`, ordering via `spec.ordinal` |
| **Widget** | UI widgets — server (HTMX endpoint), iframe, or client-side. Context subscriptions/publications for cross-widget communication |
| **ServiceProxy** | Microservice routing — path prefix to backend URL mapping. Used by dashboard to build its dynamic reverse proxy |
| **Action** | UI actions — setContext, navigate, openModal, openDrawer, REST calls. Chainable via onSuccess/onError |

### Example: NavigationNode (page with grid layout)

```yaml
apiVersion: portal.hyperbench.com/v1alpha1
kind: NavigationNode
metadata:
  name: clients-page
spec:
  title: Clients
  type: page
  icon: people
  ordinal: 10
  page:
    path: /clients
    layout:
      type: grid
      columns: 1fr
      slots:
        - name: main
          widgetRef: clients-table
```

### Example: Widget (server-rendered)

```yaml
apiVersion: portal.hyperbench.com/v1alpha1
kind: Widget
metadata:
  name: clients-table
spec:
  type: server
  server:
    endpoint: /clients/table
    swap: innerHTML
    trigger: "load"
```

### Example: ServiceProxy

```yaml
apiVersion: portal.hyperbench.com/v1alpha1
kind: ServiceProxy
metadata:
  name: clients-service
spec:
  displayName: Clients Service
  proxyRules:
    - pathPrefix: /clients
      target: http://clients.clients.svc.cluster.local:3002
    - pathPrefix: /api/clients
      target: http://clients-api.clients.svc.cluster.local:8083
```

## Request flow

```
Browser                Gateway :3000           Node.js frontend       Spring Boot API
  │                        │                        │                      │
  │  GET /                 │                        │                      │
  │───────────────────────►│                        │                      │
  │  ◄── HTML shell ───────│                        │                      │
  │  (sidebar from         │                        │                      │
  │   NavigationNode CRs)  │                        │                      │
  │                        │                        │                      │
  │  GET /clients          │                        │                      │
  │  (HTMX hx-get)        │                        │                      │
  │───────────────────────►│                        │                      │
  │                        │  pageIndex hit →       │                      │
  │  ◄── grid layout HTML ─│  serve layout with     │                      │
  │                        │  widget hx-get divs    │                      │
  │                        │                        │                      │
  │  GET /clients/table    │                        │                      │
  │  (HTMX from widget)   │                        │                      │
  │───────────────────────►│  proxyIndex match      │                      │
  │                        │───────────────────────►│                      │
  │                        │                        │  GET /ui/clients     │
  │                        │                        │─────────────────────►│
  │                        │                        │  ◄── HAL-schema-     │
  │                        │                        │      forms JSON ─────│
  │                        │                        │  render → HTML       │
  │  ◄── HTML fragment ────│  ◄─────────────────────│                      │
  │                        │                        │                      │
  │  HTMX swaps into DOM  │                        │                      │
```

## Key principles

- **CRD-driven UI** — the entire portal is defined as Kubernetes Custom Resources. Change a NavigationNode CR, the sidebar updates in real-time.
- **Hot reload** — the dashboard watches K8s APIs. CRD changes propagate without restarts.
- **Media type**: `application/hal+json; profile="https://github.com/jbadeau/hal-schema-forms"` — `_links` for navigation, `_forms` with JSON Schema for actions.
- **No client-side routing** — HTMX handles all navigation via `hx-get` + `hx-push-url`. The dashboard distinguishes HTMX requests from browser deep-links using the `hx-request` header.
- **WorkbenchContext** — client-side localStorage + `X-Context-*` HTTP headers. Widgets subscribe to context changes via `hx-trigger="load, workbench:context from:body"`.
- **Dynamic proxy routing** — ServiceProxy CRs define path prefix → backend URL mappings. The dashboard builds a `proxyIndex` and does longest-prefix matching at request time.
- **Renderer** — json-render catalog/registry/transformer pipeline converts HAL resources into Shoelace HTML via React SSR. Only SSR is used — HTMX handles all interactivity.

## Module structure

### Go

| Module | Description |
|--------|-------------|
| `hyperbench/hyperbench-operator` | Kubebuilder operator — reconciles Workbench, NavigationNode, Widget, ServiceProxy, Action CRDs. Resolver builds a config tree and writes to ConfigMap. |

### Java (Maven)

| Module | Description |
|--------|-------------|
| `hyperbench/hyperbench-hal-schema-forms-service` | Core library — media type, Jackson serialization, `FormsRepresentationModel`, `JsonSchemaBuilder`, `FormBuilder` |
| `hyperbench/hyperbench-shared-service` | Shared library — `WorkbenchContext`, `WorkbenchContextFilter` |
| `todos/todos-service` | Action Items API (:8081) — Spring Data REST + hal-schema-forms UI endpoints |
| `clients/clients-service` | Clients API (:8083) — client search, top clients, recent activity |
| `onboarding/onboarding-service` | KYC Onboarding API (:8082) — 5-step wizard with H2 persistence and dynamic form rendering |

### TypeScript (npm workspaces)

| Package | Description |
|---------|-------------|
| `hyperbench/hyperbench-shared` | HAL-schema-forms types, json-render catalog/registry/transformer, renderer (HAL → Shoelace → HTML), fetch utilities |
| `hyperbench/hyperbench-dashboard` | Dashboard gateway (:3000) — CRD store, K8s watchers, HTML shell, page layout renderer, dynamic reverse proxy |
| `todos/todos` | Action Items frontend (:3001) — dashboard widgets (greeting, summary) + full task list |
| `clients/clients` | Clients frontend (:3002) — search dropdown, context bar, client table, favorites |
| `onboarding/onboarding` | KYC Onboarding frontend (:3003) — catch-all proxy to Spring Boot API + shared renderer |

### Helm Charts

| Chart | Namespace | What it deploys |
|-------|-----------|-----------------|
| `hyperbench/hyperbench-operator-chart` | `hyperbench-operator` | Operator pod + CRDs |
| `hyperbench/hyperbench-dashboard-chart` | `dashboard` | Dashboard gateway pod |
| `todos/todos-chart` | `todos` | Todos frontend + API pods |
| `clients/clients-chart` | `clients` | Clients frontend + API pods |
| `onboarding/onboarding-chart` | `onboarding` | Onboarding frontend + API pods |
| `workbench/workbench-chart` | `workbench` | Sample CRs — Workbench, NavigationNodes, Widgets, ServiceProxies, Actions |

## Dashboard gateway internals

The dashboard server (`hyperbench/hyperbench-dashboard`) is the central gateway:

```
K8s API Server
     │
     │  Watch streams (ADDED / MODIFIED / DELETED)
     ▼
┌─────────────────────────────────────────────┐
│  MutableCrdStore                             │
│                                              │
│  Maps:                                       │
│    navigationNodes  → Map<name, CR>          │
│    widgets          → Map<name, CR>          │
│    serviceProxies   → Map<name, CR>          │
│    actions          → Map<name, CR>          │
│                                              │
│  Derived indexes (rebuilt on mutation):       │
│    pageIndex   → Map<path, NavigationNode>   │
│    proxyIndex  → Map<pathPrefix, baseUrl>    │
│    shellHtml   → pre-rendered HTML string    │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Express Server (:3000)                      │
│                                              │
│  1. Page middleware:                          │
│     if (pageIndex.has(req.path))              │
│       HTMX request → serve grid layout       │
│       browser request → serve shell HTML      │
│                                              │
│  2. Dynamic proxy:                           │
│     longest-prefix match in proxyIndex        │
│     → http-proxy-middleware to backend        │
│                                              │
│  3. Root: serve shell HTML                    │
└─────────────────────────────────────────────┘
```

## Tech stack

| Layer | Technology |
|---|---|
| Orchestration | Kubernetes (kind), Helm, Tilt |
| Operator | Go 1.24, Kubebuilder, controller-runtime |
| Server framework | Spring Boot 3.4, Spring Data REST, Spring HATEOAS |
| Server language | Java 21 |
| Media type | hal-schema-forms (custom HAL+JSON profile) |
| Database | H2 (in-memory, per-service) |
| Gateway / frontends | Express, React 19 (SSR only) |
| UI rendering | json-render (catalog + registry + renderer) |
| Frontend language | TypeScript 5.7 |
| Interactivity | HTMX 2 + htmx-json-enc |
| UI components | Shoelace 2.20 (web components) |
| Styling | Tailwind CSS |
| Build / tooling | mise, Maven 3.9, npm workspaces, Tilt |

## Development

Prerequisites: [mise](https://mise.jdx.dev/) (manages Java, Maven, Node, Go, kind, kubectl, helm, tilt).

```bash
mise install              # Install all tool versions
mise run build            # Build everything (npm + maven)
```

### Local Kubernetes with Tilt

```bash
mise run k8s:up           # Create kind cluster
mise run tilt:up          # Start Tilt — builds, deploys, watches
```

Tilt watches source files and only rebuilds/redeploys what changed. The Tilt UI at `http://localhost:10350` shows all resources. The dashboard is port-forwarded to `http://localhost:3000`.

```bash
mise run tilt:down        # Stop Tilt and tear down resources
mise run k8s:down         # Delete kind cluster
```

### Useful commands

```bash
mise run k8s:status       # Show pods and CRs across namespaces
mise run k8s:dashboard    # Port-forward dashboard to localhost:3000
mise run test             # Run Maven tests
```

## hal-schema-forms media type

### Example: Step 1 (new form, no resource yet)

```json
{
  "_links": { "self": { "href": "/ui/onboarding/step1" } },
  "step": 1, "totalSteps": 5, "stepLabel": "Client Info",
  "_forms": {
    "default": {
      "_links": { "target": { "href": "/ui/onboarding" } },
      "method": "POST", "contentType": "application/json",
      "schema": {
        "type": "object",
        "required": ["fullName", "email"],
        "properties": {
          "fullName": { "type": "string", "title": "Full Name" },
          "email": { "type": "string", "title": "Email", "format": "email" },
          "country": { "type": "string", "title": "Country",
            "oneOf": [{"const":"US","title":"United States"}, {"const":"CH","title":"Switzerland"}] }
        }
      }
    }
  }
}
```

### Dynamic form rendering

The renderer detects template variables in the self link (e.g. `{?country}`) that match a schema field name. It auto-wires `hx-patch` + `hx-trigger="sl-change"` on that field. When the user changes the value, HTMX sends a PATCH with the current form state. The server saves to H2, rebuilds the form with context-appropriate fields, and returns new HTML. The form updates in-place.

| Step | Trigger field | What changes |
|------|--------------|-------------|
| Step 2: Address & Tax | `country` | Address fields, postal format, state/canton enums |
| Step 3: Risk & Suitability | `riskTolerance` | Investment objectives, required fields, risk acknowledgment |
| Step 4: KYC Verification | `documentType` | Document number format, required fields, license class enum |

### JSON Schema to Shoelace mapping

| JSON Schema pattern | Shoelace output |
|---|---|
| `type: "string"` | `<sl-input type="text">` |
| `type: "string", format: "email"` | `<sl-input type="email">` |
| `type: "string", format: "date"` | `<sl-input type="date">` |
| `type: "string", oneOf: [{const, title}]` | `<sl-select>` + `<sl-option>`s |
| `type: "integer"` / `type: "number"` | `<sl-input type="number">` |
| `type: "string", maxLength > 255` | `<sl-textarea>` |
