// K8s CRD TypeScript interfaces — mirrors portal.hyperbench.com/v1alpha1

export interface KubeMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
}

// ── Workbench ──

export interface HeaderFeature {
  enabled?: boolean;
  widgetRef?: string;
}

export interface UserMenu {
  enabled?: boolean;
  label?: string;
  avatar?: string;
  email?: string;
}

export interface WorkbenchSpec {
  title: string;
  port?: number;
  defaultPage: string;
  branding?: {
    logo?: string;
    favicon?: string;
  };
  header?: {
    search?: HeaderFeature;
    notifications?: HeaderFeature;
    settings?: HeaderFeature;
    userMenu?: UserMenu;
  };
  contextBar?: {
    enabled?: boolean;
    widgetRef?: string;
  };
}

export interface Workbench {
  metadata: KubeMetadata;
  spec: WorkbenchSpec;
}

// ── NavigationNode ──

export interface SlotSpec {
  name: string;
  widgetRef: string;
  area?: string;
  label?: string;
  pane?: string;
}

export interface LayoutSpec {
  type: "grid" | "single" | "split" | "tabs";
  columns?: string;
  rows?: string;
  gap?: string;
  areas?: string[];
  direction?: string;
  ratio?: string;
  slots?: SlotSpec[];
}

export interface PageSpec {
  path: string;
  description?: string;
  layout?: LayoutSpec;
}

export interface NavigationNodeSpec {
  type: "group" | "page" | "alias" | "link";
  title: string;
  ordinal?: number;
  icon?: string;
  parent?: string;
  page?: PageSpec;
  link?: {
    url: string;
    target?: string;
  };
  alias?: {
    targetRef: string;
  };
}

export interface NavigationNode {
  metadata: KubeMetadata;
  spec: NavigationNodeSpec;
}

// ── Widget ──

export interface ServerWidgetSpec {
  endpoint: string;
  swap?: string;
  trigger?: string;
}

export interface ClientWidgetSpec {
  component?: string;
  element?: string;
  props?: Record<string, string>;
  propsFromContext?: Record<string, string>;
}

export interface IframeWidgetSpec {
  src: string;
  height?: string;
  sandbox?: string;
}

export interface ContextKey {
  key: string;
  required?: boolean;
}

export interface ActionMapping {
  id: string;
  actionRef: string;
}

export interface WidgetSpec {
  type: "server" | "iframe" | "client";
  title: string;
  description?: string;
  server?: ServerWidgetSpec;
  client?: ClientWidgetSpec;
  iframe?: IframeWidgetSpec;
  context?: {
    subscribes?: ContextKey[];
    publishes?: ContextKey[];
  };
  actionRefs?: ActionMapping[];
}

export interface Widget {
  metadata: KubeMetadata;
  spec: WidgetSpec;
}

// ── ServiceProxy ──

export interface ProxyRule {
  pathPrefix: string;
  target: "frontend" | "api";
}

export interface ServiceProxySpec {
  displayName: string;
  frontend?: {
    baseUrl: string;
  };
  api?: {
    baseUrl: string;
  };
  proxy: ProxyRule[];
  healthCheck?: {
    path?: string;
    target?: string;
  };
}

export interface ServiceProxy {
  metadata: KubeMetadata;
  spec: ServiceProxySpec;
}

// ── Action ──

export interface ActionSpec {
  type: "setContext" | "navigate" | "openModal" | "openDrawer" | "rest";
  setContext?: {
    params: Record<string, string>;
  };
  navigate?: {
    path: string;
    target?: string;
    pushUrl?: boolean;
    swap?: string;
  };
  openModal?: {
    widgetRef: string;
    title?: string;
    size?: string;
  };
  openDrawer?: {
    widgetRef: string;
    title?: string;
    position?: string;
    width?: string;
  };
  rest?: {
    method: string;
    endpoint: string;
    body?: string;
    headers?: Record<string, string>;
    onSuccess?: { actionRef: string };
    onError?: { actionRef: string };
  };
}

export interface Action {
  metadata: KubeMetadata;
  spec: ActionSpec;
}

// ── CRD Store ──

export interface CrdStore {
  workbench: Workbench;
  navigationNodes: NavigationNode[];
  widgets: Map<string, Widget>;
  serviceProxies: ServiceProxy[];
  actions: Map<string, Action>;
}
