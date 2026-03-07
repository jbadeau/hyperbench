import * as k8s from "@kubernetes/client-node";
import type {
  CrdStore,
  Workbench,
  NavigationNode,
  Widget,
  ServiceProxy,
  Action,
} from "./types.js";

const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";

async function listCr<T>(
  api: k8s.CustomObjectsApi,
  namespace: string,
  plural: string,
): Promise<T[]> {
  const res = await api.listNamespacedCustomObject({
    group: API_GROUP,
    version: API_VERSION,
    namespace,
    plural,
  });
  return ((res as Record<string, unknown>).items ?? []) as T[];
}

export async function loadCrds(
  namespace: string = process.env.WORKBENCH_NAMESPACE || "workbench",
  workbenchName: string = process.env.WORKBENCH_NAME || "workbench-sample",
): Promise<CrdStore> {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();

  const api = kc.makeApiClient(k8s.CustomObjectsApi);

  // Fetch the specific Workbench CR
  const wb = await api.getNamespacedCustomObject({
    group: API_GROUP,
    version: API_VERSION,
    namespace,
    plural: "workbenches",
    name: workbenchName,
  });
  const workbench = wb as Workbench;

  // Fetch all other CRs in parallel
  const [navNodes, widgetList, serviceProxies, actionList] = await Promise.all([
    listCr<NavigationNode>(api, namespace, "navigationnodes"),
    listCr<Widget>(api, namespace, "widgets"),
    listCr<ServiceProxy>(api, namespace, "serviceproxies"),
    listCr<Action>(api, namespace, "actions"),
  ]);

  const widgets = new Map<string, Widget>();
  for (const w of widgetList) {
    widgets.set(w.metadata.name, w);
  }

  const actions = new Map<string, Action>();
  for (const a of actionList) {
    actions.set(a.metadata.name, a);
  }

  return { workbench, navigationNodes: navNodes, widgets, serviceProxies, actions };
}
