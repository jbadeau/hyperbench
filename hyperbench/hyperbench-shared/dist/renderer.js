import { jsx as _jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { validateSpec } from "@json-render/core";
import { StateProvider, Renderer } from "@json-render/react";
import { registry } from "./json-render/registry.js";
import { halToSpec } from "./json-render/transformer.js";
export function renderHalForms(resource) {
    const spec = halToSpec(resource);
    const validation = validateSpec(spec);
    if (!validation.valid) {
        console.warn("[renderHalForms] Spec validation issues:", validation.issues);
    }
    return renderToString(_jsx(StateProvider, { initialState: {}, children: _jsx(Renderer, { spec: spec, registry: registry }) }));
}
export function renderSpec(spec) {
    const validation = validateSpec(spec);
    if (!validation.valid) {
        console.warn("[renderSpec] Spec validation issues:", validation.issues);
    }
    return renderToString(_jsx(StateProvider, { initialState: {}, children: _jsx(Renderer, { spec: spec, registry: registry }) }));
}
