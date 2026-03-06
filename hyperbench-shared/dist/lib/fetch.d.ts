import type { HalSchemaFormsResource } from "../hal-schema-forms/types.js";
export declare function fetchHalSchemaForms(url: string): Promise<HalSchemaFormsResource>;
export declare function sendHalSchemaForms(url: string, method: string, body: unknown): Promise<HalSchemaFormsResource>;
export declare function postHalSchemaForms(url: string, body: unknown): Promise<HalSchemaFormsResource>;
export declare function esc(s: string): string;
//# sourceMappingURL=fetch.d.ts.map