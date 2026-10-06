// Plan v2, Phase 2a: writes the re-verified statuses (audits/suite-review/gap-v1/*.json) into
// gap-analysis/gap-matrix.csv: status, current_app, current_route, evidence, issues, last_verified.
//   node program/tools/review/update-gap-matrix.mjs [YYYY-MM-DD]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROGRAM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const file = path.join(PROGRAM, "gap-analysis", "gap-matrix.csv");
const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");

// RFC 4180 rows (quoted fields may hold commas, quotes and line breaks).
function parse(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const [head, ...rows] = parse(raw);
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const results = new Map();
const dir = path.join(PROGRAM, "audits", "suite-review", "gap-v1");
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) for (const r of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) results.set(r.gap_id, r);

const before = {}, after = {};
for (const r of rows) {
  before[r[col.status]] = (before[r[col.status]] ?? 0) + 1;
  const v = results.get(r[col.gap_id]);
  if (v) {
    r[col.status] = v.status;
    if (v.current_app) r[col.current_app] = v.current_app;
    if (v.current_route) r[col.current_route] = v.current_route;
    r[col.evidence] = v.evidence ?? r[col.evidence];
    r[col.issues] = [v.missing, v.notes].filter(Boolean).join(" · ");
    r[col.last_verified] = date;
  }
  after[r[col.status]] = (after[r[col.status]] ?? 0) + 1;
}
const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
fs.writeFileSync(file, "﻿" + [head, ...rows].map((r) => r.map(q).join(",")).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, verified: results.size, before, after }));
