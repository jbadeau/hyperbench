import { esc, safeUrl, safeCss, jsLiteral } from "@hyperbench/shared/lib/html.js";
import { themeTokens } from "@hyperbench/shared/lib/theme.js";
import type { Workbench, NavigationNode, Widget } from "../k8s/types.js";

function renderSearch(workbench: Workbench, widgets: Map<string, Widget>): string {
  const search = workbench.spec.header?.search;
  if (!search?.enabled) return "";
  const widget = search.widgetRef ? widgets.get(search.widgetRef) : undefined;
  if (!widget?.spec.server?.endpoint) return "";
  const endpoint = widget.spec.server.endpoint;
  const placeholder = widget.spec.title ?? "";
  return `
    <div class="relative" id="header-search">
      <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10"></i>
      <input type="text" id="header-search-input" placeholder="${esc(placeholder)}"
             autocomplete="off"
             hx-get="${safeUrl(endpoint)}" hx-target="#header-search-results" hx-swap="innerHTML"
             hx-trigger="input changed delay:200ms, focus" hx-params="*"
             name="q"
             class="bg-input border border-border rounded-md py-1.5 pl-8 pr-3 text-foreground text-sm w-72 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition" />
      <div id="header-search-results" class="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border z-50 max-h-80 overflow-y-auto hidden"></div>
    </div>`;
}

function renderHeaderActions(workbench: Workbench): string {
  const header = workbench.spec.header;
  const parts: string[] = [];
  if (header?.notifications?.enabled) {
    parts.push(`<button type="button" class="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition" aria-label="Notifications"><i data-lucide="bell" class="w-5 h-5"></i></button>`);
  }
  if (header?.settings?.enabled) {
    parts.push(`<button type="button" class="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition" aria-label="Settings"><i data-lucide="settings" class="w-5 h-5"></i></button>`);
  }
  if (parts.length === 0) return "";
  return `<div class="flex items-center gap-1">${parts.join("\n")}</div>`;
}

function renderUserMenu(workbench: Workbench): string {
  const userMenu = workbench.spec.header?.userMenu;
  if (!userMenu?.enabled) return "";
  const label = userMenu.label ?? "";
  const email = userMenu.email ?? "";
  const initials = label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return `
    <div class="border-t border-sidebar-border p-4">
      <div class="flex items-center gap-3 text-sidebar-foreground text-sm">
        <div class="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">${esc(initials)}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${esc(label)}</div>
          ${email ? `<div class="text-xs text-muted-foreground truncate">${esc(email)}</div>` : ""}
        </div>
      </div>
    </div>`;
}

function renderContextBar(workbench: Workbench, widgets: Map<string, Widget>): string {
  const ctx = workbench.spec.contextBar;
  if (!ctx?.enabled) return "";
  const widget = ctx.widgetRef ? widgets.get(ctx.widgetRef) : undefined;
  if (!widget?.spec.server?.endpoint) return "";
  const endpoint = widget.spec.server.endpoint;
  const trigger = widget.spec.server.trigger ?? "load";
  return `
  <div id="context-bar" class="border-b border-border"
       hx-get="${safeUrl(endpoint)}"
       hx-trigger="${esc(trigger)}"
       hx-swap="innerHTML">
  </div>`;
}

function resolveTargetPath(
  node: NavigationNode,
  nodeMap: Map<string, NavigationNode>,
): string | null {
  if (node.spec.type === "page" && node.spec.page) {
    return node.spec.page.path;
  }
  if (node.spec.type === "alias" && node.spec.alias) {
    const target = nodeMap.get(node.spec.alias.targetRef);
    if (target?.spec.type === "page" && target.spec.page) {
      return target.spec.page.path;
    }
  }
  return null;
}

function renderNavNode(node: NavigationNode, nodeMap: Map<string, NavigationNode>): string {
  const spec = node.spec;

  if (spec.type === "group") {
    if (!spec.title) return "";
    return `<div class="text-xs font-medium text-muted-foreground px-3 mb-1.5">${esc(spec.title)}</div>`;
  }

  if (spec.type === "page" || spec.type === "alias") {
    const path = resolveTargetPath(node, nodeMap);
    if (!path) return "";
    const icon = spec.icon ? `<i data-lucide="${esc(spec.icon)}" class="w-4 h-4"></i> ` : "";
    return `
      <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm w-full text-left transition"
              data-nav="${esc(path)}"
              hx-get="${safeUrl(path)}" hx-target="#content" hx-swap="innerHTML" hx-push-url="${safeUrl(path)}">
        ${icon}${esc(spec.title)}
      </button>`;
  }

  if (spec.type === "link" && spec.link) {
    const target = spec.link.target ? ` target="${esc(spec.link.target)}"` : "";
    const rel = spec.link.target ? ` rel="noopener noreferrer"` : "";
    const icon = spec.icon ? `<i data-lucide="${esc(spec.icon)}" class="w-4 h-4"></i> ` : "";
    return `
      <a href="${safeUrl(spec.link.url)}"${target}${rel}
         class="flex items-center gap-2 py-1.5 px-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm w-full text-left transition no-underline">
        ${icon}${esc(spec.title)}
      </a>`;
  }

  return "";
}

function renderSidebar(navNodes: NavigationNode[]): string {
  const nodeMap = new Map<string, NavigationNode>();
  for (const n of navNodes) {
    nodeMap.set(n.metadata.name, n);
  }

  const topLevel = navNodes.filter(n => !n.spec.parent);
  const children = new Map<string, NavigationNode[]>();
  for (const n of navNodes) {
    if (n.spec.parent) {
      const list = children.get(n.spec.parent) ?? [];
      list.push(n);
      children.set(n.spec.parent, list);
    }
  }

  const mainSections: string[] = [];
  const secondarySections: string[] = [];

  for (const node of topLevel) {
    const isSecondary = node.metadata.labels?.["portal.hyperbench.com/position"] === "secondary";
    const kids = children.get(node.metadata.name) ?? [];
    if (node.spec.type === "group") {
      const groupHtml = renderNavNode(node, nodeMap);
      const childHtml = kids.map(child => renderNavNode(child, nodeMap)).join("\n");
      const section = `<div class="px-3 mb-4">${groupHtml}${childHtml}</div>`;
      (isSecondary ? secondarySections : mainSections).push(section);
    } else {
      const html = renderNavNode(node, nodeMap);
      const section = `<div class="px-3 mb-4">${html}</div>`;
      (isSecondary ? secondarySections : mainSections).push(section);
    }
  }

  return `
    <div class="flex-1">${mainSections.join("\n")}</div>
    ${secondarySections.length > 0 ? `<div class="mt-auto border-t border-sidebar-border pt-2">${secondarySections.join("\n")}</div>` : ""}`;
}

export function htmlShell(
  workbench: Workbench,
  navNodes: NavigationNode[],
  widgets: Map<string, Widget>,
): string {
  const title = workbench.spec.title;

  // Workbench.spec.theme carries raw CSS colour values from a Custom Resource.
  // They are emitted into a <style> block, so they go through safeCss rather
  // than esc — a stray `;` or `}` here would open new declarations or rules.
  const primary = safeCss(workbench.spec.theme?.primary);
  const headerBg = safeCss(workbench.spec.theme?.headerBg);
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>

  <!-- Inter Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS v4 -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
${themeTokens({ primary, headerBg })}

    body {
      font-family: var(--font-sans);
    }

    .nav-btn.active {
      color: var(--color-sidebar-primary-foreground);
      background: var(--color-sidebar-primary);
      font-weight: 500;
    }

    #sidebar.collapsed {
      width: 0;
    }

    /* A section with an editor window open. Outline, not border, so switching
       it on does not reflow the page around it. */
    [data-widget].pg-editing {
      outline: 2px solid oklch(0.62 0.19 259);
      outline-offset: 3px;
      border-radius: var(--radius);
      position: relative;
    }

    /* Edit affordance: one floating button repositioned over whichever section
       is hovered, rather than one injected per slot — htmx swaps slot contents
       and would strip an injected child on every refresh. */
    #pg-edit-fab {
      position: absolute;
      z-index: 40;
      display: none;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.5rem;
      font-size: 0.7rem;
      border-radius: 0.375rem;
      border: 1px solid var(--color-border);
      background: var(--color-card);
      color: var(--color-foreground);
      cursor: pointer;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.35);
    }

    #pg-edit-fab:hover {
      background: var(--color-accent);
    }

    /* Sits inside the slot, not hung above its top edge: slots carry
       overflow:hidden, which clipped the label entirely while leaving the
       outline (drawn outside the box, and not subject to the slot's own
       overflow) perfectly visible. */
    [data-widget].pg-editing::after {
      content: "editing";
      position: absolute;
      top: 0;
      left: 0;
      padding: 0.05rem 0.4rem;
      font-size: 0.625rem;
      line-height: 1.1rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: oklch(0.985 0 0);
      background: oklch(0.62 0.19 259);
      border-top-left-radius: var(--radius);
      border-bottom-right-radius: 0.375rem;
      pointer-events: none;
      z-index: 30;
    }
  </style>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@0.544.0"></script>

  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@2.0.10"></script>
  <script src="https://unpkg.com/htmx-ext-json-enc@2.0.3/json-enc.js"></script>
</head>
<body class="m-0 bg-sidebar h-screen antialiased">

  <div class="flex h-screen">

    <!-- Sidebar -->
    <aside id="sidebar" class="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-200 ease-linear overflow-hidden">
      <!-- Sidebar Header -->
      <div class="px-4 h-14 flex items-center gap-2 shrink-0">
        <div class="flex items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground w-7 h-7">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
        </div>
        <a href="/" class="text-base font-semibold tracking-tight text-sidebar-foreground no-underline">${title}</a>
      </div>
      <!-- Sidebar Nav -->
      <nav class="flex-1 overflow-y-auto py-2 flex flex-col">
        ${renderSidebar(navNodes)}
      </nav>
      <!-- Sidebar Footer -->
      ${renderUserMenu(workbench)}
    </aside>

    <!-- Content Area (inset) -->
    <div class="flex-1 flex flex-col my-2 mr-2 rounded-xl bg-background shadow-sm overflow-hidden">
      <!-- Content Header -->
      <header class="flex items-center h-14 border-b border-border shrink-0">
        <div class="flex w-full items-center gap-2 px-4">
          <button type="button" id="sidebar-trigger" class="-ml-1 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition" aria-label="Toggle Sidebar">
            <i data-lucide="panel-left" class="w-4 h-4"></i>
          </button>
          <div class="mx-2 h-4 w-px bg-border shrink-0"></div>
          <span id="page-title" class="text-sm font-medium text-foreground"></span>
          <div class="mx-2 h-4 w-px bg-border shrink-0"></div>
          ${renderSearch(workbench, widgets)}
          <div class="flex-1"></div>
          ${renderHeaderActions(workbench)}
        </div>
      </header>

      <!-- Context Bar -->
      ${renderContextBar(workbench, widgets)}

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6" id="content">
      </main>
    </div>

  </div>

<script>
// ── Initialize Lucide icons ──
function initIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Sidebar toggle ──
document.getElementById('sidebar-trigger').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── WorkbenchContext ──
var WorkbenchContext = (function() {
  var STORAGE_KEY = 'workbench-context';

  function _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e) { return {}; }
  }
  function _save(ctx) { localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx)); }
  function _dispatch() {
    document.body.dispatchEvent(new CustomEvent('workbench:context', { detail: _load() }));
  }
  function set(key, value) {
    var ctx = _load();
    ctx[key] = value;
    _save(ctx);
    _dispatch();
  }
  function get(key) { return _load()[key] || null; }
  function getAll() { return _load(); }
  function remove(key) {
    var ctx = _load();
    delete ctx[key];
    _save(ctx);
    _dispatch();
  }
  function clear() {
    _save({});
    _dispatch();
  }

  return { set: set, get: get, getAll: getAll, remove: remove, clear: clear };
})();

// ── Header search dropdown ──
(function() {
  var input = document.getElementById('header-search-input');
  var results = document.getElementById('header-search-results');
  if (!input || !results) return;

  document.body.addEventListener('htmx:afterSwap', function(evt) {
    if (evt.detail.target === results) {
      results.classList.toggle('hidden', results.innerHTML.trim() === '');
    }
  });

  document.addEventListener('click', function(evt) {
    if (!evt.target.closest('#header-search')) {
      results.classList.add('hidden');
    }
  });

  input.addEventListener('keydown', function(evt) {
    if (evt.key === 'Escape') {
      results.classList.add('hidden');
      input.blur();
    }
  });

  document.body.addEventListener('workbench:context', function() {
    input.value = '';
    results.innerHTML = '';
    results.classList.add('hidden');
  });
})();

// ── Action delegation ──
document.addEventListener('click', function(evt) {
  var btn = evt.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.getAttribute('data-action');
  if (action === 'clear-context') WorkbenchContext.clear();
});

// ── Context delegation ──
// Elements opt into setting workbench context by carrying a JSON object in
// data-set-context. Fragments never ship inline handlers: server data reaches
// the DOM as an attribute value, which is parsed as data and never as code.
document.addEventListener('click', function(evt) {
  var el = evt.target.closest('[data-set-context]');
  if (!el) return;
  var entries;
  try {
    entries = JSON.parse(el.getAttribute('data-set-context'));
  } catch (e) {
    console.warn('[workbench] malformed data-set-context', e);
    return;
  }
  if (!entries || typeof entries !== 'object') return;
  Object.keys(entries).forEach(function(key) {
    WorkbenchContext.set(key, String(entries[key]));
  });
});

// ── Inject X-Context-* headers on every HTMX request ──
document.body.addEventListener('htmx:configRequest', function(evt) {
  var ctx = WorkbenchContext.getAll();
  Object.keys(ctx).forEach(function(key) {
    evt.detail.headers['X-Context-' + key] = ctx[key];
  });
});

// ── Re-initialize Lucide icons after HTMX swaps ──
document.body.addEventListener('htmx:afterSwap', function() {
  initIcons();
});

// ── Edit-in-place affordance ──
// Every portal section carries data-widget, so hovering one can offer to open
// the playground editor for it without a trip to the playground page.
(function() {
  var fab = null;
  var current = null;

  function ensureFab() {
    if (fab) return fab;
    fab = document.createElement('button');
    fab.id = 'pg-edit-fab';
    fab.type = 'button';
    fab.textContent = 'Edit UI';
    fab.addEventListener('click', function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!current) return;
      var w = window.open(
        '/playground/window/' + encodeURIComponent(current),
        'pg-editor-' + current,
        'width=1400,height=900,resizable=yes,scrollbars=yes'
      );
      if (!w) {
        alert('The editor opens in a new window — allow pop-ups for this site.');
        return;
      }
      w.focus();
    });
    // Keep it alive while the pointer is on the button itself.
    fab.addEventListener('mouseenter', function() { fab.style.display = 'inline-flex'; });
    fab.addEventListener('mouseleave', hide);
    document.body.appendChild(fab);
    return fab;
  }

  function hide() {
    if (fab) fab.style.display = 'none';
    current = null;
  }

  document.addEventListener('mouseover', function(evt) {
    var slot = evt.target && evt.target.closest && evt.target.closest('[data-widget]');
    if (!slot) return;
    var name = slot.getAttribute('data-widget');
    if (!name) return;

    var el = ensureFab();
    current = name;
    var r = slot.getBoundingClientRect();
    el.style.top = (window.scrollY + r.top + 6) + 'px';
    el.style.left = (window.scrollX + r.right - 70) + 'px';
    el.style.display = 'inline-flex';
  });

  document.addEventListener('mouseout', function(evt) {
    var slot = evt.target && evt.target.closest && evt.target.closest('[data-widget]');
    if (!slot) return;
    var to = evt.relatedTarget;
    if (to && (to === fab || (fab && fab.contains(to)) || slot.contains(to))) return;
    hide();
  });

  window.addEventListener('scroll', hide, {passive: true});
})();

// ── Editing highlight ──
// The editor runs in its own window, so it announces which section it is
// editing over a BroadcastChannel. Every portal window listens and rings that
// section. A window opened after the editor asks for the current state rather
// than sitting un-highlighted until the next change.
(function() {
  if (typeof BroadcastChannel === 'undefined') return;

  var channel = new BroadcastChannel('pg-editing');
  var editing = {};

  function apply() {
    document.querySelectorAll('[data-widget]').forEach(function(el) {
      var name = el.getAttribute('data-widget');
      el.classList.toggle('pg-editing', editing[name] === true);
    });
  }

  channel.addEventListener('message', function(evt) {
    var msg = evt.data;
    if (!msg) return;

    if (msg.type === 'editing' && msg.widget) {
      if (msg.active) editing[msg.widget] = true;
      else delete editing[msg.widget];
      apply();
      return;
    }

    // An editor window is asking who is listening; portals have nothing to
    // answer, but a portal asking gets answers from the editors.
    if (msg.type === 'announce' && msg.widget) {
      editing[msg.widget] = true;
      apply();
    }
  });

  // Re-apply after every swap: htmx replaces slot elements, and the new ones
  // come back without the class.
  document.body.addEventListener('htmx:afterSwap', apply);

  channel.postMessage({type: 'who-is-editing'});
})();

// ── Live design updates ──
// Sections backed by a Design carry data-design="<name>". The gateway pushes a
// name whenever that Design changes; every mounted copy re-fetches its own
// rendered HTML, so an edit in the playground lands everywhere at once.
(function() {
  if (typeof EventSource === 'undefined') return;

  var source = null;

  /** Re-fetch the current page's layout, the way navigation does. */
  function reloadCurrentPage() {
    var path = window.location.pathname || '/';
    htmx.ajax('GET', path, {target: '#content', swap: 'innerHTML'});
  }

  function connect() {
    source = new EventSource('/events');

    source.addEventListener('design', function(evt) {
      var change;
      try {
        change = JSON.parse(evt.data);
      } catch (err) {
        return;
      }
      if (!change) return;

      // Both ends of a retarget need repainting: the widget the design now
      // renders in, and the one it stopped rendering in.
      var widgets = [change.targetWidget, change.previousTargetWidget]
        .filter(function(w, i, all) { return w && all.indexOf(w) === i; });
      if (widgets.length === 0) return;

      var relayout = false;

      widgets.forEach(function(widget) {
        var slot = document.querySelector('[data-widget="' + widget + '"]');
        // Only a slot already rendering a design can be refreshed in place.
        // One that is merely present still points at its app endpoint, and
        // needs the server to hand back a new layout.
        var alreadyBound = slot && slot.getAttribute('data-design-bound') === '1';
        if (slot && alreadyBound && !change.deleted && widget === change.targetWidget) {
          // Still bound to the same widget: the slot's URL is unchanged, so
          // re-fetching it in place is enough and leaves the rest of the page
          // untouched.
          htmx.trigger(slot, 'refresh');
        } else {
          // Newly bound, unbound, or retargeted — which element the slot should
          // point at has changed, and only the server knows the new layout.
          relayout = true;
        }
      });

      if (relayout) reloadCurrentPage();
    });

    // EventSource retries on its own, but only while the connection was ever
    // established; an error after a clean close leaves it shut, so reconnect
    // explicitly rather than silently losing live updates for the session.
    source.onerror = function() {
      if (source.readyState === EventSource.CLOSED) {
        source = null;
        setTimeout(connect, 3000);
      }
    };
  }

  connect();
})();

// ── Navigation ──
var DEFAULT_PAGE = ${jsLiteral(workbench.spec.defaultPage)};
(function() {
  function highlightNav(cleanPath) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.getAttribute('data-nav') === cleanPath) {
        btn.classList.add('active');
        var titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = btn.textContent.trim();
      }
    });
  }

  function currentCleanPath() {
    var path = window.location.pathname;
    if (path !== '/' && path !== '') return path;
    return null;
  }

  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      highlightNav(btn.getAttribute('data-nav'));
    });
  });

  window.addEventListener('popstate', function() {
    var cleanPath = currentCleanPath() || DEFAULT_PAGE;
    highlightNav(cleanPath);
    htmx.ajax('GET', cleanPath, {target: '#content', swap: 'innerHTML'});
  });

  document.addEventListener('DOMContentLoaded', function() {
    var cleanPath = currentCleanPath() || DEFAULT_PAGE;
    highlightNav(cleanPath);
    htmx.ajax('GET', cleanPath, {target: '#content', swap: 'innerHTML'});
    initIcons();
  });
})();
</script>

</body>
</html>`;
}
