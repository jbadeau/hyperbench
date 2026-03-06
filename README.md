ar# AdvisoryHub

AdvisoryHub is a **banking relationship manager workbench** built on pure hypermedia principles. The server drives all UI through the [hal-schema-forms](https://github.com/jbadeau/hal-schema-forms) media type — `_links` for navigation, `_forms` with JSON Schema for actions. A thin Node.js layer renders HAL resources to HTML using Shoelace web components, and HTMX handles all interactions without client-side routing or state management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  AdvisoryHub Shell (HTML + Tailwind CSS)                        │    │
│  │  ┌──────────┐  ┌───────────────────────────────────────────┐   │    │
│  │  │ Sidebar   │  │  #content (HTMX fragment target)          │   │    │
│  │  │ nav with  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │    │
│  │  │ local-    │  │  │ Widget  │ │ Widget  │ │ Widget  │    │   │    │
│  │  │ Storage   │  │  │ (hx-get)│ │ (hx-get)│ │ (hx-get)│    │   │    │
│  │  │ persist.  │  │  └─────────┘ └─────────┘ └─────────┘    │   │    │
│  │  └──────────┘  └───────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │ HTMX (hx-get / hx-post / hx-patch)          │
└──────────────────────────┼──────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard Gateway  (Express :3000)                                     │
│  Routes /fragments/* to micro-frontend services via http-proxy          │
│  Routes /api/* to Spring Boot APIs                                      │
│  Serves HTML shell on GET /                                             │
│  Serves dashboard grid on GET /fragments/dashboard                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │  Action Items   │  │  Clients        │  │  KYC Onboarding │        │
│  │  (Express :3001)│  │  (Express :3002)│  │  (Express :3003)│        │
│  │                 │  │                 │  │                 │        │
│  │  /fragments/    │  │  /fragments/    │  │  /fragments/    │        │
│  │  todos/*        │  │  clients/*      │  │  onboarding/*   │        │
│  │                 │  │                 │  │                 │        │
│  │  Fetches HAL    │  │  Static mock    │  │  Catch-all      │        │
│  │  from API,      │  │  data (client   │  │  proxy to       │        │
│  │  renders HTML   │  │  book, recent   │  │  Spring Boot    │        │
│  │  via shared     │  │  activity)      │  │  API + shared   │        │
│  │  renderer       │  │                 │  │  renderer       │        │
│  └────────┬────────┘  └─────────────────┘  └────────┬────────┘        │
│           │                                          │                 │
│           ▼                                          ▼                 │
│  ┌─────────────────┐                      ┌─────────────────┐         │
│  │  Spring Boot    │                      │  Spring Boot    │         │
│  │  Action Items   │                      │  KYC Onboarding │         │
│  │  API :8081      │                      │  API :8082      │         │
│  │                 │                      │                 │         │
│  │  Spring Data    │                      │  5-step wizard  │         │
│  │  REST + UI spec │                      │  controller     │         │
│  │  controller     │                      │                 │         │
│  │  (H2: todos)    │                      │  (H2: onboard)  │         │
│  └─────────────────┘                      └─────────────────┘         │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │  hyperbench-server-hal-schema-forms (shared library)        │       │
│  │  FormsRepresentationModel, JsonSchemaBuilder, FormBuilder   │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request flow

```
Browser                Gateway :3000        Node.js service       Spring Boot API
  │                        │                      │                      │
  │  GET /                 │                      │                      │
  │───────────────────────►│                      │                      │
  │  ◄─── HTML shell ─────│                      │                      │
  │                        │                      │                      │
  │  GET /fragments/       │                      │                      │
  │  onboarding/step1      │                      │                      │
  │───────────────────────►│  proxy ──────────────►│                      │
  │                        │                      │  GET /ui/onboarding/ │
  │                        │                      │  step1               │
  │                        │                      │─────────────────────►│
  │                        │                      │  ◄── hal-schema-     │
  │                        │                      │      forms JSON ─────│
  │                        │                      │                      │
  │                        │                      │  Renderer: JSON      │
  │                        │                      │  Schema → Shoelace   │
  │                        │                      │  → HTML fragment     │
  │                        │  ◄── HTML fragment ──│                      │
  │  ◄── HTML fragment ───│                      │                      │
  │                        │                      │                      │
  │  HTMX swaps into DOM  │                      │                      │
  │                        │                      │                      │
  │  POST /fragments/      │                      │                      │
  │  onboarding (json-enc) │                      │                      │
  │───────────────────────►│  proxy ──────────────►│                      │
  │                        │                      │  POST /ui/onboarding │
  │                        │                      │  {JSON body}         │
  │                        │                      │─────────────────────►│
  │                        │                      │                      │  save to H2
  │                        │                      │  ◄── step 2 JSON ───│
  │                        │                      │  render → HTML       │
  │  ◄── step 2 HTML ─────│  ◄───────────────────│                      │
  │                        │                      │                      │
  │  User changes country  │                      │                      │
  │  select (sl-change)    │                      │                      │
  │                        │                      │                      │
  │  PATCH /fragments/     │                      │                      │
  │  onboarding/{id}/step2 │                      │                      │
  │  {country: "CH"}       │                      │                      │
  │───────────────────────►│  proxy ──────────────►│                      │
  │                        │                      │  PATCH /ui/onboarding│
  │                        │                      │  /{id}/step2         │
  │                        │                      │─────────────────────►│
  │                        │                      │                      │  save, re-render
  │                        │                      │  ◄── step 2 JSON    │  with CH fields
  │                        │                      │      (CH address) ──│
  │  ◄── re-rendered HTML ─│  ◄───────────────────│                      │
  │                        │                      │                      │
  │  Form updates in-place │                      │                      │
```

### Dynamic form rendering

Three steps use server-driven dynamic form rendering via templated self links:

| Step | Trigger field | Templated self link | What changes on selection |
|------|--------------|---------------------|--------------------------|
| Step 2: Address & Tax | `country` | `{?country}` | Address fields, labels, postal format, state/canton/district enums (US/UK/DE/CH/SG/HK) |
| Step 3: Risk & Suitability | `riskTolerance` | `{?riskTolerance}` | Investment objectives, experience levels, income/net worth thresholds, required fields, risk acknowledgment (Very High) |
| Step 4: KYC Verification | `documentType` | `{?documentType}` | Document number placeholder/format, required fields, license class enum (Driver's License only) |

**How it works:** The renderer detects template variables in the self link (e.g. `{?country}`) that match a schema field name. It auto-wires `hx-patch` + `hx-trigger="sl-change"` on that field's `<sl-select>`. When the user changes the value, HTMX sends a PATCH with the current form state. The server saves to H2, rebuilds the form with context-appropriate fields, and returns the new HTML. The form updates in-place without a page reload.

### Key principles

- **Media type**: `application/hal+json; profile="https://github.com/jbadeau/hal-schema-forms"`
- **`_links`** for navigation (prev/next/self), **`_forms`** with JSON Schema for actions
- **H2 persistence** for wizard state — no hidden fields, no client-side state
- **Dynamic selects** via templated self links — renderer detects template variables matching schema field names and adds `hx-patch` + `hx-trigger="sl-change"`
- **JSON body submission** via the `htmx-json-enc` extension — no FormData workaround needed
- **Renderer** uses json-render's catalog/registry/transformer pipeline to map HAL resources to Shoelace web components via React SSR
- **localStorage** sidebar state persistence — selected nav item survives page reloads

## Dashboard layout

```
┌──────────────────────────────────────────────────────────────────┐
│  AdvisoryHub                    [Search clients, actions...]  🔔 ⚙ JD │
├────────┬─────────────────────────────────────────────────────────┤
│        │  Good morning, John                                     │
│ OVERVIEW│  Here's your advisory overview for today                │
│ Dashboard│                                                        │
│        │  ┌──────────────────────────┐ ┌────────────────────┐    │
│ CLIENTS│  │  Today's Agenda          │ │  Quick Actions     │    │
│ My Book│  │  Open: 4  In Progress: 2 │ │  [New Client KYC]  │    │
│ Recent │  │  Overdue: 1 Completed: 8 │ │  [Log Interaction] │    │
│ New KYC│  └──────────────────────────┘ │  [Schedule Review]  │    │
│        │                               └────────────────────┘    │
│ ACTIONS│  ┌──────────────────────────┐ ┌────────────────────┐    │
│ My Tasks│  │  My Client Book          │ │  Alerts & Tasks    │    │
│ Pending│  │  32 clients · CHF 847M   │ │  KYC expiring:     │    │
│ Reviews│  │  CW Chen Wei    12.4M    │ │   Chen Wei (5d)    │    │
│        │  │  SM S. Mitchell  8.2M    │ │   S. Mitchell (12d)│    │
│ADVISORY│  │  JK J. Kowalski  5.1M    │ │  Suitability rev.  │    │
│Products│  │  MS M. Santos    3.8M    │ │  Birthday: M.Santos│    │
│ Market │  └──────────────────────────┘ └────────────────────┘    │
│        │                                                         │
│COMPLIAN│  ┌──────────────────────────┐ ┌────────────────────┐    │
│KYC Ctr │  │  Recent Activity         │ │  Action Items      │    │
│Reports │  │  CW Portfolio review  Tdy│ │  ☐ Follow up...    │    │
│        │  │  SM KYC verified     Yest│ │  ☑ Review docs     │    │
│        │  │  JK Rebalanced       2d  │ │  ☐ Schedule mtg    │    │
│ Help   │  │  MS Risk updated     3d  │ │      [View all]    │    │
│        │  └──────────────────────────┘ └────────────────────┘    │
└────────┴─────────────────────────────────────────────────────────┘
```

## KYC wizard flow

```
Step 1              Step 2              Step 3              Step 4              Step 5
Client Info    →    Address & Tax  →    Risk &         →    KYC            →    Review &
                                        Suitability         Verification        Submit
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Full Name │   │ Country [▼]  │   │ Risk      [▼]│   │ Doc Type [▼] │   │ ✅ KYC       │
│ Email     │   │  ↕ dynamic   │   │  ↕ dynamic   │   │  ↕ dynamic   │   │ submission   │
│ Phone     │   │ Street       │   │ Experience   │   │ Doc Number   │   │ completed!   │
│ Type  [▼] │   │ City         │   │ Objective    │   │ Issuing Ctry │   │              │
│ Country[▼]│   │ State/Canton │   │ Income       │   │ Expiry       │   │ Summary:     │
│           │   │ Postal Code  │   │ Net Worth    │   │ License Class│   │ Name: ...    │
│           │   │              │   │ Source Wealth │   │ (DL only)    │   │ Risk: ...    │
│           │   │ Fields change│   │ Fields change│   │ Fields change│   │ Doc: ...     │
│           │   │ per country  │   │ per risk lvl │   │ per doc type │   │              │
│   [Next →]│   │   [Next →]   │   │   [Next →]   │   │   [Next →]   │   │ [Start New]  │
└──────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                CH: Canton enum     LOW: Pres/Income    Passport: ctry+    [Back to
                SG: no state        HIGH: src wealth     expiry required    Dashboard]
                HK: District enum    required            Nat'l ID: no
                DE: Bundesland      VERY_HIGH: risk      expiry req'd
                UK: County           acknowledgment      DL: license
                US: State enum       + all required       class enum
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
          "fullName": { "type": "string", "title": "Full Name", "placeholder": "e.g. Jane Smith" },
          "email": { "type": "string", "title": "Email", "format": "email" },
          "country": { "type": "string", "title": "Country",
            "oneOf": [{"const":"US","title":"United States"}, {"const":"CH","title":"Switzerland"}] }
        }
      }
    }
  }
}
```

### Example: Step 3 (templated self for dynamic risk tolerance reload)

```json
{
  "_links": {
    "self": { "href": "/ui/onboarding/abc/step3{?riskTolerance}", "templated": true },
    "prev": { "href": "/ui/onboarding/abc/step2" }
  },
  "step": 3, "totalSteps": 5, "stepLabel": "Risk & Suitability — High",
  "_forms": {
    "default": {
      "_links": { "target": { "href": "/ui/onboarding/abc/step3" } },
      "method": "POST", "contentType": "application/json",
      "schema": {
        "type": "object",
        "required": ["riskTolerance", "investmentExperience", "investmentObjective", "sourceOfWealth", "annualIncome"],
        "properties": {
          "riskTolerance": { "type": "string", "title": "Risk Tolerance",
            "oneOf": [{"const":"LOW","title":"Low"}, {"const":"MODERATE","title":"Moderate"},
                      {"const":"HIGH","title":"High"}, {"const":"VERY_HIGH","title":"Very High"}],
            "default": "HIGH" },
          "investmentObjective": { "type": "string", "title": "Investment Objective",
            "oneOf": [{"const":"INCOME","title":"Income"}, {"const":"GROWTH","title":"Growth"},
                      {"const":"SPECULATION","title":"Speculation"}] },
          "sourceOfWealth": { "type": "string", "title": "Source of Wealth", "..." : "..." }
        }
      }
    }
  }
}
```

### Example: Confirmation (display-only, no `_forms`)

```json
{
  "_links": {
    "self": { "href": "/ui/onboarding/abc/confirmation" },
    "home": { "href": "/ui/dashboard", "title": "Back to Dashboard" },
    "create": { "href": "/ui/onboarding/step1", "title": "Start New KYC" }
  },
  "step": 5, "totalSteps": 5,
  "alert": { "message": "KYC submission completed!", "variant": "success" },
  "summary": { "Name": "Jane Smith", "Email": "jane@example.com", "Risk Tolerance": "HIGH", "Document Type": "PASSPORT" }
}
```

## Renderer architecture

The shared renderer (`@hyperbench/shared`) uses [json-render](https://json-render.dev/) to convert HAL-schema-forms resources into HTML. The pipeline has three layers:

```
HAL-schema-forms JSON (from Spring Boot APIs)
        │
        ▼
┌─────────────────┐
│  transformer.ts  │  halToSpec(resource) → Spec
│  HAL → Spec      │  Converts HAL links, forms, and JSON Schema
└────────┬────────┘  into a flat element tree
         ▼
┌─────────────────┐    ┌──────────────┐
│  Renderer        │◄───│  registry.tsx │  Shoelace JSX for each component
│  (json-render)   │    └──────────────┘
└────────┬────────┘    ┌──────────────┐
         │         ◄───│  catalog.ts   │  Zod-validated component definitions
         ▼             └──────────────┘
┌─────────────────┐
│  renderToString  │  React SSR → HTML string
└─────────────────┘
```

- **Catalog** — 12 Shoelace component definitions (Card, Form, TextField, SelectField, Button, etc.) with Zod prop schemas
- **Registry** — Maps each catalog component to Shoelace JSX with HTMX attributes
- **Transformer** — Converts HAL resources into a json-render `Spec` (flat element tree), handling template variables, URL rewriting, and dynamic field detection

Only SSR is used — HTMX handles all interactivity. The `Renderer` is wrapped in `JSONUIProvider` (which bundles `StateProvider`, `VisibilityProvider`, and `ActionProvider` required by json-render internals even in SSR mode). The public API is `renderHalForms(resource) → HTML string`.

## JSON Schema to Shoelace mapping

Inspired by [RJSF](https://github.com/rjsf-team/react-jsonschema-form):

| JSON Schema pattern | Shoelace output |
|---|---|
| `type: "string"` | `<sl-input type="text">` |
| `type: "string", format: "email"` | `<sl-input type="email">` |
| `type: "string", format: "date"` | `<sl-input type="date">` |
| `type: "string", oneOf: [{const, title}]` | `<sl-select>` + `<sl-option>`s |
| `type: "integer"` / `type: "number"` | `<sl-input type="number">` with min/max |
| `type: "string", maxLength > 255` | `<sl-textarea>` |
| `default` on any property | Pre-fills the field value |

## URL structure

### KYC Onboarding (5-step wizard)

| Method | URL | Action |
|--------|-----|--------|
| GET | `/ui/onboarding/step1` | New empty step 1 form (Client Info) |
| POST | `/ui/onboarding` | Create draft in H2, return step 2 |
| GET | `/ui/onboarding/{id}/step1` | Load draft, render step 1 |
| POST | `/ui/onboarding/{id}/step1` | Update step 1, return step 2 |
| GET | `/ui/onboarding/{id}/step2` | Load draft, render step 2 (Address & Tax) |
| PATCH | `/ui/onboarding/{id}/step2` | Save fields, re-render step 2 (country change) |
| POST | `/ui/onboarding/{id}/step2` | Save step 2, return step 3 |
| GET | `/ui/onboarding/{id}/step3` | Load draft, render step 3 (Risk & Suitability) |
| PATCH | `/ui/onboarding/{id}/step3` | Save fields, re-render step 3 (risk tolerance change) |
| POST | `/ui/onboarding/{id}/step3` | Save step 3, return step 4 |
| GET | `/ui/onboarding/{id}/step4` | Load draft, render step 4 (KYC Verification) |
| PATCH | `/ui/onboarding/{id}/step4` | Save fields, re-render step 4 (document type change) |
| POST | `/ui/onboarding/{id}/step4` | Save step 4, return confirmation |
| GET | `/ui/onboarding/{id}/confirmation` | Display-only confirmation |

### Action Items (Todos)

| Method | URL | Action |
|--------|-----|--------|
| GET | `/ui/tasks` | Action item list with items array |
| GET | `/ui/tasks/form` | New action item form (JSON Schema) |
| GET | `/ui/tasks/{id}/form` | Edit action item form (pre-filled from DB) |

## Module structure

### Java (Maven)

| Module | Description |
|--------|-------------|
| `hyperbench-server-hal-schema-forms` | Core library: media type, Jackson serialization, `FormsRepresentationModel`, `JsonSchemaBuilder`, `FormBuilder` |
| `hyperbench-server-todos` | Action Items API (:8081) — Spring Data REST + hal-schema-forms UI endpoints |
| `hyperbench-server-onboarding` | KYC Onboarding API (:8082) — 5-step wizard with H2 persistence and dynamic form rendering |
| `hyperbench-server-shared` | Legacy (empty) |

### TypeScript (npm workspaces)

| Package | Description |
|---------|-------------|
| `@hyperbench/shared` | hal-schema-forms types, json-render catalog/registry/transformer, renderer (HAL → Shoelace → HTML), fetch utilities |
| `@hyperbench/dashboard` | Gateway (:3000) — HTML shell, sidebar nav, dashboard grid, proxy routing |
| `@hyperbench/todos` | Action Items micro-frontend (:3001) — dashboard widgets + full-page views |
| `@hyperbench/clients` | Clients micro-frontend (:3002) — client book, recent activity |
| `@hyperbench/onboarding` | KYC Onboarding micro-frontend (:3003) — catch-all proxy to API |

## Tech stack

| Layer | Technology |
|---|---|
| Server framework | Spring Boot 3.4, Spring Data REST, Spring HATEOAS |
| Server language | Java 21 |
| Media type | hal-schema-forms (custom HAL+JSON profile) |
| Database | H2 (in-memory, per-service) |
| Client framework | Express 5, React 19 (SSR only) |
| UI rendering | json-render (catalog + registry + renderer) |
| Schema validation | Zod 4 |
| Client language | TypeScript 5.7 |
| Interactivity | HTMX 2 + htmx-json-enc |
| UI components | Shoelace 2.20 (web components) |
| Styling | Tailwind CSS |
| Build | mise, Maven 3.9, npm workspaces |

## Development

Prerequisites: [mise](https://mise.jdx.dev/) (manages Java, Maven, Node).

```bash
mise install          # Install tool versions
npm install           # Install npm dependencies
mvn clean install     # Build all Java modules
npm run build --workspaces  # Build all TypeScript
```

### Running services

Start the Spring Boot APIs and Node.js services individually:

```bash
# Spring Boot APIs
java -jar hyperbench-server-todos/target/hyperbench-server-todos-0.1.0-SNAPSHOT.jar
java -jar hyperbench-server-onboarding/target/hyperbench-server-onboarding-0.1.0-SNAPSHOT.jar

# Node.js services
node hyperbench-dashboard/dist/server.js
node hyperbench-todos/dist/server.js
node hyperbench-clients/dist/server.js
node hyperbench-onboarding/dist/server.js
```

Open `http://localhost:3000` in your browser.

### Useful endpoints

| Endpoint | Description |
|---|---|
| `http://localhost:3000` | Application UI |
| `http://localhost:8081/api/tasks` | Action Items REST API (HAL-FORMS) |
| `http://localhost:8081/ui/tasks` | Action Items hal-schema-forms |
| `http://localhost:8081/h2-console` | Action Items H2 console |
| `http://localhost:8082/ui/onboarding/step1` | KYC Onboarding hal-schema-forms |
| `http://localhost:8082/h2-console` | KYC Onboarding H2 console |
