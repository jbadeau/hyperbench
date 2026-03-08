import express from "express";
import { fetchHalSchemaForms, esc, extractContextHeaders, } from "@hyperbench/shared/lib/fetch.js";
import { renderHalForms, renderSpec } from "@hyperbench/shared/renderer.js";
const CLIENTS_API_URL = process.env.CLIENTS_API_URL || "http://localhost:8083";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ── Client search (header dropdown) ──
app.get("/clients/search", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (!q) {
            const [top, recent] = await Promise.all([
                fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/top`, ctx),
                fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/recent`, ctx),
            ]);
            const topItems = (top.items || []);
            const recentItems = (recent.items || []);
            res.type("html").send(renderSection("Top Clients", topItems) +
                '<hr class="border-border my-1">' +
                renderSection("Recently Viewed", recentItems));
            return;
        }
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/search?q=${encodeURIComponent(q)}`, ctx);
        const items = (resource.items || []);
        if (items.length === 0) {
            res.type("html").send('<div class="px-4 py-3 text-sm text-muted-foreground">No clients found</div>');
            return;
        }
        res.type("html").send(items.map(renderClientRow).join(""));
    }
    catch (err) {
        res.status(502).send(`<p>Error loading search: ${String(err)}</p>`);
    }
});
// ── Context bar ──
app.get("/clients/context", (req, res) => {
    const ctx = extractContextHeaders(req);
    const clientName = ctx["X-Context-Clientname"] || null;
    const clientId = ctx["X-Context-Clientid"] || null;
    if (!clientName || !clientId) {
        res.type("html").send("");
        return;
    }
    const spec = {
        root: "context-bar",
        elements: {
            "context-bar": {
                type: "ContextBar",
                props: { clientName, clientId },
            },
        },
    };
    res.type("html").send(renderSpec(spec));
});
// ── Clients table ──
app.get("/clients/table", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients`, ctx);
        const items = (resource.items || []);
        const rows = items.map(c => {
            const riskBadge = c.riskProfile
                ? `<span class="${riskBadgeClass()}">${formatRiskProfile(c.riskProfile)}</span>`
                : "";
            const accountVal = c.accountValue != null
                ? `CHF ${(c.accountValue / 1_000_000).toFixed(1)}M`
                : "—";
            return `
        <tr class="border-b transition-colors hover:bg-muted/50 cursor-pointer"
            onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
          <td class="p-2 align-middle whitespace-nowrap text-muted-foreground">${esc(c.name)}</td>
          <td class="p-2 align-middle whitespace-nowrap text-muted-foreground">${esc(c.email ?? "")}</td>
          <td class="p-2 align-middle whitespace-nowrap text-muted-foreground">${esc(c.phone ?? "")}</td>
          <td class="p-2 align-middle whitespace-nowrap">${riskBadge}</td>
          <td class="p-2 align-middle whitespace-nowrap text-muted-foreground text-right">${accountVal}</td>
          <td class="p-2 align-middle whitespace-nowrap text-muted-foreground">${esc(c.lastActivityDate ?? "")}</td>
        </tr>`;
        }).join("");
        res.type("html").send(`
      <div class="flex items-end justify-between mb-5">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Clients</h1>
          <p class="text-sm text-muted-foreground mt-0.5">All clients and their portfolios</p>
        </div>
      </div>
      <div class="relative w-full overflow-x-auto rounded-xl border border-border">
        <table class="w-full caption-bottom text-sm">
          <thead class="[&_tr]:border-b">
            <tr class="border-b transition-colors hover:bg-muted/50">
              <th class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">Name</th>
              <th class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">Email</th>
              <th class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">Phone</th>
              <th class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">Risk Profile</th>
              <th class="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">Account Value</th>
              <th class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">Last Activity</th>
            </tr>
          </thead>
          <tbody class="[&_tr:last-child]:border-0">
            ${rows || '<tr><td colspan="6" class="p-2 text-center text-muted-foreground h-24">No clients found</td></tr>'}
          </tbody>
        </table>
      </div>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading clients table: ${String(err)}</p>`);
    }
});
// ── Dashboard widgets ──
app.get("/clients/quick-actions", (_req, res) => {
    res.type("html").send(`
    <div class="rounded-xl border border-border bg-card shadow-xs">
      <div class="px-4 py-3 border-b border-border font-semibold text-sm text-card-foreground">Quick Actions</div>
      <div class="p-4 flex flex-col gap-2">
        <button class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
                hx-get="/onboarding/step1" hx-target="#content" hx-swap="innerHTML">
          <i data-lucide="plus" class="w-4 h-4"></i> New Client KYC
        </button>
        <button class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
                hx-get="/todos/add" hx-target="#content" hx-swap="innerHTML">
          <i data-lucide="user-plus" class="w-4 h-4"></i> Log Interaction
        </button>
        <button class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
                hx-get="/todos/add" hx-target="#content" hx-swap="innerHTML">
          <i data-lucide="calendar" class="w-4 h-4"></i> Schedule Review
        </button>
      </div>
    </div>`);
});
app.get("/clients/favorites", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/top`, ctx);
        const items = (resource.items || []);
        if (req.query.view === "full") {
            res.type("html").send(`
        <div class="flex items-end justify-between mb-5">
          <div>
            <h1 class="text-2xl font-semibold text-foreground">My Client Book</h1>
            <p class="text-sm text-muted-foreground mt-0.5">Your assigned clients and their portfolios</p>
          </div>
          <div class="flex gap-2">
            <button class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
                    hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
              Back
            </button>
          </div>
        </div>
        <div class="rounded-xl border border-border bg-card shadow-xs p-4">
          ${renderClientCards(items)}
        </div>`);
            return;
        }
        res.type("html").send(`
      <div class="rounded-xl border border-border bg-card shadow-xs">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between font-semibold text-sm text-card-foreground">
          My Client Book
          <button class="text-sm text-muted-foreground hover:text-foreground transition"
                  hx-get="/clients/favorites?view=full" hx-target="#content" hx-swap="innerHTML">
            View all
          </button>
        </div>
        <div class="p-4">
          ${renderClientCards(items.slice(0, 4))}
        </div>
      </div>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading favorites: ${String(err)}</p>`);
    }
});
app.get("/clients/recent", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/recent`, ctx);
        const items = (resource.items || []);
        if (req.query.view === "full") {
            res.type("html").send(`
        <div class="flex items-end justify-between mb-5">
          <div>
            <h1 class="text-2xl font-semibold text-foreground">Recent Activity</h1>
            <p class="text-sm text-muted-foreground mt-0.5">Latest client interactions and updates</p>
          </div>
          <div class="flex gap-2">
            <button class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
                    hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
              Back
            </button>
          </div>
        </div>
        <div class="rounded-xl border border-border bg-card shadow-xs p-4">
          ${renderClientCards(items)}
        </div>`);
            return;
        }
        res.type("html").send(`
      <div class="rounded-xl border border-border bg-card shadow-xs">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between font-semibold text-sm text-card-foreground">
          Recent Activity
          <button class="text-sm text-muted-foreground hover:text-foreground transition"
                  hx-get="/clients/recent?view=full" hx-target="#content" hx-swap="innerHTML">
            View all
          </button>
        </div>
        <div class="p-4">
          ${renderClientCards(items.slice(0, 5))}
        </div>
      </div>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading recent: ${String(err)}</p>`);
    }
});
// ── Form views ──
app.get("/clients/add", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/form`, ctx);
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
    }
});
app.get("/clients/:id/edit", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/${req.params.id}/form`, ctx);
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
    }
});
// ── Helpers ──
function formatRiskProfile(riskProfile) {
    return riskProfile.charAt(0) + riskProfile.slice(1).toLowerCase();
}
function riskBadgeClass() {
    return "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground";
}
function renderClientRow(c) {
    return `
    <div class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-accent transition rounded-lg"
         onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
      <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">${esc(c.initials)}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-foreground truncate">${esc(c.name)}</div>
        <div class="text-xs text-muted-foreground">${esc(c.detail)}</div>
      </div>
    </div>`;
}
function renderSection(title, clients) {
    return `
    <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground px-4 pt-3 pb-1">${esc(title)}</div>
    ${clients.map(renderClientRow).join("")}`;
}
function renderClientCards(clients) {
    if (clients.length === 0) {
        return '<p class="text-center py-8 text-muted-foreground text-sm">No clients found</p>';
    }
    return clients
        .map((c) => `
      <div class="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent transition rounded-lg px-1"
           onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
        <div class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">${esc(c.initials)}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-foreground truncate">${esc(c.name)}</div>
          <div class="text-xs text-muted-foreground">${esc(c.detail)}</div>
        </div>
      </div>`)
        .join("");
}
const PORT = parseInt(process.env.PORT || "3002", 10);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clients service listening on http://0.0.0.0:${PORT}`);
});
