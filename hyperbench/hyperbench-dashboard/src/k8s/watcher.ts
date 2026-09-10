import * as k8s from "@kubernetes/client-node";
import type { MutableCrdStore } from "./crd-store.js";
import type {
  NavigationNode,
  Widget,
  ServiceProxy,
  Action,
  Workbench,
  Design,
} from "./types.js";

const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
const RECONNECT_DELAY_MS = 5_000;

type WatchEvent = "ADDED" | "MODIFIED" | "DELETED";

interface WatchTarget<T> {
  plural: string;
  label: string;
  /** Replace the store's entire set for this kind, used after every (re)list. */
  replaceAll: (items: T[]) => void;
  onEvent: (type: WatchEvent, obj: T) => void;
}

interface KubeListResponse<T> {
  items: T[];
  metadata?: { resourceVersion?: string };
}

/**
 * List-then-watch with relist on every reconnect.
 *
 * A watch started without a `resourceVersion` begins at the present moment, so
 * anything that happened while the stream was down is never delivered — a
 * NavigationNode deleted during the backoff would stay in the sidebar until the
 * pod restarted. Two things prevent that drift:
 *
 *  - each cycle lists first, replaces the store's contents wholesale, and opens
 *    the watch at the `resourceVersion` the list returned, so no event between
 *    the list and the watch is missed; and
 *  - a stream that ends for any reason returns to the list step rather than
 *    reopening the watch, so a missed delete is reconciled by the next list.
 *
 * The cost is one extra list per reconnect, which is cheap at portal scale and
 * is what makes "eventually correct" true rather than aspirational.
 */
async function runWatchCycle<T>(
  kc: k8s.KubeConfig,
  watch: k8s.Watch,
  namespace: string,
  target: WatchTarget<T>,
  store: MutableCrdStore,
): Promise<void> {
  const path = `/apis/${API_GROUP}/${API_VERSION}/namespaces/${namespace}/${target.plural}`;
  const api = kc.makeApiClient(k8s.CustomObjectsApi);

  // ── 1. List, and adopt the result as the authoritative set ──
  const listed = (await api.listNamespacedCustomObject({
    group: API_GROUP,
    version: API_VERSION,
    namespace,
    plural: target.plural,
  })) as unknown as KubeListResponse<T>;

  const resourceVersion = listed.metadata?.resourceVersion;
  target.replaceAll(listed.items ?? []);
  console.log(
    `[watch] ${target.label}: listed ${(listed.items ?? []).length} at rv=${resourceVersion ?? "?"}`,
  );

  // ── 2. Watch forward from exactly where the list ended ──
  return new Promise<void>((resolve, reject) => {
    watch
      .watch(
        path,
        resourceVersion ? { resourceVersion } : {},
        (type: string, obj: T) => {
          console.log(`[watch] ${target.label}: ${type}`);
          target.onEvent(type as WatchEvent, obj);
        },
        (err?: unknown) => {
          // Any stream end — clean or not — sends us back through the list step.
          if (err) reject(err);
          else resolve();
        },
      )
      .then(() => {
        store.watchesConnected += 1;
      })
      .catch(reject);
  });
}

/**
 * Keep one kind in sync forever, relisting whenever the stream drops.
 *
 * `410 Gone` (the resourceVersion has aged out of etcd's history window) is the
 * expected failure on a long-lived watch and is handled by the same path as any
 * other: list again, get a fresh resourceVersion, carry on.
 */
async function watchForever<T>(
  kc: k8s.KubeConfig,
  watch: k8s.Watch,
  namespace: string,
  target: WatchTarget<T>,
  store: MutableCrdStore,
): Promise<void> {
  let connected = false;

  for (;;) {
    try {
      console.log(`[watch] Starting watch: ${target.label}`);
      connected = true;
      await runWatchCycle(kc, watch, namespace, target, store);
      console.log(`[watch] ${target.label} stream ended — relisting`);
    } catch (err) {
      console.error(`[watch] ${target.label} error:`, err);
    } finally {
      if (connected) {
        store.watchesConnected = Math.max(0, store.watchesConnected - 1);
        connected = false;
      }
    }
    await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
  }
}

export function startCrdWatchers(
  store: MutableCrdStore,
  namespace: string = process.env.WORKBENCH_NAMESPACE || "workbench",
): void {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();
  const watch = new k8s.Watch(kc);

  const targets: WatchTarget<any>[] = [
    {
      plural: "navigationnodes",
      label: "NavigationNode",
      replaceAll: (items: NavigationNode[]) => store.replaceNavigationNodes(items),
      onEvent(type, obj) {
        const node = obj as NavigationNode;
        if (type === "DELETED") store.deleteNavigationNode(node.metadata.name);
        else store.upsertNavigationNode(node);
      },
    },
    {
      plural: "widgets",
      label: "Widget",
      replaceAll: (items: Widget[]) => store.replaceWidgets(items),
      onEvent(type, obj) {
        const widget = obj as Widget;
        if (type === "DELETED") store.deleteWidget(widget.metadata.name);
        else store.upsertWidget(widget);
      },
    },
    {
      plural: "serviceproxies",
      label: "ServiceProxy",
      replaceAll: (items: ServiceProxy[]) => store.replaceServiceProxies(items),
      onEvent(type, obj) {
        const sp = obj as ServiceProxy;
        if (type === "DELETED") store.deleteServiceProxy(sp.metadata.name);
        else store.upsertServiceProxy(sp);
      },
    },
    {
      plural: "actions",
      label: "Action",
      replaceAll: (items: Action[]) => store.replaceActions(items),
      onEvent(type, obj) {
        const action = obj as Action;
        if (type === "DELETED") store.deleteAction(action.metadata.name);
        else store.upsertAction(action);
      },
    },
    {
      plural: "designs",
      label: "Design",
      replaceAll: (items: Design[]) => store.replaceDesigns(items),
      onEvent(type, obj) {
        const design = obj as Design;
        if (type === "DELETED") store.deleteDesign(design.metadata.name);
        else store.upsertDesign(design);
      },
    },
    {
      plural: "workbenches",
      label: "Workbench",
      replaceAll: (items: Workbench[]) => {
        const name = process.env.WORKBENCH_NAME || "workbench-sample";
        const match = items.find((w) => w.metadata.name === name);
        if (match) store.updateWorkbench(match);
      },
      onEvent(type, obj) {
        const wb = obj as Workbench;
        if (wb.metadata.name !== (process.env.WORKBENCH_NAME || "workbench-sample")) return;
        if (type !== "DELETED") store.updateWorkbench(wb);
      },
    },
  ];

  for (const target of targets) {
    // Deliberately not awaited: each kind syncs independently and forever.
    void watchForever(kc, watch, namespace, target, store);
  }
}
