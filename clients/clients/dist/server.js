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
                '<hr class="border-slate-100 my-1">' +
                renderSection("Recently Viewed", recentItems));
            return;
        }
        const resource = await fetchHalSchemaForms(`${CLIENTS_API_URL}/ui/clients/search?q=${encodeURIComponent(q)}`, ctx);
        const items = (resource.items || []);
        if (items.length === 0) {
            res.type("html").send('<div class="px-4 py-3 text-sm text-slate-400">No clients found</div>');
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
                ? `<sl-badge variant="${riskVariant(c.riskProfile)}">${formatRiskProfile(c.riskProfile)}</sl-badge>`
                : "";
            const accountVal = c.accountValue != null
                ? `CHF ${(c.accountValue / 1_000_000).toFixed(1)}M`
                : "—";
            return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
            onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <sl-avatar initials="${esc(c.initials)}" style="--size: 2rem;" class="[--sl-color-neutral-400:${c.color}]"></sl-avatar>
              <span class="font-medium text-slate-800">${esc(c.name)}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-600">${esc(c.email ?? "")}</td>
          <td class="py-3 px-4 text-slate-600">${esc(c.phone ?? "")}</td>
          <td class="py-3 px-4">${riskBadge}</td>
          <td class="py-3 px-4 text-slate-600 text-right">${accountVal}</td>
          <td class="py-3 px-4 text-slate-500 text-sm">${esc(c.lastActivityDate ?? "")}</td>
        </tr>`;
        }).join("");
        res.type("html").send(`
      <div class="flex items-end justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Clients</h1>
          <p class="text-sm text-slate-500 mt-0.5">All clients and their portfolios</p>
        </div>
      </div>
      <sl-card>
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
              <th class="py-3 px-4 font-semibold">Name</th>
              <th class="py-3 px-4 font-semibold">Email</th>
              <th class="py-3 px-4 font-semibold">Phone</th>
              <th class="py-3 px-4 font-semibold">Risk Profile</th>
              <th class="py-3 px-4 font-semibold text-right">Account Value</th>
              <th class="py-3 px-4 font-semibold">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="py-8 text-center text-slate-400">No clients found</td></tr>'}
          </tbody>
        </table>
      </sl-card>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading clients table: ${String(err)}</p>`);
    }
});
// ── Dashboard widgets ──
app.get("/clients/quick-actions", (_req, res) => {
    res.type("html").send(`
    <sl-card>
      <div slot="header" class="font-semibold text-sm text-slate-700">Quick Actions</div>
      <div class="flex flex-col gap-2">
        <sl-button variant="primary" class="w-full"
                hx-get="/onboarding/step1" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="plus-lg"></sl-icon> New Client KYC
        </sl-button>
        <sl-button variant="default" class="w-full"
                hx-get="/todos/add" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="person-plus"></sl-icon> Log Interaction
        </sl-button>
        <sl-button variant="default" class="w-full"
                hx-get="/todos/add" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="calendar-event"></sl-icon> Schedule Review
        </sl-button>
      </div>
    </sl-card>`);
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
            <h1 class="text-2xl font-bold text-slate-800">My Client Book</h1>
            <p class="text-sm text-slate-500 mt-0.5">Your assigned clients and their portfolios</p>
          </div>
          <div class="flex gap-2">
            <sl-button variant="default"
                    hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
              Back
            </sl-button>
          </div>
        </div>
        <sl-card>
          ${renderClientCards(items)}
        </sl-card>`);
            return;
        }
        res.type("html").send(`
      <sl-card>
        <div slot="header" class="flex items-center justify-between font-semibold text-sm text-slate-700">
          My Client Book
          <sl-button size="small" variant="text"
                  hx-get="/clients/favorites?view=full" hx-target="#content" hx-swap="innerHTML">
            View all
          </sl-button>
        </div>
        ${renderClientCards(items.slice(0, 4))}
      </sl-card>`);
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
            <h1 class="text-2xl font-bold text-slate-800">Recent Activity</h1>
            <p class="text-sm text-slate-500 mt-0.5">Latest client interactions and updates</p>
          </div>
          <div class="flex gap-2">
            <sl-button variant="default"
                    hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
              Back
            </sl-button>
          </div>
        </div>
        <sl-card>
          ${renderClientCards(items)}
        </sl-card>`);
            return;
        }
        res.type("html").send(`
      <sl-card>
        <div slot="header" class="flex items-center justify-between font-semibold text-sm text-slate-700">
          Recent Activity
          <sl-button size="small" variant="text"
                  hx-get="/clients/recent?view=full" hx-target="#content" hx-swap="innerHTML">
            View all
          </sl-button>
        </div>
        ${renderClientCards(items.slice(0, 5))}
      </sl-card>`);
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
function riskVariant(riskProfile) {
    switch (riskProfile) {
        case "CONSERVATIVE": return "neutral";
        case "BALANCED": return "primary";
        case "GROWTH": return "success";
        case "AGGRESSIVE": return "danger";
        default: return "neutral";
    }
}
function renderClientRow(c) {
    return `
    <div class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 transition"
         onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
      <sl-avatar initials="${esc(c.initials)}" style="--size: 2rem;" class="[--sl-color-neutral-400:${c.color}]"></sl-avatar>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-slate-800 truncate">${esc(c.name)}</div>
        <div class="text-xs text-slate-400">${esc(c.detail)}</div>
      </div>
    </div>`;
}
function renderSection(title, clients) {
    return `
    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-4 pt-3 pb-1">${esc(title)}</div>
    ${clients.map(renderClientRow).join("")}`;
}
function renderClientCards(clients) {
    if (clients.length === 0) {
        return '<p class="text-center py-8 text-slate-400 text-sm">No clients found</p>';
    }
    return clients
        .map((c) => `
      <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0 cursor-pointer hover:bg-slate-50 transition"
           onclick="WorkbenchContext.set('ClientId','${c.id}'); WorkbenchContext.set('ClientName','${esc(c.name)}')">
        <sl-avatar initials="${esc(c.initials)}" style="--size: 2.25rem;" class="[--sl-color-neutral-400:${c.color}]"></sl-avatar>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-800 truncate">${esc(c.name)}</div>
          <div class="text-xs text-slate-400">${esc(c.detail)}</div>
        </div>
      </div>`)
        .join("");
}
const PORT = parseInt(process.env.PORT || "3002", 10);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clients service listening on http://0.0.0.0:${PORT}`);
});
