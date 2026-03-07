function renderSearch(workbench, widgets) {
    const search = workbench.spec.header?.search;
    if (!search?.enabled)
        return "";
    const widget = search.widgetRef ? widgets.get(search.widgetRef) : undefined;
    const endpoint = widget?.spec.server?.endpoint ?? "/clients/search";
    return `
    <div class="relative mx-8" id="client-search">
      <sl-icon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none z-10"></sl-icon>
      <input type="text" id="client-search-input" placeholder="Search clients..."
             autocomplete="off"
             hx-get="${endpoint}" hx-target="#client-search-results" hx-swap="innerHTML"
             hx-trigger="input changed delay:200ms, focus" hx-params="*"
             name="q"
             class="bg-white/10 border border-white/15 rounded-md py-1.5 pl-8 pr-3 text-white text-sm w-72 outline-none placeholder:text-slate-500 focus:bg-white/15 focus:border-white/30 transition" />
      <div id="client-search-results" class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto hidden"></div>
    </div>`;
}
function renderHeaderActions(workbench) {
    const header = workbench.spec.header;
    const parts = [];
    if (header?.notifications?.enabled) {
        parts.push(`<sl-icon-button name="bell" label="Notifications" class="text-slate-400 text-lg hover:text-white relative"></sl-icon-button>`);
    }
    if (header?.settings?.enabled) {
        parts.push(`<sl-icon-button name="gear" label="Settings" class="text-slate-400 text-lg hover:text-white"></sl-icon-button>`);
    }
    if (parts.length === 0)
        return "";
    return `<div class="flex items-center gap-4">${parts.join("\n")}</div>`;
}
function renderUserMenu(workbench) {
    const userMenu = workbench.spec.header?.userMenu;
    if (!userMenu?.enabled)
        return "";
    const label = userMenu.label ?? "User";
    const initials = label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `
    <div class="flex items-center gap-2 text-slate-300 text-sm ml-4">
      <sl-avatar initials="${initials}" style="--size: 2rem;"></sl-avatar>
      <span>${label}</span>
    </div>`;
}
function renderContextBar(workbench, widgets) {
    const ctx = workbench.spec.contextBar;
    if (!ctx?.enabled)
        return "";
    const widget = ctx.widgetRef ? widgets.get(ctx.widgetRef) : undefined;
    const endpoint = widget?.spec.server?.endpoint ?? "/clients/context";
    const trigger = widget?.spec.server?.trigger ?? "load, workbench:context from:body";
    return `
  <div id="context-bar"
       hx-get="${endpoint}"
       hx-trigger="${trigger}"
       hx-swap="innerHTML">
  </div>`;
}
function renderNavNode(node) {
    const spec = node.spec;
    if (spec.type === "group") {
        return `<div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">${spec.title}</div>`;
    }
    if (spec.type === "page" && spec.page) {
        const path = spec.page.path;
        const icon = spec.icon ? `<sl-icon name="${spec.icon}"></sl-icon> ` : "";
        return `
      <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
              data-nav="${path}"
              hx-get="${path}" hx-target="#content" hx-swap="innerHTML" hx-push-url="${path}">
        ${icon}${spec.title}
      </button>`;
    }
    if (spec.type === "link" && spec.link) {
        const target = spec.link.target ? ` target="${spec.link.target}"` : "";
        const icon = spec.icon ? `<sl-icon name="${spec.icon}"></sl-icon> ` : "";
        return `
      <a href="${spec.link.url}"${target}
         class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition no-underline">
        ${icon}${spec.title}
      </a>`;
    }
    return "";
}
function renderSidebar(navNodes) {
    // Group nodes by parent
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
            const groupHtml = renderNavNode(node);
            const childHtml = kids.map(renderNavNode).join("\n");
            sections.push(`<div class="px-3 mb-5">${groupHtml}${childHtml}</div>`);
        }
        else {
            // Top-level page/link without a group
            const html = renderNavNode(node);
            sections.push(`<div class="px-3 mb-5">${html}</div>`);
        }
    }
    return sections.join("\n");
}
export function htmlShell(workbench, navNodes, widgets) {
    const title = workbench.spec.title;
    const headerBg = workbench.spec.theme?.headerBg ?? "#1e293b";
    const primary = workbench.spec.theme?.primary ?? "#1e40af";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>

  <!-- Shoelace -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/light.css" />
  <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/shoelace-autoloader.js"></script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>

  <style>
    :root {
      --wb-primary: ${primary};
      --wb-header-bg: ${headerBg};
    }
    body { height: 100vh; }
    .dash-grid > div { overflow: hidden; }
    .dash-grid > div > sl-card { display: block; height: 100%; }
    .dash-grid > div > sl-card::part(base) { height: 100%; display: flex; flex-direction: column; }
    .dash-grid > div > sl-card::part(body) { flex: 1; overflow: auto; }
  </style>
</head>
<body class="m-0 font-sans text-slate-900 bg-slate-100 h-screen flex flex-col">

  <!-- Top Navigation -->
  <nav style="background-color: var(--wb-header-bg);" class="text-white flex items-center px-6 h-14 shrink-0">
    <a href="/" class="text-xl font-bold tracking-tight text-white no-underline">${title}</a>
    ${renderSearch(workbench, widgets)}
    <div class="flex-1"></div>
    ${renderHeaderActions(workbench)}
    ${renderUserMenu(workbench)}
  </nav>

  <!-- Context Bar -->
  ${renderContextBar(workbench, widgets)}

  <div class="flex flex-1 overflow-hidden">

    <!-- Left Sidebar -->
    <aside class="w-56 bg-white border-r border-slate-200 py-4 shrink-0 overflow-y-auto flex flex-col">
      ${renderSidebar(navNodes)}
    </aside>

    <!-- Content Area -->
    <main class="flex-1 overflow-y-auto p-6" id="content">
    </main>

  </div>

<script>
// ── WorkbenchContext ──
var WorkbenchContext = (function() {
  var STORAGE_KEY = 'advisoryhub-context';

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

// ── Client search dropdown ──
(function() {
  var input = document.getElementById('client-search-input');
  var results = document.getElementById('client-search-results');
  if (!input || !results) return;

  document.body.addEventListener('htmx:afterSwap', function(evt) {
    if (evt.detail.target === results) {
      results.classList.toggle('hidden', results.innerHTML.trim() === '');
    }
  });

  document.addEventListener('click', function(evt) {
    if (!evt.target.closest('#client-search')) {
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

// ── Inject X-Context-* headers on every HTMX request ──
document.body.addEventListener('htmx:configRequest', function(evt) {
  var ctx = WorkbenchContext.getAll();
  Object.keys(ctx).forEach(function(key) {
    evt.detail.headers['X-Context-' + key] = ctx[key];
  });
});

// ── Navigation ──
(function() {
  function highlightNav(cleanPath) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.remove('text-blue-600', 'bg-blue-50', 'font-medium');
      btn.classList.add('text-slate-600');
      if (btn.getAttribute('data-nav') === cleanPath) {
        btn.classList.remove('text-slate-600');
        btn.classList.add('text-blue-600', 'bg-blue-50', 'font-medium');
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
    var cleanPath = currentCleanPath();
    if (cleanPath) {
      highlightNav(cleanPath);
      htmx.ajax('GET', cleanPath, {target: '#content', swap: 'innerHTML'});
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    var cleanPath = currentCleanPath();
    if (cleanPath) {
      highlightNav(cleanPath);
      htmx.ajax('GET', cleanPath, {target: '#content', swap: 'innerHTML'});
    }
  });
})();
</script>

</body>
</html>`;
}
