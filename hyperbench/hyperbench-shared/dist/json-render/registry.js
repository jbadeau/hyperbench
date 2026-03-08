import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRenderer } from "@json-render/react";
import { catalog } from "./catalog.js";
export const HalRenderer = createRenderer(catalog, {
    Card: ({ children }) => (_jsx("div", { className: "rounded-xl border border-border bg-card text-card-foreground shadow-sm", children: _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }, children: children }) })),
    ProgressBar: ({ element: { props } }) => (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1.5", children: [_jsx("span", { children: props.label }), _jsxs("span", { children: [props.value, "%"] })] }), _jsx("div", { className: "h-2 bg-secondary rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all", style: { width: `${props.value}%` } }) })] })),
    StepLabel: ({ element: { props } }) => (_jsx("p", { className: "text-lg font-semibold text-foreground", children: props.text })),
    Alert: ({ element: { props } }) => {
        const colors = {
            success: "border-green-800 bg-green-950 text-green-400",
            warning: "border-yellow-800 bg-yellow-950 text-yellow-400",
            danger: "border-red-800 bg-red-950 text-red-400",
            primary: "border-border bg-muted text-foreground",
        };
        const cls = colors[props.variant] || colors.primary;
        return (_jsxs("div", { className: `rounded-xl border px-4 py-3 text-sm ${cls}`, children: [_jsx("i", { "data-lucide": "check-circle-2", className: "inline-block w-4 h-4 mr-2 align-text-bottom" }), props.message] }));
    },
    Summary: ({ element: { props } }) => (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: props.entries.map((entry) => (_jsxs("p", { className: "text-sm text-muted-foreground", children: [_jsxs("strong", { className: "text-foreground", children: [entry.key, ":"] }), " ", entry.value] }, entry.key))) })),
    ItemsTable: ({ element: { props } }) => (_jsx("div", { className: "relative w-full overflow-x-auto", children: _jsxs("table", { className: "w-full caption-bottom text-sm", children: [_jsx("thead", { className: "[&_tr]:border-b", children: _jsx("tr", { className: "border-b transition-colors hover:bg-muted/50", children: props.columns.map((col) => (_jsx("th", { className: "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground", children: col.charAt(0).toUpperCase() +
                                col.slice(1).replace(/([A-Z])/g, " $1") }, col))) }) }), _jsx("tbody", { className: "[&_tr:last-child]:border-0", children: props.rows.map((row, i) => (_jsx("tr", { className: "border-b transition-colors hover:bg-muted/50", children: props.columns.map((col) => (_jsx("td", { className: "p-2 align-middle whitespace-nowrap", children: String(row[col] ?? "") }, col))) }, i))) })] }) })),
    Form: ({ element: { props }, children }) => {
        const hxAttr = props.method === "POST" ? "hx-post" : "hx-put";
        return (_jsx("form", { [hxAttr]: props.action, "hx-target": "#content", "hx-swap": "innerHTML", "hx-ext": "json-enc", style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: children }));
    },
    TextField: ({ element: { props } }) => {
        const dynamicAttrs = {};
        if (props.dynamic && props.patchUrl) {
            dynamicAttrs["hx-patch"] = props.patchUrl;
            dynamicAttrs["hx-target"] = "#content";
            dynamicAttrs["hx-swap"] = "innerHTML";
            dynamicAttrs["hx-trigger"] = "change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: props.label }), _jsx("input", { type: props.inputType || "text", name: props.name, defaultValue: props.value || "", ...(props.required ? { required: true } : {}), ...(props.placeholder ? { placeholder: props.placeholder } : {}), ...(props.min !== null ? { min: String(props.min) } : {}), ...(props.max !== null ? { max: String(props.max) } : {}), ...dynamicAttrs, className: "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" })] }));
    },
    SelectField: ({ element: { props } }) => {
        const dynamicAttrs = {};
        if (props.dynamic && props.patchUrl) {
            dynamicAttrs["hx-patch"] = props.patchUrl;
            dynamicAttrs["hx-target"] = "#content";
            dynamicAttrs["hx-swap"] = "innerHTML";
            dynamicAttrs["hx-trigger"] = "change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: props.label }), _jsx("select", { name: props.name, defaultValue: props.value || "", ...(props.required ? { required: true } : {}), ...dynamicAttrs, className: "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring", children: props.options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }));
    },
    TextareaField: ({ element: { props } }) => {
        const dynamicAttrs = {};
        if (props.dynamic && props.patchUrl) {
            dynamicAttrs["hx-patch"] = props.patchUrl;
            dynamicAttrs["hx-target"] = "#content";
            dynamicAttrs["hx-swap"] = "innerHTML";
            dynamicAttrs["hx-trigger"] = "change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: props.label }), _jsx("textarea", { name: props.name, defaultValue: props.value || "", ...(props.required ? { required: true } : {}), ...(props.placeholder ? { placeholder: props.placeholder } : {}), ...dynamicAttrs, className: "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" })] }));
    },
    Button: ({ element: { props } }) => {
        const hxAttrs = {};
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
        const variants = {
            primary: "bg-primary text-primary-foreground hover:opacity-90",
            success: "bg-green-600 text-white hover:opacity-90",
            danger: "bg-destructive text-destructive-foreground hover:opacity-90",
            default: "bg-secondary text-secondary-foreground hover:bg-accent",
            text: "text-muted-foreground hover:text-foreground hover:bg-accent",
        };
        const cls = variants[props.variant] || variants.default;
        return (_jsx("button", { ...(props.submit ? { type: "submit" } : { type: "button" }), ...hxAttrs, className: `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${cls}`, children: props.label }));
    },
    ButtonGroup: ({ children }) => (_jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: children })),
    ContextBar: ({ element: { props } }) => (_jsxs("div", { className: "bg-muted border-b border-border px-6 py-2 flex items-center gap-3 shrink-0", children: [_jsx("i", { "data-lucide": "user", className: "w-4 h-4 text-foreground" }), _jsxs("span", { className: "text-sm font-medium text-foreground", children: ["Viewing: ", props.clientName] }), _jsx("div", { className: "flex-1" }), _jsxs("button", { type: "button", "data-action": "clear-context", className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition", children: [_jsx("i", { "data-lucide": "x", className: "w-3.5 h-3.5" }), " Clear"] })] })),
});
