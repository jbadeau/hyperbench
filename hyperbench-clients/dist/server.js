import express from "express";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ── Dashboard widgets ──
app.get("/fragments/clients/quick-actions", (_req, res) => {
    res.type("html").send(`
    <sl-card>
      <div slot="header" class="font-semibold text-sm text-slate-700">Quick Actions</div>
      <div class="flex flex-col gap-2">
        <sl-button variant="primary" class="w-full"
                hx-get="/fragments/onboarding/step1" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="plus-lg"></sl-icon> New Client KYC
        </sl-button>
        <sl-button variant="default" class="w-full"
                hx-get="/fragments/todos/add" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="person-plus"></sl-icon> Log Interaction
        </sl-button>
        <sl-button variant="default" class="w-full"
                hx-get="/fragments/todos/add" hx-target="#content" hx-swap="innerHTML">
          <sl-icon slot="prefix" name="calendar-event"></sl-icon> Schedule Review
        </sl-button>
      </div>
    </sl-card>`);
});
app.get("/fragments/clients/favorites", (req, res) => {
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
        ${renderFavoriteClients()}
      </sl-card>`);
        return;
    }
    res.type("html").send(`
    <sl-card>
      <div slot="header" class="flex items-center justify-between font-semibold text-sm text-slate-700">
        My Client Book
        <sl-button size="small" variant="text"
                hx-get="/fragments/clients/favorites?view=full" hx-target="#content" hx-swap="innerHTML">
          View all
        </sl-button>
      </div>
      ${renderFavoriteClients()}
    </sl-card>`);
});
app.get("/fragments/clients/recent", (req, res) => {
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
        ${renderRecentClients()}
      </sl-card>`);
        return;
    }
    res.type("html").send(`
    <sl-card>
      <div slot="header" class="flex items-center justify-between font-semibold text-sm text-slate-700">
        Recent Activity
        <sl-button size="small" variant="text"
                hx-get="/fragments/clients/recent?view=full" hx-target="#content" hx-swap="innerHTML">
          View all
        </sl-button>
      </div>
      ${renderRecentClients()}
    </sl-card>`);
});
// ── Helpers ──
function renderFavoriteClients() {
    const favorites = [
        { initials: "CW", name: "Chen Wei", detail: "CHF 12.4M AUM · Growth", color: "#2563eb" },
        { initials: "SM", name: "Sarah Mitchell", detail: "CHF 8.2M AUM · Balanced", color: "#7c3aed" },
        { initials: "JK", name: "James Kowalski", detail: "CHF 5.1M AUM · Conservative", color: "#059669" },
        { initials: "MS", name: "Maria Santos", detail: "CHF 3.8M AUM · Aggressive", color: "#d97706" },
    ];
    return `
      <div class="text-xs text-slate-400 mb-2">32 clients · CHF 847M AUM</div>` +
        favorites
            .map((c) => `
      <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0">
        <sl-avatar initials="${c.initials}" style="--size: 2.25rem;" class="[--sl-color-neutral-400:${c.color}]"></sl-avatar>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-800 truncate">${c.name}</div>
          <div class="text-xs text-slate-400">${c.detail}</div>
        </div>
      </div>`)
            .join("");
}
function renderRecentClients() {
    const recents = [
        { initials: "CW", name: "Chen Wei", detail: "Note added — Portfolio review", time: "Today", color: "#2563eb" },
        { initials: "SM", name: "Sarah Mitchell", detail: "KYC verification completed", time: "Yesterday", color: "#7c3aed" },
        { initials: "JK", name: "James Kowalski", detail: "Portfolio rebalanced", time: "2 days ago", color: "#059669" },
        { initials: "MS", name: "Maria Santos", detail: "Risk profile updated", time: "3 days ago", color: "#d97706" },
        { initials: "LP", name: "Li Peng", detail: "New account opened", time: "Last week", color: "#0891b2" },
    ];
    return recents
        .map((c) => `
      <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0">
        <sl-avatar initials="${c.initials}" style="--size: 2.25rem;" class="[--sl-color-neutral-400:${c.color}]"></sl-avatar>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-800 truncate">${c.name}</div>
          <div class="text-xs text-slate-400">${c.detail}</div>
        </div>
        <span class="text-xs text-slate-400 shrink-0">${c.time}</span>
      </div>`)
        .join("");
}
const PORT = parseInt(process.env.PORT || "3002", 10);
app.listen(PORT, () => {
    console.log(`Clients service listening on http://localhost:${PORT}`);
});
