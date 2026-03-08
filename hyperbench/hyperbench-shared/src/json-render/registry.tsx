import React from "react";
import { defineRegistry, type BaseComponentProps } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog.js";

export const { registry } = defineRegistry(catalog, {
  components: {
    // --- shadcn display components ---
    Card: shadcnComponents.Card,
    Table: shadcnComponents.Table,
    Alert: shadcnComponents.Alert,
    Text: shadcnComponents.Text,
    Heading: shadcnComponents.Heading,
    Progress: shadcnComponents.Progress,
    Stack: shadcnComponents.Stack,
    Badge: shadcnComponents.Badge,
    Separator: shadcnComponents.Separator,

    // --- custom app components ---
    Summary: ({ props }: BaseComponentProps<{ entries: { key: string; value: string }[] }>) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {props.entries.map((entry) => (
          <p key={entry.key} className="text-sm text-muted-foreground">
            <strong className="text-foreground">{entry.key}:</strong> {entry.value}
          </p>
        ))}
      </div>
    ),

    ContextBar: ({ props }: BaseComponentProps<{ clientName: string; clientId: string }>) => (
      <div className="bg-muted border-b border-border px-6 py-2 flex items-center gap-3 shrink-0">
        <i data-lucide="user" className="w-4 h-4 text-foreground"></i>
        <span className="text-sm font-medium text-foreground">
          Viewing: {props.clientName}
        </span>
        <div className="flex-1"></div>
        <button
          type="button"
          data-action="clear-context"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <i data-lucide="x" className="w-3.5 h-3.5"></i> Clear
        </button>
      </div>
    ),

    // --- custom HTMX components ---
    Form: ({ props, children }: BaseComponentProps<{ action: string; method: string }>) => {
      const hxAttr = props.method === "POST" ? "hx-post" : "hx-put";
      return (
        <form
          {...{ [hxAttr]: props.action }}
          hx-target="#content"
          hx-swap="innerHTML"
          hx-ext="json-enc"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {children}
        </form>
      );
    },

    TextField: ({ props }: BaseComponentProps<{
      name: string; label: string; inputType: string | null;
      value: string | null; required: boolean | null;
      placeholder: string | null; min: number | null; max: number | null;
      dynamic: boolean | null; patchUrl: string | null;
    }>) => {
      const dynamicAttrs: Record<string, string> = {};
      if (props.dynamic && props.patchUrl) {
        dynamicAttrs["hx-patch"] = props.patchUrl;
        dynamicAttrs["hx-target"] = "#content";
        dynamicAttrs["hx-swap"] = "innerHTML";
        dynamicAttrs["hx-trigger"] = "change";
        dynamicAttrs["hx-include"] = "closest form";
      }
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{props.label}</label>
          <input
            type={props.inputType || "text"}
            name={props.name}
            defaultValue={props.value || ""}
            {...(props.required ? { required: true } : {})}
            {...(props.placeholder ? { placeholder: props.placeholder } : {})}
            {...(props.min !== null ? { min: String(props.min) } : {})}
            {...(props.max !== null ? { max: String(props.max) } : {})}
            {...dynamicAttrs}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      );
    },

    SelectField: ({ props }: BaseComponentProps<{
      name: string; label: string; value: string | null;
      required: boolean | null;
      options: { value: string; label: string }[];
      dynamic: boolean | null; patchUrl: string | null;
    }>) => {
      const dynamicAttrs: Record<string, string> = {};
      if (props.dynamic && props.patchUrl) {
        dynamicAttrs["hx-patch"] = props.patchUrl;
        dynamicAttrs["hx-target"] = "#content";
        dynamicAttrs["hx-swap"] = "innerHTML";
        dynamicAttrs["hx-trigger"] = "change";
        dynamicAttrs["hx-include"] = "closest form";
      }
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{props.label}</label>
          <select
            name={props.name}
            defaultValue={props.value || ""}
            {...(props.required ? { required: true } : {})}
            {...dynamicAttrs}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {props.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    },

    TextareaField: ({ props }: BaseComponentProps<{
      name: string; label: string; value: string | null;
      required: boolean | null; placeholder: string | null;
      dynamic: boolean | null; patchUrl: string | null;
    }>) => {
      const dynamicAttrs: Record<string, string> = {};
      if (props.dynamic && props.patchUrl) {
        dynamicAttrs["hx-patch"] = props.patchUrl;
        dynamicAttrs["hx-target"] = "#content";
        dynamicAttrs["hx-swap"] = "innerHTML";
        dynamicAttrs["hx-trigger"] = "change";
        dynamicAttrs["hx-include"] = "closest form";
      }
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{props.label}</label>
          <textarea
            name={props.name}
            defaultValue={props.value || ""}
            {...(props.required ? { required: true } : {})}
            {...(props.placeholder ? { placeholder: props.placeholder } : {})}
            {...dynamicAttrs}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      );
    },

    Button: ({ props }: BaseComponentProps<{
      label: string; variant: string; submit: boolean | null;
      hxGet: string | null; hxPost: string | null;
    }>) => {
      const hxAttrs: Record<string, string> = {};
      if (props.hxGet) {
        hxAttrs["hx-get"] = props.hxGet;
        hxAttrs["hx-target"] = "#content";
        hxAttrs["hx-swap"] = "innerHTML";
      }
      if (props.hxPost) {
        hxAttrs["hx-post"] = props.hxPost;
        hxAttrs["hx-target"] = "#content";
        hxAttrs["hx-swap"] = "innerHTML";
      }
      const variants: Record<string, string> = {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        success: "bg-green-600 text-white hover:opacity-90",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
        default: "bg-secondary text-secondary-foreground hover:bg-accent",
        text: "text-muted-foreground hover:text-foreground hover:bg-accent",
      };
      const cls = variants[props.variant] || variants.default;
      return (
        <button
          {...(props.submit ? { type: "submit" as const } : { type: "button" as const })}
          {...hxAttrs}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${cls}`}
        >
          {props.label}
        </button>
      );
    },

    ButtonGroup: ({ children }: BaseComponentProps) => (
      <div style={{ display: "flex", gap: "0.5rem" }}>{children}</div>
    ),
  },
});
