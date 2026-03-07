import * as k8s from "@kubernetes/client-node";
const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
const RECONNECT_DELAY_MS = 5_000;
function startWatch(watch, namespace, target) {
    const path = `/apis/${API_GROUP}/${API_VERSION}/namespaces/${namespace}/${target.plural}`;
    console.log(`[watch] Starting watch: ${target.label}`);
    watch
        .watch(path, {}, (type, obj) => {
        console.log(`[watch] ${target.label}: ${type}`);
        target.onEvent(type, obj);
    }, (err) => {
        if (err) {
            console.error(`[watch] ${target.label} error:`, err);
        }
        else {
            console.log(`[watch] ${target.label} stream ended`);
        }
        setTimeout(() => startWatch(watch, namespace, target), RECONNECT_DELAY_MS);
    })
        .catch((err) => {
        console.error(`[watch] ${target.label} failed to start:`, err);
        setTimeout(() => startWatch(watch, namespace, target), RECONNECT_DELAY_MS);
    });
}
export function startCrdWatchers(store, namespace = process.env.WORKBENCH_NAMESPACE || "workbench") {
    const kc = new k8s.KubeConfig();
    kc.loadFromCluster();
    const watch = new k8s.Watch(kc);
    const targets = [
        {
            plural: "navigationnodes",
            label: "NavigationNode",
            onEvent(type, obj) {
                const node = obj;
                if (type === "DELETED")
                    store.deleteNavigationNode(node.metadata.name);
                else
                    store.upsertNavigationNode(node);
            },
        },
        {
            plural: "widgets",
            label: "Widget",
            onEvent(type, obj) {
                const widget = obj;
                if (type === "DELETED")
                    store.deleteWidget(widget.metadata.name);
                else
                    store.upsertWidget(widget);
            },
        },
        {
            plural: "serviceproxies",
            label: "ServiceProxy",
            onEvent(type, obj) {
                const sp = obj;
                if (type === "DELETED")
                    store.deleteServiceProxy(sp.metadata.name);
                else
                    store.upsertServiceProxy(sp);
            },
        },
        {
            plural: "actions",
            label: "Action",
            onEvent(type, obj) {
                const action = obj;
                if (type === "DELETED")
                    store.deleteAction(action.metadata.name);
                else
                    store.upsertAction(action);
            },
        },
        {
            plural: "workbenches",
            label: "Workbench",
            onEvent(type, obj) {
                const wb = obj;
                if (type !== "DELETED")
                    store.updateWorkbench(wb);
            },
        },
    ];
    for (const target of targets) {
        startWatch(watch, namespace, target);
    }
}
