import React from "react";
import { createRenderer, type ComponentRenderProps } from "@json-render/react";
import { catalog } from "./catalog.js";

export const HalRenderer = createRenderer(catalog, {
  Card: ({ children }: ComponentRenderProps) => (
    <sl-card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {children}
      </div>
    </sl-card>
  ),

  ProgressBar: ({ element: { props } }: ComponentRenderProps<{ value: number; label: string }>) => (
    <sl-progress-bar value={String(props.value)} label={props.label}>
      {props.label}
    </sl-progress-bar>
  ),

  StepLabel: ({ element: { props } }: ComponentRenderProps<{ text: string }>) => (
    <p className="text-lg font-semibold text-slate-700">{props.text}</p>
  ),

  Alert: ({ element: { props } }: ComponentRenderProps<{ message: string; variant: string }>) => (
    <sl-alert variant={props.variant} open>
      <sl-icon slot="icon" name="check2-circle" />
      {props.message}
    </sl-alert>
  ),

  Summary: ({ element: { props } }: ComponentRenderProps<{ entries: { key: string; value: string }[] }>) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {props.entries.map((entry) => (
        <p key={entry.key} className="text-sm text-slate-700">
          <strong>{entry.key}:</strong> {entry.value}
        </p>
      ))}
    </div>
  ),

  ItemsTable: ({ element: { props } }: ComponentRenderProps<{ columns: string[]; rows: Record<string, unknown>[] }>) => (
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-200">
          {props.columns.map((col) => (
            <th
              key={col}
              className="py-2 px-2 text-xs uppercase tracking-wide text-slate-500 font-semibold"
            >
              {col.charAt(0).toUpperCase() +
                col.slice(1).replace(/([A-Z])/g, " $1")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-50">
            {props.columns.map((col) => (
              <td key={col} className="py-2 px-2 text-slate-700">
                {String(row[col] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
      dynamicAttrs["hx-trigger"] = "sl-change";
      dynamicAttrs["hx-include"] = "closest form";
    }
    return (
      <sl-input
        type={props.inputType || "text"}
        name={props.name}
        label={props.label}
        value={props.value || ""}
        {...(props.required ? { required: true } : {})}
        {...(props.placeholder ? { placeholder: props.placeholder } : {})}
        {...(props.min !== null ? { min: String(props.min) } : {})}
        {...(props.max !== null ? { max: String(props.max) } : {})}
        {...dynamicAttrs}
      />
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
      dynamicAttrs["hx-trigger"] = "sl-change";
      dynamicAttrs["hx-include"] = "closest form";
    }
    return (
      <sl-select
        name={props.name}
        label={props.label}
        value={props.value || ""}
        {...(props.required ? { required: true } : {})}
        {...dynamicAttrs}
      >
        {props.options.map((opt) => (
          <sl-option key={opt.value} value={opt.value}>
            {opt.label}
          </sl-option>
        ))}
      </sl-select>
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
      dynamicAttrs["hx-trigger"] = "sl-change";
      dynamicAttrs["hx-include"] = "closest form";
    }
    return (
      <sl-textarea
        name={props.name}
        label={props.label}
        value={props.value || ""}
        {...(props.required ? { required: true } : {})}
        {...(props.placeholder ? { placeholder: props.placeholder } : {})}
        {...dynamicAttrs}
      />
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
    return (
      <sl-button
        variant={props.variant}
        {...(props.submit ? { type: "submit" } : {})}
        {...hxAttrs}
      >
        {props.label}
      </sl-button>
    );
  },

  ButtonGroup: ({ children }: ComponentRenderProps) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>{children}</div>
  ),
});
