// Where every app lives and how to sign in to it. Ports come from local-dev/config.js,
// so they have one source of truth.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROGRAM = path.resolve(here, "..", "..", "..");
export const WORKSPACE = path.resolve(PROGRAM, "..");
export const AUDITS = path.join(PROGRAM, "audits");

const require = createRequire(import.meta.url);
const config = require(path.join(WORKSPACE, "local-dev", "config.js"));
export const PASSWORD = require(path.join(WORKSPACE, "local-dev", "lib", "identity.js")).LOCAL_PASSWORD;

export const webUrl = (key) => config.webUrl(key);
export const apiUrl = (key) => config.apiUrl(key);
export const SOS_API = `${config.apiUrl("sos")}/api`;

// How the launcher opens each app: SOS takes the token at /auth, the rest at /{locale}/auth.
// `locale` says whether the app's own routes carry the /en prefix.
export const APPS = {
  sos: { auth: "/auth?code=", locale: false },
  tasks: { auth: "/en/auth?code=", locale: true },
  files: { auth: "/en/auth?code=", locale: true },
  sales: { auth: "/en/auth?code=", locale: true },
  hr: { auth: "/en/auth?code=", locale: true },
  marketing: { auth: "/en/auth?code=", locale: true },
  content: { auth: "/en/auth?code=", locale: true },
  chats: { auth: "/en/auth?code=", locale: false },
  wm: { auth: "/en/auth?code=", locale: true }, // Website Manager (D-034)
  admin: { auth: "/en/auth?code=", locale: true }, // OrgTik Admin (Phase E, D-011)
};

// The frozen instant audits run at, unless told otherwise (09:00 in Cairo, the test users' zone).
export const AUDIT_NOW = "2026-09-29T09:00:00+03:00";
export const AUDIT_TZ = "Africa/Cairo";

export function readRoutes() {
  const file = path.join(AUDITS, "inventory", "routes.csv");
  const [head, ...lines] = fs.readFileSync(file, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((line) => {
    const vals = line.split(","); // no field in routes.csv contains a comma
    return Object.fromEntries(cols.map((c, i) => [c, vals[i] ?? ""]));
  });
}

export function args(defaults = {}) {
  const out = { ...defaults };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export const slug = (route) => (route === "/" ? "root" : route.replace(/^\//, "").replace(/[/:*]+/g, "_").replace(/[^\w.-]+/g, "-"));

// Free space on the workspace drive. The dev servers' .next caches grow with every route they
// compile, so a long run can fill a small disk; the runners stop cleanly below a floor.
export const freeMB = () => {
  const s = fs.statfsSync(WORKSPACE);
  return Math.floor((s.bavail * s.bsize) / 1024 / 1024);
};
export const MIN_FREE_MB = 400;

// Audit output is committed, so secrets in URLs are masked before anything is written.
export const redact = (url) => String(url || "").replace(/([?&](?:access_?token|token|code|secret|password)=)[^&#]+/gi, "$1[redacted]");

// The kit's CSVs: UTF-8 with a BOM (Excel), every field quoted, "" for a quote inside one.
export function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const s = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows;
  return head ? body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))) : [];
}

export function writeCsv(file, cols, rows) {
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  fs.writeFileSync(file, "﻿" + csv);
}

// A run covers some apps; the combined CSV keeps the other apps' rows from earlier runs.
export function mergeCsv(file, cols, rows) {
  const ran = new Set(rows.map((r) => r.app));
  const kept = readCsv(file).filter((r) => !ran.has(r.app));
  const order = Object.keys(APPS);
  const all = [...kept, ...rows].sort((a, b) => order.indexOf(a.app) - order.indexOf(b.app));
  writeCsv(file, cols, all);
}
