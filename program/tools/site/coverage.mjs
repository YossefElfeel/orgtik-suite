// Coverage (plan G2): what reader text is still typed into the website's page files, after the
// content layer (src/content) took over. Uses the same extractors as the seed, on the working tree:
// a copy slot or a message they still find is text the Website Manager can't change yet.
//
//   node coverage.mjs [--list]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "..");
const REF = path.join(process.env.SITE_APP ?? path.join(ROOT, "orgtik-website", "landing-directions"), "src", "reference");
const seedDir = path.join(ROOT, "local-dev", "apps", "wm", "seed");
const { extractCopy } = await import(pathToFileURL(path.join(seedDir, "copy.mjs")).href);
const { extractStrings } = await import(pathToFileURL(path.join(seedDir, "strings.mjs")).href);
const { field } = await import(pathToFileURL(path.join(seedDir, "fields.mjs")).href);
const LIST = process.argv.includes("--list");

// The content layer's own arguments are keys, not copy.
const isKey = (t) => /\|/.test(t) || /^[A-Z][A-Za-z]+:\d+$/.test(t);
const files = fs.readdirSync(REF).filter((f) => f.endsWith(".jsx"));
let copyLeft = 0;
let msgLeft = 0;
const rows = [];
for (const f of files) {
  const full = path.join(REF, f);
  const copy = extractCopy(full).regions.flatMap((r) => r.slots.map((s) => `${r.key}/${s.key}: ${s.text}`));
  const msgs = extractStrings(full).filter((m) => !isKey(m.text)).map((m) => m.text);
  copyLeft += copy.length;
  msgLeft += msgs.length;
  rows.push({ file: f, copy, msgs });
}
// Class-field data still typed in the pages (what the content adapters didn't take).
const DATA = ["BX", "PAL", "CONNECT", "UC_IMGS", "SITE", "HOME", "CONTACT"];
const dataLeft = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(REF, f), "utf8");
  for (const m of src.matchAll(/^  ([A-Z][A-Z_]+) = [\[{"]/gm)) dataLeft.push(`${f} ${m[1]}${DATA.includes(m[1]) ? " (configuration)" : ""}`);
}
console.log(`Copy slots still typed in pages: ${copyLeft}`);
console.log(`Messages still typed in code:     ${msgLeft}`);
console.log(`Class-field data still in pages:  ${dataLeft.length}${dataLeft.length ? ` (${dataLeft.join(", ")})` : ""}`);
if (LIST)
  for (const r of rows.filter((r) => r.copy.length || r.msgs.length)) {
    console.log(`\n${r.file}`);
    for (const c of r.copy) console.log(`  copy  ${c.slice(0, 110)}`);
    for (const m of r.msgs) console.log(`  msg   ${m.slice(0, 110)}`);
  }
