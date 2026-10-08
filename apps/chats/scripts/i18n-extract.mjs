// Builds messages/en.json from the English defaults written at every t("key", "default") call, and
// checks the other catalogs against it (Chats wave, FS-CHT-3).
//
//   node scripts/i18n-extract.mjs           write en.json; report keys missing or extra in ar/de/fr/it
//   node scripts/i18n-extract.mjs --check   write nothing; exit 1 on drift (a default that changed, a
//                                           key used with two different defaults, catalogs out of step)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["app", "features", "components", "lib", "store", "entities", "mock"];
const LOCALES = ["en", "ar", "de", "fr", "it"];
const check = process.argv.includes("--check");

function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(tsx?|mjs)$/.test(e.name)) yield p;
  }
}

/** Reads a JS string literal starting at s[i] (a quote); returns [value, indexAfter] or null. */
function literal(s, i) {
  const q = s[i];
  if (q !== '"' && q !== "'" && q !== "`") return null;
  let out = "";
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") {
      const n = s[++j];
      out += n === "n" ? "\n" : n === "t" ? "\t" : n;
      continue;
    }
    if (q === "`" && c === "$" && s[j + 1] === "{") return null; // a template with values is not a default
    if (c === q) return [out, j + 1];
    out += c;
  }
  return null;
}

const skipSpace = (s, i) => {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
};

const found = new Map(); // key -> { text, where }
const conflicts = [];
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of files(abs)) {
    const src = fs.readFileSync(file, "utf8");
    // t("key", "text") at call sites; msg()/msgText()/titled() where a message is declared ahead of use.
    const re = /(?<![\w.$])(?:t|msg|msgText|titled)\(\s*/g;
    let m;
    while ((m = re.exec(src))) {
      let i = m.index + m[0].length;
      const key = literal(src, i);
      if (!key) continue;
      i = skipSpace(src, key[1]);
      if (src[i] !== ",") continue;
      i = skipSpace(src, i + 1);
      const text = literal(src, i);
      if (!text) continue;
      const where = `${path.relative(ROOT, file).replaceAll("\\", "/")}:${src.slice(0, m.index).split("\n").length}`;
      const seen = found.get(key[0]);
      if (seen && seen.text !== text[0]) conflicts.push(`${key[0]}: "${seen.text}" (${seen.where}) vs "${text[0]}" (${where})`);
      else if (!seen) found.set(key[0], { text: text[0], where });
    }
  }
}

const en = Object.fromEntries([...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v.text]));
const enFile = path.join(ROOT, "messages", "en.json");
const before = fs.existsSync(enFile) ? fs.readFileSync(enFile, "utf8") : "";
const eol = before.includes("\r\n") ? "\r\n" : "\n";
const after = (JSON.stringify(en, null, 2) + "\n").replace(/\n/g, eol);
let drift = conflicts.length > 0;
if (before !== after) {
  if (check) {
    drift = true;
    console.log("messages/en.json is out of date: run node scripts/i18n-extract.mjs");
  } else fs.writeFileSync(enFile, after);
}
for (const c of conflicts) console.log(`same key, two texts: ${c}`);

for (const l of LOCALES.slice(1)) {
  const file = path.join(ROOT, "messages", `${l}.json`);
  const cat = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const missing = Object.keys(en).filter((k) => !(k in cat));
  const extra = Object.keys(cat).filter((k) => !(k in en));
  if (missing.length || extra.length) drift = true;
  console.log(`${l}: ${Object.keys(en).length - missing.length}/${Object.keys(en).length}${missing.length ? `, ${missing.length} missing` : ""}${extra.length ? `, ${extra.length} extra (${extra.slice(0, 5).join(", ")})` : ""}`);
}
console.log(`${Object.keys(en).length} keys${conflicts.length ? `, ${conflicts.length} reused with a different text` : ""}`);
if (check && drift) process.exit(1);
