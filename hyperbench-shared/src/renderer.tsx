import React from "react";
import { renderToString } from "react-dom/server";
import { Renderer, JSONUIProvider } from "@json-render/react";
import type { HalSchemaFormsResource } from "./hal-schema-forms/types.js";
import { registry } from "./json-render/registry.js";
import { halToSpec } from "./json-render/transformer.js";

export function renderHalForms(resource: HalSchemaFormsResource): string {
  const spec = halToSpec(resource);
  return renderToString(
    <JSONUIProvider registry={registry} initialState={{}}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
