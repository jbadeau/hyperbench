import { htmlShell } from "../views/shell.js";
export class MutableCrdStore {
    workbench;
    navigationNodes;
    widgets;
    serviceProxies;
    actions;
    /** Pre-rendered shell HTML — regenerated on every rebuild() */
    shellHtml = "";
    /** Maps clean page path (e.g. "/clients") → NavigationNode for O(1) route lookup */
    pageIndex = new Map();
    /** Maps path prefix → target URL for dynamic proxy routing */
    proxyIndex = new Map();
    constructor(initial) {
        this.workbench = initial.workbench;
        this.navigationNodes = new Map();
        for (const n of initial.navigationNodes) {
            this.navigationNodes.set(n.metadata.name, n);
        }
        this.widgets = new Map(initial.widgets);
        this.serviceProxies = new Map();
        for (const sp of initial.serviceProxies) {
            this.serviceProxies.set(sp.metadata.name, sp);
        }
        this.actions = new Map(initial.actions);
        this.rebuild();
    }
    // ── Mutation helpers ──
    upsertNavigationNode(node) {
        this.navigationNodes.set(node.metadata.name, node);
        this.rebuild();
    }
    deleteNavigationNode(name) {
        this.navigationNodes.delete(name);
        this.rebuild();
    }
    upsertWidget(widget) {
        this.widgets.set(widget.metadata.name, widget);
        this.rebuild();
    }
    deleteWidget(name) {
        this.widgets.delete(name);
        this.rebuild();
    }
    upsertServiceProxy(sp) {
        this.serviceProxies.set(sp.metadata.name, sp);
        this.rebuild();
    }
    deleteServiceProxy(name) {
        this.serviceProxies.delete(name);
        this.rebuild();
    }
    upsertAction(action) {
        this.actions.set(action.metadata.name, action);
        this.rebuild();
    }
    deleteAction(name) {
        this.actions.delete(name);
        this.rebuild();
    }
    updateWorkbench(wb) {
        this.workbench = wb;
        this.rebuild();
    }
    // ── Rebuild derived state ──
    rebuild() {
        const navNodes = [...this.navigationNodes.values()]
            .sort((a, b) => (a.spec.ordinal ?? 0) - (b.spec.ordinal ?? 0));
        // Shell HTML
        this.shellHtml = htmlShell(this.workbench, navNodes, this.widgets);
        // Page index: clean path → NavigationNode
        this.pageIndex = new Map();
        for (const node of navNodes) {
            if (node.spec.type === "page" && node.spec.page) {
                this.pageIndex.set(node.spec.page.path, node);
            }
        }
        // Proxy index: pathPrefix → target URL
        this.proxyIndex = new Map();
        for (const sp of this.serviceProxies.values()) {
            for (const rule of sp.spec.proxy) {
                const baseUrl = rule.target === "api"
                    ? sp.spec.api?.baseUrl
                    : sp.spec.frontend?.baseUrl;
                if (baseUrl) {
                    this.proxyIndex.set(rule.pathPrefix, baseUrl);
                }
            }
        }
        console.log(`[crd-store] Rebuilt: ${navNodes.length} nav nodes, ` +
            `${this.pageIndex.size} pages, ${this.proxyIndex.size} proxies`);
    }
}
