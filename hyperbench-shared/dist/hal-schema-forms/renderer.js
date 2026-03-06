import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Parse URI template variables from a templated link href.
 * E.g. "/ui/onboarding/abc/step2{?country}" → ["country"]
 */
function parseTemplateVars(href) {
    const match = href.match(/\{\?([^}]+)\}/);
    if (!match)
        return [];
    return match[1].split(",").map((v) => v.trim());
}
/**
 * Resolve a templated href to a concrete URL by stripping the template part.
 * E.g. "/ui/onboarding/abc/step2{?country}" → "/ui/onboarding/abc/step2"
 */
function resolveHref(href) {
    return href.replace(/\{[^}]+\}/g, "");
}
function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/**
 * Render a single JSON Schema property to a Shoelace form field.
 */
function renderField(name, prop, required, dynamicVars, selfHref) {
    const defaultVal = prop.default !== undefined && prop.default !== null
        ? String(prop.default)
        : undefined;
    // Dynamic reload attributes for fields matching template variables
    const isDynamic = dynamicVars.includes(name);
    const dynamicAttrs = {};
    if (isDynamic) {
        dynamicAttrs["hx-patch"] = resolveHref(selfHref).replace(/^\/ui\//, "/fragments/");
        dynamicAttrs["hx-target"] = "#content";
        dynamicAttrs["hx-swap"] = "innerHTML";
        dynamicAttrs["hx-trigger"] = "sl-change";
        dynamicAttrs["hx-include"] = "closest form";
    }
    // oneOf → sl-select
    if (prop.oneOf && prop.oneOf.length > 0) {
        return (_jsx("sl-select", { name: name, label: prop.title || name, value: defaultVal || "", ...(required ? { required: true } : {}), ...dynamicAttrs, children: prop.oneOf.map((opt) => (_jsx("sl-option", { value: opt.const, children: opt.title }, opt.const))) }, name));
    }
    // textarea for large text
    if (prop.type === "string" && prop.maxLength && prop.maxLength > 255) {
        return (_jsx("sl-textarea", { name: name, label: prop.title || name, value: defaultVal || "", ...(required ? { required: true } : {}), ...(prop.placeholder ? { placeholder: prop.placeholder } : {}), ...dynamicAttrs }, name));
    }
    // integer / number
    if (prop.type === "integer" || prop.type === "number") {
        return (_jsx("sl-input", { type: "number", name: name, label: prop.title || name, value: defaultVal || "", ...(required ? { required: true } : {}), ...(prop.minimum !== undefined ? { min: String(prop.minimum) } : {}), ...(prop.maximum !== undefined ? { max: String(prop.maximum) } : {}), ...dynamicAttrs }, name));
    }
    // string with format
    let inputType = "text";
    if (prop.format === "email")
        inputType = "email";
    else if (prop.format === "date")
        inputType = "date";
    return (_jsx("sl-input", { type: inputType, name: name, label: prop.title || name, value: defaultVal || "", ...(required ? { required: true } : {}), ...(prop.placeholder ? { placeholder: prop.placeholder } : {}), ...dynamicAttrs }, name));
}
/**
 * Core rendering function: HalSchemaFormsResource → React elements.
 */
export function renderHalSchemaForms(resource) {
    const links = resource._links || {};
    const forms = resource._forms || {};
    const form = forms.default;
    const selfLink = links.self;
    // Parse template vars for dynamic reload
    const dynamicVars = selfLink?.templated
        ? parseTemplateVars(selfLink.href)
        : [];
    const elements = [];
    // Progress bar
    if (resource.step !== undefined && resource.totalSteps !== undefined) {
        const pct = Math.round((resource.step / resource.totalSteps) * 100);
        const label = pct === 100
            ? "Complete"
            : `Step ${resource.step} of ${resource.totalSteps}`;
        elements.push(_jsx("sl-progress-bar", { value: String(pct), label: label, children: label }, "progress"));
    }
    // Step label
    if (resource.stepLabel) {
        elements.push(_jsx("p", { className: "text-lg font-semibold text-slate-700", children: resource.stepLabel }, "step-label"));
    }
    // Alert
    if (resource.alert) {
        elements.push(_jsxs("sl-alert", { variant: resource.alert.variant, open: true, children: [_jsx("sl-icon", { slot: "icon", name: "check2-circle" }), resource.alert.message] }, "alert"));
    }
    // Summary (key-value display)
    if (resource.summary) {
        elements.push(_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: Object.entries(resource.summary).map(([k, v]) => (_jsxs("p", { className: "text-sm text-slate-700", children: [_jsxs("strong", { children: [k, ":"] }), " ", v] }, k))) }, "summary"));
    }
    // Items table
    if (resource.items && resource.items.length > 0) {
        const cols = Object.keys(resource.items[0]).filter((k) => k !== "id" && k !== "unitPrice");
        elements.push(_jsxs("table", { className: "w-full text-sm text-left border-collapse", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-200", children: cols.map((col) => (_jsx("th", { className: "py-2 px-2 text-xs uppercase tracking-wide text-slate-500 font-semibold", children: col.charAt(0).toUpperCase() +
                                col.slice(1).replace(/([A-Z])/g, " $1") }, col))) }) }), _jsx("tbody", { children: resource.items.map((item, i) => (_jsx("tr", { className: "border-b border-slate-50", children: cols.map((col) => (_jsx("td", { className: "py-2 px-2 text-slate-700", children: String(item[col] ?? "") }, col))) }, i))) })] }, "items-table"));
    }
    // Subtotal/shipping note/total (cart view)
    if (resource.subtotal) {
        elements.push(_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.25rem" }, children: [_jsxs("p", { className: "text-sm text-slate-700", children: ["Subtotal: ", resource.subtotal] }), resource.shippingNote && (_jsx("p", { className: "text-sm text-slate-500", children: resource.shippingNote })), resource.total && (_jsx("p", { className: "text-sm font-semibold text-slate-800", children: resource.total }))] }, "cart-totals"));
    }
    // Cost summary (shipping/payment views)
    if (resource.costSummary) {
        const cs = resource.costSummary;
        elements.push(_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.25rem" }, children: [_jsx("p", { className: "text-sm text-slate-700", children: cs.subtotal }), _jsx("p", { className: "text-sm text-slate-700", children: cs.shipping }), _jsx("p", { className: "text-sm font-semibold text-slate-800", children: cs.total })] }, "cost-summary"));
    }
    // Form
    if (form) {
        const schema = form.schema;
        const targetHref = form._links.target.href;
        const method = form.method.toUpperCase();
        const fields = [];
        if (schema && schema.properties) {
            const requiredFields = schema.required || [];
            for (const [name, prop] of Object.entries(schema.properties)) {
                fields.push(renderField(name, prop, requiredFields.includes(name), dynamicVars, selfLink?.href || ""));
            }
        }
        // Navigation + submit buttons
        const buttons = [];
        // Other navigation links (home, create, etc.)
        for (const [rel, link] of Object.entries(links)) {
            if (rel === "self" || rel === "prev")
                continue;
            buttons.push(_jsx("sl-button", { variant: "default", "hx-get": link.href.replace(/^\/ui\//, "/fragments/"), "hx-target": "#content", "hx-swap": "innerHTML", children: link.title || rel }, rel));
        }
        if (links.prev) {
            const prevHref = links.prev.href;
            buttons.push(_jsx("sl-button", { variant: "default", "hx-get": prevHref.replace(/^\/ui\//, "/fragments/"), "hx-target": "#content", "hx-swap": "innerHTML", children: "\u2190 Back" }, "back"));
        }
        // Submit button
        buttons.push(_jsx("sl-button", { variant: "primary", type: "submit", children: resource.step === resource.totalSteps ? "Submit →" : "Continue →" }, "submit"));
        const formAttrs = {};
        if (method === "POST") {
            formAttrs["hx-post"] = targetHref.replace(/^\/ui\//, "/fragments/");
        }
        else if (method === "PUT") {
            formAttrs["hx-put"] = targetHref.replace(/^\/ui\//, "/fragments/");
        }
        elements.push(_jsxs("form", { ...formAttrs, "hx-target": "#content", "hx-swap": "innerHTML", "hx-ext": "json-enc", style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: [fields, _jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: buttons })] }, "form"));
    }
    else {
        // No form — render navigation links (home, create, etc.)
        const navButtons = [];
        for (const [rel, link] of Object.entries(links)) {
            if (rel === "self" || rel === "prev")
                continue;
            navButtons.push(_jsx("sl-button", { variant: rel === "home" ? "default" : "primary", "hx-get": link.href.replace(/^\/ui\//, "/fragments/"), "hx-target": "#content", "hx-swap": "innerHTML", children: link.title || rel }, rel));
        }
        if (navButtons.length > 0) {
            elements.push(_jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: navButtons }, "nav"));
        }
    }
    return (_jsx("sl-card", { children: _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: elements }) }));
}
