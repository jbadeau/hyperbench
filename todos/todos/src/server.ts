import express from "express";
import {
  fetchHalSchemaForms,
  esc,
  extractContextHeaders,
} from "@hyperbench/shared/lib/fetch.js";
import { renderHalForms } from "@hyperbench/shared/renderer.js";
import type { HalSchemaFormsResource } from "@hyperbench/shared/hal-schema-forms.js";

const TODOS_API_URL = process.env.TODOS_API_URL || "http://localhost:8081";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Dashboard widgets ──

interface TaskItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  clientName: string;
  dueDate: string;
  assignedTo: string;
  editUrl?: string;
  deleteUrl?: string;
}

app.get("/fragments/todos/greeting", async (req, res) => {
  try {
    const ctx = extractContextHeaders(req);
    const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`, ctx);
    const rows = (resource.items || []) as unknown as TaskItem[];
    const open = rows.filter((r) => r.status === "OPEN");
    const inProgress = rows.filter((r) => r.status === "IN_PROGRESS");
    const overdue = rows.filter((r) => r.status === "OVERDUE");
    const completed = rows.filter((r) => r.status === "COMPLETED");

    res.type("html").send(`
      <div class="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div class="px-6 py-5">
          <div class="text-lg font-semibold text-foreground">Today's Agenda</div>
          <div class="text-sm text-muted-foreground mt-1">You have ${open.length} open items and ${inProgress.length} in progress</div>
          <div class="flex gap-8 mt-5">
            <div>
              <div class="text-2xl font-semibold tabular-nums text-foreground">${open.length}</div>
              <div class="text-xs text-muted-foreground mt-0.5">Open</div>
            </div>
            <div>
              <div class="text-2xl font-semibold tabular-nums text-foreground">${inProgress.length}</div>
              <div class="text-xs text-muted-foreground mt-0.5">In Progress</div>
            </div>
            <div>
              <div class="text-2xl font-semibold tabular-nums text-foreground">${overdue.length}</div>
              <div class="text-xs text-muted-foreground mt-0.5">Overdue</div>
            </div>
            <div>
              <div class="text-2xl font-semibold tabular-nums text-foreground">${completed.length}</div>
              <div class="text-xs text-muted-foreground mt-0.5">Completed</div>
            </div>
          </div>
        </div>
      </div>`);
  } catch (err) {
    res.status(502).send(`<p>Error loading greeting: ${String(err)}</p>`);
  }
});

app.get("/fragments/todos/summary", async (req, res) => {
  try {
    const ctx = extractContextHeaders(req);
    const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`, ctx);
    const rows = (resource.items || []) as unknown as TaskItem[];

    res.type("html").send(`
      <div class="rounded-xl border border-border bg-card shadow-xs">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between font-semibold text-sm text-card-foreground">
          Action Items
          <button class="text-sm text-muted-foreground hover:text-foreground transition"
                  hx-get="/fragments/todos/list" hx-target="#content" hx-swap="innerHTML">
            View all
          </button>
        </div>
        <div class="p-4" id="todo-widget-body">
          ${renderTodoItems(rows)}
        </div>
      </div>`);
  } catch (err) {
    res.status(502).send(`<p>Error loading todo summary: ${String(err)}</p>`);
  }
});

app.get("/fragments/todos/deadlines", (_req, res) => {
  res.type("html").send(`
    <div class="rounded-xl border border-border bg-card shadow-xs">
      <div class="px-4 py-3 border-b border-border font-semibold text-sm text-card-foreground">Alerts & Tasks</div>
      <div class="p-4">
        ${renderDeadlines()}
      </div>
    </div>`);
});

// ── Full-page views ──

app.get("/fragments/todos/list", async (req, res) => {
  try {
    const ctx = extractContextHeaders(req);
    const resource = await fetchHalSchemaForms(`${TODOS_API_URL}/ui/tasks`, ctx);
    const rows = (resource.items || []) as unknown as TaskItem[];
    res.type("html").send(`
      <div class="flex items-end justify-between mb-5">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">My Action Items</h1>
          <p class="text-sm text-muted-foreground mt-0.5">${rows.length} action items</p>
        </div>
        <div class="flex gap-2">
          <button class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
                  hx-get="/fragments/todos/add" hx-target="#todo-full-body" hx-swap="beforebegin">
            <i data-lucide="plus" class="w-4 h-4"></i> New Action Item
          </button>
          <button class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
                  hx-get="/fragments/dashboard" hx-target="#content" hx-swap="innerHTML">
            Back
          </button>
        </div>
      </div>
      <div class="rounded-xl border border-border bg-card shadow-xs p-4">
        <div id="todo-full-body">
          ${renderTodoItems(rows)}
        </div>
      </div>`);
  } catch (err) {
    res.status(502).send(`<p>Error loading todos: ${String(err)}</p>`);
  }
});

app.get("/fragments/todos/add", async (req, res) => {
  try {
    const ctx = extractContextHeaders(req);
    const resource = await fetchHalSchemaForms(
      `${TODOS_API_URL}/ui/tasks/form`,
      ctx
    );
    res.type("html").send(renderHalForms(resource));
  } catch (err) {
    res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
  }
});

app.get("/fragments/todos/:id/edit", async (req, res) => {
  try {
    const ctx = extractContextHeaders(req);
    const resource = await fetchHalSchemaForms(
      `${TODOS_API_URL}/ui/tasks/${req.params.id}/form`,
      ctx
    );
    res.type("html").send(renderHalForms(resource));
  } catch (err) {
    res.status(502).send(`<p>Error loading form: ${String(err)}</p>`);
  }
});

// ── Helpers ──

function statusBadgeClass(): string {
  return "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground";
}

function renderTodoItems(rows: TaskItem[]): string {
  if (rows.length === 0) {
    return '<p class="text-center py-8 text-muted-foreground text-sm">No action items. All caught up!</p>';
  }
  return rows
    .map((r) => {
      const isDone = r.status === "COMPLETED";
      return `
        <div class="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0 text-sm text-foreground">
          <input type="checkbox" ${isDone ? "checked" : ""} disabled
                 class="w-4 h-4 rounded border-input bg-background accent-primary cursor-not-allowed" />
          <span class="${isDone ? "line-through text-muted-foreground" : ""} flex-1">${esc(r.title)}</span>
          <span class="${statusBadgeClass()}">${r.status}</span>
          <span class="text-xs text-muted-foreground shrink-0">${r.dueDate || ''}</span>
        </div>`;
    })
    .join("");
}

function renderDeadlines(): string {
  const deadlines = [
    { label: "KYC expiring: Chen Wei", time: "5 days", urgent: true },
    { label: "KYC expiring: Sarah Mitchell", time: "12 days", urgent: true },
    { label: "Suitability review: James K.", time: "Mar 15", urgent: true },
    { label: "Birthday: Maria Santos", time: "Mar 10", urgent: false },
    { label: "Portfolio rebalance needed", time: "Mar 12", urgent: false },
  ];
  return deadlines
    .map(
      (d) => `
      <div class="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0 text-sm">
        <i data-lucide="${d.urgent ? "alert-triangle" : "calendar"}" class="w-4 h-4 text-muted-foreground"></i>
        <span class="flex-1 text-foreground">${d.label}</span>
        <span class="text-xs text-muted-foreground shrink-0">${d.time}</span>
      </div>`
    )
    .join("");
}

const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Todos service listening on http://0.0.0.0:${PORT}`);
});
