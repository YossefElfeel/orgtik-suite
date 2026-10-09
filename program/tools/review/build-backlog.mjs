// Plan v2, Phase 2d: merges the suite review into one ranked backlog.
//   node program/tools/review/build-backlog.mjs
// Sources:
//   audits/suite-review/findings.jsonl      journey and heuristic findings (SR-###)
//   audits/suite-review/gap-v1/*.json       spec rows re-verified (status per gap_id)
//   audits/benchmark/<tool>.md              Expected/Differentiator features vs comparable products
// Writes backlog/backlog.csv (UTF-8 BOM, every field quoted) and backlog/summary.json.
// Score = impact / effort. Impact: review S1 10, S2 6, S3 3; spec Must×(flawed/Missing 3, Partial 2),
// Should ×0.6, Could ×0.3; benchmark Expected-Missing 5, Expected-Partial 3, Differentiator ★ 2.
// Effort: S 1, M 2, L 3 (M when unknown). Themes group items for the readout.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reconcileV3 } from "./reconcile-v3.mjs";

const PROGRAM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const A = (...p) => path.join(PROGRAM, "audits", ...p);
const EFFORT = { S: 1, M: 2, L: 3 };

// Themes: the foundation items unblock most journeys, so they come first in the readout.
const THEME_OF_FINDING = {
  "SR-001": "T1", "SR-007": "T1", "SR-012": "T1", "SR-013": "T1", "SR-014": "T1", "SR-015": "T1", "SR-016": "T1", "SR-019": "T1",
  "SR-002": "T2", "SR-003": "T2", "SR-017": "T2",
  "SR-018": "T3", "SR-020": "T3", "SR-022": "T3", "SR-023": "T3", "SR-024": "T3", "SR-025": "T3", "SR-026": "T3", "SR-021": "T3",
  "SR-004": "T6", "SR-005": "T6", "SR-006": "T6", "SR-008": "T3", "SR-009": "T2", "SR-010": "T6", "SR-011": "T6",
};
const EFFORT_OF_FINDING = {
  "SR-001": "L", "SR-002": "S", "SR-003": "M", "SR-004": "S", "SR-005": "S", "SR-006": "S", "SR-007": "S", "SR-008": "M", "SR-009": "S", "SR-010": "S",
  "SR-011": "S", "SR-012": "S", "SR-013": "M", "SR-014": "L", "SR-015": "L", "SR-016": "M", "SR-017": "M", "SR-018": "M", "SR-019": "M", "SR-020": "L",
  "SR-021": "L", "SR-022": "M", "SR-023": "M", "SR-024": "M", "SR-025": "L", "SR-026": "L",
};
export const THEMES = {
  T1: "Suite foundation: workspaces in every tool, paid tools open, members join, billing state applies",
  T2: "Money and prices: one price authority, correct re-pricing, seats, tax",
  T3: "Apps working together: files, notifications, search, leads, publishing, preferences",
  T4: "Tools complete for their category (benchmark Expected features)",
  T5: "SaaS core completeness (ADM/USR spec rows)",
  T6: "Polish: copy, accessibility, responsive, performance",
};

const items = [];
const add = (o) => items.push({ decision: "user", ...o, score: Math.round((o.impact / (EFFORT[o.effort] ?? 2)) * 100) / 100 });

// 1. Review findings
for (const line of fs.readFileSync(A("suite-review", "findings.jsonl"), "utf8").split(/\r?\n/).filter(Boolean)) {
  const f = JSON.parse(line);
  add({
    id: f.id, source: "review", theme: THEME_OF_FINDING[f.id] ?? "T6", type: f.type, apps: f.apps, ref: f.journey,
    title: f.title, detail: f.detail, severity: f.sev, impact: { S1: 10, S2: 6, S3: 3 }[f.sev] ?? 3,
    effort: EFFORT_OF_FINDING[f.id] ?? "M", decision: /PM/.test(f.type) ? "PM" : "user", evidence: f.evidence,
  });
}

// 2. Spec rows re-verified
const matrix = Object.fromEntries(
  fs.readFileSync(path.join(PROGRAM, "gap-analysis", "gap-matrix.csv"), "utf8").replace(/^﻿/, "").split(/\r?\n/).slice(1).filter(Boolean)
    .map((l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')))
    .map((c) => [c[0], { spec: c[1], area: c[3], requirement: c[4], priority: c[5], owner: c[6], decisionDep: c[12] }]),
);
const gapDir = A("suite-review", "gap-v1");
for (const file of fs.existsSync(gapDir) ? fs.readdirSync(gapDir).filter((f) => f.endsWith(".json")) : []) {
  for (const r of JSON.parse(fs.readFileSync(path.join(gapDir, file), "utf8"))) {
    if (["Exists-OK", "Superseded"].includes(r.status)) continue;
    const m = matrix[r.gap_id] ?? {};
    const weight = { "Exists-flawed": 3, Missing: 3, Partial: 2, Conflicts: 1 }[r.status] ?? 1;
    const pr = { Must: 1, Should: 0.6, Could: 0.3 }[m.priority] ?? 0.6;
    const pricing = file.startsWith("pricing");
    add({
      id: r.gap_id, source: "spec", theme: pricing ? "T2" : "T5", type: r.status === "Exists-flawed" ? "Fix flow" : r.status === "Conflicts" ? "Decision (PM)" : "Missing feature",
      apps: r.current_app ?? "", ref: r.spec_id, title: `${r.spec_id}: ${(m.requirement ?? "").slice(0, 120)}`, detail: r.missing || r.notes || "",
      severity: `${m.priority ?? ""} · ${r.status}`, impact: Math.round(weight * pr * (pricing && r.status === "Exists-flawed" ? 3 : 2) * 10) / 10,
      // Only gaps still open with the PM (phase-e/README: the others have accepted defaults).
      effort: "M", decision: /\bG-(04|12|18|21|24|28)\b/.test(m.decisionDep ?? "") && r.status !== "Exists-flawed" ? "PM" : "user", evidence: r.evidence ?? "",
    });
  }
}

// 3. Benchmarks: Expected features that are Missing or Partial, and starred differentiators
const benchDir = A("benchmark");
for (const file of fs.readdirSync(benchDir).filter((f) => f.endsWith(".md"))) {
  const tool = file.replace(/\.md$/, "");
  let row = 0;
  for (const line of fs.readFileSync(path.join(benchDir, file), "utf8").split(/\r?\n/)) {
    // Table rows, with or without a leading "#" column; not headers or separators.
    if (!/^\|/.test(line) || /^\|\s*(#|Feature)\s*\|/.test(line) || /^\|\s*-/.test(line)) continue;
    const cells = line.replace(/\|\s*$/, "").split("|").slice(1).map((s) => s.trim());
    const numbered = /^\d+$/.test(cells[0]);
    row += 1;
    const [feature, area, rating, today, evidence, gap] = numbered ? cells.slice(1) : cells;
    const n = numbered ? cells[0] : String(row);
    if (!rating || !today) continue;
    const missing = /missing/i.test(today);
    const partial = /partial/i.test(today);
    const expected = /^expected/i.test(rating);
    const starred = /differentiator/i.test(rating) && /★|★|worth/i.test(rating + gap);
    if (!((expected && (missing || partial)) || (starred && (missing || partial)))) continue;
    const size = (gap?.match(/\b([SML])\b(?!\w)/) ?? [])[1] ?? "M";
    add({
      id: `BM-${tool}-${n}`, source: "benchmark", theme: "T4", type: "Missing feature", apps: tool, ref: area,
      title: `${tool}: ${feature}`, detail: gap ?? "", severity: `${expected ? "Expected" : "Differentiator"} · ${missing ? "Missing" : "Partial"}`,
      impact: expected ? (missing ? 5 : 3) : 2, effort: size, decision: "user", evidence: evidence ?? "",
    });
  }
}

items.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
items.forEach((it, i) => (it.rank = i + 1));
const COLS = ["rank", "id", "theme", "source", "type", "title", "apps", "ref", "severity", "impact", "effort", "score", "decision", "detail", "evidence"];
fs.mkdirSync(path.join(PROGRAM, "backlog"), { recursive: true });
const csv = [COLS.join(","), ...items.map((it) => COLS.map((k) => `"${String(it[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
fs.writeFileSync(path.join(PROGRAM, "backlog", "backlog.csv"), "﻿" + csv + "\n");

const by = (key) => items.reduce((acc, it) => ((acc[it[key]] = (acc[it[key]] ?? 0) + 1), acc), {});
const summary = { generated: new Date().toISOString(), total: items.length, bySource: by("source"), byTheme: by("theme"), byType: by("type"), byDecision: by("decision"), themes: THEMES };
fs.writeFileSync(path.join(PROGRAM, "backlog", "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
// Preserve the current delivery/status overlay when regenerating historical sources.
if (fs.existsSync(path.join(PROGRAM, "plan-v3-execution.md"))) console.log(JSON.stringify(reconcileV3(), null, 2));
