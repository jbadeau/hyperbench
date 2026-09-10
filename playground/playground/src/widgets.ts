import * as k8s from "@kubernetes/client-node";

const API_GROUP = "portal.hyperbench.com";
const API_VERSION = "v1alpha1";
const PLURAL = "widgets";
const NAV_PLURAL = "navigationnodes";

const NAMESPACE = process.env.WORKBENCH_NAMESPACE || "workbench";

export interface WidgetSummary {
  /** Widget CR name. */
  name: string;
  title: string;
  description?: string;
  type: string;
  /** Where the widget's own (un-overridden) content comes from, for display. */
  source?: string;
  /**
   * Portal page paths that mount this widget.
   *
   * A widget can exist in the namespace without any page showing it, in which
   * case editing it changes nothing anyone can see. The tiles say so rather
   * than presenting every widget as equally editable.
   */
  mountedOn: string[];
  /** Name of the Design bound to this widget, when one is. */
  designName?: string;
  /** True when a Design is currently rendering in place of this widget. */
  overridden: boolean;
}

/**
 * Read-only client for Widget resources.
 *
 * The playground never writes a Widget. Its Role covers Designs for writing and
 * Widgets for reading only, so an author can re-skin a section without being
 * able to re-point it at a different backend.
 */
function api(): k8s.CustomObjectsApi {
  const kc = new k8s.KubeConfig();
  if (process.env.KUBERNETES_SERVICE_HOST) kc.loadFromCluster();
  else kc.loadFromDefault();
  return kc.makeApiClient(k8s.CustomObjectsApi);
}

/**
 * True for the widget that mounts the playground itself.
 *
 * Overriding it would replace the editor with a static design, and the only
 * way back — the Revert button — would have gone with it. It is excluded from
 * the tiles rather than merely discouraged.
 */
function isPlaygroundItself(spec: Record<string, any>): boolean {
  const endpoint = spec?.server?.endpoint;
  return typeof endpoint === "string" && endpoint.startsWith("/playground");
}

function sourceOf(spec: Record<string, any>): string | undefined {
  if (spec?.type === "server") return spec.server?.endpoint;
  if (spec?.type === "iframe") return spec.iframe?.src;
  if (spec?.type === "client") return spec.client?.element ?? spec.client?.component;
  return undefined;
}

/**
 * List the portal's widgets, flagged with whether a Design currently overrides
 * each one.
 *
 * `boundDesigns` maps widget name → design name and is passed in rather than
 * fetched here, so a tile render costs one Design list regardless of how many
 * sections the portal has.
 */
export async function listWidgets(
  boundDesigns: Map<string, string>,
): Promise<WidgetSummary[]> {
  const client = api();
  const [res, navRes] = await Promise.all([
    client.listNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: PLURAL,
    }) as unknown as Promise<{ items?: Array<Record<string, any>> }>,
    client.listNamespacedCustomObject({
      group: API_GROUP,
      version: API_VERSION,
      namespace: NAMESPACE,
      plural: NAV_PLURAL,
    }) as unknown as Promise<{ items?: Array<Record<string, any>> }>,
  ]);

  // widget name -> the page paths that mount it
  const mounts = new Map<string, string[]>();
  for (const node of navRes.items ?? []) {
    const page = node.spec?.page;
    const path = page?.path;
    if (!path) continue;
    for (const slot of page.layout?.slots ?? []) {
      if (!slot?.widgetRef) continue;
      const list = mounts.get(slot.widgetRef) ?? [];
      if (!list.includes(path)) list.push(path);
      mounts.set(slot.widgetRef, list);
    }
  }

  return (res.items ?? [])
    .filter((w) => !isPlaygroundItself(w.spec ?? {}))
    .map((w) => {
      const name = w.metadata?.name ?? "";
      const designName = boundDesigns.get(name);
      return {
        name,
        title: w.spec?.title ?? name,
        description: w.spec?.description,
        type: w.spec?.type ?? "unknown",
        source: sourceOf(w.spec ?? {}),
        mountedOn: mounts.get(name) ?? [],
        designName,
        overridden: designName !== undefined,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Ask a widget's own endpoint for the json-render spec it renders.
 *
 * A widget that serves `?format=spec` has a real template, and editing that
 * beats editing a generic starter: the author changes the thing the app
 * actually renders. Widgets still built from HTML strings return nothing here
 * and fall back to a starter.
 *
 * The request goes through the portal gateway rather than straight to the
 * backing service, because the endpoint recorded on the Widget is a portal
 * path — resolving it any other way would mean duplicating the ServiceProxy
 * routing table in here.
 */
const GATEWAY_URL =
  process.env.GATEWAY_URL || "http://dashboard.dashboard.svc.cluster.local:3000";

export async function fetchWidgetTemplate(endpoint: string): Promise<unknown | null> {
  if (!endpoint.startsWith("/")) return null;

  const url = `${GATEWAY_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}format=spec`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    if (!res.headers.get("content-type")?.includes("application/json")) return null;
    const spec = await res.json();
    // A template must at least be a tree; anything else is a widget that
    // answered ?format=spec by accident.
    if (!spec || typeof spec !== "object" || !("root" in spec) || !("elements" in spec)) {
      return null;
    }
    return spec;
  } catch {
    return null;
  }
}

/**
 * Fetch the live data a widget binds to, for previewing a design against real
 * content rather than an empty shell.
 *
 * Using the widget's own data beats a mock: the preview then shows exactly what
 * the portal will show. Widgets that serve no state simply preview empty, which
 * is honest — nothing is invented to fill the gap.
 */
export async function fetchWidgetState(
  endpoint: string,
): Promise<Record<string, unknown> | undefined> {
  if (!endpoint.startsWith("/")) return undefined;

  const url = `${GATEWAY_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}format=state`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return undefined;
    if (!res.headers.get("content-type")?.includes("application/json")) return undefined;
    const state = await res.json();
    return state && typeof state === "object" ? (state as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

