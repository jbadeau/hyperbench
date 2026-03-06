export function htmlShell(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AdvisoryHub</title>

  <!-- Shoelace -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/light.css" />
  <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/shoelace-autoloader.js"></script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>

  <style>
    body { height: 100vh; }
    .dash-grid > div { overflow: hidden; }
    .dash-grid > div > sl-card { display: block; height: 100%; }
    .dash-grid > div > sl-card::part(base) { height: 100%; display: flex; flex-direction: column; }
    .dash-grid > div > sl-card::part(body) { flex: 1; overflow: auto; }
  </style>
</head>
<body class="m-0 font-sans text-slate-900 bg-slate-100 h-screen flex flex-col">

  <!-- Top Navigation -->
  <nav class="bg-slate-800 text-white flex items-center px-6 h-14 shrink-0">
    <a href="/" class="text-xl font-bold tracking-tight text-white no-underline">AdvisoryHub</a>
    <div class="relative mx-8">
      <sl-icon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none"></sl-icon>
      <input type="text" placeholder="Search clients, actions..."
             class="bg-white/10 border border-white/15 rounded-md py-1.5 pl-8 pr-3 text-white text-sm w-64 outline-none placeholder:text-slate-500 focus:bg-white/15 focus:border-white/30 transition" />
    </div>
    <div class="flex-1"></div>
    <div class="flex items-center gap-4">
      <sl-icon-button name="bell" label="Notifications" class="text-slate-400 text-lg hover:text-white relative">
      </sl-icon-button>
      <sl-icon-button name="gear" label="Settings" class="text-slate-400 text-lg hover:text-white">
      </sl-icon-button>
    </div>
    <div class="flex items-center gap-2 text-slate-300 text-sm ml-4">
      <sl-avatar initials="JD" class="--size: 32px;" style="--size: 2rem;"></sl-avatar>
      <span>John Doe</span>
    </div>
  </nav>

  <div class="flex flex-1 overflow-hidden">

    <!-- Left Sidebar -->
    <aside class="w-56 bg-white border-r border-slate-200 py-4 shrink-0 overflow-y-auto flex flex-col">
      <div class="px-3 mb-5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">Overview</div>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/dashboard"
                hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="grid-3x3-gap"></sl-icon> Dashboard
        </button>
      </div>
      <div class="px-3 mb-5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">Clients</div>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/clients/favorites?view=full"
                hx-get="/fragments/clients/favorites?view=full" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="journal-text"></sl-icon> My Book
        </button>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/clients/recent?view=full"
                hx-get="/fragments/clients/recent?view=full" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="clock-history"></sl-icon> Recent
        </button>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/onboarding/step1"
                hx-get="/fragments/onboarding/step1" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="person-plus"></sl-icon> New Client KYC
        </button>
      </div>
      <div class="px-3 mb-5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">Actions</div>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/todos/list"
                hx-get="/fragments/todos/list" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="check2-square"></sl-icon> My Tasks
          <sl-badge variant="neutral" pill class="ml-auto" id="todo-count">-</sl-badge>
        </button>
        <button class="nav-btn flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm w-full text-left transition"
                data-nav="/fragments/todos/list"
                hx-get="/fragments/todos/list" hx-target="#content" hx-swap="innerHTML">
          <sl-icon name="file-earmark-text"></sl-icon> Pending Reviews
        </button>
      </div>
      <div class="px-3 mb-5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">Advisory</div>
        <button class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-400 text-sm w-full text-left cursor-not-allowed" disabled>
          <sl-icon name="box"></sl-icon> Products
        </button>
        <button class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-400 text-sm w-full text-left cursor-not-allowed" disabled>
          <sl-icon name="graph-up"></sl-icon> Market View
        </button>
      </div>
      <div class="px-3 mb-5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 mb-1.5">Compliance</div>
        <button class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-400 text-sm w-full text-left cursor-not-allowed" disabled>
          <sl-icon name="search"></sl-icon> KYC Center
        </button>
        <button class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-400 text-sm w-full text-left cursor-not-allowed" disabled>
          <sl-icon name="file-earmark-bar-graph"></sl-icon> Reports
        </button>
      </div>
      <div class="mt-auto pt-3 px-3 border-t border-slate-100">
        <button class="flex items-center gap-2 py-1.5 px-3 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 text-sm w-full text-left transition">
          <sl-icon name="question-circle"></sl-icon> Help &amp; Support
        </button>
      </div>
    </aside>

    <!-- Content Area -->
    <main class="flex-1 overflow-y-auto p-6" id="content">
    </main>

  </div>

<script>
(function() {
  var STORAGE_KEY = 'advisoryhub-nav';
  var ACTIVE_CLASS = 'text-blue-600 bg-blue-50 font-medium';
  var INACTIVE_CLASS = 'text-slate-600';

  function highlightNav(url) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.remove('text-blue-600', 'bg-blue-50', 'font-medium');
      btn.classList.add('text-slate-600');
      if (btn.getAttribute('data-nav') === url) {
        btn.classList.remove('text-slate-600');
        btn.classList.add('text-blue-600', 'bg-blue-50', 'font-medium');
      }
    });
  }

  // On sidebar click — persist and highlight
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var url = btn.getAttribute('data-nav');
      if (url) {
        localStorage.setItem(STORAGE_KEY, url);
        highlightNav(url);
      }
    });
  });

  // On page load — restore saved nav or default to dashboard
  document.addEventListener('DOMContentLoaded', function() {
    var saved = localStorage.getItem(STORAGE_KEY) || '/fragments/dashboard';
    highlightNav(saved);
    htmx.ajax('GET', saved, {target: '#content', swap: 'innerHTML'});
  });
})();
</script>

</body>
</html>`;
}
