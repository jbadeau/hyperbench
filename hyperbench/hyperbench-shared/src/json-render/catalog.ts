import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    // --- shadcn display components ---
    Card: shadcnComponentDefinitions.Card,
    Table: shadcnComponentDefinitions.Table,
    Alert: shadcnComponentDefinitions.Alert,
    Text: shadcnComponentDefinitions.Text,
    Heading: shadcnComponentDefinitions.Heading,
    Progress: shadcnComponentDefinitions.Progress,
    Stack: shadcnComponentDefinitions.Stack,
    Badge: shadcnComponentDefinitions.Badge,
    Separator: shadcnComponentDefinitions.Separator,

    // --- custom app components ---
    Summary: {
      props: z.object({
        entries: z.array(z.object({ key: z.string(), value: z.string() })),
      }),
      slots: [],
      description: "Key-value summary display",
    },
    ContextBar: {
      props: z.object({
        clientName: z.string(),
        clientId: z.string(),
      }),
      slots: [],
      description: "Context bar showing the currently selected client",
    },

    // --- custom HTMX components ---
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
  },
  actions: {},
});

export type AppCatalog = typeof catalog;
