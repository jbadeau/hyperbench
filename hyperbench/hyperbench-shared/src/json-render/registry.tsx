import React from "react";
import { defineRegistry, type BaseComponentProps } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog.js";
import { safePortalPath } from "../lib/html.js";

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
      // Same reasoning as Remote: a design is authored in the playground and
      // rendered into every viewer's portal, so its request targets have to
      // stay on this origin. A form that would submit off-origin is refused
      // outright rather than rendered pointing somewhere else.
      const action = safePortalPath(props.action);
      if (!action) {
        return (
          <div
            className="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs"
            role="alert"
          >
            Form action must be a path on this portal, starting with "/".
          </div>
        );
      }
      const hxAttr = props.method === "POST" ? "hx-post" : "hx-put";
      return (
        <form
          {...{ [hxAttr]: action }}
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
      // An off-origin patchUrl degrades the field to a plain input rather than
      // failing it: the value still edits, it just stops live-patching.
      const patchUrl = props.dynamic ? safePortalPath(props.patchUrl) : null;
      if (patchUrl) {
        dynamicAttrs["hx-patch"] = patchUrl;
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
      // An off-origin patchUrl degrades the field to a plain input rather than
      // failing it: the value still edits, it just stops live-patching.
      const patchUrl = props.dynamic ? safePortalPath(props.patchUrl) : null;
      if (patchUrl) {
        dynamicAttrs["hx-patch"] = patchUrl;
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
      // An off-origin patchUrl degrades the field to a plain input rather than
      // failing it: the value still edits, it just stops live-patching.
      const patchUrl = props.dynamic ? safePortalPath(props.patchUrl) : null;
      if (patchUrl) {
        dynamicAttrs["hx-patch"] = patchUrl;
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
      // An off-origin target is dropped, leaving an inert button: it swaps its
      // response into #content, so a third party's HTML would land in the
      // middle of the portal.
      const hxGet = safePortalPath(props.hxGet);
      const hxPost = safePortalPath(props.hxPost);
      if (hxGet) {
        hxAttrs["hx-get"] = hxGet;
        hxAttrs["hx-target"] = "#content";
        hxAttrs["hx-swap"] = "innerHTML";
      }
      if (hxPost) {
        hxAttrs["hx-post"] = hxPost;
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

    MetricCards: ({ props }: BaseComponentProps<{
      cards: {
        label: string; value: string; badge: string | null;
        trend: string | null; footer: string | null; detail: string | null;
      }[];
      columns: number | null;
    }>) => {
      const cols = props.columns ?? 4;
      const cards = Array.isArray(props.cards) ? props.cards : [];
      return (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ ["--pg-cols" as string]: String(cols) }}
        >
          {cards.map((c, i) => {
            const down = c.trend === "down";
            const tone = down ? "text-red-400" : "text-emerald-400";
            const badgeTone = down
              ? "text-red-400 bg-red-500/10"
              : "text-emerald-400 bg-emerald-500/10";
            return (
              <div
                key={i}
                className="rounded-xl border border-border bg-gradient-to-t from-primary/5 to-card text-card-foreground shadow-xs"
                style={{ gridColumn: "span 1" }}
              >
                <div className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    {c.badge && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeTone}`}
                      >
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground mt-2 tabular-nums">
                    {c.value}
                  </p>
                </div>
                <div className="px-6 pb-6 pt-2">
                  {c.footer && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <i
                        data-lucide={down ? "trending-down" : "trending-up"}
                        className={`w-3 h-3 ${tone}`}
                      ></i>
                      {c.footer}
                    </p>
                  )}
                  {c.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    },

    AreaChart: ({ props }: BaseComponentProps<{
      title: string | null; subtitle: string | null;
      series: { name: string; color: string; points: number[] }[];
      ranges: string[] | null; activeRange: string | null; height: number | null;
    }>) => {
      const W = 800;
      const H = props.height ?? 200;
      const series = Array.isArray(props.series) ? props.series : [];

      // One shared scale across series, so two series are comparable by eye.
      const all = series.flatMap((s) => (Array.isArray(s.points) ? s.points : []));
      const max = all.length ? Math.max(...all) : 1;
      const scale = max > 0 ? max : 1;

      const pathFor = (points: number[]) => {
        if (points.length === 0) return "";
        const step = points.length > 1 ? W / (points.length - 1) : W;
        return points
          .map((v, i) => {
            const x = Math.round(i * step);
            const y = Math.round(H - (v / scale) * (H * 0.9));
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ");
      };

      return (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {props.title && (
                <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
              )}
              {props.subtitle && (
                <p className="text-sm text-muted-foreground">{props.subtitle}</p>
              )}
            </div>
            {Array.isArray(props.ranges) && props.ranges.length > 0 && (
              <div className="flex gap-1 bg-muted rounded-lg p-0.5 shrink-0">
                {props.ranges.map((r) => (
                  <button
                    key={r}
                    className={`px-3 py-1 text-xs rounded-md ${
                      r === props.activeRange
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 pt-4">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: `${H}px` }}
              preserveAspectRatio="none"
            >
              {series.map((s, i) => {
                const d = pathFor(Array.isArray(s.points) ? s.points : []);
                if (!d) return null;
                return (
                  <g key={i}>
                    <path d={`${d} L${W},${H} L0,${H} Z`} fill={s.color} fillOpacity={0.15} />
                    <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
                  </g>
                );
              })}
            </svg>
            <div className="flex items-center gap-6 mt-4 text-sm">
              {series.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: s.color }}
                  ></div>
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    },

    DataTable: ({ props }: BaseComponentProps<{
      title: string | null; subtitle: string | null;
      columns: { key: string; label: string; align: string | null; badge: boolean | null }[];
      rows: { cells: Record<string, string>; context: Record<string, string> | null }[];
      emptyMessage: string | null;
    }>) => {
      // A prop may arrive as an unresolved binding object rather than an array:
      // the editor validates a spec by rendering it with no state, and a widget
      // whose data endpoint is unreachable renders with none either. Treating
      // that as "no rows" keeps the section rendering; reading .length off it
      // took down the whole page.
      const columns = Array.isArray(props.columns) ? props.columns : [];
      const rows = Array.isArray(props.rows) ? props.rows : [];

      return (
      <div>
        {(props.title || props.subtitle) && (
          <div className="flex items-end justify-between mb-5">
            <div>
              {props.title && (
                <h1 className="text-2xl font-semibold text-foreground">{props.title}</h1>
              )}
              {props.subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{props.subtitle}</p>
              )}
            </div>
          </div>
        )}
        <div className="relative w-full overflow-x-auto rounded-xl border border-border">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`h-10 px-2 align-middle font-medium whitespace-nowrap text-foreground ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="p-2 text-center text-muted-foreground h-24"
                  >
                    {props.emptyMessage || "No rows"}
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b transition-colors hover:bg-muted/50${
                      row.context ? " cursor-pointer" : ""
                    }`}
                    {...(row.context
                      ? { "data-set-context": JSON.stringify(row.context) }
                      : {})}
                  >
                    {columns.map((col) => {
                      const value = row.cells?.[col.key] ?? "";
                      return (
                        <td
                          key={col.key}
                          className={`p-2 align-middle whitespace-nowrap ${
                            col.align === "right"
                              ? "text-right text-muted-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {col.badge && value ? (
                            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      );
    },

    Remote: ({ props }: BaseComponentProps<{
      endpoint: string; trigger: string | null;
      swap: string | null; minHeight: string | null;
    }>) => {
      // A design is authored in the playground and rendered into every
      // viewer's portal, so an off-origin endpoint here would be third-party
      // HTML injected into the page. Refuse rather than render it, and say so
      // in place — a silently empty region reads as a slow load.
      const endpoint = safePortalPath(props.endpoint);
      if (!endpoint) {
        return (
          <div
            className="rounded-md border border-destructive/50 text-destructive px-3 py-2 text-xs"
            role="alert"
          >
            Remote endpoint must be a path on this portal, starting with "/".
          </div>
        );
      }

      return (
        <div
          {...{
            "hx-get": endpoint,
            "hx-trigger": props.trigger || "load",
            "hx-swap": props.swap || "innerHTML",
          }}
          style={props.minHeight ? { minHeight: props.minHeight } : undefined}
        />
      );
    },

    ButtonGroup: ({ children }: BaseComponentProps) => (
      <div style={{ display: "flex", gap: "0.5rem" }}>{children}</div>
    ),
  },
});
