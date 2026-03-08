import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({}),
      slots: ["default"],
      description: "Outer card wrapper with border and shadow",
    },
    ProgressBar: {
      props: z.object({
        value: z.number(),
        label: z.string(),
      }),
      slots: [],
      description: "Wizard progress bar with percentage",
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
      description: "Alert banner with variant styling",
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
      description: "Text input field with label",
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
      description: "Select dropdown with label",
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
      description: "Textarea field with label",
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
      description: "Button with optional HTMX navigation",
    },
    ButtonGroup: {
      props: z.object({}),
      slots: ["default"],
      description: "Flex container for grouping buttons",
    },
    ContextBar: {
      props: z.object({
        clientName: z.string(),
        clientId: z.string(),
      }),
      slots: [],
      description: "Context bar showing the currently selected client",
    },
  },
  actions: {},
});

export type AppCatalog = typeof catalog;
