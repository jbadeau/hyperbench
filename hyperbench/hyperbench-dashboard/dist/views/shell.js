function renderSearch(workbench, widgets) {
    const search = workbench.spec.header?.search;
    if (!search?.enabled)
        return "";
    const widget = search.widgetRef ? widgets.get(search.widgetRef) : undefined;
    if (!widget?.spec.server?.endpoint)
        return "";
    const endpoint = widget.spec.server.endpoint;
    const placeholder = widget.spec.title ?? "";
    return `
    <div class="relative" id="header-search">
      <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10"></i>
      <input type="text" id="header-search-input" placeholder="${placeholder}"
             autocomplete="off"
             hx-get="${endpoint}" hx-target="#header-search-results" hx-swap="innerHTML"
             hx-trigger="input changed delay:200ms, focus" hx-params="*"
             name="q"
             class="bg-input border border-border rounded-md py-1.5 pl-8 pr-3 text-foreground text-sm w-72 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition" />
      <div id="header-search-results" class="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border z-50 max-h-80 overflow-y-auto hidden"></div>
    </div>`;
}
function renderHeaderActions(workbench) {
    const header = workbench.spec.header;
    const parts = [];
    if (header?.notifications?.enabled) {
        parts.push(`<button type="button" class="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition" aria-label="Notifications"><i data-lucide="bell" class="w-5 h-5"></i></button>`);
    }
    if (header?.settings?.enabled) {
        parts.push(`<button type="button" class="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition" aria-label="Settings"><i data-lucide="settings" class="w-5 h-5"></i></button>`);
    }
    if (parts.length === 0)
        return "";
    return `<div class="flex items-center gap-1">${parts.join("\n")}</div>`;
}
function renderUserMenu(workbench) {
    const userMenu = workbench.spec.header?.userMenu;
    if (!userMenu?.enabled)
        return "";
    const label = userMenu.label ?? "";
    const initials = label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `
    <div class="border-t border-sidebar-border p-4">
      <div class="flex items-center gap-3 text-sidebar-foreground text-sm">
        <div class="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">${initials}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${label}</div>
        </div>
      </div>
    </div>`;
}
function renderContextBar(workbench, widgets) {
    const ctx = workbench.spec.contextBar;
    if (!ctx?.enabled)
        return "";
    const widget = ctx.widgetRef ? widgets.get(ctx.widgetRef) : undefined;
    if (!widget?.spec.server?.endpoint)
        return "";
    const endpoint = widget.spec.server.endpoint;
    const trigger = widget.spec.server.trigger ?? "load";
    return `
  <div id="context-bar" class="border-b border-border"
       hx-get="${endpoint}"
       hx-trigger="${trigger}"
       hx-swap="innerHTML">
  </div>`;
}
function resolveTargetPath(node, nodeMap) {
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
function renderNavNode(node, nodeMap) {
    const spec = node.spec;
    if (spec.type === "group") {
        return `<div class="text-xs font-medium text-muted-foreground px-3 mb-1.5">${spec.title}</div>`;
    }
    if (spec.type === "page" || spec.type === "alias") {
        const path = resolveTargetPath(node, nodeMap);
        if (!path)
            return "";
        const icon = spec.icon ? `<i data-lucide="${spec.icon}" class="w-4 h-4"></i> ` : "";
        return `
      <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm w-full text-left transition"
              data-nav="${path}"
              hx-get="${path}" hx-target="#content" hx-swap="innerHTML" hx-push-url="${path}">
        ${icon}${spec.title}
      </button>`;
    }
    if (spec.type === "link" && spec.link) {
        const target = spec.link.target ? ` target="${spec.link.target}"` : "";
        const rel = spec.link.target ? ` rel="noopener noreferrer"` : "";
        const icon = spec.icon ? `<i data-lucide="${spec.icon}" class="w-4 h-4"></i> ` : "";
        return `
      <a href="${spec.link.url}"${target}${rel}
         class="flex items-center gap-2 py-1.5 px-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm w-full text-left transition no-underline">
        ${icon}${spec.title}
      </a>`;
    }
    return "";
}
function renderSidebar(navNodes) {
    const nodeMap = new Map();
    for (const n of navNodes) {
        nodeMap.set(n.metadata.name, n);
    }
    const topLevel = navNodes.filter(n => !n.spec.parent);
    const children = new Map();
    for (const n of navNodes) {
        if (n.spec.parent) {
            const list = children.get(n.spec.parent) ?? [];
            list.push(n);
            children.set(n.spec.parent, list);
        }
    }
    const sections = [];
    for (const node of topLevel) {
        const kids = children.get(node.metadata.name) ?? [];
        if (node.spec.type === "group") {
            const groupHtml = renderNavNode(node, nodeMap);
            const childHtml = kids.map(child => renderNavNode(child, nodeMap)).join("\n");
            sections.push(`<div class="px-3 mb-4">${groupHtml}${childHtml}</div>`);
        }
        else {
            const html = renderNavNode(node, nodeMap);
            sections.push(`<div class="px-3 mb-4">${html}</div>`);
        }
    }
    return sections.join("\n");
}
export function htmlShell(workbench, navNodes, widgets) {
    const title = workbench.spec.title;
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>

  <!-- Inter Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS v4 -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
    @theme {
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
      --color-ring: oklch(0.556 0 0);
      --color-sidebar: oklch(0.205 0 0);
      --color-sidebar-foreground: oklch(0.985 0 0);
      --color-sidebar-primary: oklch(0.985 0 0);
      --color-sidebar-primary-foreground: oklch(0.205 0 0);
      --color-sidebar-accent: oklch(0.269 0 0);
      --color-sidebar-accent-foreground: oklch(0.985 0 0);
      --color-sidebar-border: oklch(1 0 0 / 10%);
      --color-sidebar-ring: oklch(0.439 0 0);
    }

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
  </style>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>
</head>
<body class="m-0 bg-sidebar h-screen antialiased">

  <div class="flex h-screen">

    <!-- Sidebar -->
    <aside id="sidebar" class="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-200 ease-linear overflow-hidden">
      <!-- Sidebar Header -->
      <div class="px-4 h-14 flex items-center shrink-0">
        <a href="/" class="text-base font-semibold tracking-tight text-sidebar-foreground no-underline">${title}</a>
      </div>
      <!-- Sidebar Nav -->
      <nav class="flex-1 overflow-y-auto py-2">
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

// ── Navigation ──
var DEFAULT_PAGE = '${workbench.spec.defaultPage}';
(function() {
  function highlightNav(cleanPath) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.getAttribute('data-nav') === cleanPath) {
        btn.classList.add('active');
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
