import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { defineRegistry } from "@json-render/react";
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
        Summary: ({ props }) => (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: props.entries.map((entry) => (_jsxs("p", { className: "text-sm text-muted-foreground", children: [_jsxs("strong", { className: "text-foreground", children: [entry.key, ":"] }), " ", entry.value] }, entry.key))) })),
        ContextBar: ({ props }) => (_jsxs("div", { className: "bg-muted border-b border-border px-6 py-2 flex items-center gap-3 shrink-0", children: [_jsx("i", { "data-lucide": "user", className: "w-4 h-4 text-foreground" }), _jsxs("span", { className: "text-sm font-medium text-foreground", children: ["Viewing: ", props.clientName] }), _jsx("div", { className: "flex-1" }), _jsxs("button", { type: "button", "data-action": "clear-context", className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition", children: [_jsx("i", { "data-lucide": "x", className: "w-3.5 h-3.5" }), " Clear"] })] })),
        // --- custom HTMX components ---
        Form: ({ props, children }) => {
            const hxAttr = props.method === "POST" ? "hx-post" : "hx-put";
            return (_jsx("form", { [hxAttr]: props.action, "hx-target": "#content", "hx-swap": "innerHTML", "hx-ext": "json-enc", style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: children }));
        },
        TextField: ({ props }) => {
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
        SelectField: ({ props }) => {
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
        TextareaField: ({ props }) => {
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
        Button: ({ props }) => {
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
    },
});
