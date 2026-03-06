import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { htmlShell } from "./views/shell.js";

const app = express();

const TODOS_URL = process.env.TODOS_URL || "http://localhost:3001";
const CLIENTS_URL = process.env.CLIENTS_URL || "http://localhost:3002";
const ONBOARDING_URL = process.env.ONBOARDING_URL || "http://localhost:3003";

const TODOS_API_URL = process.env.TODOS_API_URL || "http://localhost:8081";
const ONBOARDING_API_URL = process.env.ONBOARDING_API_URL || "http://localhost:8082";

// Proxy to micro-frontend services
app.use(createProxyMiddleware({ target: TODOS_URL, changeOrigin: true, pathFilter: "/fragments/todos" }));
app.use(createProxyMiddleware({ target: CLIENTS_URL, changeOrigin: true, pathFilter: "/fragments/clients" }));
app.use(createProxyMiddleware({ target: ONBOARDING_URL, changeOrigin: true, pathFilter: "/fragments/onboarding" }));

// Proxy API to per-domain backends
app.use(createProxyMiddleware({ target: TODOS_API_URL, changeOrigin: true, pathFilter: "/api/tasks" }));

// HTML shell
app.get("/", (_req, res) => {
  res.type("html").send(htmlShell());
});

// Dashboard layout — static grid with hx-trigger="load" placeholders
app.get("/fragments/dashboard", (_req, res) => {
  const html = `
    <div class="flex items-end justify-between mb-5">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Good morning, John</h1>
        <p class="text-sm text-slate-500 mt-0.5">Here's your advisory overview for today</p>
      </div>
    </div>
    <div class="dash-grid" style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:180px 280px 280px;gap:1.25rem;">
      <div style="overflow:hidden;" hx-get="/fragments/todos/greeting"        hx-trigger="load" hx-swap="innerHTML"></div>
      <div style="overflow:hidden;" hx-get="/fragments/clients/quick-actions" hx-trigger="load" hx-swap="innerHTML"></div>
      <div style="overflow:hidden;" hx-get="/fragments/clients/favorites"     hx-trigger="load" hx-swap="innerHTML"></div>
      <div style="overflow:hidden;" hx-get="/fragments/todos/deadlines"       hx-trigger="load" hx-swap="innerHTML"></div>
      <div style="overflow:hidden;" hx-get="/fragments/clients/recent"        hx-trigger="load" hx-swap="innerHTML"></div>
      <div style="overflow:hidden;" hx-get="/fragments/todos/summary"         hx-trigger="load" hx-swap="innerHTML"></div>
    </div>`;
  res.type("html").send(html);
});

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Dashboard gateway listening on http://localhost:${PORT}`);
});
