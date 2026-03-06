export interface HalFormsProperty {
  name: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  regex?: string;
  prompt?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  value?: unknown;
  options?: {
    inline?: HalFormsOption[];
    link?: {
      href: string;
    };
    maxItems?: number;
    minItems?: number;
    selectedValues?: string[];
    promptField?: string;
    valueField?: string;
  };
}

export interface HalFormsOption {
  prompt: string;
  value: string;
}

export interface HalFormsTemplate {
  title?: string;
  method: string;
  contentType?: string;
  properties: HalFormsProperty[];
  target?: string;
}

export interface HalLink {
  href: string;
  templated?: boolean;
}

export interface HalResource {
  _links: Record<string, HalLink | HalLink[]>;
  _templates?: Record<string, HalFormsTemplate>;
  _embedded?: Record<string, HalResource[]>;
  [key: string]: unknown;
}
