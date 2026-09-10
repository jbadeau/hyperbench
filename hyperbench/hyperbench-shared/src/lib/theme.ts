/**
 * The portal's Tailwind theme tokens.
 *
 * These live here rather than in the dashboard because more than one service
 * now renders a standalone document that has to look like the portal — the
 * dashboard shell, and the playground's popup editor. Duplicating the token
 * list would let the two drift into subtly different greys.
 */

export interface ThemeOverrides {
  /** Primary accent, from Workbench.spec.theme.primary. */
  primary?: string;
  /** Header background, from Workbench.spec.theme.headerBg. */
  headerBg?: string;
}

/**
 * Render the `@theme { … }` block for Tailwind v4's browser build.
 *
 * Returns the block only — callers wrap it in their own
 * `<style type="text/tailwindcss">` along with whatever component rules they
 * need, since those differ per document.
 */
export function themeTokens(overrides: ThemeOverrides = {}): string {
  const extra = [
    overrides.primary ? `      --color-primary: ${overrides.primary};` : "",
    overrides.headerBg ? `      --color-header-bg: ${overrides.headerBg};` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `    @theme {
      --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      --radius: 0.625rem;
      --color-background: oklch(0.145 0 0);
      --color-foreground: oklch(0.985 0 0);
      --color-card: oklch(0.205 0 0);
      --color-card-foreground: oklch(0.985 0 0);
      --color-popover: oklch(0.269 0 0);
      --color-popover-foreground: oklch(0.985 0 0);
      --color-primary: oklch(0.922 0 0);
      --color-primary-foreground: oklch(0.205 0 0);
      --color-secondary: oklch(0.269 0 0);
      --color-secondary-foreground: oklch(0.985 0 0);
      --color-muted: oklch(0.269 0 0);
      --color-muted-foreground: oklch(0.708 0 0);
      --color-accent: oklch(0.371 0 0);
      --color-accent-foreground: oklch(0.985 0 0);
      --color-destructive: oklch(0.704 0.191 22.216);
      --color-destructive-foreground: oklch(0.985 0 0);
      --color-border: oklch(1 0 0 / 10%);
      --color-input: oklch(1 0 0 / 15%);
${extra}
      --color-ring: oklch(0.556 0 0);
      --color-sidebar: oklch(0.205 0 0);
      --color-sidebar-foreground: oklch(0.985 0 0);
      --color-sidebar-primary: oklch(0.985 0 0);
      --color-sidebar-primary-foreground: oklch(0.205 0 0);
      --color-sidebar-accent: oklch(0.269 0 0);
      --color-sidebar-accent-foreground: oklch(0.985 0 0);
      --color-sidebar-border: oklch(1 0 0 / 10%);
      --color-sidebar-ring: oklch(0.439 0 0);
    }`;
}

/** CDN tags every portal document needs: font, Tailwind, HTMX. */
export function portalHead(): string {
  return `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://unpkg.com/htmx.org@2.0.10"></script>`;
}
