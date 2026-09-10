import express from "express";
import { renderSpecDetailed } from "@hyperbench/shared/renderer.js";
import { esc, errorFragment } from "@hyperbench/shared/lib/html.js";
import type { Spec } from "@json-render/core";
import {
  renderEditor,
  renderPreview,
  renderParseError,
  renderTiles,
  renderEditorWindow,
  starterSpecFor,
  STARTER_SPEC,
} from "./views.js";
import { generateDesign, generationAvailable } from "./generate.js";
import { listDesigns, getDesign, saveDesign, deleteDesign, designName } from "./designs.js";
import { listWidgets, fetchWidgetTemplate, fetchWidgetState } from "./widgets.js";
import {
  renderDesignEditor,
  coerceProp,
  freshKey,
  removeElement,
  type EditableSpec,
} from "./design-editor.js";
import { componentSchema } from "@hyperbench/shared/json-render.js";

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/** Parse the spec posted from the editor textarea. */
function parseSpec(raw: unknown): { spec: Spec } | { error: string } {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: "No spec supplied." };
  }
  try {
    return { spec: JSON.parse(raw) as Spec };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Designs are listed on every editor render so the saved list stays current
 * after a save without a page reload. The list is small and the call is cheap;
 * a failure to reach the API server degrades to an empty list rather than
 * taking down the hand-editing half of the playground.
 */
async function safeListDesigns() {
  try {
    return await listDesigns();
  } catch (err) {
    console.warn("[playground] could not list designs:", err);
    return [];
  }
}

// ── Health ────────────────────────────────────────────────────────────────

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));
app.get("/readyz", (_req, res) => res.type("text/plain").send("ok"));

// ── Editor ────────────────────────────────────────────────────────────────

/**
 * Load the portal's widgets alongside the design names that override them.
 *
 * One Design list serves both, so a tile render is two API calls regardless of
 * how many sections the portal has.
 */
async function loadTiles() {
  const designs = await safeListDesigns();
  const bound = new Map<string, string>();
  for (const d of designs) {
    // First writer wins, matching how the portal resolves a collision.
    if (d.targetWidget && !bound.has(d.targetWidget)) bound.set(d.targetWidget, d.name);
  }
  return listWidgets(bound);
}

app.get("/playground/editor", async (_req, res) => {
  try {
    res.type("html").send(renderTiles(await loadTiles()));
  } catch (err) {
    res.status(502).send(errorFragment("playground sections", err));
  }
});

// ── Editor window for one section ─────────────────────────────────────────

app.get("/playground/window/:widget", async (req, res) => {
  try {
    const widgets = await loadTiles();
    const widget = widgets.find((w) => w.name === req.params.widget);
    if (!widget) {
      res.status(404).type("html").send(
        `<div class="text-sm text-destructive">No widget named ${esc(req.params.widget)}.</div>`,
      );
      return;
    }

    // Seed from the design already overriding this section, else from the
    // widget's own template, so the editor opens on something real.
    const existing = widget.designName ? await getDesign(widget.designName) : null;

    // Preference order: the design already applied, then the widget's own
    // template, then a generic starter. Editing the app's real template is the
    // point — a starter is only for widgets that do not expose one.
    const [template, state] = await Promise.all([
      existing ? Promise.resolve(null) : fetchWidgetTemplate(widget.source ?? ""),
      fetchWidgetState(widget.source ?? ""),
    ]);
    const spec = (existing?.spec ??
      template ??
      starterSpecFor(widget)) as unknown as EditableSpec;

    res.type("html").send(
      renderEditorWindow({
        widget,
        editorHtml: editorHtml({
          spec,
          selected: spec.root,
          widget: widget.name,
          title: widget.title,
          prompt: existing?.prompt ?? "",
          pane: "chat",
          autoApply: true,
          dirty: false,
          state,
        }),
      }),
    );
  } catch (err) {
    res.status(502).send(errorFragment("playground editor", err));
  }
});

// ── Revert a section to its own rendering ─────────────────────────────────

app.delete("/playground/override/:widget", async (req, res) => {
  try {
    // Delete the design actually bound to this widget rather than assuming the
    // name matches — a design authored elsewhere may hold the binding.
    const widgets = await loadTiles();
    const target = widgets.find((w) => w.name === req.params.widget);
    if (target?.designName) await deleteDesign(target.designName);
    res.type("html").send(renderTiles(await loadTiles()));
  } catch (err) {
    console.error("[playground] revert failed:", err);
    res.status(502).send(errorFragment("revert", err));
  }
});

// ── Visual editor ─────────────────────────────────────────────────────────

/** Read the editor's posted state: the spec, the selection and its binding. */
function editorState(body: any): EditorState | null {
  const parsed = parseSpec(body?.spec);
  if ("error" in parsed) return null;
  const spec = parsed.spec as unknown as EditableSpec;
  return {
    spec,
    // A tab button and the hidden field share the name, and the clicked button
    // is posted last, so the last value wins and the tab actually switches.
    selected: pickLast(body?.selected) ?? spec.root,
    widget: typeof body?.widget === "string" ? body.widget : "",
    title: typeof body?.title === "string" ? body.title : "",
    prompt: typeof body?.prompt === "string" ? body.prompt : "",
    pane: pickLast(body?.pane) ?? "chat",
    // A checkbox posts nothing when cleared, so its absence is the "off" signal
    // — but only on requests that actually carry the form.
    autoApply: Object.prototype.hasOwnProperty.call(body ?? {}, "autoApply"),
    dirty: pickLast(body?.dirty) === "1",
    // Round-tripped through the form so the preview keeps its data across
    // edits without re-fetching the backing service on every keystroke.
    state: parseState(body?.state),
  };
}

/** Preview state travels as JSON in a hidden field; bad JSON just means none. */
function parseState(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "string" || raw === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Express gives repeated fields as an array; the clicked control is last. */
function pickLast(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return typeof last === "string" ? last : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

interface EditorState {
  spec: EditableSpec;
  selected: string;
  widget: string;
  title: string;
  prompt: string;
  pane: string;
  autoApply: boolean;
  dirty: boolean;
  /** Live data the preview binds to, carried so every re-render keeps it. */
  state?: Record<string, unknown>;
}

/** Re-render the editor around a spec, with the preview and any issues. */
function editorHtml(st: EditorState): string {
  let previewHtml = "";
  let issues: string[] = [];
  try {
    const result = renderSpecDetailed(st.spec as unknown as Spec, st.state);
    previewHtml = result.html;
    issues = result.issues.filter((i) => i.severity === "error").map((i) => i.message);
  } catch (err) {
    issues = [err instanceof Error ? err.message : String(err)];
  }

  return renderDesignEditor({
    spec: st.spec,
    selected: st.selected,
    previewHtml,
    issues,
    widgetName: st.widget,
    title: st.title,
    prompt: st.prompt,
    pane: st.pane,
    autoApply: st.autoApply,
    dirty: st.dirty,
    state: st.state,
    generationAvailable: generationAvailable(),
  });
}

/**
 * A JSON-pane edit, applied without touching the textarea.
 *
 * Only the preview is swapped in place; the spec field, the parse-error slot
 * and the auto-apply trigger come back out-of-band. That is what lets this run
 * on a debounce while typing — re-rendering the editor would replace the
 * textarea mid-keystroke and throw away whatever was half-written.
 */
app.post("/playground/design/json", (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send("");

  const edited = parseSpec(req.body?.specText);

  if ("error" in edited) {
    // Invalid mid-edit JSON is the normal case on most keystrokes: report it
    // and leave the last good spec in place rather than swapping anything.
    res.type("html").send(
      oob(
        "pg-json-error",
        `<div class="px-3 py-2 text-xs text-destructive border-t border-destructive/40">${esc(
          edited.error,
        )}</div>`,
      ),
    );
    return;
  }

  st.spec = edited.spec as unknown as EditableSpec;
  if (!st.spec.elements?.[st.selected]) st.selected = st.spec.root;
  st.dirty = true;

  let previewHtml = "";
  let issue = "";
  try {
    const result = renderSpecDetailed(st.spec as unknown as Spec, st.state);
    previewHtml = result.html;
    const errors = result.issues.filter((i) => i.severity === "error");
    if (errors.length) issue = errors[0].message;
  } catch (err) {
    issue = err instanceof Error ? err.message : String(err);
  }

  res.type("html").send(
    previewHtml +
      oob(
        "pg-spec-field",
        `<input type="hidden" id="pg-spec-field" name="spec" value="${esc(
          JSON.stringify(st.spec, null, 2),
        )}" />`,
      ) +
      oob(
        "pg-json-error",
        issue
          ? `<div class="px-3 py-2 text-xs text-destructive border-t border-destructive/40">${esc(
              issue,
            )}</div>`
          : "",
      ) +
      oob(
        "pg-autosave",
        st.autoApply
          ? `<div hx-post="/playground/save" hx-include="#pg-editor-form"
                  hx-target="#pg-save-result" hx-swap="innerHTML"
                  hx-trigger="load delay:900ms"></div>`
          : "",
      ),
  );
});

/** Wrap content as an htmx out-of-band swap for the given element id. */
function oob(id: string, inner: string): string {
  return `<div id="${id}" hx-swap-oob="true">${inner}</div>`;
}

app.post("/playground/design/generate", async (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send(renderParseError("Spec is not valid JSON."));

  const prompt = typeof req.body?.chatPrompt === "string" ? req.body.chatPrompt.trim() : "";
  if (!prompt) return void res.type("html").send(editorHtml(st));

  try {
    const { spec } = await generateDesign(prompt, st.spec as unknown as Spec);
    st.spec = spec as unknown as EditableSpec;
    st.selected = st.spec.root;
    st.prompt = prompt;
    st.dirty = true;
    res.type("html").send(editorHtml(st));
  } catch (err) {
    console.error("[playground] generation failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    st.prompt = prompt;
    res.type("html").send(
      editorHtml(st).replace(
        "</form>",
        `</form><div class="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs" role="alert">${esc(
          message,
        )}</div>`,
      ),
    );
  }
});

app.post("/playground/design/select", (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send(renderParseError("Spec is not valid JSON."));
  res.type("html").send(editorHtml(st));
});

app.post("/playground/design/prop", (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send(renderParseError("Spec is not valid JSON."));

  const el = st.spec.elements?.[st.selected];
  const schema = el ? componentSchema(el.type) : undefined;
  if (el && schema) {
    el.props = el.props ?? {};
    for (const prop of schema.props) {
      const field = `prop_${prop.name}`;
      // A checkbox posts nothing when cleared, so booleans read from presence
      // rather than value; every other prop is skipped when absent so one
      // control's change cannot blank the rest.
      if (prop.kind === "boolean") {
        el.props[prop.name] = Object.prototype.hasOwnProperty.call(req.body, field);
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
      const next = coerceProp(prop, req.body[field]);
      if (next !== undefined) el.props[prop.name] = next;
    }
  }

  st.dirty = true;
  res.type("html").send(editorHtml(st));
});

app.post("/playground/design/add", (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send(renderParseError("Spec is not valid JSON."));

  const type = typeof req.body?.addType === "string" ? req.body.addType : "";
  const schema = type ? componentSchema(type) : undefined;
  const parent = st.spec.elements?.[st.selected];

  if (schema && parent) {
    const key = freshKey(st.spec, type);
    // Seed required string props so the new element renders instead of failing
    // validation the moment it appears.
    const props: Record<string, unknown> = {};
    for (const prop of schema.props) {
      if (!prop.optional && prop.kind === "string") props[prop.name] = prop.name;
    }
    st.spec.elements[key] = { type, props };
    parent.children = [...(parent.children ?? []), key];
    st.selected = key;
    st.dirty = true;
  }

  res.type("html").send(editorHtml(st));
});

app.post("/playground/design/remove", (req, res) => {
  const st = editorState(req.body);
  if (!st) return void res.type("html").send(renderParseError("Spec is not valid JSON."));
  removeElement(st.spec, st.selected);
  st.selected = st.spec.root;
  st.dirty = true;
  res.type("html").send(editorHtml(st));
});

// ── Live preview ──────────────────────────────────────────────────────────

app.post("/playground/preview", (req, res) => {
  const parsed = parseSpec(req.body?.spec);
  if ("error" in parsed) {
    // A spec mid-edit is invalid on most keystrokes; that is expected, so this
    // is a 200 with an inline message rather than an error status.
    res.type("html").send(renderParseError(parsed.error));
    return;
  }

  try {
    const result = renderSpecDetailed(parsed.spec);
    res.type("html").send(renderPreview(result.html, result.issues, result.fixes));
  } catch (err) {
    res.type("html").send(renderParseError(err instanceof Error ? err.message : String(err)));
  }
});

// ── Generate / refine ─────────────────────────────────────────────────────

app.post("/playground/generate", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const widgetName = typeof req.body?.widget === "string" ? req.body.widget : undefined;
  const designs = await safeListDesigns();

  if (!prompt) {
    res.type("html").send(
      renderEditor({ designs, generationAvailable: generationAvailable(), widgetName }),
    );
    return;
  }

  // Refine when the editor already holds a parseable spec, otherwise generate
  // from scratch. Silently starting over on an unparseable spec would discard
  // the author's work, so a parse failure falls back to fresh generation only
  // because the existing text could not have been rendering anyway.
  const parsed = parseSpec(req.body?.spec);
  const currentSpec = "spec" in parsed ? parsed.spec : null;

  try {
    const { spec } = await generateDesign(prompt, currentSpec);
    res.type("html").send(
      renderEditor({
        specText: JSON.stringify(spec, null, 2),
        prompt,
        designs,
        generationAvailable: true,
        widgetName,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[playground] generation failed:", err);
    res.type("html").send(
      renderEditor({
        specText: typeof req.body?.spec === "string" ? req.body.spec : undefined,
        prompt,
        designs,
        generationAvailable: generationAvailable(),
        widgetName,
      }) +
        `<div class="mt-2 rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs" role="alert">${esc(
          message,
        )}</div>`,
    );
  }
});

// ── Save (lock down) ──────────────────────────────────────────────────────

app.post("/playground/save", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) {
    res.type("html").send(`<span class="text-destructive">A title is required.</span>`);
    return;
  }

  const parsed = parseSpec(req.body?.spec);
  if ("error" in parsed) {
    res.type("html").send(
      `<span class="text-destructive">Cannot save: spec is not valid JSON.</span>`,
    );
    return;
  }

  // Refuse to persist a design that does not render. A Design is platform
  // configuration once saved, and a broken one would be served to every viewer
  // of whatever page mounts it.
  //
  // Validated against the editor's state so `$state` bindings resolve the same
  // way they will in the portal. Rendering with no state made every bound spec
  // look broken and blocked the save.
  const result = renderSpecDetailed(parsed.spec, parseState(req.body?.state));
  const errors = result.issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    res.type("html").send(
      `<span class="text-destructive">Cannot save: ${esc(errors[0].message)}</span>`,
    );
    return;
  }

  try {
    // Binding to a widget is what makes the save land in the portal: the
    // dashboard renders a Design in place of the Widget its spec.targetWidget
    // names. The CR is also named after the widget so re-editing a section
    // upserts its one design rather than piling up an object per save.
    const widgetName = typeof req.body?.widget === "string" && req.body.widget
      ? req.body.widget
      : undefined;

    const { name, created } = await saveDesign({
      title,
      prompt: typeof req.body?.prompt === "string" ? req.body.prompt : "",
      spec: parsed.spec,
      targetWidget: widgetName,
      name: widgetName,
    });

    res.type("html").send(
      widgetName
        ? `<span class="text-foreground">${created ? "Applied" : "Updated"} — live in the portal.</span>`
        : `<span class="text-foreground">${created ? "Saved" : "Updated"} as <code>${esc(
            name,
          )}</code>.</span>`,
    );
  } catch (err) {
    console.error("[playground] save failed:", err);
    res.type("html").send(
      `<span class="text-destructive">Save failed — check the operator logs.</span>`,
    );
  }
});

// ── Load a saved design back into the editor ──────────────────────────────

app.get("/playground/load/:name", async (req, res) => {
  const design = await getDesign(designName(req.params.name));
  const designs = await safeListDesigns();

  if (!design) {
    res.type("html").send(
      renderEditor({ designs, generationAvailable: generationAvailable() }),
    );
    return;
  }

  res.type("html").send(
    renderEditor({
      specText: JSON.stringify(design.spec ?? STARTER_SPEC, null, 2),
      prompt: design.prompt,
      title: design.title,
      designs,
      generationAvailable: generationAvailable(),
    }),
  );
});

const PORT = parseInt(process.env.PORT || "3004", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Playground listening on http://0.0.0.0:${PORT}`);
  console.log(`Design generation: ${generationAvailable() ? "enabled" : "disabled (no API key)"}`);
});
