import express from "express";
import { fetchHalSchemaForms, esc, } from "@hyperbench/shared/lib/fetch.js";
import { renderHalForms } from "@hyperbench/shared/renderer.js";
const TODOS_API_URL = process.env.TODOS_API_URL || "http://localhost:8081";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/fragments/todos/greeting", async (_req, res) => {
    try {
        const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`);
        const rows = (resource.items || []);
        const open = rows.filter((r) => r.status === "OPEN");
        const inProgress = rows.filter((r) => r.status === "IN_PROGRESS");
        const overdue = rows.filter((r) => r.status === "OVERDUE");
        const completed = rows.filter((r) => r.status === "COMPLETED");
        res.type("html").send(`
      <sl-card class="[--border-color:transparent]" style="--border-color: transparent;">
        <div slot="header" class="bg-gradient-to-br from-blue-800 to-blue-500 text-white px-6 py-5 -m-[var(--padding)] rounded-t-lg">
          <div class="text-xl font-bold">Today's Agenda</div>
          <div class="text-sm text-white/80 mt-1">You have ${open.length} open items and ${inProgress.length} in progress</div>
          <div class="flex gap-8 mt-5">
            <div>
              <div class="text-2xl font-bold leading-none">${open.length}</div>
              <div class="text-xs text-white/70 mt-0.5">Open</div>
            </div>
            <div>
              <div class="text-2xl font-bold leading-none">${inProgress.length}</div>
              <div class="text-xs text-white/70 mt-0.5">In Progress</div>
            </div>
            <div>
              <div class="text-2xl font-bold leading-none">${overdue.length}</div>
              <div class="text-xs text-white/70 mt-0.5">Overdue</div>
            </div>
            <div>
              <div class="text-2xl font-bold leading-none">${completed.length}</div>
              <div class="text-xs text-white/70 mt-0.5">Completed</div>
            </div>
          </div>
        </div>
      </sl-card>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading greeting: ${String(err)}</p>`);
    }
});
app.get("/fragments/todos/summary", async (_req, res) => {
    try {
        const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`);
        const rows = (resource.items || []);
        res.type("html").send(`
      <sl-card>
        <div slot="header" class="flex items-center justify-between font-semibold text-sm text-slate-700">
          Action Items
          <sl-button size="small" variant="text"
                  hx-get="/fragments/todos/list" hx-target="#content" hx-swap="innerHTML">
            View all
          </sl-button>
        </div>
        <div id="todo-widget-body">
          ${renderTodoItems(rows)}
        </div>
      </sl-card>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading todo summary: ${String(err)}</p>`);
    }
});
app.get("/fragments/todos/deadlines", (_req, res) => {
    res.type("html").send(`
    <sl-card>
      <div slot="header" class="font-semibold text-sm text-slate-700">Alerts & Tasks</div>
      ${renderDeadlines()}
    </sl-card>`);
});
// ── Full-page views ──
app.get("/fragments/todos/list", async (_req, res) => {
    try {
        const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`);
        const rows = (resource.items || []);
        res.type("html").send(`
      <div class="flex items-end justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">My Action Items</h1>
          <p class="text-sm text-slate-500 mt-0.5">${rows.length} action items</p>
        </div>
        <div class="flex gap-2">
          <sl-button variant="primary"
                  hx-get="/fragments/todos/add" hx-target="#todo-full-body" hx-swap="beforebegin">
            <sl-icon slot="prefix" name="plus-lg"></sl-icon> New Action Item
          </sl-button>
          <sl-button variant="default"
                  hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
            Back
          </sl-button>
        </div>
      </div>
      <sl-card>
        <div id="todo-full-body">
          ${renderTodoItems(rows)}
        </div>
      </sl-card>`);
    }
    catch (err) {
        res.status(502).send(`<p>Error loading todos: ${String(err)}</p>`);
    }
});
app.get("/fragments/todos/add", async (_req, res) => {
    try {
        const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks/form`);
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
    }
});
app.get("/fragments/todos/:id/edit", async (req, res) => {
    try {
        const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks/${req.params.id}/form`);
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
    }
});
// ── Helpers ──
function renderTodoItems(rows) {
    if (rows.length === 0) {
        return '<p class="text-center py-8 text-slate-400 text-sm">No action items. All caught up!</p>';
    }
    return rows
        .map((r) => {
        const isDone = r.status === "COMPLETED";
        const badgeVariant = r.status === "OPEN"
            ? "warning"
            : r.status === "IN_PROGRESS"
                ? "primary"
                : r.status === "OVERDUE"
                    ? "danger"
                    : "success";
        return `
        <div class="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-b-0 text-sm text-slate-700">
          <sl-checkbox ${isDone ? "checked" : ""} disabled></sl-checkbox>
          <span class="${isDone ? "line-through text-slate-400" : ""} flex-1">${esc(r.title)}</span>
          <sl-badge variant="${badgeVariant}">${r.status}</sl-badge>
          <span class="text-xs text-slate-400 shrink-0">${r.dueDate || ''}</span>
        </div>`;
    })
        .join("");
}
function renderDeadlines() {
    const deadlines = [
        { label: "KYC expiring: Chen Wei", time: "5 days", urgent: true },
        { label: "KYC expiring: Sarah Mitchell", time: "12 days", urgent: true },
        { label: "Suitability review: James K.", time: "Mar 15", urgent: true },
        { label: "Birthday: Maria Santos", time: "Mar 10", urgent: false },
        { label: "Portfolio rebalance needed", time: "Mar 12", urgent: false },
    ];
    return deadlines
        .map((d) => `
      <div class="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-b-0 text-sm">
        <sl-icon name="${d.urgent ? "exclamation-triangle" : "calendar-event"}" class="${d.urgent ? "text-red-500" : "text-slate-400"}"></sl-icon>
        <span class="flex-1 ${d.urgent ? "text-red-600 font-medium" : "text-slate-700"}">${d.label}</span>
        <span class="text-xs text-slate-400 shrink-0">${d.time}</span>
      </div>`)
        .join("");
}
const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, () => {
    console.log(`Todos service listening on http://localhost:${PORT}`);
});
