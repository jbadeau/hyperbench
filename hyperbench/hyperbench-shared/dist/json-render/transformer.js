/**
 * Parse URI template variables from a templated link href.
 * E.g. "/ui/onboarding/abc/step2{?country}" -> ["country"]
 */
function parseTemplateVars(href) {
    const match = href.match(/\{\?([^}]+)\}/);
    if (!match)
        return [];
    return match[1].split(",").map((v) => v.trim());
}
/**
 * Resolve a templated href to a concrete URL by stripping the template part.
 * E.g. "/ui/onboarding/abc/step2{?country}" -> "/ui/onboarding/abc/step2"
 */
function resolveHref(href) {
    return href.replace(/\{[^}]+\}/g, "");
}
/**
 * Rewrite /ui/ paths to /fragments/ for HTMX proxying.
 */
function rewriteUrl(href) {
    return resolveHref(href).replace(/^\/ui\//, "/fragments/");
}
/**
 * Build a field element from a JSON Schema property.
 */
function buildFieldElement(name, prop, required, dynamicVars, selfHref) {
    const defaultVal = prop.default !== undefined && prop.default !== null
        ? String(prop.default)
        : null;
    const isDynamic = dynamicVars.includes(name);
    const patchUrl = isDynamic ? rewriteUrl(selfHref) : null;
    // oneOf -> SelectField
    if (prop.oneOf && prop.oneOf.length > 0) {
        return {
            type: "SelectField",
            props: {
                name,
                label: prop.title || name,
                value: defaultVal || null,
                required: required || null,
                options: prop.oneOf.map((opt) => ({
                    value: opt.const,
                    label: opt.title,
                })),
                dynamic: isDynamic || null,
                patchUrl,
            },
        };
    }
    // textarea for large text
    if (prop.type === "string" && prop.maxLength && prop.maxLength > 255) {
        return {
            type: "TextareaField",
            props: {
                name,
                label: prop.title || name,
                value: defaultVal || null,
                required: required || null,
                placeholder: prop.placeholder || null,
                dynamic: isDynamic || null,
                patchUrl,
            },
        };
    }
    // integer / number
    if (prop.type === "integer" || prop.type === "number") {
        return {
            type: "TextField",
            props: {
                name,
                label: prop.title || name,
                inputType: "number",
                value: defaultVal || null,
                required: required || null,
                placeholder: null,
                min: prop.minimum ?? null,
                max: prop.maximum ?? null,
                dynamic: isDynamic || null,
                patchUrl,
            },
        };
    }
    // string with format
    let inputType = "text";
    if (prop.format === "email")
        inputType = "email";
    else if (prop.format === "date")
        inputType = "date";
    return {
        type: "TextField",
        props: {
            name,
            label: prop.title || name,
            inputType,
            value: defaultVal || null,
            required: required || null,
            placeholder: prop.placeholder || null,
            min: null,
            max: null,
            dynamic: isDynamic || null,
            patchUrl,
        },
    };
}
/**
 * Convert a HAL-schema-forms resource into a json-render Spec.
 */
export function halToSpec(resource) {
    const elements = {};
    const cardChildren = [];
    let nextId = 1;
    const id = (prefix) => `${prefix}-${nextId++}`;
    const links = resource._links || {};
    const forms = resource._forms || {};
    const form = forms.default;
    const selfLink = links.self;
    // Parse template vars for dynamic reload
    const dynamicVars = selfLink?.templated ? parseTemplateVars(selfLink.href) : [];
    // 1. Progress bar
    if (resource.step !== undefined && resource.totalSteps !== undefined) {
        const pct = Math.round((resource.step / resource.totalSteps) * 100);
        const label = pct === 100
            ? "Complete"
            : `Step ${resource.step} of ${resource.totalSteps}`;
        const eid = id("progress");
        elements[eid] = {
            type: "Progress",
            props: { value: pct, label, max: null },
        };
        cardChildren.push(eid);
    }
    // 2. Step label
    if (resource.stepLabel) {
        const eid = id("step-label");
        elements[eid] = {
            type: "Heading",
            props: { text: resource.stepLabel, level: "h2" },
        };
        cardChildren.push(eid);
    }
    // 3. Alert
    if (resource.alert) {
        const eid = id("alert");
        const typeMap = {
            success: "success",
            warning: "warning",
            danger: "error",
            primary: "info",
        };
        elements[eid] = {
            type: "Alert",
            props: {
                title: resource.alert.message,
                message: null,
                type: typeMap[resource.alert.variant] || "info",
            },
        };
        cardChildren.push(eid);
    }
    // 4. Summary (key-value display)
    if (resource.summary) {
        const eid = id("summary");
        elements[eid] = {
            type: "Summary",
            props: {
                entries: Object.entries(resource.summary).map(([k, v]) => ({
                    key: k,
                    value: v,
                })),
            },
        };
        cardChildren.push(eid);
    }
    // 5. Items table
    if (resource.items && resource.items.length > 0) {
        const cols = Object.keys(resource.items[0]).filter((k) => k !== "id" && k !== "unitPrice");
        const columnLabels = cols.map((col) => col.charAt(0).toUpperCase() +
            col.slice(1).replace(/([A-Z])/g, " $1"));
        const rows = resource.items.map((row) => cols.map((col) => String(row[col] ?? "")));
        const eid = id("items-table");
        elements[eid] = {
            type: "Table",
            props: {
                columns: columnLabels,
                rows,
                caption: null,
            },
        };
        cardChildren.push(eid);
    }
    // 6. Subtotal / shipping / total (cart view)
    if (resource.subtotal) {
        const entries = [
            { key: "Subtotal", value: resource.subtotal },
        ];
        if (resource.shippingNote) {
            entries.push({ key: "Shipping", value: resource.shippingNote });
        }
        if (resource.total) {
            entries.push({ key: "Total", value: resource.total });
        }
        const eid = id("cart-totals");
        elements[eid] = {
            type: "Summary",
            props: { entries },
        };
        cardChildren.push(eid);
    }
    // 7. Cost summary (shipping/payment views)
    if (resource.costSummary) {
        const cs = resource.costSummary;
        const eid = id("cost-summary");
        elements[eid] = {
            type: "Summary",
            props: {
                entries: [
                    { key: "Subtotal", value: cs.subtotal },
                    { key: "Shipping", value: cs.shipping },
                    { key: "Total", value: cs.total },
                ],
            },
        };
        cardChildren.push(eid);
    }
    // 8. Form (with fields + buttons)
    if (form) {
        const schema = form.schema;
        const targetHref = form._links.target.href;
        const method = form.method.toUpperCase();
        const formChildren = [];
        // Fields
        if (schema && schema.properties) {
            const requiredFields = schema.required || [];
            for (const [name, prop] of Object.entries(schema.properties)) {
                const fieldEid = id("field");
                elements[fieldEid] = buildFieldElement(name, prop, requiredFields.includes(name), dynamicVars, selfLink?.href || "");
                formChildren.push(fieldEid);
            }
        }
        // Button group with nav + submit
        const buttonGroupChildren = [];
        // Navigation links (skip self and prev)
        for (const [rel, link] of Object.entries(links)) {
            if (rel === "self" || rel === "prev")
                continue;
            const btnEid = id("btn");
            elements[btnEid] = {
                type: "Button",
                props: {
                    label: link.title || rel,
                    variant: "default",
                    submit: null,
                    hxGet: rewriteUrl(link.href),
                    hxPost: null,
                },
            };
            buttonGroupChildren.push(btnEid);
        }
        // Back button
        if (links.prev) {
            const btnEid = id("btn");
            elements[btnEid] = {
                type: "Button",
                props: {
                    label: "\u2190 Back",
                    variant: "default",
                    submit: null,
                    hxGet: rewriteUrl(links.prev.href),
                    hxPost: null,
                },
            };
            buttonGroupChildren.push(btnEid);
        }
        // Submit button
        const submitEid = id("btn");
        elements[submitEid] = {
            type: "Button",
            props: {
                label: resource.step === resource.totalSteps ? "Submit \u2192" : "Continue \u2192",
                variant: "primary",
                submit: true,
                hxGet: null,
                hxPost: null,
            },
        };
        buttonGroupChildren.push(submitEid);
        const btnGroupEid = id("btn-group");
        elements[btnGroupEid] = {
            type: "ButtonGroup",
            props: {},
            children: buttonGroupChildren,
        };
        formChildren.push(btnGroupEid);
        const formEid = id("form");
        elements[formEid] = {
            type: "Form",
            props: {
                action: rewriteUrl(targetHref),
                method,
            },
            children: formChildren,
        };
        cardChildren.push(formEid);
    }
    else {
        // No form — render navigation links
        const navButtonChildren = [];
        for (const [rel, link] of Object.entries(links)) {
            if (rel === "self" || rel === "prev")
                continue;
            const btnEid = id("btn");
            elements[btnEid] = {
                type: "Button",
                props: {
                    label: link.title || rel,
                    variant: rel === "home" ? "default" : "primary",
                    submit: null,
                    hxGet: rewriteUrl(link.href),
                    hxPost: null,
                },
            };
            navButtonChildren.push(btnEid);
        }
        if (navButtonChildren.length > 0) {
            const navEid = id("nav");
            elements[navEid] = {
                type: "ButtonGroup",
                props: {},
                children: navButtonChildren,
            };
            cardChildren.push(navEid);
        }
    }
    const cardEid = id("card");
    elements[cardEid] = {
        type: "Card",
        props: { title: null, description: null, maxWidth: null, centered: null },
        children: cardChildren,
    };
    return { root: cardEid, elements };
}
