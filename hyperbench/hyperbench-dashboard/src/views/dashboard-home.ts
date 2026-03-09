/**
 * Mock dashboard home page fragments matching shadcn dashboard-01 template.
 * All data is hardcoded — these are display-only widgets.
 */

export function renderKpiCards(): string {
  const cards = [
    {
      label: "Total Revenue",
      value: "$1,250.00",
      badge: "+12.5%",
      badgeColor: "text-emerald-400 bg-emerald-500/10",
      trend: "trending-up",
      trendColor: "text-emerald-400",
      footer: "Trending up this month",
      detail: "Visitors for the period",
    },
    {
      label: "New Customers",
      value: "1,234",
      badge: "-20%",
      badgeColor: "text-red-400 bg-red-500/10",
      trend: "trending-down",
      trendColor: "text-red-400",
      footer: "Down 20% this period",
      detail: "Acquisition needs attention",
    },
    {
      label: "Active Accounts",
      value: "45,678",
      badge: "+12.5%",
      badgeColor: "text-emerald-400 bg-emerald-500/10",
      trend: "trending-up",
      trendColor: "text-emerald-400",
      footer: "Strong user retention",
      detail: "Engagement exceed targets",
    },
    {
      label: "Growth Rate",
      value: "4.5%",
      badge: "+4.5%",
      badgeColor: "text-emerald-400 bg-emerald-500/10",
      trend: "trending-up",
      trendColor: "text-emerald-400",
      footer: "Steady performance increase",
      detail: "Meets growth projections",
    },
  ];

  const cardHtml = cards
    .map(
      (c) => `
    <div class="rounded-xl border border-border bg-gradient-to-t from-primary/5 to-card text-card-foreground shadow-xs">
      <div class="p-6 pb-2">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">${c.label}</p>
          <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${c.badgeColor}">${c.badge}</span>
        </div>
        <p class="text-2xl font-semibold tracking-tight text-foreground mt-2 tabular-nums">${c.value}</p>
      </div>
      <div class="px-6 pb-6 pt-2">
        <p class="text-xs text-muted-foreground flex items-center gap-1">
          <i data-lucide="${c.trend}" class="w-3 h-3 ${c.trendColor}"></i>
          ${c.footer}
        </p>
        <p class="text-xs text-muted-foreground mt-0.5">${c.detail}</p>
      </div>
    </div>`,
    )
    .join("\n");

  return `<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">${cardHtml}</div>`;
}

export function renderChart(): string {
  // Static SVG approximating the dashboard-01 stacked area chart
  const desktopPath =
    "M0,160 C30,155 60,140 90,130 C120,120 150,100 180,95 C210,90 240,110 270,105 " +
    "C300,100 330,80 360,70 C390,60 420,75 450,65 C480,55 510,40 540,50 " +
    "C570,60 600,45 630,35 C660,25 690,40 720,30 C750,20 780,35 800,25";
  const mobilePath =
    "M0,180 C30,175 60,170 90,165 C120,160 150,150 180,148 C210,145 240,155 270,150 " +
    "C300,148 330,135 360,128 C390,120 420,130 450,125 C480,118 510,105 540,112 " +
    "C570,118 600,110 630,100 C660,92 690,105 720,95 C750,88 780,98 800,90";

  return `
  <div class="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
    <div class="px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-semibold text-foreground">Total Visitors</h3>
        <p class="text-sm text-muted-foreground">Showing total visitors for the last 3 months</p>
      </div>
      <div class="flex gap-1 bg-muted rounded-lg p-0.5 shrink-0">
        <button class="px-3 py-1 text-xs rounded-md bg-background text-foreground shadow-xs">Last 3 months</button>
        <button class="px-3 py-1 text-xs rounded-md text-muted-foreground">Last 30 days</button>
        <button class="px-3 py-1 text-xs rounded-md text-muted-foreground">Last 7 days</button>
      </div>
    </div>
    <div class="p-6 pt-4">
      <svg viewBox="0 0 800 200" class="w-full" style="height:200px" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad-desktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="oklch(0.623 0.214 259.815)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="oklch(0.623 0.214 259.815)" stop-opacity="0.02"/>
          </linearGradient>
          <linearGradient id="grad-mobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="oklch(0.746 0.16 232.661)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="oklch(0.746 0.16 232.661)" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <!-- Desktop area -->
        <path d="${desktopPath} L800,200 L0,200 Z" fill="url(#grad-desktop)" />
        <path d="${desktopPath}" fill="none" stroke="oklch(0.623 0.214 259.815)" stroke-width="2"/>
        <!-- Mobile area -->
        <path d="${mobilePath} L800,200 L0,200 Z" fill="url(#grad-mobile)" />
        <path d="${mobilePath}" fill="none" stroke="oklch(0.746 0.16 232.661)" stroke-width="2"/>
      </svg>
      <div class="flex items-center gap-6 mt-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" style="background:oklch(0.623 0.214 259.815)"></div>
          <span class="text-muted-foreground">Desktop</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" style="background:oklch(0.746 0.16 232.661)"></div>
          <span class="text-muted-foreground">Mobile</span>
        </div>
      </div>
    </div>
  </div>`;
}

export function renderDataTable(): string {
  const rows = [
    { header: "Executive Summary", type: "Technical", status: "Done", target: "$250,000", limit: "$150,000", reviewer: "Eddie Lake" },
    { header: "Technical Approach", type: "Technical", status: "In Progress", target: "$150,000", limit: "$100,000", reviewer: "Assign reviewer" },
    { header: "Design and Implementation Plan", type: "Design", status: "Done", target: "$75,000", limit: "$50,000", reviewer: "Eddie Lake" },
    { header: "Testing and Validation Results", type: "Technical", status: "Done", target: "$125,000", limit: "$75,000", reviewer: "Assign reviewer" },
    { header: "Risk Assessment and Mitigation", type: "Analysis", status: "In Progress", target: "$200,000", limit: "$125,000", reviewer: "Eddie Lake" },
    { header: "Resource Allocation Overview", type: "Planning", status: "Done", target: "$90,000", limit: "$60,000", reviewer: "Assign reviewer" },
    { header: "Timeline and Milestones", type: "Planning", status: "Done", target: "$180,000", limit: "$110,000", reviewer: "Eddie Lake" },
    { header: "Budget Analysis", type: "Analysis", status: "In Progress", target: "$220,000", limit: "$140,000", reviewer: "Eddie Lake" },
    { header: "Compliance Documentation", type: "Documentation", status: "Done", target: "$95,000", limit: "$55,000", reviewer: "Assign reviewer" },
    { header: "Stakeholder Communication Plan", type: "Planning", status: "Done", target: "$160,000", limit: "$90,000", reviewer: "Eddie Lake" },
    { header: "Quality Assurance Report", type: "Technical", status: "In Progress", target: "$185,000", limit: "$120,000", reviewer: "Assign reviewer" },
    { header: "Training Materials", type: "Documentation", status: "Done", target: "$65,000", limit: "$40,000", reviewer: "Eddie Lake" },
    { header: "Post-Implementation Review", type: "Analysis", status: "Done", target: "$140,000", limit: "$85,000", reviewer: "Eddie Lake" },
    { header: "Vendor Evaluation Summary", type: "Analysis", status: "In Progress", target: "$175,000", limit: "$105,000", reviewer: "Assign reviewer" },
    { header: "Infrastructure Requirements", type: "Technical", status: "Done", target: "$210,000", limit: "$130,000", reviewer: "Eddie Lake" },
    { header: "Security Audit Findings", type: "Technical", status: "Done", target: "$155,000", limit: "$95,000", reviewer: "Assign reviewer" },
    { header: "Performance Benchmarks", type: "Technical", status: "In Progress", target: "$130,000", limit: "$80,000", reviewer: "Eddie Lake" },
    { header: "User Acceptance Testing", type: "Design", status: "Done", target: "$115,000", limit: "$70,000", reviewer: "Eddie Lake" },
    { header: "API Integration Spec", type: "Technical", status: "Done", target: "$195,000", limit: "$115,000", reviewer: "Assign reviewer" },
    { header: "Data Migration Plan", type: "Planning", status: "In Progress", target: "$145,000", limit: "$88,000", reviewer: "Eddie Lake" },
  ];

  const statusBadge = (status: string) => {
    if (status === "Done") {
      return `<span class="inline-flex items-center gap-1 text-xs text-emerald-400"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Done</span>`;
    }
    return `<span class="inline-flex items-center gap-1 text-xs text-blue-400"><i data-lucide="loader" class="w-3.5 h-3.5"></i> In Progress</span>`;
  };

  const typeBadge = (type: string) => {
    return `<span class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">${type}</span>`;
  };

  const rowsHtml = rows
    .map(
      (r) => `
      <tr class="border-b border-border transition-colors hover:bg-muted/50">
        <td class="p-3 w-8 text-muted-foreground"><i data-lucide="grip-vertical" class="w-4 h-4"></i></td>
        <td class="p-3 w-8"><input type="checkbox" class="h-4 w-4 rounded border-border bg-background" /></td>
        <td class="p-3 font-medium text-foreground">${r.header}</td>
        <td class="p-3">${typeBadge(r.type)}</td>
        <td class="p-3">${statusBadge(r.status)}</td>
        <td class="p-3 tabular-nums text-muted-foreground">${r.target}</td>
        <td class="p-3 tabular-nums text-muted-foreground">${r.limit}</td>
        <td class="p-3 text-muted-foreground text-sm">${r.reviewer}</td>
        <td class="p-3 w-8 text-muted-foreground"><button class="p-1 rounded hover:bg-accent"><i data-lucide="more-vertical" class="w-4 h-4"></i></button></td>
      </tr>`,
    )
    .join("\n");

  return `
  <div class="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
    <!-- Tabs -->
    <div class="border-b border-border px-4">
      <div class="flex gap-4">
        <button class="px-1 py-3 text-sm font-medium text-foreground border-b-2 border-foreground -mb-px">Outline</button>
        <button class="px-1 py-3 text-sm text-muted-foreground">Past Performance <span class="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-xs">3</span></button>
        <button class="px-1 py-3 text-sm text-muted-foreground">Key Personnel <span class="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-xs">2</span></button>
        <button class="px-1 py-3 text-sm text-muted-foreground">Focus Documents</button>
      </div>
    </div>
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="h-10 px-3 text-left font-medium text-muted-foreground w-8"></th>
            <th class="h-10 px-3 text-left font-medium text-muted-foreground w-8"><input type="checkbox" class="h-4 w-4 rounded border-border bg-background" /></th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Header</th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Type</th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Status</th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Target</th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Limit</th>
            <th class="h-10 px-3 text-left font-medium text-foreground">Reviewer</th>
            <th class="h-10 px-3 text-left font-medium text-muted-foreground w-8"></th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div class="flex items-center justify-between px-4 py-3 border-t border-border">
      <p class="text-sm text-muted-foreground">0 of ${rows.length} row(s) selected.</p>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Rows per page</span>
          <select class="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground">
            <option>10</option><option selected>20</option><option>50</option>
          </select>
        </div>
        <span class="text-sm text-muted-foreground">Page 1 of 1</span>
        <div class="flex gap-1">
          <button class="p-1.5 rounded-md border border-border text-muted-foreground opacity-50" disabled><i data-lucide="chevrons-left" class="w-4 h-4"></i></button>
          <button class="p-1.5 rounded-md border border-border text-muted-foreground opacity-50" disabled><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
          <button class="p-1.5 rounded-md border border-border text-muted-foreground opacity-50" disabled><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
          <button class="p-1.5 rounded-md border border-border text-muted-foreground opacity-50" disabled><i data-lucide="chevrons-right" class="w-4 h-4"></i></button>
        </div>
      </div>
    </div>
  </div>`;
}
