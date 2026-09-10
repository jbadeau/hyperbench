/**
 * HTML output encoding.
 *
 * Every value that reaches markup — whether it came from a Custom Resource, a
 * backend API or the request — must pass through one of these. The rule is
 * context-sensitive: `esc` is safe for element text and quoted attribute values,
 * `safeUrl` is required for anything that lands in `href`/`src`, and there is
 * deliberately no helper for interpolating into inline JavaScript, because that
 * context cannot be made safe by escaping. Use data attributes instead.
 */

/**
 * Escape for HTML text and quoted attribute values.
 *
 * Covers both quote characters: single quotes matter because attribute values
 * are not always double-quoted, and `/` is escaped to defuse `</script>` in
 * text nodes.
 */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#47;");
}

/** Schemes permitted in `href` and `src`. Everything else is dropped. */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/**
 * Characters browsers strip before parsing a scheme. A tab or newline inside
 * "java<TAB>script:" does not stop it being a javascript URL, so they are
 * removed before the scheme check rather than after.
 */
const URL_NOISE = /[\u0000-\u0020]/g;

/**
 * Escape a URL for use in `href`/`src`, rejecting dangerous schemes.
 *
 * Relative URLs (`/clients`, `./x`, `#frag`) are allowed through and escaped.
 * Absolute URLs must carry an allowlisted scheme; `javascript:`, `data:` and
 * `vbscript:` resolve to "#" rather than throwing, so one bad Custom Resource
 * degrades a single link instead of failing the whole shell render.
 */
export function safeUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (raw === "") return "#";

  const normalized = raw.replace(URL_NOISE, "").toLowerCase();

  // Relative forms carry no scheme and are always safe.
  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?")) {
    return esc(raw);
  }

  // A colon before the first slash means an explicit scheme.
  const colon = normalized.indexOf(":");
  const slash = normalized.indexOf("/");
  if (colon !== -1 && (slash === -1 || colon < slash)) {
    if (!SAFE_SCHEMES.has(normalized.slice(0, colon + 1))) return "#";
  }

  return esc(raw);
}

/**
 * Serialize a value into a `data-*` attribute.
 *
 * This is the supported way to hand server data to client-side JavaScript.
 * Reading it back with `dataset` yields a string that was never parsed as code.
 */
export function dataAttr(value: unknown): string {
  return esc(typeof value === "string" ? value : JSON.stringify(value ?? null));
}

/**
 * Validate a `data-*` / custom element attribute *name* coming from a Custom
 * Resource. Widget `client.props` keys are attacker-controlled in the same way
 * values are, and an unchecked key can close the attribute and open another.
 */
export function safeAttrName(name: string): string | null {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(name) ? name : null;
}

/**
 * Validate an HTML tag name from a Custom Resource (`widget.spec.client.element`).
 * Custom elements are `foo-bar`; anything else is refused.
 */
export function safeTagName(name: string): string | null {
  return /^[a-zA-Z][a-zA-Z0-9-]*$/.test(name) ? name : null;
}

/**
 * Escape a CSS value destined for a `style` attribute.
 *
 * Layout values from CRDs (`grid-template-columns`, `gap`) reach an inline
 * style. Semicolons and braces would let one property become several, or
 * escape the attribute entirely.
 */
export function safeCss(value: unknown): string {
  return String(value ?? "")
    .replace(/[<>"'`;{}\\]/g, "")
    .replace(/url\s*\(/gi, "")
    .replace(/expression\s*\(/gi, "")
    .trim();
}

/**
 * Embed a value inside a `<script>` block as a JavaScript literal.
 *
 * HTML-escaping is the wrong tool for this context — `&quot;` is not a quote to
 * a JS parser. `JSON.stringify` produces a correct literal; the follow-up
 * replacements stop the result from terminating the enclosing script element or
 * opening an HTML comment, both of which end script context in the HTML parser
 * before JavaScript ever sees them.
 */
export function jsLiteral(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Render an error fragment that reveals nothing about the server.
 *
 * The real error is logged with a correlation id; the browser gets the id and
 * nothing else. Upstream URLs, stack traces and the request path are all
 * server-side detail — echoing them tells an attacker the cluster's internal
 * topology, and echoing the request path reflects attacker-controlled input
 * straight back into the response body.
 */
export function errorFragment(context: string, err: unknown): string {
  const id = Math.random().toString(36).slice(2, 10);
  console.error(`[error ${id}] ${context}:`, err);
  return (
    `<div class="p-4 text-sm text-destructive" role="alert">` +
    `<p class="font-medium">Something went wrong loading this section.</p>` +
    `<p class="text-xs text-muted-foreground mt-1">Reference: ${esc(id)}</p>` +
    `</div>`
  );
}

/**
 * Accept only a same-origin, root-relative path.
 *
 * Stricter than `safeUrl` on purpose. `safeUrl` treats anything starting with
 * "/" as relative, which lets "//evil.com" — a protocol-relative URL — through.
 * That is tolerable for Widget resources, which are platform configuration
 * written by whoever controls the cluster, but not for Designs: those are
 * authored in the playground and rendered into every viewer's portal, so an
 * endpoint pointing off-origin would let a design author inject a third
 * party's HTML into the page.
 *
 * Returns null when the value is not acceptable, so callers must decide what
 * to render instead rather than silently emitting a dead link.
 */
export function safePortalPath(value: unknown): string | null {
  const raw = String(value ?? "").trim();

  if (!raw.startsWith("/")) return null;
  // "//host" and "/\host" are both read as protocol-relative by browsers.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  // Control characters can break out of an attribute or smuggle a newline.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;

  return raw;
}

