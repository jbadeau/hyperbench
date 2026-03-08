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
    _rebuildTimer = null;
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
        this.scheduleRebuild();
    }
    deleteNavigationNode(name) {
        this.navigationNodes.delete(name);
        this.scheduleRebuild();
    }
    upsertWidget(widget) {
        this.widgets.set(widget.metadata.name, widget);
        this.scheduleRebuild();
    }
    deleteWidget(name) {
        this.widgets.delete(name);
        this.scheduleRebuild();
    }
    upsertServiceProxy(sp) {
        this.serviceProxies.set(sp.metadata.name, sp);
        this.scheduleRebuild();
    }
    deleteServiceProxy(name) {
        this.serviceProxies.delete(name);
        this.scheduleRebuild();
    }
    upsertAction(action) {
        this.actions.set(action.metadata.name, action);
        this.scheduleRebuild();
    }
    deleteAction(name) {
        this.actions.delete(name);
        this.scheduleRebuild();
    }
    updateWorkbench(wb) {
        this.workbench = wb;
        this.scheduleRebuild();
    }
    /** Debounced rebuild — coalesces rapid CRD watch events into a single rebuild */
    scheduleRebuild() {
        if (this._rebuildTimer)
            clearTimeout(this._rebuildTimer);
        this._rebuildTimer = setTimeout(() => {
            this._rebuildTimer = null;
            this.rebuild();
        }, 50);
    }
    // ── Rebuild derived state ──
    rebuild() {
        const sorted = [...this.navigationNodes.values()]
            .sort((a, b) => (a.spec.ordinal ?? 0) - (b.spec.ordinal ?? 0));
        // Resolve alias nodes → synthetic page nodes with the target's page spec
        const navNodes = sorted.map(node => {
            if (node.spec.type !== "alias" || !node.spec.alias)
                return node;
            const target = this.navigationNodes.get(node.spec.alias.targetRef);
            if (!target || target.spec.type !== "page" || !target.spec.page)
                return node;
            return {
                metadata: node.metadata,
                spec: {
                    ...node.spec,
                    type: "page",
                    page: target.spec.page,
                    alias: undefined,
                },
            };
        });
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
