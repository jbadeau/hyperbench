import React from "react";
import { renderToString } from "react-dom/server";
import { validateSpec } from "@json-render/core";
import type { Spec } from "@json-render/core";
import { StateProvider, Renderer } from "@json-render/react";
import type { HalSchemaFormsResource } from "./hal-schema-forms/types.js";
import { registry } from "./json-render/registry.js";
import { halToSpec } from "./json-render/transformer.js";

export function renderHalForms(resource: HalSchemaFormsResource): string {
  const spec = halToSpec(resource);

  const validation = validateSpec(spec);
  if (!validation.valid) {
    console.warn(
      "[renderHalForms] Spec validation issues:",
      validation.issues
    );
  }

  return renderToString(
    <StateProvider initialState={{}}>
      <Renderer spec={spec} registry={registry} />
    </StateProvider>
  );
}

export function renderSpec(spec: Spec): string {
  const validation = validateSpec(spec);
  if (!validation.valid) {
    console.warn("[renderSpec] Spec validation issues:", validation.issues);
  }
  return renderToString(
    <StateProvider initialState={{}}>
      <Renderer spec={spec} registry={registry} />
    </StateProvider>
  );
}
