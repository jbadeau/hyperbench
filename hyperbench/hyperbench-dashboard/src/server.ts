import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { esc, safeUrl, safeCss, safeAttrName, safeTagName } from "@hyperbench/shared/lib/html.js";
import { renderSpecDetailed } from "@hyperbench/shared/renderer.js";
import { loadCrds } from "./k8s/client.js";
import { MutableCrdStore } from "./k8s/crd-store.js";
import { startCrdWatchers } from "./k8s/watcher.js";
import type { NavigationNode, Widget, SlotSpec, Design } from "./k8s/types.js";
import type { Spec } from "@json-render/core";
import { renderKpiCards, renderChart, renderDataTable } from "./views/dashboard-home.js";

/**
 * Context keys the gateway is willing to forward to backends.
 *
 * `X-Context-*` headers are written by page JavaScript, so everything arriving
 * under that prefix is client-asserted. The allowlist does not make the values
 * trustworthy — a caller can still claim any client id — it only stops an
 * arbitrary header set from being injected into every backend. Backends must
 * treat these as a user's *selection*, never as an authorization decision.
 */
const ALLOWED_CONTEXT_KEYS = new Set(
  (process.env.CONTEXT_KEYS || "clientid,clientname")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean),
);

/** Upper bound on a single context header value, to keep proxied headers small. */
const MAX_CONTEXT_VALUE_LENGTH = 256;

/**
 * Strip context headers that are not allowlisted, and truncate the rest.
 *
 * Applied on the way in, so a backend never sees a context key the portal does
 * not define.
 */
function sanitizeContextHeaders(headers: Record<string, unknown>): void {
  for (const name of Object.keys(headers)) {
    const lower = name.toLowerCase();
    if (!lower.startsWith("x-context-")) continue;

    const key = lower.slice("x-context-".length);
    const value = headers[name];

    if (!ALLOWED_CONTEXT_KEYS.has(key) || typeof value !== "string") {
      delete headers[name];
      continue;
    }
    if (value.length > MAX_CONTEXT_VALUE_LENGTH) {
      headers[name] = value.slice(0, MAX_CONTEXT_VALUE_LENGTH);
    }
  }
}

/**
 * Longest-prefix match against the proxy index, respecting path segments.
 *
 * A bare `startsWith` would let the rule `/clients` capture `/clients-admin`,
 * routing an unrelated path to the clients service. A prefix matches only when
 * the path is the prefix exactly, or continues with `/`.
 */
function matchProxyPrefix(
  proxyIndex: Map<string, string>,
  path: string,
): { prefix: string; target: string } | null {
  let best: { prefix: string; target: string } | null = null;

  for (const [prefix, target] of proxyIndex) {
    const isMatch = path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : prefix + "/");
    if (!isMatch) continue;
    if (!best || prefix.length > best.prefix.length) best = { prefix, target };
  }

  return best;
}

async function main() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Load CRDs from the cluster. A failure here is not fatal: the gateway starts
  // unconfigured, reports itself unready, and the watchers fill the store in as
  // resources appear.
  let store: MutableCrdStore;
  try {
    store = new MutableCrdStore(await loadCrds());
    console.log(
      `Loaded CRDs: workbench="${store.workbench.spec.title}", ` +
        `${store.navigationNodes.size} nav nodes, ${store.widgets.size} widgets, ` +
        `${store.serviceProxies.size} service proxies`,
    );
  } catch (err) {
    console.error("[startup] Initial CRD load failed — starting unconfigured:", err);
    store = MutableCrdStore.empty();
  }

  // Start K8s watch streams for live CRD updates
  startCrdWatchers(store);

  // ── Health endpoints ──────────────────────────────────────────────────
  // Registered before the page middleware so a NavigationNode cannot shadow
  // them by claiming one of these paths.

  app.get("/healthz", (_req, res) => {
    res.type("text/plain").send("ok");
  });

  app.get("/readyz", (_req, res) => {
    // Ready means the store has been populated at least once and at least one
    // watch stream is connected. Serving nav-less pages would look like a
    // successful deploy while the portal is empty.
    const ready = store.isConfigured() && store.watchesConnected > 0;
    res
      .status(ready ? 200 : 503)
      .type("application/json")
      .send(
        JSON.stringify({
          ready,
          configured: store.isConfigured(),
          watchesConnected: store.watchesConnected,
          pages: store.pageIndex.size,
          proxies: store.proxyIndex.size,
        }),
      );
  });

  // Page routes — HTMX requests get the page layout, browser requests get the shell
  app.use((req, res, next) => {
    const node = store.pageIndex.get(req.path);
    if (!node) return next();
    if (req.headers["hx-request"]) {
      res.type("html").send(renderPageLayout(node, store.widgets, store.designsByWidget));
    } else {
      res.type("html").send(store.shellHtml);
    }
  });

  // ── Design rendering ──────────────────────────────────────────────────
  // Registered before the proxy so a ServiceProxy prefix cannot capture it.

  /**
   * Fetch the live data for a design's target widget.
   *
   * A Design carries layout; the widget's own endpoint still owns the content.
   * Without this a design that binds its rows renders empty — editing a
   * section's appearance would silently throw its data away.
   *
   * The request goes back through this gateway rather than to the service
   * directly, so ServiceProxy routing is not duplicated here, and the caller's
   * context headers ride along so a context-aware widget still filters.
   */
  async function widgetState(
    design: Design,
    req: express.Request,
  ): Promise<Record<string, unknown> | undefined> {
    const target = design.spec?.targetWidget;
    if (!target) return undefined;

    const endpoint = store.widgets.get(target)?.spec?.server?.endpoint;
    if (!endpoint || !endpoint.startsWith("/")) return undefined;

    const url = `http://127.0.0.1:${PORT}${endpoint}${
      endpoint.includes("?") ? "&" : "?"
    }format=state`;

    const headers: Record<string, string> = { accept: "application/json" };
    for (const [name, value] of Object.entries(req.headers)) {
      const lower = name.toLowerCase();
      if (!lower.startsWith("x-context-")) continue;
      if (!ALLOWED_CONTEXT_KEYS.has(lower.slice("x-context-".length))) continue;
      if (typeof value === "string") headers[name] = value;
    }

    try {
      const upstream = await fetch(url, { headers, signal: AbortSignal.timeout(4000) });
      if (!upstream.ok) return undefined;
      if (!upstream.headers.get("content-type")?.includes("application/json")) return undefined;
      const state = await upstream.json();
      return state && typeof state === "object" ? (state as Record<string, unknown>) : undefined;
    } catch (err) {
      // A widget with no data endpoint is normal; a slow one should not hang
      // the page. Either way the design still renders, just without content.
      console.warn(`[designs] no state for "${target}":`, err);
      return undefined;
    }
  }

  app.get("/designs/:name", async (req, res) => {
    const design = store.designs.get(req.params.name);
    if (!design) {
      res.status(404).type("html").send(
        `<div class="text-sm text-muted-foreground">No design named ${esc(req.params.name)}.</div>`,
      );
      return;
    }

    try {
      const state = await widgetState(design, req);
      const result = renderSpecDetailed(design.spec.spec as Spec, state);
      const errors = result.issues.filter((i) => i.severity === "error");
      if (errors.length > 0) {
        // A design that does not render is a portal-wide defect, so it says so
        // in place rather than leaving an empty slot that looks like a load
        // that never finished.
        res.type("html").send(
          `<div class="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs" role="alert">` +
            `Design "${esc(design.spec.title)}" failed to render: ${esc(errors[0].message)}</div>`,
        );
        return;
      }
      res.type("html").send(result.html);
    } catch (err) {
      console.error(`[designs] render failed for "${req.params.name}":`, err);
      res.status(500).type("html").send(
        `<div class="text-sm text-destructive">Design failed to render.</div>`,
      );
    }
  });

  /**
   * Server-sent events carrying design changes to open pages.
   *
   * The portal is otherwise entirely request-driven, so this is the only push
   * channel: it exists so that saving in the playground repaints every mounted
   * copy of a section without anyone reloading. Only the design's name travels
   * over it — the client re-fetches the rendered HTML, which keeps rendering
   * server-side and avoids putting spec content on a broadcast channel.
   */
  app.get("/events", (req, res) => {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      // Proxies that buffer would defeat the point of a push channel.
      "x-accel-buffering": "no",
    });
    res.write("retry: 3000\n\n");

    const unsubscribe = store.onDesignChange((change) => {
      res.write(`event: design\ndata: ${JSON.stringify(change)}\n\n`);
    });

    // Without traffic an idle SSE connection is indistinguishable from a dead
    // one to anything in the path, so keep it warm.
    const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25_000);

    req.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  // Dashboard widget endpoints (mocked content)
  app.get("/dashboard/kpi-cards", (_req, res) => {
    res.type("html").send(renderKpiCards());
  });
  app.get("/dashboard/chart", (_req, res) => {
    res.type("html").send(renderChart());
  });
  app.get("/dashboard/data-table", (_req, res) => {
    res.type("html").send(renderDataTable());
  });

  // Single dynamic proxy — reads store.proxyIndex at request time
  app.use(
    createProxyMiddleware({
      changeOrigin: true,
      pathFilter(path) {
        return matchProxyPrefix(store.proxyIndex, path) !== null;
      },
      router(req) {
        const match = matchProxyPrefix(store.proxyIndex, req.url ?? "");
        return match ? match.target : "";
      },
      on: {
        proxyReq(proxyReq) {
          // Drop context headers the portal does not define before they reach a
          // backend. See ALLOWED_CONTEXT_KEYS.
          for (const name of proxyReq.getHeaderNames()) {
            const lower = name.toLowerCase();
            if (!lower.startsWith("x-context-")) continue;
            const key = lower.slice("x-context-".length);
            if (!ALLOWED_CONTEXT_KEYS.has(key)) {
              proxyReq.removeHeader(name);
              continue;
            }
            const value = proxyReq.getHeader(name);
            if (typeof value === "string" && value.length > MAX_CONTEXT_VALUE_LENGTH) {
              proxyReq.setHeader(name, value.slice(0, MAX_CONTEXT_VALUE_LENGTH));
            }
          }
        },
      },
    }),
  );

  // Root — serve the shell
  app.get("/", (_req, res) => {
    res.type("html").send(store.shellHtml);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dashboard gateway listening on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Render one layout slot.
 *
 * Every value here originates in a Custom Resource, so each is encoded for the
 * context it lands in: URLs through `safeUrl`, attribute names and tag names
 * validated against a pattern rather than escaped, and inline styles through
 * `safeCss`.
 */
function renderSlot(
  slot: SlotSpec,
  widget: Widget,
  extraStyle?: string,
  designsByWidget?: Map<string, Design>,
): string {
  const spec = widget.spec;
  const style = extraStyle ? ` style="${esc(extraStyle)}"` : "";
  const name = widget.metadata.name;

  // A Design bound to this widget replaces whatever the widget would have
  // rendered, in every page that mounts it. The slot is tagged with the
  // *widget* name, not the design's: that is the stable identity the shell's
  // live-update listener keys on, so a design being retargeted or deleted
  // still finds the element it needs to repaint.
  const bound = designsByWidget?.get(name);
  if (bound) {
    // `data-design-bound` is what tells the live-update listener that this slot
    // is already pointing at a design. Without it a slot that has only just
    // become design-backed looks identical to one that is not, and the listener
    // refreshes it in place — re-fetching the app endpoint it has not stopped
    // pointing at yet — instead of re-fetching the page layout.
    return `<div${style} data-widget="${esc(name)}" data-design-bound="1" hx-get="/designs/${encodeURIComponent(bound.metadata.name)}" hx-trigger="load, refresh" hx-swap="innerHTML"></div>`;
  }

  const tag = ` data-widget="${esc(name)}"`;

  if (spec.type === "server" && spec.server) {
    const endpoint = safeUrl(spec.server.endpoint);
    const swap = esc(spec.server.swap ?? "innerHTML");
    const trigger = esc(spec.server.trigger ?? "load");
    return `<div${style}${tag} hx-get="${endpoint}" hx-trigger="${trigger}" hx-swap="${swap}"></div>`;
  }

  if (spec.type === "iframe" && spec.iframe) {
    const height = safeCss(spec.iframe.height ?? "400px");
    // Sandbox is mandatory. A CR may widen it, but an omitted sandbox would let
    // an embedded document script the portal that frames it.
    const sandbox = esc(spec.iframe.sandbox ?? "allow-scripts allow-same-origin");
    const inline = safeCss(extraStyle ?? "");
    return `<iframe${tag} src="${safeUrl(spec.iframe.src)}" sandbox="${sandbox}" style="width:100%;height:${height};border:none;${inline}" loading="lazy"></iframe>`;
  }

  if (spec.type === "client" && spec.client) {
    const clientTag = safeTagName(spec.client.element ?? spec.client.component ?? "div");
    if (!clientTag) return "";

    const attrs: string[] = [];
    if (spec.client.props) {
      for (const [k, v] of Object.entries(spec.client.props)) {
        const name = safeAttrName(k);
        if (name) attrs.push(`data-prop-${name}="${esc(v)}"`);
      }
    }
    if (spec.client.propsFromContext) {
      for (const [k, v] of Object.entries(spec.client.propsFromContext)) {
        const name = safeAttrName(k);
        if (name) attrs.push(`data-context-key-${name}="${esc(v)}"`);
      }
    }
    return `<${clientTag}${style}${tag}${attrs.length ? " " + attrs.join(" ") : ""}></${clientTag}>`;
  }

  return "";
}

function renderPageLayout(
  node: NavigationNode,
  widgets: Map<string, Widget>,
  designsByWidget?: Map<string, Design>,
): string {
  const layout = node.spec.page?.layout;
  if (!layout || !layout.slots) {
    const icon = esc(node.spec.icon || "file");
    const title = esc(node.spec.title);
    const desc = esc(node.spec.page?.description || "This page is under construction.");
    return `
    <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <i data-lucide="${icon}" class="w-12 h-12 mb-4 opacity-50"></i>
      <h2 class="text-lg font-medium text-foreground">${title}</h2>
      <p class="text-sm mt-1">${desc}</p>
    </div>`;
  }

  if (layout.type === "grid") {
    const columns = safeCss(layout.columns ?? "1fr");
    const rows = safeCss(layout.rows ?? "auto");
    const gap = safeCss(layout.gap ?? "1rem");
    const areas = layout.areas
      ? layout.areas.map(a => `"${safeCss(a)}"`).join(" ")
      : undefined;

    const style = [
      "display:grid",
      `grid-template-columns:${columns}`,
      `grid-template-rows:${rows}`,
      `gap:${gap}`,
      areas ? `grid-template-areas:${areas}` : "",
    ].filter(Boolean).join(";");

    const slotHtml = layout.slots.map(slot => {
      const widget = widgets.get(slot.widgetRef);
      if (!widget) return "";
      const areaStyle = slot.area
        ? `overflow:hidden;grid-area:${safeCss(slot.area)};`
        : "overflow:hidden;";
      return renderSlot(slot, widget, areaStyle, designsByWidget);
    }).join("\n      ");

    return `
    <div class="dash-grid" style="${esc(style)}">
      ${slotHtml}
    </div>`;
  }

  // Fallback for other layout types — render slots sequentially
  const slotHtml = layout.slots.map(slot => {
    const widget = widgets.get(slot.widgetRef);
    if (!widget) return "";
    return renderSlot(slot, widget, undefined, designsByWidget);
  }).join("\n    ");

  return `
    <div>
      ${slotHtml}
    </div>`;
}

main().catch((err) => {
  console.error("Failed to start dashboard:", err);
  process.exit(1);
});
