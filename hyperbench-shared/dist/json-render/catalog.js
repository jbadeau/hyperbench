import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
export const catalog = defineCatalog(schema, {
    components: {
        Card: {
            props: z.object({}),
            slots: ["default"],
            description: "Outer card wrapper using sl-card",
        },
        ProgressBar: {
            props: z.object({
                value: z.number(),
                label: z.string(),
            }),
            slots: [],
            description: "Wizard progress bar using sl-progress-bar",
        },
        StepLabel: {
            props: z.object({
                text: z.string(),
            }),
            slots: [],
            description: "Step label paragraph",
        },
        Alert: {
            props: z.object({
                message: z.string(),
                variant: z.string(),
            }),
            slots: [],
            description: "Alert banner using sl-alert",
        },
        Summary: {
            props: z.object({
                entries: z.array(z.object({ key: z.string(), value: z.string() })),
            }),
            slots: [],
            description: "Key-value summary display",
        },
        ItemsTable: {
            props: z.object({
                columns: z.array(z.string()),
                rows: z.array(z.record(z.string(), z.unknown())),
            }),
            slots: [],
            description: "Data table for item listings",
        },
        Form: {
            props: z.object({
                action: z.string(),
                method: z.string(),
            }),
            slots: ["default"],
            description: "Form with HTMX submission attributes",
        },
        TextField: {
            props: z.object({
                name: z.string(),
                label: z.string(),
                inputType: z.string().nullable(),
                value: z.string().nullable(),
                required: z.boolean().nullable(),
                placeholder: z.string().nullable(),
                min: z.number().nullable(),
                max: z.number().nullable(),
                dynamic: z.boolean().nullable(),
                patchUrl: z.string().nullable(),
            }),
            slots: [],
            description: "Text input field using sl-input",
        },
        SelectField: {
            props: z.object({
                name: z.string(),
                label: z.string(),
                value: z.string().nullable(),
                required: z.boolean().nullable(),
                options: z.array(z.object({ value: z.string(), label: z.string() })),
                dynamic: z.boolean().nullable(),
                patchUrl: z.string().nullable(),
            }),
            slots: [],
            description: "Select dropdown using sl-select",
        },
        TextareaField: {
            props: z.object({
                name: z.string(),
                label: z.string(),
                value: z.string().nullable(),
                required: z.boolean().nullable(),
                placeholder: z.string().nullable(),
                dynamic: z.boolean().nullable(),
                patchUrl: z.string().nullable(),
            }),
            slots: [],
            description: "Textarea field using sl-textarea",
        },
        Button: {
            props: z.object({
                label: z.string(),
                variant: z.string(),
                submit: z.boolean().nullable(),
                hxGet: z.string().nullable(),
                hxPost: z.string().nullable(),
            }),
            slots: [],
            description: "Button using sl-button with optional HTMX navigation",
        },
        ButtonGroup: {
            props: z.object({}),
            slots: ["default"],
            description: "Flex container for grouping buttons",
        },
    },
    actions: {},
});
