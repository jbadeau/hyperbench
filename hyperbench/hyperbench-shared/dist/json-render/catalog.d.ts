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
            props: z.ZodObject<{
                title: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                maxWidth: z.ZodNullable<z.ZodEnum<{
                    sm: "sm";
                    md: "md";
                    lg: "lg";
                    full: "full";
                }>>;
                centered: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>;
            slots: string[];
            description: string;
            example: {
                title: string;
                description: string;
            };
        };
        Table: {
            props: z.ZodObject<{
                columns: z.ZodArray<z.ZodString>;
                rows: z.ZodArray<z.ZodArray<z.ZodString>>;
                caption: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            description: string;
            example: {
                columns: string[];
                rows: string[][];
            };
        };
        Alert: {
            props: z.ZodObject<{
                title: z.ZodString;
                message: z.ZodNullable<z.ZodString>;
                type: z.ZodNullable<z.ZodEnum<{
                    success: "success";
                    info: "info";
                    warning: "warning";
                    error: "error";
                }>>;
            }, z.core.$strip>;
            description: string;
            example: {
                title: string;
                message: string;
                type: string;
            };
        };
        Text: {
            props: z.ZodObject<{
                text: z.ZodString;
                variant: z.ZodNullable<z.ZodEnum<{
                    caption: "caption";
                    body: "body";
                    muted: "muted";
                    lead: "lead";
                    code: "code";
                }>>;
            }, z.core.$strip>;
            description: string;
            example: {
                text: string;
            };
        };
        Heading: {
            props: z.ZodObject<{
                text: z.ZodString;
                level: z.ZodNullable<z.ZodEnum<{
                    h1: "h1";
                    h2: "h2";
                    h3: "h3";
                    h4: "h4";
                }>>;
            }, z.core.$strip>;
            description: string;
            example: {
                text: string;
                level: string;
            };
        };
        Progress: {
            props: z.ZodObject<{
                value: z.ZodNumber;
                max: z.ZodNullable<z.ZodNumber>;
                label: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>;
            description: string;
            example: {
                value: number;
                max: number;
                label: string;
            };
        };
        Stack: {
            props: z.ZodObject<{
                direction: z.ZodNullable<z.ZodEnum<{
                    horizontal: "horizontal";
                    vertical: "vertical";
                }>>;
                gap: z.ZodNullable<z.ZodEnum<{
                    sm: "sm";
                    md: "md";
                    lg: "lg";
                    none: "none";
                }>>;
                align: z.ZodNullable<z.ZodEnum<{
                    start: "start";
                    center: "center";
                    end: "end";
                    stretch: "stretch";
                }>>;
                justify: z.ZodNullable<z.ZodEnum<{
                    start: "start";
                    center: "center";
                    end: "end";
                    between: "between";
                    around: "around";
                }>>;
            }, z.core.$strip>;
            slots: string[];
            description: string;
            example: {
                direction: string;
                gap: string;
            };
        };
        Badge: {
            props: z.ZodObject<{
                text: z.ZodString;
                variant: z.ZodNullable<z.ZodEnum<{
                    default: "default";
                    secondary: "secondary";
                    destructive: "destructive";
                    outline: "outline";
                }>>;
            }, z.core.$strip>;
            description: string;
            example: {
                text: string;
                variant: string;
            };
        };
        Separator: {
            props: z.ZodObject<{
                orientation: z.ZodNullable<z.ZodEnum<{
                    horizontal: "horizontal";
                    vertical: "vertical";
                }>>;
            }, z.core.$strip>;
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
        ContextBar: {
            props: z.ZodObject<{
                clientName: z.ZodString;
                clientId: z.ZodString;
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
    };
    actions: {};
}>;
export type AppCatalog = typeof catalog;
//# sourceMappingURL=catalog.d.ts.map