import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

/**
 * The component definitions, exported separately from the built catalog.
 *
 * `defineCatalog` returns an object carrying type-inference-only getters that
 * throw when enumerated, so anything that needs to walk the components at
 * runtime — the editor's property panel — reads this map instead.
 */
export const componentDefinitions = {
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
    MetricCards: {
      props: z.object({
        cards: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            badge: z.string().nullable(),
            // "up" | "down" — drives both the arrow and the colour, so a
            // design cannot end up with a green downward trend.
            trend: z.string().nullable(),
            footer: z.string().nullable(),
            detail: z.string().nullable(),
          }),
        ),
        columns: z.number().nullable(),
      }),
      slots: [],
      description: "Row of KPI metric cards with value, delta badge and trend note",
    },
    AreaChart: {
      props: z.object({
        title: z.string().nullable(),
        subtitle: z.string().nullable(),
        // Points are plain numbers and the path is derived, so the shape of the
        // chart is editable rather than a frozen SVG path.
        series: z.array(
          z.object({
            name: z.string(),
            color: z.string(),
            points: z.array(z.number()),
          }),
        ),
        ranges: z.array(z.string()).nullable(),
        activeRange: z.string().nullable(),
        height: z.number().nullable(),
      }),
      slots: [],
      description: "Stacked area chart over one or more numeric series",
    },
    DataTable: {
      props: z.object({
        title: z.string().nullable(),
        subtitle: z.string().nullable(),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            align: z.string().nullable(),
            badge: z.boolean().nullable(),
          }),
        ),
        rows: z.array(
          z.object({
            cells: z.record(z.string(), z.string()),
            // Row click publishes portal context (e.g. the selected client).
            context: z.record(z.string(), z.string()).nullable(),
          }),
        ),
        emptyMessage: z.string().nullable(),
      }),
      slots: [],
      description:
        "Data table with labelled columns, optional badge cells and rows that publish portal context when clicked. Columns are design; rows are supplied by the backing app.",
    },
    Remote: {
      props: z.object({
        endpoint: z.string(),
        trigger: z.string().nullable(),
        swap: z.string().nullable(),
        minHeight: z.string().nullable(),
      }),
      slots: [],
      description:
        "Live region filled by a portal service over HTMX. Lets a design restyle around content it does not own, instead of replacing it with static markup.",
    },
    ButtonGroup: {
      props: z.object({}),
      slots: ["default"],
      description: "Flex container for grouping buttons",
    },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});

export type AppCatalog = typeof catalog;
