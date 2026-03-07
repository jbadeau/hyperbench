import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { loadCrds } from "./k8s/client.js";
import { MutableCrdStore } from "./k8s/crd-store.js";
import { startCrdWatchers } from "./k8s/watcher.js";
async function main() {
    const app = express();
    // Load CRDs from cluster and build the mutable store
    const store = new MutableCrdStore(await loadCrds());
    console.log(`Loaded CRDs: workbench="${store.workbench.spec.title}", ` +
        `${store.navigationNodes.size} nav nodes, ${store.widgets.size} widgets, ` +
        `${store.serviceProxies.size} service proxies`);
    // Start K8s watch streams for live CRD updates
    startCrdWatchers(store);
    // Page routes — HTMX requests get the page layout, browser requests get the shell
    app.use((req, res, next) => {
        const node = store.pageIndex.get(req.path);
        if (!node)
            return next();
        if (req.headers["hx-request"]) {
            res.type("html").send(renderPageLayout(node, store.widgets));
        }
        else {
            res.type("html").send(store.shellHtml);
        }
    });
    // Single dynamic proxy — reads store.proxyIndex at request time
    app.use(createProxyMiddleware({
        changeOrigin: true,
        pathFilter(path) {
            for (const prefix of store.proxyIndex.keys()) {
                if (path.startsWith(prefix))
                    return true;
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
    }));
    // Root — serve the shell
    app.get("/", (_req, res) => {
        res.type("html").send(store.shellHtml);
    });
    const PORT = parseInt(process.env.PORT || "3000", 10);
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Dashboard gateway listening on http://0.0.0.0:${PORT}`);
    });
}
function renderPageLayout(node, widgets) {
    const layout = node.spec.page?.layout;
    if (!layout || !layout.slots)
        return "";
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
            if (!widget?.spec.server)
                return "";
            const areaStyle = slot.area ? `grid-area:${slot.area};` : "";
            const endpoint = widget.spec.server.endpoint;
            const swap = widget.spec.server.swap ?? "innerHTML";
            const trigger = widget.spec.server.trigger ?? "load";
            return `<div style="overflow:hidden;${areaStyle}" hx-get="${endpoint}" hx-trigger="${trigger}" hx-swap="${swap}"></div>`;
        }).join("\n      ");
        return `
    <div class="dash-grid" style="${style}">
      ${slotHtml}
    </div>`;
    }
    // Fallback for other layout types — render slots sequentially
    const slotHtml = layout.slots.map(slot => {
        const widget = widgets.get(slot.widgetRef);
        if (!widget?.spec.server)
            return "";
        const endpoint = widget.spec.server.endpoint;
        const swap = widget.spec.server.swap ?? "innerHTML";
        const trigger = widget.spec.server.trigger ?? "load";
        return `<div hx-get="${endpoint}" hx-trigger="${trigger}" hx-swap="${swap}"></div>`;
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
