import { z } from "zod";
export declare const catalog: import("@json-render/core").Catalog<{
    spec: import("@json-render/core").SchemaType<"object", {
        root: import("@json-render/core").SchemaType<"string", unknown>;
        elements: import("@json-render/core").SchemaType<"record", import("@json-render/core").SchemaType<"object", {
            type: import("@json-render/core").SchemaType<"ref", string>;
            props: import("@json-render/core").SchemaType<"propsOf", string>;
            children: import("@json-render/core").SchemaType<"array", import("@json-render/core").SchemaType<"string", unknown>>;
            visible: import("@json-render/core").SchemaType<"any", unknown>;
        }>>;
    }>;
    catalog: import("@json-render/core").SchemaType<"object", {
        components: import("@json-render/core").SchemaType<"map", {
            props: import("@json-render/core").SchemaType<"zod", unknown>;
            slots: import("@json-render/core").SchemaType<"array", import("@json-render/core").SchemaType<"string", unknown>>;
            description: import("@json-render/core").SchemaType<"string", unknown>;
            example: import("@json-render/core").SchemaType<"any", unknown>;
        }>;
        actions: import("@json-render/core").SchemaType<"map", {
            params: import("@json-render/core").SchemaType<"zod", unknown>;
            description: import("@json-render/core").SchemaType<"string", unknown>;
        }>;
    }>;
}, {
    components: {
        Card: {
            props: z.ZodObject<{}, z.core.$strip>;
            slots: string[];
            description: string;
        };
        ProgressBar: {
            props: z.ZodObject<{
                value: z.ZodNumber;
                label: z.ZodString;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        StepLabel: {
            props: z.ZodObject<{
                text: z.ZodString;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        Alert: {
            props: z.ZodObject<{
                message: z.ZodString;
                variant: z.ZodString;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        Summary: {
            props: z.ZodObject<{
                entries: z.ZodArray<z.ZodObject<{
                    key: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        ItemsTable: {
            props: z.ZodObject<{
                columns: z.ZodArray<z.ZodString>;
                rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        Form: {
            props: z.ZodObject<{
                action: z.ZodString;
                method: z.ZodString;
            }, z.core.$strip>;
            slots: string[];
            description: string;
        };
        TextField: {
            props: z.ZodObject<{
                name: z.ZodString;
                label: z.ZodString;
                inputType: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                required: z.ZodNullable<z.ZodBoolean>;
                placeholder: z.ZodNullable<z.ZodString>;
                min: z.ZodNullable<z.ZodNumber>;
                max: z.ZodNullable<z.ZodNumber>;
                dynamic: z.ZodNullable<z.ZodBoolean>;
                patchUrl: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        SelectField: {
            props: z.ZodObject<{
                name: z.ZodString;
                label: z.ZodString;
                value: z.ZodNullable<z.ZodString>;
                required: z.ZodNullable<z.ZodBoolean>;
                options: z.ZodArray<z.ZodObject<{
                    value: z.ZodString;
                    label: z.ZodString;
                }, z.core.$strip>>;
                dynamic: z.ZodNullable<z.ZodBoolean>;
                patchUrl: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        TextareaField: {
            props: z.ZodObject<{
                name: z.ZodString;
                label: z.ZodString;
                value: z.ZodNullable<z.ZodString>;
                required: z.ZodNullable<z.ZodBoolean>;
                placeholder: z.ZodNullable<z.ZodString>;
                dynamic: z.ZodNullable<z.ZodBoolean>;
                patchUrl: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        Button: {
            props: z.ZodObject<{
                label: z.ZodString;
                variant: z.ZodString;
                submit: z.ZodNullable<z.ZodBoolean>;
                hxGet: z.ZodNullable<z.ZodString>;
                hxPost: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
        ButtonGroup: {
            props: z.ZodObject<{}, z.core.$strip>;
            slots: string[];
            description: string;
        };
        ContextBar: {
            props: z.ZodObject<{
                clientName: z.ZodString;
                clientId: z.ZodString;
            }, z.core.$strip>;
            slots: never[];
            description: string;
        };
    };
    actions: {};
}>;
export type AppCatalog = typeof catalog;
//# sourceMappingURL=catalog.d.ts.map