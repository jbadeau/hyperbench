import { esc } from "@hyperbench/shared/lib/html.js";
import {
  componentSchemas,
  componentSchema,
  acceptsChildren,
  type PropSchema,
} from "@hyperbench/shared/json-render.js";

/**
 * A visual editor over a json-render spec.
 *
 * Every control posts the whole spec back and the server returns a re-rendered
 * editor. That keeps the spec in exactly one place — the form — rather than
 * duplicating it into client-side state that can drift from what gets saved.
 */

export interface SpecElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
}

export interface EditableSpec {
  root: string;
  elements: Record<string, SpecElement>;
  state?: Record<string, unknown>;
}

/** Depth-first walk from the root, so the tree renders in document order. */
function walk(
  spec: EditableSpec,
  key: string,
  depth: number,
  seen: Set<string>,
  out: { key: string; depth: number }[],
): void {
  if (seen.has(key) || !spec.elements?.[key]) return;
  seen.add(key);
  out.push({ key, depth });
  for (const child of spec.elements[key].children ?? []) {
    walk(spec, child, depth + 1, seen, out);
  }
}

export function elementOrder(spec: EditableSpec): { key: string; depth: number }[] {
  const out: { key: string; depth: number }[] = [];
  walk(spec, spec.root, 0, new Set(), out);

  // Elements not reachable from the root still exist and still save, so they
  // are listed rather than hidden — an unreachable element is usually a
  // mistake the author needs to see.
  for (const key of Object.keys(spec.elements ?? {})) {
    if (!out.some((e) => e.key === key)) out.push({ key, depth: 0 });
  }
  return out;
}

/** Find the element whose children include `key`. */
function parentOf(spec: EditableSpec, key: string): string | null {
  for (const [k, el] of Object.entries(spec.elements ?? {})) {
    if ((el.children ?? []).includes(key)) return k;
  }
  return null;
}

// ── Tree ──────────────────────────────────────────────────────────────────

function renderTree(spec: EditableSpec, selected: string): string {
  const rows = elementOrder(spec)
    .map(({ key, depth }) => {
      const el = spec.elements[key];
      const active = key === selected;
      return `
      <button type="button"
        class="w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 ${
          active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
        }"
        style="padding-left:${0.5 + depth * 0.75}rem"
        name="selected" value="${esc(key)}"
        hx-post="/playground/design/select"
        hx-include="#pg-editor-form"
        hx-target="#pg-editor"
        hx-swap="outerHTML">
        <span class="font-medium">${esc(el.type)}</span>
        <span class="${active ? "opacity-70" : "text-muted-foreground"}">${esc(key)}</span>
      </button>`;
    })
    .join("");

  return `
  <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
    <div class="px-3 py-2 border-b border-border bg-card text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Elements
    </div>
    <div class="flex-1 overflow-auto p-1 space-y-0.5">${rows}</div>
  </div>`;
}

// ── Property controls ─────────────────────────────────────────────────────

const LABEL = `class="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1"`;
const INPUT = `class="w-full bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"`;

/**
 * One control per prop, chosen from the catalog's own schema.
 *
 * Structured props (arrays of objects, records) get a JSON box rather than a
 * bespoke widget: a column list or a row map has no single obvious form, and a
 * half-guessed widget that silently drops fields is worse than a text area
 * that round-trips exactly what the catalog accepts.
 */
function renderPropControl(prop: PropSchema, value: unknown): string {
  const name = `prop_${prop.name}`;

  // Typed fields update as you type, after a short pause. `change` alone fires
  // only on blur, which makes the preview feel broken — you type and nothing
  // happens until you click elsewhere. `changed` suppresses re-renders when the
  // value has not actually moved (arrow keys, tabbing through).
  const typing = `hx-trigger="keyup changed delay:400ms, change"`;
  const immediate = `hx-trigger="change"`;
  const post = `hx-post="/playground/design/prop" hx-include="#pg-editor-form" hx-target="#pg-editor" hx-swap="outerHTML"`;
  const common = `name="${esc(name)}" ${post} ${immediate}`;
  const commonTyping = `name="${esc(name)}" ${post} ${typing}`;

  if (prop.kind === "boolean") {
    return `
    <label class="flex items-center gap-2 text-xs text-foreground">
      <input type="checkbox" ${common} ${value ? "checked" : ""}
        class="h-3.5 w-3.5 rounded border-border bg-background" />
      ${esc(prop.name)}
    </label>`;
  }

  if (prop.kind === "enum" && prop.values?.length) {
    const opts = prop.values
      .map(
        (v) =>
          `<option value="${esc(v)}"${String(value) === v ? " selected" : ""}>${esc(v)}</option>`,
      )
      .join("");
    return `
    <div>
      <label ${LABEL}>${esc(prop.name)}</label>
      <select ${common} ${INPUT}>
        <option value=""${value == null ? " selected" : ""}>—</option>
        ${opts}
      </select>
    </div>`;
  }

  if (prop.kind === "number") {
    return `
    <div>
      <label ${LABEL}>${esc(prop.name)}</label>
      <input type="number" ${commonTyping} ${INPUT} value="${value == null ? "" : esc(String(value))}" />
    </div>`;
  }

  if (prop.kind === "string") {
    const text = value == null ? "" : String(value);
    const long = text.length > 60;
    return `
    <div>
      <label ${LABEL}>${esc(prop.name)}</label>
      ${
        long
          ? `<textarea ${commonTyping} ${INPUT} rows="3">${esc(text)}</textarea>`
          : `<input type="text" ${commonTyping} ${INPUT} value="${esc(text)}" />`
      }
    </div>`;
  }

  // string[] / number[] / object[] / record / unknown
  const json = value === undefined ? "" : JSON.stringify(value, null, 2);
  return `
  <div>
    <label ${LABEL}>${esc(prop.name)} <span class="normal-case opacity-70">${esc(prop.kind)}</span></label>
    <textarea ${common} ${INPUT} rows="${Math.min(10, Math.max(3, json.split("\n").length))}"
      spellcheck="false">${esc(json)}</textarea>
  </div>`;
}

function renderProps(spec: EditableSpec, selected: string): string {
  const el = spec.elements?.[selected];
  if (!el) {
    return `<p class="text-xs text-muted-foreground p-3">Select an element.</p>`;
  }

  const schema = componentSchema(el.type);
  const body = schema
    ? schema.props.map((p) => renderPropControl(p, el.props?.[p.name])).join("")
    : `<p class="text-xs text-destructive">"${esc(el.type)}" is not in the catalog.</p>`;

  const addable = acceptsChildren(el.type)
    ? `
    <div class="border-t border-border pt-2 mt-2">
      <label ${LABEL}>Add child</label>
      <select name="addType" ${INPUT}
        hx-post="/playground/design/add" hx-include="#pg-editor-form"
        hx-target="#pg-editor" hx-swap="outerHTML" hx-trigger="change">
        <option value="">Choose a component…</option>
        ${componentSchemas()
          .map((c) => `<option value="${esc(c.type)}">${esc(c.type)}</option>`)
          .join("")}
      </select>
    </div>`
    : "";

  const removable = selected !== spec.root
    ? `
    <button type="button"
      class="mt-2 w-full px-2 py-1 rounded-md border border-destructive/50 text-destructive text-xs hover:bg-destructive/10 transition"
      hx-post="/playground/design/remove" hx-include="#pg-editor-form"
      hx-target="#pg-editor" hx-swap="outerHTML">Delete ${esc(selected)}</button>`
    : `<p class="mt-2 text-[11px] text-muted-foreground">The root element cannot be deleted.</p>`;

  return `
  <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
    <div class="px-3 py-2 border-b border-border bg-card flex items-center justify-between">
      <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Properties</span>
      <span class="text-xs text-foreground">${esc(el.type)}</span>
    </div>
    <div class="flex-1 overflow-auto p-3 space-y-3">
      ${body}
      ${addable}
      ${removable}
    </div>
  </div>`;
}

// ── Mutations ─────────────────────────────────────────────────────────────

/** Coerce a posted form value to the type the catalog declares. */
export function coerceProp(prop: PropSchema, raw: string | undefined): unknown {
  if (prop.kind === "boolean") return raw === "on" || raw === "true";
  if (raw === undefined || raw === "") return prop.optional ? null : raw ?? "";
  if (prop.kind === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  if (prop.kind === "string" || prop.kind === "enum") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // Leave the previous value alone rather than writing a broken prop; the
    // editor re-renders from the spec, so the box visibly reverts.
    return undefined;
  }
}

/** A key that does not collide with anything already in the spec. */
export function freshKey(spec: EditableSpec, type: string): string {
  const base = type.toLowerCase();
  let i = 1;
  let key = base;
  while (spec.elements?.[key]) key = `${base}-${++i}`;
  return key;
}

/** Remove an element and every reference to it, including orphaned children. */
export function removeElement(spec: EditableSpec, key: string): void {
  if (key === spec.root) return;
  const parent = parentOf(spec, key);
  if (parent) {
    spec.elements[parent].children = (spec.elements[parent].children ?? []).filter(
      (c) => c !== key,
    );
  }
  const doomed = [key];
  while (doomed.length) {
    const k = doomed.pop()!;
    const el = spec.elements[k];
    if (!el) continue;
    doomed.push(...(el.children ?? []));
    delete spec.elements[k];
  }
}

// ── Whole editor ──────────────────────────────────────────────────────────

export function renderDesignEditor(opts: {
  spec: EditableSpec;
  selected: string;
  previewHtml: string;
  issues: string[];
  widgetName: string;
  title: string;
  generationAvailable: boolean;
  prompt?: string;
  /** Which tool the left pane is showing: the AI chat or the element editor. */
  pane?: string;
  /** Push each edit to the portal without pressing Apply. */
  autoApply?: boolean;
  /** True once this session has actually changed the spec. */
  dirty?: boolean;
  /** Live data the preview is bound against. */
  state?: Record<string, unknown>;
}): string {
  const specJson = JSON.stringify(opts.spec, null, 2);
  const selected =
    opts.spec.elements?.[opts.selected] !== undefined ? opts.selected : opts.spec.root;
  const pane =
    opts.pane === "elements" || opts.pane === "data" ? opts.pane : "chat";
  const autoApply = opts.autoApply !== false;

  // Auto-apply is armed only once something has actually been edited. Firing on
  // open would turn "look at this section" into "override this section", and a
  // Design is platform configuration every portal viewer sees.
  //
  // The delay debounces: each edit re-renders this element, which restarts the
  // timer, so a burst of changes writes one Custom Resource rather than one per
  // keystroke. etcd is the wrong store for keystroke-frequency writes.
  const autoTrigger =
    autoApply && opts.dirty
      ? `<div hx-post="/playground/save" hx-include="#pg-editor-form"
             hx-target="#pg-save-result" hx-swap="innerHTML"
             hx-trigger="load delay:900ms"></div>`
      : "";

  const issues = opts.issues.length
    ? `<div class="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs" role="alert">
         ${opts.issues.map((i) => esc(i)).join("<br/>")}
       </div>`
    : "";

  const tab = (id: string, label: string) => `
    <button type="button"
      class="px-2 py-1 rounded-md text-xs ${
        pane === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
      }"
      name="pane" value="${id}"
      hx-post="/playground/design/select" hx-include="#pg-editor-form"
      hx-target="#pg-editor" hx-swap="outerHTML">${esc(label)}</button>`;

  const chatPane = `
    <div class="flex-1 overflow-auto p-3 flex flex-col gap-2">
      ${
        opts.generationAvailable
          ? ""
          : `<p class="text-xs text-muted-foreground">
               Generation is unavailable: no Anthropic API key is configured for the
               playground. The JSON and element editors still work.
             </p>`
      }
      <label ${LABEL}>Describe the change</label>
      <textarea name="chatPrompt" rows="4" ${INPUT}
        placeholder="${
          opts.generationAvailable
            ? "e.g. put the account value first and drop the phone column"
            : "unavailable — no API key"
        }" ${opts.generationAvailable ? "" : "disabled"}></textarea>
      <button type="button"
        class="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition"
        hx-post="/playground/design/generate" hx-include="#pg-editor-form"
        hx-target="#pg-editor" hx-swap="outerHTML"
        hx-indicator="#pg-thinking"
        ${opts.generationAvailable ? "" : "disabled"}>Generate</button>
      <span id="pg-thinking" class="htmx-indicator text-xs text-muted-foreground">thinking…</span>
      ${
        opts.prompt
          ? `<div class="border-t border-border pt-2 mt-1">
               <div class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Last prompt</div>
               <p class="text-xs text-foreground">${esc(opts.prompt)}</p>
             </div>`
          : ""
      }
    </div>`;

  // The data the preview is bound to, shown so an author can see what
  // `$state` paths are available and what the rows actually contain. Read-only
  // on purpose: this is the backing app's live content, not part of the design,
  // and letting it be edited here would suggest saving it — which is exactly
  // the mistake that froze rows into designs in the first place.
  const dataPane = (() => {
    const json = opts.state ? JSON.stringify(opts.state, null, 2) : "";
    const paths = opts.state ? Object.keys(opts.state).map((k) => "/" + k) : [];

    if (!json) {
      return `
      <div class="flex-1 overflow-auto p-3">
        <p class="text-xs text-muted-foreground">
          This section serves no data endpoint, so the preview renders without
          content. Bind a prop with <code>{"$state": "/…"}</code> once it does.
        </p>
      </div>`;
    }

    return `
    <div class="flex-1 overflow-auto p-3 flex flex-col gap-2 min-h-0">
      <div>
        <label ${LABEL}>Bindable paths</label>
        <div class="flex flex-wrap gap-1">
          ${paths
            .map(
              (pth) =>
                `<code class="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">${esc(
                  pth,
                )}</code>`,
            )
            .join("")}
        </div>
      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        <label ${LABEL}>Live data</label>
        <pre class="flex-1 overflow-auto rounded-md border border-border bg-background p-2 text-[11px] font-mono text-muted-foreground whitespace-pre">${esc(
          json,
        )}</pre>
      </div>
      <p class="text-[11px] text-muted-foreground">
        Read-only — supplied by the section's own service at render time.
      </p>
    </div>`;
  })();

  const elementsPane = `
    <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-2 p-2">
      ${renderTree(opts.spec, selected)}
      ${renderProps(opts.spec, selected)}
    </div>`;

  return `
<div id="pg-editor" class="flex flex-col gap-3 h-full">
  <form id="pg-editor-form" class="contents">
    <input type="hidden" id="pg-spec-field" name="spec" value="${esc(specJson)}" />
    <input type="hidden" name="selected" value="${esc(selected)}" />
    <input type="hidden" name="widget" value="${esc(opts.widgetName)}" />
    <input type="hidden" name="title" value="${esc(opts.title)}" />
    <input type="hidden" name="prompt" value="${esc(opts.prompt ?? "")}" />
    <input type="hidden" name="pane" value="${esc(pane)}" />
    <input type="hidden" name="dirty" value="${opts.dirty ? "1" : ""}" />
    <input type="hidden" name="state" value="${esc(
      opts.state ? JSON.stringify(opts.state) : "",
    )}" />
  </form>

  ${issues}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">

    <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
      <div class="px-2 py-2 border-b border-border bg-card flex items-center gap-1">
        ${tab("chat", "AI chat")}
        ${tab("elements", "Elements")}
        ${tab("data", "Data")}
      </div>
      ${pane === "chat" ? chatPane : pane === "data" ? dataPane : elementsPane}
    </div>

    <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
      <div class="px-3 py-2 border-b border-border bg-card flex items-center justify-between">
        <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">JSON</span>
        <span class="text-xs text-muted-foreground">edits the preview</span>
      </div>
      <!-- Targets the preview, not the whole editor: re-rendering this pane
           would replace the textarea under the cursor and reset half-typed
           JSON to the last good spec. The spec field and any parse error come
           back as out-of-band swaps instead, so typing is never disturbed. -->
      <textarea name="specText" spellcheck="false"
        class="flex-1 min-h-[20rem] bg-background text-foreground font-mono text-xs p-3 outline-none resize-none"
        hx-post="/playground/design/json" hx-include="#pg-editor-form"
        hx-target="#pg-preview" hx-swap="innerHTML"
        hx-trigger="keyup changed delay:500ms, change">${esc(specJson)}</textarea>
      <div id="pg-json-error"></div>
    </div>

    <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
      <div class="px-3 py-2 border-b border-border bg-card">
        <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
      </div>
      <div id="pg-preview" class="flex-1 overflow-auto p-4">${opts.previewHtml}</div>
    </div>
  </div>

  <div class="flex gap-2 items-center border-t border-border pt-3">
    <label class="flex items-center gap-1.5 text-xs text-foreground">
      <input type="checkbox" name="autoApply" ${autoApply ? "checked" : ""}
        form="pg-editor-form"
        hx-post="/playground/design/select" hx-include="#pg-editor-form"
        hx-target="#pg-editor" hx-swap="outerHTML" hx-trigger="change"
        class="h-3.5 w-3.5 rounded border-border bg-background" />
      Apply automatically
    </label>
    <button type="button"
      class="px-4 py-1.5 rounded-md ${
        autoApply
          ? "border border-border text-foreground hover:bg-accent"
          : "bg-primary text-primary-foreground hover:opacity-90"
      } text-sm font-medium transition"
      hx-post="/playground/save" hx-include="#pg-editor-form"
      hx-target="#pg-save-result" hx-swap="innerHTML">Apply to portal</button>
    <span id="pg-save-result" class="text-xs text-muted-foreground"></span>
    <div id="pg-autosave">${autoTrigger}</div>
  </div>
</div>`;
}
