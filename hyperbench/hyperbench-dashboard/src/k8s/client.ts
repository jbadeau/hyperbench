import * as k8s from "@kubernetes/client-node";
import type {
  CrdStore,
  Workbench,
  NavigationNode,
  Widget,
  ServiceProxy,
  Action,
  Design,
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

/**
 * A placeholder Workbench used until the real one is observed.
 *
 * The gateway must be able to start before its Custom Resources exist — the
 * deploy order installs the dashboard chart ahead of the workbench chart, and a
 * Workbench can be deleted and recreated on a running cluster. Treating "no
 * Workbench yet" as a normal state rather than a fatal one is what keeps the
 * pod from crash-looping through both situations.
 */
export const PLACEHOLDER_WORKBENCH: Workbench = {
  metadata: { name: "unconfigured" },
  spec: { title: "HyperBench", defaultPage: "/" },
};

export async function loadCrds(
  namespace: string = process.env.WORKBENCH_NAMESPACE || "workbench",
  workbenchName: string = process.env.WORKBENCH_NAME || "workbench-sample",
): Promise<CrdStore> {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();

  const api = kc.makeApiClient(k8s.CustomObjectsApi);

  // A missing Workbench is expected on a cluster where the workbench chart has
  // not been installed yet; the watchers will supply it when it appears.
  let workbench: Workbench;
  try {
    workbench = (await api.getNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace,
      plural: "workbenches",
      name: workbenchName,
    })) as Workbench;
  } catch (err) {
    console.warn(
      `[crd] Workbench "${workbenchName}" not found in namespace "${namespace}" — ` +
        "starting unconfigured and waiting for it to appear",
    );
    workbench = PLACEHOLDER_WORKBENCH;
  }

  // Fetch all other CRs in parallel
  const [navNodes, widgetList, serviceProxies, actionList, designList] = await Promise.all([
    listCr<NavigationNode>(api, namespace, "navigationnodes"),
    listCr<Widget>(api, namespace, "widgets"),
    listCr<ServiceProxy>(api, namespace, "serviceproxies"),
    listCr<Action>(api, namespace, "actions"),
    listCr<Design>(api, namespace, "designs"),
  ]);

  const widgets = new Map<string, Widget>();
  for (const w of widgetList) {
    widgets.set(w.metadata.name, w);
  }

  const actions = new Map<string, Action>();
  for (const a of actionList) {
    actions.set(a.metadata.name, a);
  }

  const designs = new Map<string, Design>();
  for (const d of designList) {
    designs.set(d.metadata.name, d);
  }

  return { workbench, navigationNodes: navNodes, widgets, serviceProxies, actions, designs };
}
