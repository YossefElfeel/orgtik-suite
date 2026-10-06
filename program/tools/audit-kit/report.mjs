// Per-app runtime metrics from a sweep and a dead-end run, in the same metric × app layout as
// ../../audits/baseline-metrics.md (the static counts). Like those, these are the starting point
// each app's wave has to improve on.
//
//   node report.mjs                  the "baseline" runs
//   node report.mjs --label mobile
//
// Reads audits/sweep-<label>.csv, audits/<app>/sweep-<label>.json and
// audits/<app>/deadends-<label>.json. Writes audits/runtime-metrics-<label>.{csv,md}.
import fs from "node:fs";
import path from "node:path";
import { APPS, AUDITS, args, readCsv } from "./lib/suite.mjs";

const opt = args({ label: "baseline" });
const label = opt.label;


const sweepFile = path.join(AUDITS, `sweep-${label}.csv`);
if (!fs.existsSync(sweepFile)) {
  console.error(`No audits/sweep-${label}.csv: run the sweep first.`);
  process.exit(1);
}
const rows = readCsv(sweepFile);
const apps = Object.keys(APPS).filter((a) => rows.some((r) => r.app === a));
const num = (v) => (v === "" || v == null ? 0 : Number(v));
const loaded = (r) => num(r.status) >= 200 && num(r.status) < 400 && !r.auth_redirect;
const median = (xs) => {
  if (!xs.length) return "";
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

// [metric, what it means, how to compute it for one app's rows, summed across apps?]
const SWEEP = [
  ["routes", "Routes in the inventory", (rs) => rs.length, true],
  ["loaded", "Loaded (2xx/3xx, not sent to sign-in)", (rs) => rs.filter(loaded).length, true],
  ["failed", "Failed (4xx/5xx or didn't load)", (rs) => rs.filter((r) => num(r.status) >= 400 || (r.error && r.error !== "no sample link found")).length, true],
  ["sign_in_redirects", "Signed in, but sent to sign-in or not-allowed", (rs) => rs.filter((r) => r.auth_redirect).length, true],
  ["no_sample", "Dynamic routes with no link to follow", (rs) => rs.filter((r) => r.error === "no sample link found").length, true],
  ["routes_with_console_errors", "Routes with console errors", (rs) => rs.filter((r) => num(r.console_errors) > 0).length, true],
  ["console_errors", "Console errors in total", (rs) => rs.reduce((n, r) => n + num(r.console_errors), 0), true],
  ["routes_with_uncaught_errors", "Routes with uncaught exceptions", (rs) => rs.filter((r) => num(r.page_errors) > 0).length, true],
  ["routes_with_failing_api_calls", "Routes with failing calls to the mocks", (rs) => rs.filter((r) => num(r.api_errors) > 0).length, true],
  ["failing_api_calls", "Failing calls in total", (rs) => rs.reduce((n, r) => n + num(r.api_errors), 0), true],
  ["token_in_url", "Routes that keep a token in the address", (rs) => rs.filter((r) => r.token_in_url).length, true],
  ["axe_critical", "axe critical (elements)", (rs) => rs.reduce((n, r) => n + num(r.axe_critical), 0), true],
  ["axe_serious", "axe serious (elements)", (rs) => rs.reduce((n, r) => n + num(r.axe_serious), 0), true],
  ["routes_with_axe_critical_or_serious", "Routes with any critical or serious axe issue", (rs) => rs.filter((r) => num(r.axe_critical) + num(r.axe_serious) > 0).length, true],
  ["routes_without_one_h1", "Loaded routes without exactly one h1", (rs) => rs.filter((r) => loaded(r) && r.h1 !== "" && num(r.h1) !== 1).length, true],
  ["unnamed_controls", "Controls with no accessible name", (rs) => rs.reduce((n, r) => n + num(r.unnamed_controls), 0), true],
  ["img_no_alt", "Images with no alt", (rs) => rs.reduce((n, r) => n + num(r.img_no_alt), 0), true],
  ["small_targets", "Buttons and links under 24×24", (rs) => rs.reduce((n, r) => n + num(r.small_targets), 0), true],
  ["median_load_ms", "Median load time of loaded routes (ms)", (rs) => median(rs.filter(loaded).map((r) => num(r.load_ms))), false],
];

const DEAD = [
  ["pages", "Pages checked"],
  ["pressed", "Controls pressed"],
  ["dead end", "Dead ends"],
  ["left the app", "Back buttons that leave the app"],
  ["copied silently", "Copies with no feedback"],
  ["sign-in wall", "Sent to sign-in while signed in"],
  ["broken link", "Links to no known route"],
  ["not clickable", "Couldn't be clicked"],
  ["not found", "Gone after a reload"],
  ["current page", "Current-page items not marked aria-current"],
  ["active option", "Active options not marked pressed/selected"],
  ["skipped", "Skipped (destructive or hover-only)"],
  ["unnamed buttons", "Unnamed buttons found"],
  ["over the limit", "Controls over the per-page limit"],
];

const table = (header, lines) => [`| ${header.join(" | ")} |`, `|${header.map(() => "---").join("|")}|`, ...lines.map((l) => `| ${l.join(" | ")} |`)].join("\n");
const csvRows = [];
const md = [];

const meta = (() => {
  for (const a of apps) {
    const f = path.join(AUDITS, a, `sweep-${label}.json`);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  }
  return {};
})();
md.push(`# Runtime metrics: ${label}`);
md.push("");
md.push(`Generated by \`tools/audit-kit/report.mjs\` from the \`${label}\` route sweep and dead-end run. Signed in as ${meta.as || "?"}, ${meta.combo || "?"}, clocks ${meta.frozen ? "frozen" : "real"}, run on ${(meta.at || "").slice(0, 10)}. Together with \`baseline-metrics.md\` (the code counts), these numbers are what each app's wave has to improve on.`);
md.push("");
md.push("## Route sweep");
md.push("");
const sweepLines = SWEEP.map(([key, desc, f, sum]) => {
  const vals = apps.map((a) => f(rows.filter((r) => r.app === a)));
  const total = sum ? vals.reduce((n, v) => n + num(v), 0) : f(rows);
  csvRows.push({ group: "sweep", metric: key, ...Object.fromEntries(apps.map((a, i) => [a, vals[i]])), total });
  return [desc, ...vals, total];
});
md.push(table(["Metric", ...apps, "Total"], sweepLines));
md.push("");

// Accessibility failures by rule: on how many routes each rule fails, per app.
const ruleRoutes = new Map();
for (const r of rows) for (const rule of (r.axe_rules || "").split(" ").filter(Boolean)) {
  const m = ruleRoutes.get(rule) || new Map();
  m.set(r.app, (m.get(r.app) || 0) + 1);
  ruleRoutes.set(rule, m);
}
const rules = [...ruleRoutes.entries()].map(([rule, m]) => [rule, [...m.values()].reduce((n, v) => n + v, 0), m]).sort((a, b) => b[1] - a[1]);
if (rules.length) {
  md.push("## Accessibility failures by rule");
  md.push("");
  md.push("The number of routes on which each axe rule fails (any impact).");
  md.push("");
  md.push(table(["Rule", ...apps, "Routes"], rules.map(([rule, total, m]) => [`\`${rule}\``, ...apps.map((a) => m.get(a) || 0), total])));
  md.push("");
  for (const [rule, total, m] of rules) csvRows.push({ group: "axe_rule_routes", metric: rule, ...Object.fromEntries(apps.map((a) => [a, m.get(a) || 0])), total });
}

const tallies = Object.fromEntries(
  apps.map((a) => {
    const f = path.join(AUDITS, a, `deadends-${label}.json`);
    return [a, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).tally : null];
  }),
);
const deadApps = apps.filter((a) => tallies[a]);
if (deadApps.length) {
  md.push("## Dead-end detector");
  md.push("");
  md.push("Outcomes are explained in `tools/audit-kit/README.md`.");
  md.push("");
  md.push(
    table(
      ["Metric", ...deadApps, "Total"],
      DEAD.map(([key, desc]) => {
        const vals = deadApps.map((a) => tallies[a][key] ?? 0);
        const total = vals.reduce((n, v) => n + v, 0);
        csvRows.push({ group: "deadends", metric: key, ...Object.fromEntries(deadApps.map((a, i) => [a, vals[i]])), total });
        return [desc, ...vals, total];
      }),
    ),
  );
  md.push("");
  const missing = apps.filter((a) => !tallies[a]);
  if (missing.length) md.push(`No dead-end run yet for: ${missing.join(", ")}.\n`);
}

md.push("## Reading these numbers");
md.push("");
md.push("- axe counts are elements, not rules: one missing label on a repeated row counts once per row.");
md.push("- Console errors in development include React's own warnings (hydration mismatches, missing keys); each one is still a defect.");
md.push("- Load times come from dev servers and mean something only relative to each other on a warm server.");
md.push("- Failing API calls are calls to the local mocks. Before logging one as an app bug, check whether the mock or the real backend contract is the gap.");

const cols = ["group", "metric", ...apps, "total"];
const csv = [cols.join(","), ...csvRows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
fs.writeFileSync(path.join(AUDITS, `runtime-metrics-${label}.csv`), "﻿" + csv);
fs.writeFileSync(path.join(AUDITS, `runtime-metrics-${label}.md`), md.join("\n") + "\n");
console.log(`Written: audits/runtime-metrics-${label}.{csv,md}`);
