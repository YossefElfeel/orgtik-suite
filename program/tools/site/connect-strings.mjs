// Connects the messages the website builds in code to the Website Manager's Strings (D-035).
//
// Every place a message is written (a string, a concatenation, a template literal; the seed's
// extractor finds them the same way) becomes msg(id, [its moving parts]):
//   "Showing " + shown + " of " + total        →  msg("Services:14", [shown, total])
// src/content/strings-templates.js keeps, per place, the message's key in the Website Manager, its
// published English and the original pieces, so an unchanged message is built exactly as before;
// an edited one fills its {0}, {1} with the same parts. A message inside another's parts is
// replaced inside it. A concatenation that starts with two expressions (which JS might add as
// numbers) is left alone, as is any message the Website Manager doesn't hold.
//
//   node connect-strings.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "..");
// SITE_APP points at another checkout of the website (a worktree, e.g. when the branch is rebuilt on a new main).
const APP = process.env.SITE_APP ?? path.join(ROOT, "orgtik-website", "landing-directions");
const REF = path.join(APP, "src", "reference");
const DRY = process.argv.includes("--dry");
const { extractStrings } = await import(pathToFileURL(path.join(ROOT, "local-dev", "apps", "wm", "seed", "strings.mjs")).href);
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "local-dev", "apps", "wm", "seed", "website.json"), "utf8"));

// message text → "entry|block|slot", per strings entry
const keysOf = (id) => {
  const e = seed.entries.find((x) => x.id === id);
  const map = new Map();
  for (const sec of e?.layout ?? []) for (const slot of sec.slots) map.set(e.locales.en[sec.key][slot.key], `${id}|${sec.key}|${slot.key}`);
  return map;
};
const shared = keysOf("st_shared");
const FILES = [
  ["Home.jsx", "st_home"],
  ["Services.jsx", "st_services"],
  ["Software.jsx", "st_software"],
  ["Work.jsx", "st_work"],
  ["About.jsx", "st_about"],
  ["Insights.jsx", "st_insights"],
  ["Contact.jsx", "st_contact"],
  ["Roadmap.jsx", "st_roadmap"],
  ["Legal.jsx", "st_legal"],
  ["SignIn.jsx", "st_signIn"],
  ["CaseStudy.jsx", "st_components"],
  ["Testimonials.jsx", "st_components"],
  ["ServiceWork.jsx", "st_components"],
  ["LanguageMenu.jsx", "st_components"],
  ["PurchaseUI.jsx", "st_commerce"],
  ["PurchaseControls.jsx", "st_commerce"],
  ["CommerceLayout.jsx", "st_commerce"],
  ["PurchasePlans.jsx", "st_commerce"],
  ["PurchaseCart.jsx", "st_commerce"],
  ["PurchaseCheckout.jsx", "st_commerce"],
  ["SiteHeader.jsx", "st_commerce"],
  ["AccountControl.jsx", "st_commerce"],
  ["PaymentDetails.jsx", "st_commerce"],
  ["purchase-payment.js", "st_commerce"],
  ["purchase-identity.js", "st_commerce"],
  ["purchase-adapter.js", "st_commerce"],
];

// Runs again over files already connected: what's done stays, new places continue the numbering.
const TEMPLATES = path.join(APP, "src", "content", "strings-templates.js");
const templates = fs.existsSync(TEMPLATES) ? (await import(`${pathToFileURL(TEMPLATES).href}?t=${Date.now()}`)).default : {};
let connected = 0;
const skipped = [];
for (const [file, entryId] of FILES) {
  const full = path.join(REF, file);
  const source = fs.readFileSync(full, "utf8");
  const own = keysOf(entryId);
  const occ = extractStrings(full).occurrences;
  const base = file.replace(/\.jsx?$/, "");
  let n = Math.max(0, ...Object.keys(templates).filter((k) => k.startsWith(`${file.replace(/\.jsx?$/, "")}:`)).map((k) => Number(k.split(":")[1])));
  const edits = [];
  for (const o of occ) {
    const key = shared.get(o.text) ?? own.get(o.text);
    if (!key) continue; // not a message the Website Manager holds (page copy, data, or code)
    if (o.shape.length > 1 && typeof o.shape[0] !== "string" && typeof o.shape[1] !== "string") {
      skipped.push(`${file}: ${JSON.stringify(o.text).slice(0, 60)} (starts with two expressions)`);
      continue;
    }
    let argIndex = 0;
    const args = [];
    const shape = o.shape.map((p) => {
      if (typeof p === "string") return p;
      args.push(p.expr);
      return argIndex++;
    });
    const joined = shape.map((p) => (typeof p === "number" ? `{${p}}` : p)).join("");
    const seedText = joined.replace(/\s+/g, " ").trim();
    if (seedText !== o.text) {
      skipped.push(`${file}: ${JSON.stringify(o.text).slice(0, 60)} (pieces don't rebuild it)`);
      continue;
    }
    const id = `${base}:${++n}`;
    templates[id] = { k: key, seed: o.text, shape, lead: joined.match(/^\s*/)[0], trail: joined.match(/\s*$/)[0] };
    // A string given straight to a JSX attribute (label="…") needs braces once it's a call.
    const attr = source[o.node.start - 1] === "=" && o.node.type === "StringLiteral";
    edits.push({ start: o.node.start, end: o.node.end, id, args, attr });
    connected++;
  }
  if (!edits.length) continue;
  // Apply edits inside a range, innermost first: an argument can hold another message.
  const within = (start, end, pool) => pool.filter((e) => e.start >= start && e.end <= end && !(e.start === start && e.end === end));
  const top = (list) => list.filter((e) => !list.some((x) => x !== e && x.start <= e.start && x.end >= e.end && (x.start !== e.start || x.end !== e.end)));
  const render = (start, end) => {
    const inner = top(within(start, end, edits)).sort((a, b) => b.start - a.start);
    let text = source.slice(start, end);
    for (const e of inner) text = text.slice(0, e.start - start) + callOf(e) + text.slice(e.end - start);
    return text;
  };
  const callOf = (e) => {
    const call = `msg(${JSON.stringify(e.id)}${e.args.length ? `, [${e.args.map((a) => render(a.start, a.end)).join(", ")}]` : ""})`;
    return e.attr ? `{${call}}` : call;
  };
  let out = render(0, source.length);
  const imports = [...out.matchAll(/^import .*;$/gm)];
  const last = imports[imports.length - 1];
  if (!/from "\.\.\/content\/strings(?:\.js)?"/.test(out)) {
    const at = last ? last.index + last[0].length : 0;
    out = out.slice(0, at) + `\nimport { msg } from "../content/strings.js";\n` + out.slice(at);
  }
  if (!DRY) fs.writeFileSync(full, out);
  console.log(`${file}: ${edits.length} messages`);
}
if (!DRY) {
  fs.writeFileSync(
    path.join(APP, "src", "content", "strings-templates.js"),
    `// Written by orgtik-program/tools/site/connect-strings.mjs: per place a message is built, its key in\n// the Website Manager, its published English and the original pieces. Not content to edit (that's the\n// Website Manager): the shape an unchanged message is rebuilt from, exactly as before.\nexport default ${JSON.stringify(templates, null, 1)};\n`,
  );
}
console.log(`\n${connected} places connected, ${skipped.length} left:`);
for (const s of skipped) console.log("  " + s);
