import React from "react";
import { renderToString } from "react-dom/server";
import { validateSpec, formatSpecIssues, autoFixSpec } from "@json-render/core";
import type { Spec, SpecIssue } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import type { HalSchemaFormsResource } from "./hal-schema-forms/types.js";
import { registry } from "./json-render/registry.js";
import { halToSpec } from "./json-render/transformer.js";

/** Outcome of rendering a spec, including anything validation had to say. */
export interface RenderResult {
  html: string;
  valid: boolean;
  issues: SpecIssue[];
  /** Messages describing any repairs autoFixSpec applied before rendering. */
  fixes: string[];
}

/**
 * Render a spec to HTML.
 *
 * `JSONUIProvider` composes the state, action, visibility and validation
 * contexts that the renderer requires. As of json-render 0.20 the element
 * renderer calls `useActions()` unconditionally, so a bare `StateProvider` —
 * which was sufficient on 0.11 — now throws at render time. TypeScript cannot
 * see this: the missing context is a runtime failure, not a type error.
 *
 * The state passed here is what `$state`, `$item` and `$template` bindings
 * read. It was previously hard-coded to `{}`, which silently resolved every
 * binding in every spec to nothing — bindings appeared to be unsupported when
 * they were simply never given anything to bind to.
 */
function renderTree(spec: Spec, state?: Record<string, unknown>): string {
  const initialState = state ?? (spec as { state?: Record<string, unknown> }).state ?? {};
  return renderToString(
    <JSONUIProvider registry={registry} initialState={initialState}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>,
  );
}

/**
 * Render a spec, reporting what was wrong and rendering what works.
 *
 * The original spec is validated first so the author sees the problems they
 * actually wrote; the repaired copy is what gets rendered. Doing it the other
 * way round — repair, then validate — reports a clean bill of health for a spec
 * that had a dangling reference, which is worse than useless in an editor.
 *
 * Errors are returned rather than thrown: a spec mid-edit is invalid on most
 * keystrokes, and the parts that are sound should still render.
 */
export function renderSpecDetailed(
  spec: Spec,
  state?: Record<string, unknown>,
): RenderResult {
  const validation = validateSpec(spec);
  const repaired = autoFixSpec(spec);

  return {
    html: renderTree(repaired.spec, state),
    valid: validation.valid,
    issues: validation.issues,
    fixes: repaired.fixes,
  };
}

/** Render a spec to HTML, logging any validation issues. */
export function renderSpec(spec: Spec, state?: Record<string, unknown>): string {
  const result = renderSpecDetailed(spec, state);
  if (!result.valid) {
    console.warn("[renderSpec] Spec validation issues:\n" + formatSpecIssues(result.issues));
  }
  return result.html;
}

/** Render a hal-schema-forms resource to HTML via the shared transformer. */
export function renderHalForms(resource: HalSchemaFormsResource): string {
  return renderSpec(halToSpec(resource));
}
