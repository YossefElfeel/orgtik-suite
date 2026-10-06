// Checks the message catalogs: every area file exists in every language, the keys match English
// exactly, no value is empty, ICU placeholders match English's, and every t("…") key used in the
// code exists (best effort: literal keys under a literal useTranslations namespace).
//   node scripts/i18n-check.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "ar", "de", "fr", "it"];
const request = fs.readFileSync(path.join(ROOT, "i18n/request.ts"), "utf8");
const AREAS = JSON.parse(request.match(/const AREAS = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
const problems = [];

const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
// Argument names only ("{count, plural, …}", "{name}"), not the words inside plural branches.
const args = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]))].sort().join(",");

const catalogs = {};
for (const l of LOCALES) {
  catalogs[l] = {};
  for (const a of AREAS) {
    const f = path.join(ROOT, "messages", l, `${a}.json`);
    if (!fs.existsSync(f)) { problems.push(`missing ${l}/${a}.json`); continue; }
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const [k, v] of flat(data)) {
      if (k in catalogs[l]) problems.push(`${l}: "${k}" is defined in two area files`);
      catalogs[l][k] = v;
    }
  }
}
const en = catalogs.en;
for (const l of LOCALES.slice(1)) {
  for (const k of Object.keys(en)) {
    if (!(k in catalogs[l])) problems.push(`${l}: missing ${k}`);
    else if (!String(catalogs[l][k]).trim()) problems.push(`${l}: empty ${k}`);
    else if (args(en[k]) !== args(catalogs[l][k])) problems.push(`${l}: placeholders differ in ${k}`);
  }
  for (const k of Object.keys(catalogs[l])) if (!(k in en)) problems.push(`${l}: extra key ${k}`);
}

// Keys used in code: const t = useTranslations("Ns"); … t("a.b")
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (["node_modules", ".next", ".yalc"].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(e.name)) files.push(p); } };
for (const d of ["app", "components", "lib"]) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
let used = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  // One name can be bound to different namespaces in different functions of a file: a key passes
  // if it exists under any of them. t.has("…") checks are skipped (they're allowed to miss).
  const bound = {};
  for (const m of src.matchAll(/const (\w+) = useTranslations\("([\w.]+)"\)/g)) (bound[m[1]] ??= new Set()).add(m[2]);
  for (const [fn, spaces] of Object.entries(bound)) {
    for (const u of src.matchAll(new RegExp(`\\b${fn}(?:\\.rich|\\.markup)?\\("([\\w.]+)"`, "g"))) {
      used++;
      const known = [...spaces].some((ns) => `${ns}.${u[1]}` in en || Object.keys(en).some((k) => k.startsWith(`${ns}.${u[1]}.`)));
      if (!known) problems.push(`${path.relative(ROOT, f)}: unknown key ${[...spaces].join("|")}.${u[1]}`);
    }
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`messages OK: ${Object.keys(en).length} keys × ${LOCALES.length} languages, ${used} literal uses checked`);
