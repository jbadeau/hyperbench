import * as k8s from "@kubernetes/client-node";
const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
async function listCr(api, namespace, plural) {
    const res = await api.listNamespacedCustomObject({
        group: API_GROUP,
        version: API_VERSION,
        namespace,
        plural,
    });
    return (res.items ?? []);
}
export async function loadCrds(namespace = process.env.WORKBENCH_NAMESPACE || "workbench", workbenchName = process.env.WORKBENCH_NAME || "workbench-sample") {
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
    const workbench = wb;
    // Fetch all other CRs in parallel
    const [navNodes, widgetList, serviceProxies, actionList] = await Promise.all([
        listCr(api, namespace, "navigationnodes"),
        listCr(api, namespace, "widgets"),
        listCr(api, namespace, "serviceproxies"),
        listCr(api, namespace, "actions"),
    ]);
    const widgets = new Map();
    for (const w of widgetList) {
        widgets.set(w.metadata.name, w);
    }
    const actions = new Map();
    for (const a of actionList) {
        actions.set(a.metadata.name, a);
    }
    return { workbench, navigationNodes: navNodes, widgets, serviceProxies, actions };
}
