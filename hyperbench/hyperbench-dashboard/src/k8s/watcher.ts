import * as k8s from "@kubernetes/client-node";
import type { MutableCrdStore } from "./crd-store.js";
import type {
  NavigationNode,
  Widget,
  ServiceProxy,
  Action,
  Workbench,
} from "./types.js";

const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
const RECONNECT_DELAY_MS = 5_000;

type WatchEvent = "ADDED" | "MODIFIED" | "DELETED";

interface WatchTarget<T> {
  plural: string;
  label: string;
  onEvent: (type: WatchEvent, obj: T) => void;
}

function startWatch<T>(
  watch: k8s.Watch,
  namespace: string,
  target: WatchTarget<T>,
): void {
  const path = `/apis/${API_GROUP}/${API_VERSION}/namespaces/${namespace}/${target.plural}`;

  console.log(`[watch] Starting watch: ${target.label}`);

  watch
    .watch(
      path,
      {},
      (type: string, obj: T) => {
        console.log(`[watch] ${target.label}: ${type}`);
        target.onEvent(type as WatchEvent, obj);
      },
      (err?: unknown) => {
        if (err) {
          console.error(`[watch] ${target.label} error:`, err);
        } else {
          console.log(`[watch] ${target.label} stream ended`);
        }
        setTimeout(() => startWatch(watch, namespace, target), RECONNECT_DELAY_MS);
      },
    )
    .catch((err: unknown) => {
      console.error(`[watch] ${target.label} failed to start:`, err);
      setTimeout(() => startWatch(watch, namespace, target), RECONNECT_DELAY_MS);
    });
}

export function startCrdWatchers(
  store: MutableCrdStore,
  namespace: string = process.env.WORKBENCH_NAMESPACE || "workbench",
): void {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();
  const watch = new k8s.Watch(kc);

  const targets: WatchTarget<unknown>[] = [
    {
      plural: "navigationnodes",
      label: "NavigationNode",
      onEvent(type, obj) {
        const node = obj as NavigationNode;
        if (type === "DELETED") store.deleteNavigationNode(node.metadata.name);
        else store.upsertNavigationNode(node);
      },
    },
    {
      plural: "widgets",
      label: "Widget",
      onEvent(type, obj) {
        const widget = obj as Widget;
        if (type === "DELETED") store.deleteWidget(widget.metadata.name);
        else store.upsertWidget(widget);
      },
    },
    {
      plural: "serviceproxies",
      label: "ServiceProxy",
      onEvent(type, obj) {
        const sp = obj as ServiceProxy;
        if (type === "DELETED") store.deleteServiceProxy(sp.metadata.name);
        else store.upsertServiceProxy(sp);
      },
    },
    {
      plural: "actions",
      label: "Action",
      onEvent(type, obj) {
        const action = obj as Action;
        if (type === "DELETED") store.deleteAction(action.metadata.name);
        else store.upsertAction(action);
      },
    },
    {
      plural: "workbenches",
      label: "Workbench",
      onEvent(type, obj) {
        const wb = obj as Workbench;
        if (type !== "DELETED") store.updateWorkbench(wb);
      },
    },
  ];

  for (const target of targets) {
    startWatch(watch, namespace, target);
  }
}
