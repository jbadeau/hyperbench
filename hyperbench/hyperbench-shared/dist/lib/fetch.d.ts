import type { HalSchemaFormsResource } from "../hal-schema-forms/types.js";
export declare function fetchHalSchemaForms(url: string, extraHeaders?: Record<string, string>): Promise<HalSchemaFormsResource>;
export declare function sendHalSchemaForms(url: string, method: string, body: unknown, extraHeaders?: Record<string, string>): Promise<HalSchemaFormsResource>;
export declare function postHalSchemaForms(url: string, body: unknown, extraHeaders?: Record<string, string>): Promise<HalSchemaFormsResource>;
export declare function extractContextHeaders(req: {
    headers: Record<string, string | string[] | undefined>;
}): Record<string, string>;
export declare function esc(s: string): string;
//# sourceMappingURL=fetch.d.ts.map