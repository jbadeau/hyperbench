import { jsx as _jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { Renderer, JSONUIProvider } from "@json-render/react";
import { registry } from "./json-render/registry.js";
import { halToSpec } from "./json-render/transformer.js";
export function renderHalForms(resource) {
    const spec = halToSpec(resource);
    return renderToString(_jsx(JSONUIProvider, { registry: registry, initialState: {}, children: _jsx(Renderer, { spec: spec, registry: registry }) }));
}
