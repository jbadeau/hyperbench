import { esc, dataAttr } from "@hyperbench/shared/lib/html.js";
import { themeTokens, portalHead } from "@hyperbench/shared/lib/theme.js";
import type { SpecIssue } from "@json-render/core";
import type { DesignSummary } from "./designs.js";
import type { WidgetSummary } from "./widgets.js";

const STARTER_SPEC = {
  root: "page",
  elements: {
    page: { type: "Stack", props: { gap: 4 }, children: ["heading", "card"] },
    heading: { type: "Heading", props: { text: "Untitled design", level: 2 } },
    card: { type: "Card", props: { title: "Start here" }, children: ["body"] },
    body: {
      type: "Text",
      props: { text: "Edit the JSON on the left, or describe what you want above." },
    },
  },
};

/**
 * The editor shell.
 *
 * The spec under edit lives in the textarea and is posted with every request —
 * the form *is* the session state. That keeps the server stateless, survives a
 * reload without a store, and means nothing is persisted anywhere until the
 * author presses Save.
 */
export function renderEditor(opts: {
  specText?: string;
  prompt?: string;
  title?: string;
  designs: DesignSummary[];
  generationAvailable: boolean;
  /**
   * Set when editing a portal section. The saved Design takes the widget's
   * name, which is what binds the override to it, and the save button says so.
   */
  widgetName?: string;
}): string {
  const specText = opts.specText ?? JSON.stringify(STARTER_SPEC, null, 2);
  const title = opts.title ?? "Untitled design";
  const widgetName = opts.widgetName;

  return `
<div class="flex flex-col gap-3 h-full" id="playground">

  <!-- Prompt bar -->
  <form class="flex gap-2 items-start"
        hx-post="/playground/generate"
        hx-target="#playground"
        hx-swap="outerHTML"
        hx-indicator="#pg-busy"
        hx-disabled-elt="find button">
    <textarea name="prompt" rows="2"
      class="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring resize-y"
      placeholder="${opts.generationAvailable
        ? "Describe the design you want — or how to change the current one"
        : "Generation is unavailable: no Anthropic API key is configured"}"
      ${opts.generationAvailable ? "" : "disabled"}>${esc(opts.prompt ?? "")}</textarea>
    <input type="hidden" name="spec" id="pg-prompt-spec" />
    ${widgetName ? `<input type="hidden" name="widget" value="${esc(widgetName)}" />` : ""}
    <button type="submit"
      class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition whitespace-nowrap"
      ${opts.generationAvailable ? "" : "disabled"}>
      Generate
    </button>
    <span id="pg-busy" class="htmx-indicator text-xs text-muted-foreground self-center whitespace-nowrap">
      thinking…
    </span>
  </form>

  <!-- Editor + preview -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">

    <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Spec</span>
        <span class="text-xs text-muted-foreground">edits preview as you type</span>
      </div>
      <textarea id="pg-spec" name="spec" spellcheck="false"
        class="flex-1 min-h-[22rem] bg-background text-foreground font-mono text-xs p-3 outline-none resize-none"
        hx-post="/playground/preview"
        hx-trigger="input changed delay:350ms"
        hx-target="#pg-preview"
        hx-swap="innerHTML">${esc(specText)}</textarea>
    </div>

    <div class="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
      </div>
      <div id="pg-preview" class="flex-1 overflow-auto p-4"
           hx-post="/playground/preview"
           hx-trigger="load"
           hx-include="#pg-spec"
           hx-swap="innerHTML"></div>
    </div>
  </div>

  <!-- Save bar -->
  <form class="flex gap-2 items-center border-t border-border pt-3"
        hx-post="/playground/save"
        hx-target="#pg-save-result"
        hx-swap="innerHTML"
        hx-include="#pg-spec">
    <label class="text-xs uppercase tracking-wide text-muted-foreground">Title</label>
    <input type="text" name="title" value="${esc(title)}" required
      class="bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground w-64 outline-none focus:ring-2 focus:ring-ring" />
    <input type="hidden" name="prompt" value="${esc(opts.prompt ?? "")}" />
    ${widgetName ? `<input type="hidden" name="widget" value="${esc(widgetName)}" />` : ""}
    <button type="submit"
      class="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
      ${widgetName ? "Apply to portal" : "Lock down &amp; save"}
    </button>
    <span id="pg-save-result" class="text-xs text-muted-foreground"></span>
  </form>

  ${widgetName ? "" : renderSavedList(opts.designs)}
</div>`;
}

function renderSavedList(designs: DesignSummary[]): string {
  if (designs.length === 0) {
    return `<p class="text-xs text-muted-foreground">No saved designs yet.</p>`;
  }
  const rows = designs
    .map(
      (d) => `
    <button type="button"
      class="text-left px-3 py-2 rounded-md border border-border hover:bg-accent transition"
      hx-get="/playground/load/${encodeURIComponent(d.name)}"
      hx-target="#playground"
      hx-swap="outerHTML">
      <div class="text-sm font-medium text-foreground">${esc(d.title)}</div>
      <div class="text-xs text-muted-foreground">${d.elementCount} elements${
        d.prompt ? ` · ${esc(d.prompt.slice(0, 60))}` : ""
      }</div>
    </button>`,
    )
    .join("");

  return `
  <div class="border-t border-border pt-3">
    <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
      Saved designs
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${rows}</div>
  </div>`;
}

/** Preview pane contents: the rendered design plus anything validation said. */
export function renderPreview(html: string, issues: SpecIssue[], fixes: string[]): string {
  const problems = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity !== "error");

  const banner = (
    label: string,
    items: string[],
    tone: "error" | "warn" | "info",
  ): string => {
    if (items.length === 0) return "";
    const cls =
      tone === "error"
        ? "border-destructive/50 text-destructive"
        : tone === "warn"
          ? "border-border text-muted-foreground"
          : "border-border text-muted-foreground";
    return `
    <div class="mb-3 rounded-md border ${cls} px-3 py-2 text-xs" role="status">
      <div class="font-medium mb-1">${esc(label)}</div>
      <ul class="list-disc pl-4 space-y-0.5">
        ${items.map((i) => `<li>${esc(i)}</li>`).join("")}
      </ul>
    </div>`;
  };

  return (
    banner("Errors", problems.map(issueText), "error") +
    banner("Warnings", warnings.map(issueText), "warn") +
    banner("Repaired automatically", fixes, "info") +
    `<div class="jr-preview">${html}</div>`
  );
}

function issueText(i: SpecIssue): string {
  return i.elementKey ? `${i.elementKey}: ${i.message}` : i.message;
}

/** A parse failure is shown in place of the preview, keeping the last good text. */
export function renderParseError(message: string): string {
  return `
  <div class="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs" role="alert">
    <div class="font-medium mb-1">Spec is not valid JSON</div>
    <div class="font-mono">${esc(message)}</div>
  </div>`;
}

/**
 * The playground's landing view: every portal section as a tile.
 *
 * The tiles are the portal's Widgets, not the playground's own designs — the
 * point of the loop is to re-skin a section that already exists somewhere in
 * the portal, so what you can edit is exactly what is mounted.
 */
export function renderTiles(widgets: WidgetSummary[]): string {
  // Sections nobody can see are the confusing case: editing one applies
  // cleanly and changes nothing visible. They stay listed — the page that
  // mounts them may not exist yet — but sort last and say so plainly.
  const visible = widgets.filter((w) => w.mountedOn.length > 0);
  const unmounted = widgets.filter((w) => w.mountedOn.length === 0);

  const tile = (w: WidgetSummary) => {
    const badge = w.overridden
      ? `<span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary text-primary-foreground">edited</span>`
      : `<span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-muted-foreground">${esc(w.type)}</span>`;

    const revert = w.overridden
      ? `<button type="button"
          class="px-2 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent transition"
          hx-delete="/playground/override/${encodeURIComponent(w.name)}"
          hx-target="#pg-tiles"
          hx-swap="outerHTML"
          hx-confirm="Revert &quot;${esc(w.title)}&quot; to its original rendering?">Revert</button>`
      : "";

    const where = w.mountedOn.length
      ? `<span class="text-xs text-muted-foreground">Appears on ${w.mountedOn
          .map((p) => `<code class="text-foreground">${esc(p)}</code>`)
          .join(", ")}</span>`
      : `<span class="text-xs text-muted-foreground">Not on any page — editing this changes nothing visible</span>`;

    return `
    <div class="flex flex-col gap-2 rounded-lg border border-border bg-card p-3${
      w.mountedOn.length ? "" : " opacity-60"
    }">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="text-sm font-medium text-foreground truncate">${esc(w.title)}</div>
          <div class="text-xs text-muted-foreground truncate">${esc(w.description ?? w.source ?? w.name)}</div>
        </div>
        ${badge}
      </div>
      ${where}
      <div class="flex gap-2 mt-auto pt-1">
        <button type="button"
          class="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
          data-pg-edit="${esc(w.name)}">Edit UI</button>
        ${revert}
      </div>
    </div>`;
  };

  const empty = `<p class="text-sm text-muted-foreground">No widgets found in the workbench namespace.</p>`;

  const grid = (items: WidgetSummary[]) =>
    `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${items
      .map(tile)
      .join("")}</div>`;

  const unmountedBlock = unmounted.length
    ? `
  <div class="border-t border-border pt-3 mt-1">
    <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
      Not shown in the portal
    </div>
    <p class="text-xs text-muted-foreground mb-2">
      These sections exist but no page mounts them, so an edit here has nowhere to appear.
    </p>
    ${grid(unmounted)}
  </div>`
    : "";

  return `
<div id="pg-tiles" class="flex flex-col gap-3">
  <div>
    <h2 class="text-base font-medium text-foreground">Portal sections</h2>
    <p class="text-xs text-muted-foreground mt-0.5">
      Edit a section's UI and it re-renders live everywhere in the portal that mounts it.
    </p>
  </div>
  ${widgets.length ? grid(visible) : empty}
  ${unmountedBlock}
</div>
<script>
// A separate window rather than an overlay: the point of the loop is to watch
// the portal change while you edit, which an in-page modal covers up. Named per
// widget so re-clicking Edit focuses the existing window instead of stacking
// duplicates that would race each other's saves.
function pgOpenEditor(widget) {
  var w = window.open(
    '/playground/window/' + encodeURIComponent(widget),
    'pg-editor-' + widget,
    'width=1100,height=800,resizable=yes,scrollbars=yes'
  );
  if (!w) {
    alert('The editor opens in a new window — allow pop-ups for this site and try again.');
    return;
  }
  w.focus();
}

// The "edited" badges are rendered server-side, so they go stale while an
// editor window is open. Refresh them when one closes, and when this window is
// focused again after an apply.
(function() {
  if (window.__pgTilesBound) return;
  window.__pgTilesBound = true;

  // Delegated from document so it survives the tiles being swapped out and
  // back in by htmx, which would drop a listener bound to the old element.
  document.addEventListener('click', function(evt) {
    var btn = evt.target && evt.target.closest && evt.target.closest('[data-pg-edit]');
    if (!btn) return;
    evt.preventDefault();
    pgOpenEditor(btn.getAttribute('data-pg-edit'));
  });

  function refreshTiles() {
    if (!document.getElementById('pg-tiles')) return;
    // Reloading would discard whatever is typed in the on-page editor, so skip
    // it while a spec is being edited. The badges catch up on the next select.
    var spec = document.getElementById('pg-spec');
    if (spec && spec.value && spec.dataset.pgDirty === '1') return;
    htmx.ajax('GET', '/playground/editor', {target: '#pg-tiles', swap: 'outerHTML'});
  }

  // Mark the editor dirty on first keystroke so the refresh guard above knows
  // there is unsaved work.
  document.addEventListener('input', function(evt) {
    if (evt.target && evt.target.id === 'pg-spec') evt.target.dataset.pgDirty = '1';
  });

  window.addEventListener('pg-editor-closed', refreshTiles);
  window.addEventListener('focus', refreshTiles);
})();
</script>`;
}

/**
 * A starting spec for a section that has no design yet.
 *
 * The generic starter made every section look identical in the editor, which
 * is actively misleading — you could not tell which one you had opened. This
 * cannot reproduce the widget's *current* appearance: that HTML comes from the
 * backing app and is not a json-render spec, so there is nothing to decompile.
 * What it can do is name the section, carry its description, and record what it
 * is replacing, so the author starts from something specific.
 */
export function starterSpecFor(widget: WidgetSummary): unknown {
  const origin = widget.source
    ? `Currently rendered by ${widget.source}.`
    : `Currently rendered as a ${widget.type} widget.`;

  // A section backed by a live endpoint opens with that endpoint still in the
  // design, wrapped in a Remote. Seeding it with static placeholders instead
  // would mean applying a design silently swaps real data for invented rows —
  // this way the default edit restyles the section and leaves the app to keep
  // supplying its content.
  if (widget.type === "server" && widget.source && widget.source.startsWith("/")) {
    return {
      root: "page",
      elements: {
        page: { type: "Stack", props: { gap: 4 }, children: ["heading", "live"] },
        heading: { type: "Heading", props: { text: widget.title, level: 2 } },
        live: {
          type: "Remote",
          props: {
            endpoint: widget.source,
            trigger: null,
            swap: null,
            minHeight: "4rem",
          },
        },
      },
    };
  }

  // A section that renders a table should open on a table, not on a card the
  // author has to throw away. The columns are placeholders on purpose: the
  // real ones live in the backing app's HTML, which is not a spec and cannot
  // be decompiled into one, so inventing convincing-looking column names would
  // just be a lie that renders.
  if (/table|grid|list/i.test(widget.name + " " + widget.title)) {
    return {
      root: "page",
      elements: {
        page: { type: "Stack", props: { gap: 4 }, children: ["heading", "table"] },
        heading: { type: "Heading", props: { text: widget.title, level: 2 } },
        table: {
          type: "Table",
          props: {
            columns: ["Column 1", "Column 2", "Column 3"],
            rows: [
              ["Replace", "these", "rows"],
              ["with", "your", "content"],
            ],
            caption: origin,
          },
        },
      },
    };
  }

  return {
    root: "page",
    elements: {
      page: { type: "Stack", props: { gap: 4 }, children: ["heading", "intro", "card"] },
      heading: { type: "Heading", props: { text: widget.title, level: 2 } },
      intro: {
        type: "Text",
        props: {
          text:
            widget.description ??
            `Replacement UI for the "${widget.name}" section of the portal.`,
        },
      },
      card: { type: "Card", props: { title: "Replace this" }, children: ["body"] },
      body: { type: "Text", props: { text: origin } },
    },
  };
}

/**
 * The editor as its own browser window.
 *
 * A standalone document rather than a fragment: it is opened with window.open
 * and so has no portal shell around it to supply styling or HTMX. Keeping the
 * portal visible in the window behind is the whole point — an edit applied here
 * repaints the portal live, and you can watch it happen.
 */
export function renderEditorWindow(opts: {
  widget: WidgetSummary;
  editorHtml: string;
}): string {
  const inner = opts.editorHtml;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Edit — ${esc(opts.widget.title)}</title>
${portalHead()}
  <style type="text/tailwindcss">
${themeTokens()}

    body { font-family: var(--font-sans); }
  </style>
</head>
<body class="bg-background text-foreground h-screen overflow-hidden">
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <div>
        <div class="text-sm font-medium text-foreground">${esc(opts.widget.title)}</div>
        <div class="text-xs text-muted-foreground">${esc(opts.widget.name)}</div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-muted-foreground">Applying updates the portal live</span>
        <button type="button" onclick="window.close()"
          class="px-2 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent transition">
          Close
        </button>
      </div>
    </div>
    <div class="flex-1 min-h-0 overflow-auto p-4">
      ${inner}
    </div>
  </div>
  <script>
  (function() {
    var widget = ${JSON.stringify(opts.widget.name)};

    // Tell every open portal window which section is being edited, so it can
    // ring it. A BroadcastChannel rather than the opener: the portal page the
    // author is watching is usually a different window entirely, not the one
    // that launched this editor.
    var channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('pg-editing')
      : null;

    function announce(active) {
      if (channel) channel.postMessage({type: 'editing', widget: widget, active: active});
    }

    if (channel) {
      // A portal window opened after this editor has no idea it is running.
      channel.addEventListener('message', function(evt) {
        if (evt.data && evt.data.type === 'who-is-editing') {
          channel.postMessage({type: 'announce', widget: widget});
        }
      });
    }

    announce(true);

    window.addEventListener('pagehide', function() {
      announce(false);
      // The tiles behind this window show an "edited" badge per section.
      // Nothing pushes to the opener, so refresh it on close.
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.dispatchEvent(new Event('pg-editor-closed'));
        }
      } catch (err) {
        /* opener may be cross-origin or gone; nothing to refresh */
      }
    });
  })();
  </script>
</body>
</html>`;
}

export { STARTER_SPEC };
