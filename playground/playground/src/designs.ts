import * as k8s from "@kubernetes/client-node";
import type { Spec } from "@json-render/core";

const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
const PLURAL = "designs";

const NAMESPACE = process.env.WORKBENCH_NAMESPACE || "workbench";

export interface DesignSummary {
  name: string;
  title: string;
  description?: string;
  prompt?: string;
  /** Widget this design renders in place of, when it is bound to one. */
  targetWidget?: string;
  elementCount: number;
}

export interface SavedDesign extends DesignSummary {
  spec: Spec;
}

/**
 * Kubernetes client for Design resources.
 *
 * Designs are the only part of the playground that touches the cluster. The
 * spec under edit lives in the browser and is posted with each request; nothing
 * reaches etcd until an author explicitly saves. That boundary is deliberate —
 * a keystroke-frequency write to a Custom Resource would be an abuse of the API
 * server, and per-user drafts have no business being cluster-scoped objects.
 */
function api(): k8s.CustomObjectsApi {
  const kc = new k8s.KubeConfig();
  // In-cluster when running as a pod, kubeconfig when running locally.
  if (process.env.KUBERNETES_SERVICE_HOST) kc.loadFromCluster();
  else kc.loadFromDefault();
  return kc.makeApiClient(k8s.CustomObjectsApi);
}

/** RFC 1123 name derived from a title, since CR names are DNS labels. */
export function designName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
  return slug || "untitled-design";
}

function elementCount(spec: Spec): number {
  const elements = (spec as { elements?: Record<string, unknown> }).elements;
  return elements ? Object.keys(elements).length : 0;
}

function componentTypes(spec: Spec): string[] {
  const elements = (spec as { elements?: Record<string, { type?: string }> }).elements ?? {};
  const seen = new Set<string>();
  for (const el of Object.values(elements)) {
    if (el?.type) seen.add(el.type);
  }
  return [...seen].sort();
}

/** List saved designs, newest first is not guaranteed — sorted by title. */
export async function listDesigns(): Promise<DesignSummary[]> {
  const res = (await api().listNamespacedCustomObject({
    group: API_GROUP,
    version: API_VERSION,
    namespace: NAMESPACE,
    plural: PLURAL,
  })) as unknown as { items?: Array<Record<string, any>> };

  return (res.items ?? [])
    .map((d) => ({
      name: d.metadata?.name ?? "",
      title: d.spec?.title ?? d.metadata?.name ?? "",
      description: d.spec?.description,
      prompt: d.spec?.prompt,
      targetWidget: d.spec?.targetWidget,
      elementCount: d.status?.elementCount ?? elementCount(d.spec?.spec ?? {}),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Fetch one design by CR name. */
export async function getDesign(name: string): Promise<SavedDesign | null> {
  try {
    const d = (await api().getNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: PLURAL,
      name,
    })) as unknown as Record<string, any>;

    return {
      name: d.metadata?.name,
      title: d.spec?.title,
      description: d.spec?.description,
      prompt: d.spec?.prompt,
      targetWidget: d.spec?.targetWidget,
      elementCount: d.status?.elementCount ?? elementCount(d.spec?.spec ?? {}),
      spec: d.spec?.spec as Spec,
    };
  } catch {
    return null;
  }
}

/**
 * Create or replace a Design.
 *
 * Save is upsert-by-name so that re-saving under the same title is an update
 * rather than a conflict — the playground's mental model is "save this design",
 * not "create a new object every time I press the button".
 */
export async function saveDesign(input: {
  title: string;
  description?: string;
  prompt?: string;
  catalog?: string;
  spec: Spec;
  /**
   * Widget this design renders in place of. Written to spec.targetWidget, which
   * is what the portal reads to decide a section's rendering.
   */
  targetWidget?: string;
  /**
   * Explicit CR name. Overrides are named after their target widget so that
   * re-editing a section upserts its one design rather than accumulating a new
   * object per save.
   */
  name?: string;
}): Promise<{ name: string; created: boolean }> {
  const name = input.name ?? designName(input.title);
  const client = api();

  const body = {
    apiVersion: `${API_GROUP}/${API_VERSION}`,
    kind: "Design",
    metadata: { name, namespace: NAMESPACE },
    spec: {
      title: input.title,
      description: input.description ?? "",
      prompt: input.prompt ?? "",
      catalog: input.catalog ?? "hyperbench",
      ...(input.targetWidget ? { targetWidget: input.targetWidget } : {}),
      spec: input.spec,
    },
  };

  const existing = await getDesign(name);
  if (existing) {
    // Read-modify-write: replace needs the current resourceVersion, so fetch
    // the raw object rather than reusing the mapped summary above.
    const current = (await client.getNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: PLURAL,
      name,
    })) as unknown as Record<string, any>;

    await client.replaceNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: PLURAL,
      name,
      body: {
        ...body,
        metadata: {
          ...body.metadata,
          resourceVersion: current.metadata?.resourceVersion,
        },
      },
    });
    return { name, created: false };
  }

  await client.createNamespacedCustomObject({
    group: API_GROUP,
    version: API_VERSION,
    namespace: NAMESPACE,
    plural: PLURAL,
    body,
  });
  return { name, created: true };
}

/**
 * Remove a Design, reverting whatever it overrode to its own rendering.
 *
 * Returns false when there was nothing to delete, so a double-click on revert
 * is not reported as an error.
 */
export async function deleteDesign(name: string): Promise<boolean> {
  try {
    await api().deleteNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: PLURAL,
      name,
    });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number; code?: number })?.statusCode
      ?? (err as { code?: number })?.code;
    if (status === 404) return false;
    throw err;
  }
}

export { elementCount, componentTypes };
