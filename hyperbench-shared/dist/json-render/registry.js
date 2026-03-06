import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRenderer } from "@json-render/react";
import { catalog } from "./catalog.js";
export const HalRenderer = createRenderer(catalog, {
    Card: ({ children }) => (_jsx("sl-card", { children: _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: children }) })),
    ProgressBar: ({ element: { props } }) => (_jsx("sl-progress-bar", { value: String(props.value), label: props.label, children: props.label })),
    StepLabel: ({ element: { props } }) => (_jsx("p", { className: "text-lg font-semibold text-slate-700", children: props.text })),
    Alert: ({ element: { props } }) => (_jsxs("sl-alert", { variant: props.variant, open: true, children: [_jsx("sl-icon", { slot: "icon", name: "check2-circle" }), props.message] })),
    Summary: ({ element: { props } }) => (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: props.entries.map((entry) => (_jsxs("p", { className: "text-sm text-slate-700", children: [_jsxs("strong", { children: [entry.key, ":"] }), " ", entry.value] }, entry.key))) })),
    ItemsTable: ({ element: { props } }) => (_jsxs("table", { className: "w-full text-sm text-left border-collapse", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-200", children: props.columns.map((col) => (_jsx("th", { className: "py-2 px-2 text-xs uppercase tracking-wide text-slate-500 font-semibold", children: col.charAt(0).toUpperCase() +
                            col.slice(1).replace(/([A-Z])/g, " $1") }, col))) }) }), _jsx("tbody", { children: props.rows.map((row, i) => (_jsx("tr", { className: "border-b border-slate-50", children: props.columns.map((col) => (_jsx("td", { className: "py-2 px-2 text-slate-700", children: String(row[col] ?? "") }, col))) }, i))) })] })),
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
            dynamicAttrs["hx-trigger"] = "sl-change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsx("sl-input", { type: props.inputType || "text", name: props.name, label: props.label, value: props.value || "", ...(props.required ? { required: true } : {}), ...(props.placeholder ? { placeholder: props.placeholder } : {}), ...(props.min !== null ? { min: String(props.min) } : {}), ...(props.max !== null ? { max: String(props.max) } : {}), ...dynamicAttrs }));
    },
    SelectField: ({ element: { props } }) => {
        const dynamicAttrs = {};
        if (props.dynamic && props.patchUrl) {
            dynamicAttrs["hx-patch"] = props.patchUrl;
            dynamicAttrs["hx-target"] = "#content";
            dynamicAttrs["hx-swap"] = "innerHTML";
            dynamicAttrs["hx-trigger"] = "sl-change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsx("sl-select", { name: props.name, label: props.label, value: props.value || "", ...(props.required ? { required: true } : {}), ...dynamicAttrs, children: props.options.map((opt) => (_jsx("sl-option", { value: opt.value, children: opt.label }, opt.value))) }));
    },
    TextareaField: ({ element: { props } }) => {
        const dynamicAttrs = {};
        if (props.dynamic && props.patchUrl) {
            dynamicAttrs["hx-patch"] = props.patchUrl;
            dynamicAttrs["hx-target"] = "#content";
            dynamicAttrs["hx-swap"] = "innerHTML";
            dynamicAttrs["hx-trigger"] = "sl-change";
            dynamicAttrs["hx-include"] = "closest form";
        }
        return (_jsx("sl-textarea", { name: props.name, label: props.label, value: props.value || "", ...(props.required ? { required: true } : {}), ...(props.placeholder ? { placeholder: props.placeholder } : {}), ...dynamicAttrs }));
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
        return (_jsx("sl-button", { variant: props.variant, ...(props.submit ? { type: "submit" } : {}), ...hxAttrs, children: props.label }));
    },
    ButtonGroup: ({ children }) => (_jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: children })),
});
