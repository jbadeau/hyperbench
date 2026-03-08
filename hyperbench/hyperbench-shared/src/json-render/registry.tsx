import React from "react";
import { createRenderer, type ComponentRenderProps } from "@json-render/react";
import { catalog } from "./catalog.js";

export const HalRenderer = createRenderer(catalog, {
  Card: ({ children }: ComponentRenderProps) => (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  ),

  ProgressBar: ({ element: { props } }: ComponentRenderProps<{ value: number; label: string }>) => (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>{props.label}</span>
        <span>{props.value}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${props.value}%` }}></div>
      </div>
    </div>
  ),

  StepLabel: ({ element: { props } }: ComponentRenderProps<{ text: string }>) => (
    <p className="text-lg font-semibold text-foreground">{props.text}</p>
  ),

  Alert: ({ element: { props } }: ComponentRenderProps<{ message: string; variant: string }>) => {
    const colors: Record<string, string> = {
      success: "border-green-800 bg-green-950 text-green-400",
      warning: "border-yellow-800 bg-yellow-950 text-yellow-400",
      danger: "border-red-800 bg-red-950 text-red-400",
      primary: "border-border bg-muted text-foreground",
    };
    const cls = colors[props.variant] || colors.primary;
    return (
      <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
        <i data-lucide="check-circle-2" className="inline-block w-4 h-4 mr-2 align-text-bottom"></i>
        {props.message}
      </div>
    );
  },

  Summary: ({ element: { props } }: ComponentRenderProps<{ entries: { key: string; value: string }[] }>) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {props.entries.map((entry) => (
        <p key={entry.key} className="text-sm text-muted-foreground">
          <strong className="text-foreground">{entry.key}:</strong> {entry.value}
        </p>
      ))}
    </div>
  ),

  ItemsTable: ({ element: { props } }: ComponentRenderProps<{ columns: string[]; rows: Record<string, unknown>[] }>) => (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {props.columns.map((col) => (
              <th
                key={col}
                className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground"
              >
                {col.charAt(0).toUpperCase() +
                  col.slice(1).replace(/([A-Z])/g, " $1")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {props.rows.map((row, i) => (
            <tr key={i} className="border-b transition-colors hover:bg-muted/50">
              {props.columns.map((col) => (
                <td key={col} className="p-2 align-middle whitespace-nowrap">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  Form: ({ element: { props }, children }: ComponentRenderProps<{ action: string; method: string }>) => {
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

  TextField: ({ element: { props } }: ComponentRenderProps<{
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

  SelectField: ({ element: { props } }: ComponentRenderProps<{
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

  TextareaField: ({ element: { props } }: ComponentRenderProps<{
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

  Button: ({ element: { props } }: ComponentRenderProps<{
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
        {...(props.submit ? { type: "submit" } : { type: "button" })}
        {...hxAttrs}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${cls}`}
      >
        {props.label}
      </button>
    );
  },

  ButtonGroup: ({ children }: ComponentRenderProps) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>{children}</div>
  ),

  ContextBar: ({ element: { props } }: ComponentRenderProps<{ clientName: string; clientId: string }>) => (
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
});
