// Merges translated keys into the catalogs and keeps each one in step with en.json: keys in en's
// order, new translations added, keys en no longer has removed (Chats wave, FS-CHT-3).
//   node scripts/i18n-merge.mjs delta.json      delta: { "ar": { key: text }, "de": { … }, … }
//   node scripts/i18n-merge.mjs                 only re-order and drop stale keys
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (l) => path.join(ROOT, "messages", `${l}.json`);
const en = JSON.parse(fs.readFileSync(file("en"), "utf8"));
const delta = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : {};
for (const l of ["ar", "de", "fr", "it"]) {
  const cat = fs.existsSync(file(l)) ? JSON.parse(fs.readFileSync(file(l), "utf8")) : {};
  Object.assign(cat, delta[l] ?? {});
  const out = {};
  for (const k of Object.keys(en)) if (k in cat) out[k] = cat[k];
  const dropped = Object.keys(cat).filter((k) => !(k in en));
  fs.writeFileSync(file(l), JSON.stringify(out, null, 2) + "\n");
  console.log(`${l}: ${Object.keys(out).length}/${Object.keys(en).length}${dropped.length ? `, dropped ${dropped.join(", ")}` : ""}`);
}
