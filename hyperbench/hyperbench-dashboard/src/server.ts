import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { loadCrds } from "./k8s/client.js";
import { MutableCrdStore } from "./k8s/crd-store.js";
import { startCrdWatchers } from "./k8s/watcher.js";
import type { NavigationNode, Widget, SlotSpec } from "./k8s/types.js";

async function main() {
  const app = express();

  // Load CRDs from cluster and build the mutable store
  const store = new MutableCrdStore(await loadCrds());

  console.log(
    `Loaded CRDs: workbench="${store.workbench.spec.title}", ` +
      `${store.navigationNodes.size} nav nodes, ${store.widgets.size} widgets, ` +
      `${store.serviceProxies.size} service proxies`,
  );

  // Start K8s watch streams for live CRD updates
  startCrdWatchers(store);

  // Page routes — HTMX requests get the page layout, browser requests get the shell
  app.use((req, res, next) => {
    const node = store.pageIndex.get(req.path);
    if (!node) return next();
    if (req.headers["hx-request"]) {
      res.type("html").send(renderPageLayout(node, store.widgets));
    } else {
      res.type("html").send(store.shellHtml);
    }
  });

  // Single dynamic proxy — reads store.proxyIndex at request time
  app.use(
    createProxyMiddleware({
      changeOrigin: true,
      pathFilter(path) {
        for (const prefix of store.proxyIndex.keys()) {
          if (path.startsWith(prefix)) return true;
        }
        return false;
      },
      router(req) {
        const path = req.url ?? "";
        // Longest-prefix match
        let bestPrefix = "";
        let bestTarget = "";
        for (const [prefix, target] of store.proxyIndex) {
          if (path.startsWith(prefix) && prefix.length > bestPrefix.length) {
            bestPrefix = prefix;
            bestTarget = target;
          }
        }
        return bestTarget;
      },
    }),
  );

  // Root — serve the shell
  app.get("/", (_req, res) => {
    res.type("html").send(store.shellHtml);
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dashboard gateway listening on http://0.0.0.0:${PORT}`);
  });
}

function renderSlot(slot: SlotSpec, widget: Widget, extraStyle?: string): string {
  const spec = widget.spec;
  const style = extraStyle ? ` style="${extraStyle}"` : "";

  if (spec.type === "server" && spec.server) {
    const endpoint = spec.server.endpoint;
    const swap = spec.server.swap ?? "innerHTML";
    const trigger = spec.server.trigger ?? "load";
    return `<div${style} hx-get="${endpoint}" hx-trigger="${trigger}" hx-swap="${swap}"></div>`;
  }

  if (spec.type === "iframe" && spec.iframe) {
    const height = spec.iframe.height ?? "400px";
    const sandbox = spec.iframe.sandbox ? ` sandbox="${spec.iframe.sandbox}"` : "";
    return `<iframe src="${spec.iframe.src}"${sandbox} style="width:100%;height:${height};border:none;${extraStyle ?? ""}" loading="lazy"></iframe>`;
  }

  if (spec.type === "client" && spec.client) {
    const tag = spec.client.element ?? spec.client.component ?? "div";
    const attrs: string[] = [];
    if (spec.client.props) {
      for (const [k, v] of Object.entries(spec.client.props)) {
        attrs.push(`data-prop-${k}="${v}"`);
      }
    }
    if (spec.client.propsFromContext) {
      for (const [k, v] of Object.entries(spec.client.propsFromContext)) {
        attrs.push(`data-context-key-${k}="${v}"`);
      }
    }
    return `<${tag}${style}${attrs.length ? " " + attrs.join(" ") : ""}></${tag}>`;
  }

  return "";
}

function renderPageLayout(node: NavigationNode, widgets: Map<string, Widget>): string {
  const layout = node.spec.page?.layout;
  if (!layout || !layout.slots) return "";

  if (layout.type === "grid") {
    const columns = layout.columns ?? "1fr";
    const rows = layout.rows ?? "auto";
    const gap = layout.gap ?? "1rem";
    const areas = layout.areas
      ? layout.areas.map(a => `"${a}"`).join(" ")
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
      const areaStyle = slot.area ? `overflow:hidden;grid-area:${slot.area};` : "overflow:hidden;";
      return renderSlot(slot, widget, areaStyle);
    }).join("\n      ");

    return `
    <div class="dash-grid" style="${style}">
      ${slotHtml}
    </div>`;
  }

  // Fallback for other layout types — render slots sequentially
  const slotHtml = layout.slots.map(slot => {
    const widget = widgets.get(slot.widgetRef);
    if (!widget) return "";
    return renderSlot(slot, widget);
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
