import { htmlShell } from "../views/shell.js";
import { PLACEHOLDER_WORKBENCH } from "./client.js";
import type {
  CrdStore,
  Workbench,
  NavigationNode,
  Widget,
  ServiceProxy,
  Action,
  Design,
} from "./types.js";

/** What moved when a Design changed, enough for a page to repaint precisely. */
export interface DesignChange {
  name: string;
  targetWidget?: string;
  previousTargetWidget?: string;
  deleted: boolean;
}

export class MutableCrdStore {
  workbench: Workbench;
  navigationNodes: Map<string, NavigationNode>;
  widgets: Map<string, Widget>;
  serviceProxies: Map<string, ServiceProxy>;
  actions: Map<string, Action>;
  designs: Map<string, Design>;
  /**
   * Widget name → the Design bound to it, rebuilt with the rest of the derived
   * state. Resolving this once per rebuild keeps slot rendering a map lookup
   * rather than a scan of every design on every page request.
   */
  designsByWidget: Map<string, Design> = new Map();

  /** Pre-rendered shell HTML — regenerated on every rebuild() */
  shellHtml: string = "";
  /** Maps clean page path (e.g. "/clients") → NavigationNode for O(1) route lookup */
  pageIndex: Map<string, NavigationNode> = new Map();
  /** Maps path prefix → target URL for dynamic proxy routing */
  proxyIndex: Map<string, string> = new Map();

  /**
   * Number of watch streams currently connected.
   *
   * Readiness depends on this: a gateway whose watches are all down still
   * serves its last known state, but it is no longer tracking the cluster and
   * should not be treated as healthy.
   */
  watchesConnected: number = 0;

  private _rebuildTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Listeners notified when a single Design changes.
   *
   * Kept separate from rebuild(): a rebuild is debounced and says only that
   * *something* moved, while a live portal section needs to know *which* design
   * moved, and whether it still exists — an edit can be repainted in place, but
   * a design that has just appeared or been deleted changes which element the
   * slot should be pointing at at all.
   */
  private _designListeners = new Set<(change: DesignChange) => void>();

  onDesignChange(fn: (change: DesignChange) => void): () => void {
    this._designListeners.add(fn);
    return () => this._designListeners.delete(fn);
  }

  private emitDesignChange(change: DesignChange): void {
    for (const fn of this._designListeners) {
      try {
        fn(change);
      } catch (err) {
        console.warn("[crd-store] design listener threw:", err);
      }
    }
  }

  /** A store with no Custom Resources, used when the initial load fails. */
  static empty(): MutableCrdStore {
    return new MutableCrdStore({
      workbench: PLACEHOLDER_WORKBENCH,
      navigationNodes: [],
      widgets: new Map(),
      serviceProxies: [],
      actions: new Map(),
      designs: new Map(),
    });
  }

  /** True once a real Workbench has been observed. */
  isConfigured(): boolean {
    return this.workbench !== PLACEHOLDER_WORKBENCH;
  }

  constructor(initial: CrdStore) {
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
    this.designs = new Map(initial.designs);
    this.rebuildDesignIndex();

    this.rebuild();
  }

  // ── Mutation helpers ──

  upsertNavigationNode(node: NavigationNode): void {
    this.navigationNodes.set(node.metadata.name, node);
    this.scheduleRebuild();
  }

  deleteNavigationNode(name: string): void {
    this.navigationNodes.delete(name);
    this.scheduleRebuild();
  }

  upsertWidget(widget: Widget): void {
    this.widgets.set(widget.metadata.name, widget);
    this.scheduleRebuild();
  }

  deleteWidget(name: string): void {
    this.widgets.delete(name);
    this.scheduleRebuild();
  }

  upsertServiceProxy(sp: ServiceProxy): void {
    this.serviceProxies.set(sp.metadata.name, sp);
    this.scheduleRebuild();
  }

  deleteServiceProxy(name: string): void {
    this.serviceProxies.delete(name);
    this.scheduleRebuild();
  }

  upsertDesign(design: Design): void {
    const previous = this.designs.get(design.metadata.name);
    this.designs.set(design.metadata.name, design);
    this.rebuildDesignIndex();
    this.emitDesignChange({
      name: design.metadata.name,
      // A retarget has to repaint the slot it left as well as the one it
      // joined, so both widgets travel with the event.
      targetWidget: design.spec?.targetWidget,
      previousTargetWidget: previous?.spec?.targetWidget,
      deleted: false,
    });
    this.scheduleRebuild();
  }

  deleteDesign(name: string): void {
    const previous = this.designs.get(name);
    this.designs.delete(name);
    this.rebuildDesignIndex();
    this.emitDesignChange({
      name,
      previousTargetWidget: previous?.spec?.targetWidget,
      deleted: true,
    });
    this.scheduleRebuild();
  }

  /**
   * Resolve widget → design.
   *
   * Two designs may name the same target; the portal has to pick one and be
   * consistent about it across restarts, so the lowest CR name wins and the
   * collision is logged rather than silently resolved.
   */
  private rebuildDesignIndex(): void {
    const byWidget = new Map<string, Design>();
    for (const design of [...this.designs.values()].sort((a, b) =>
      a.metadata.name.localeCompare(b.metadata.name),
    )) {
      const target = design.spec?.targetWidget;
      if (!target) continue;
      const existing = byWidget.get(target);
      if (existing) {
        console.warn(
          `[crd-store] designs "${existing.metadata.name}" and "${design.metadata.name}" ` +
            `both target widget "${target}" — using "${existing.metadata.name}"`,
        );
        continue;
      }
      byWidget.set(target, design);
    }
    this.designsByWidget = byWidget;
  }

  upsertAction(action: Action): void {
    this.actions.set(action.metadata.name, action);
    this.scheduleRebuild();
  }

  deleteAction(name: string): void {
    this.actions.delete(name);
    this.scheduleRebuild();
  }

  // ── Wholesale replacement, used after each (re)list ──
  //
  // A relist is the only way to learn about events missed while a watch stream
  // was down, so these replace the map rather than merging into it: an object
  // absent from the list has been deleted, and merging would keep it forever.

  replaceNavigationNodes(items: NavigationNode[]): void {
    this.navigationNodes = new Map(items.map((n) => [n.metadata.name, n]));
    this.scheduleRebuild();
  }

  replaceWidgets(items: Widget[]): void {
    this.widgets = new Map(items.map((w) => [w.metadata.name, w]));
    this.scheduleRebuild();
  }

  replaceServiceProxies(items: ServiceProxy[]): void {
    this.serviceProxies = new Map(items.map((sp) => [sp.metadata.name, sp]));
    this.scheduleRebuild();
  }

  replaceDesigns(items: Design[]): void {
    // A relist can both add and remove; notify on the union so a slot whose
    // design disappeared reverts to the widget's own rendering.
    const next = new Map(items.map((d) => [d.metadata.name, d]));
    const touched = new Set([...this.designs.keys(), ...next.keys()]);
    const before = this.designs;
    this.designs = next;
    this.rebuildDesignIndex();
    for (const name of touched) {
      this.emitDesignChange({
        name,
        targetWidget: next.get(name)?.spec?.targetWidget,
        previousTargetWidget: before.get(name)?.spec?.targetWidget,
        deleted: !next.has(name),
      });
    }
    this.scheduleRebuild();
  }

  replaceActions(items: Action[]): void {
    this.actions = new Map(items.map((a) => [a.metadata.name, a]));
    this.scheduleRebuild();
  }

  updateWorkbench(wb: Workbench): void {
    this.workbench = wb;
    this.scheduleRebuild();
  }

  /** Debounced rebuild — coalesces rapid CRD watch events into a single rebuild */
  private scheduleRebuild(): void {
    if (this._rebuildTimer) clearTimeout(this._rebuildTimer);
    this._rebuildTimer = setTimeout(() => {
      this._rebuildTimer = null;
      this.rebuild();
    }, 50);
  }

  // ── Rebuild derived state ──

  rebuild(): void {
    const sorted = [...this.navigationNodes.values()]
      .sort((a, b) => (a.spec.ordinal ?? 0) - (b.spec.ordinal ?? 0));

    // Resolve alias nodes → synthetic page nodes with the target's page spec
    const navNodes = sorted.map(node => {
      if (node.spec.type !== "alias" || !node.spec.alias) return node;
      const target = this.navigationNodes.get(node.spec.alias.targetRef);
      if (!target || target.spec.type !== "page" || !target.spec.page) return node;
      return {
        metadata: node.metadata,
        spec: {
          ...node.spec,
          type: "page" as const,
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
        const baseUrl =
          rule.target === "api"
            ? sp.spec.api?.baseUrl
            : sp.spec.frontend?.baseUrl;
        if (baseUrl) {
          this.proxyIndex.set(rule.pathPrefix, baseUrl);
        }
      }
    }

    console.log(
      `[crd-store] Rebuilt: ${navNodes.length} nav nodes, ` +
        `${this.pageIndex.size} pages, ${this.proxyIndex.size} proxies`,
    );
  }
}
