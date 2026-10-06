// Lists visible text that bypasses t(): JSX text, and literal values of the attributes and object
// fields people read (aria-label, title, placeholder, alt, label, hint, description …).
//   node scripts/i18n-literals.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["app", "features", "components", "lib", "store", "mock"];
const hits = [];
function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.tsx?$/.test(e.name)) yield p;
  }
}
const words = (s) => /[A-Za-z]{2,}/.test(s) && !/^[\w.-]+$/.test(s.trim()) || /^[A-Z][a-z]+$/.test(s.trim());
for (const dir of DIRS) {
  for (const file of files(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line) || /\bt\(|msg\(|console\.|import |throw new Error|className=/.test(line) && !/(aria-label|title|placeholder|alt)="/.test(line)) return;
      for (const m of line.matchAll(/\b(aria-label|title|placeholder|alt)="([^"{}]+)"/g)) if (words(m[2])) hits.push([rel, i + 1, m[1], m[2]]);
      for (const m of line.matchAll(/\b(label|hint|description|title|blurb|text|message|body|name)\s*:\s*"([^"]{3,})"/g)) if (words(m[2]) && /\s/.test(m[2])) hits.push([rel, i + 1, m[1], m[2]]);
      if (rel.endsWith(".tsx")) for (const m of line.matchAll(/>\s*([A-Za-z][^<>{}]*[a-z][^<>{}]*)\s*</g)) if (words(m[1])) hits.push([rel, i + 1, "jsx", m[1].trim()]);
    });
  }
}
if (process.argv.includes("--json")) console.log(JSON.stringify(hits));
else {
  for (const [f, l, k, v] of hits) console.log(`${f}:${l}  ${k}  ${v.slice(0, 90)}`);
  const byFile = {};
  for (const [f] of hits) byFile[f] = (byFile[f] ?? 0) + 1;
  console.log(`\n${hits.length} literals in ${Object.keys(byFile).length} files`);
}
