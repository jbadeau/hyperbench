import Anthropic from "@anthropic-ai/sdk";
import { catalog } from "@hyperbench/shared/json-render.js";
import type { Spec } from "@json-render/core";

/**
 * Model used for design generation.
 *
 * Overridable so an operator can trade cost for capability without a rebuild,
 * but the default is the most capable model — a design is generated once and
 * then lived with, so quality matters more than per-call price here.
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * The catalog is the guardrail.
 *
 * `catalog.prompt()` describes the available components and their props, and
 * `catalog.jsonSchema()` turns the same catalog into a JSON Schema. Passing the
 * latter as a structured output format means the API itself constrains the
 * response — the model cannot invent a component that does not exist, so a
 * generated design is renderable by construction rather than by hope.
 *
 * Both are computed once: they depend only on the catalog, which is fixed at
 * build time, and rebuilding them per request would be pure waste.
 */
const SYSTEM_PROMPT = catalog.prompt({
  system:
    "You design dashboard views for HyperBench, a hypermedia portal. " +
    "Produce clear, information-dense layouts using only the components in the catalog. " +
    "Prefer a Stack or Card as the root element. Use realistic placeholder content " +
    "relevant to the user's request rather than lorem ipsum.",
});

const SPEC_SCHEMA = catalog.jsonSchema() as Record<string, unknown>;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  // Constructed lazily so the service still starts (and the hand-editing half
  // of the playground still works) when no API key is configured.
  if (!client) client = new Anthropic();
  return client;
}

export function generationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export interface GenerateResult {
  spec: Spec;
  /** Text Claude produced alongside the design, if any. */
  note: string;
}

/**
 * Generate or refine a design from a natural-language prompt.
 *
 * When `currentSpec` is supplied the request is a refinement: the existing
 * design is included so the model edits it rather than starting over, which is
 * what makes the "prompt until happy" loop converge instead of oscillating.
 *
 * Streaming is used because a full spec can be long and a non-streaming request
 * at this `max_tokens` risks an HTTP timeout.
 */
export async function generateDesign(
  prompt: string,
  currentSpec?: Spec | null,
): Promise<GenerateResult> {
  const userContent = currentSpec
    ? `Refine the existing design according to this instruction:\n\n${prompt}\n\n` +
      `Current design:\n\`\`\`json\n${JSON.stringify(currentSpec, null, 2)}\n\`\`\`\n\n` +
      `Return the complete updated design, not a patch.`
    : prompt;

  // Server-side fallback: if a safety classifier declines the request, the API
  // re-runs it on a fallback model within the same call rather than leaving the
  // author staring at an error. "default" routes by refusal category, so there
  // is no model list here to go stale.
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    system: SYSTEM_PROMPT,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: SPEC_SCHEMA,
      },
    },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: userContent }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(
      `The model declined this request (${message.stop_details?.category ?? "unspecified"}).`,
    );
  }

  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text.trim()) {
    throw new Error("The model returned no design.");
  }

  let spec: Spec;
  try {
    spec = JSON.parse(text) as Spec;
  } catch (err) {
    throw new Error(`The model returned output that was not valid JSON: ${String(err)}`);
  }

  return { spec, note: "" };
}
