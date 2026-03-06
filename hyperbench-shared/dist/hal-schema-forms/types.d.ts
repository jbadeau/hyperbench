export interface HalLink {
    href: string;
    templated?: boolean;
    title?: string;
}
export interface HalLinks {
    [rel: string]: HalLink;
}
export interface JsonSchemaProperty {
    type: string;
    title?: string;
    format?: string;
    placeholder?: string;
    oneOf?: Array<{
        const: string;
        title: string;
    }>;
    minimum?: number;
    maximum?: number;
    maxLength?: number;
    default?: unknown;
}
export interface JsonSchema {
    type: "object";
    required?: string[];
    properties: Record<string, JsonSchemaProperty>;
}
export interface FormDefinition {
    _links: {
        target: HalLink;
    };
    method: string;
    contentType: string;
    schema: JsonSchema;
}
export interface HalSchemaFormsResource {
    _links?: HalLinks;
    _forms?: Record<string, FormDefinition>;
    step?: number;
    totalSteps?: number;
    stepLabel?: string;
    alert?: {
        message: string;
        variant: string;
    };
    summary?: Record<string, string>;
    items?: Array<Record<string, unknown>>;
    subtotal?: string;
    shippingNote?: string;
    total?: string;
    costSummary?: {
        subtotal: string;
        shipping: string;
        total: string;
    };
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map