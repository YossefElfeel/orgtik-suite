// Checks a translated catalog against messages/en.json (Chats wave, FS-CHT-3).
//   node scripts/i18n-check.mjs ar [de fr it] [--en path/to/en.json]   (default: messages/en.json)
// For each language: every key present and no extra ones; each {value} the English uses is still
// there (plural branches may be added for a count, never values dropped or renamed); plural
// messages parse, and render for 0, 1, 2, 3, 11 and 100 without leaving a brace behind.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatMessage } from "../lib/messages.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (l) => JSON.parse(fs.readFileSync(path.join(ROOT, "messages", `${l}.json`), "utf8"));
const enAt = process.argv.indexOf("--en");
const en = enAt > -1 ? JSON.parse(fs.readFileSync(process.argv[enAt + 1], "utf8")) : read("en");
const locales = process.argv.slice(2).filter((a, i, all) => a !== "--en" && all[i - 1] !== "--en");

/** The value names a message uses: {name} and {n, plural, …}. */
function names(message) {
  const out = new Set();
  for (const m of message.matchAll(/\{\s*(\w+)\s*(?:,\s*plural\s*,)?/g)) {
    // Skip plural branch selectors like "one {" / "=0 {".
    const before = message.slice(0, m.index).trimEnd();
    if (/(=\d+|zero|one|two|few|many|other)$/.test(before)) continue;
    out.add(m[1]);
  }
  return out;
}

let failed = 0;
for (const locale of locales) {
  const cat = read(locale);
  const problems = [];
  for (const [key, text] of Object.entries(en)) {
    const tr = cat[key];
    if (typeof tr !== "string" || !tr.trim()) {
      problems.push(`${key}: missing`);
      continue;
    }
    const want = names(text);
    const got = names(tr);
    for (const n of want) if (!got.has(n)) problems.push(`${key}: lost {${n}}`);
    for (const n of got) if (!want.has(n)) problems.push(`${key}: unknown {${n}}`);
    const opens = (tr.match(/\{/g) ?? []).length;
    const closes = (tr.match(/\}/g) ?? []).length;
    if (opens !== closes) problems.push(`${key}: unbalanced braces`);
    const vars = Object.fromEntries([...want].map((n) => [n, "X"]));
    for (const n of [0, 1, 2, 3, 11, 100]) {
      const sample = { ...vars };
      for (const p of tr.matchAll(/\{\s*(\w+)\s*,\s*plural/g)) sample[p[1]] = n;
      const out = formatMessage(tr, sample, locale);
      if (/[{}]/.test(out)) {
        problems.push(`${key}: renders with a brace for ${n}: ${out.slice(0, 80)}`);
        break;
      }
    }
  }
  for (const key of Object.keys(cat)) if (!(key in en)) problems.push(`${key}: not in en`);
  console.log(`${locale}: ${problems.length ? `${problems.length} problems` : "ok"} (${Object.keys(cat).length}/${Object.keys(en).length})`);
  for (const p of problems.slice(0, 40)) console.log(`  ${p}`);
  if (problems.length) failed++;
}
process.exit(failed ? 1 : 0);
