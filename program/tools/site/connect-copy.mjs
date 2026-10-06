// Connects the website's page copy to the Website Manager (D-035, orgtik-website cms/connect).
//
// Every copy slot the seed extracted (local-dev/apps/wm/seed/copy.mjs, same traversal, same keys)
// is replaced in the page source by a lookup:
//   - an attribute (alt, aria-label, placeholder, title):   alt={attr("pg_home|hero|img@alt")}
//   - a text run inside a heading, paragraph, link…:        {run("pg_home|closing|h2", 2)}
// The page keeps every element it had (marks, line wrappers, icons): only the words move out.
// src/content/copy-templates.js keeps, per slot, the published English it was built from and each
// run's exact original text. A run renders that original while its part of the slot is unchanged
// in the Website Manager, so the page is identical until someone edits it; an edited part renders
// the new words with the original spacing. Slots whose text doesn't match the seed are left alone
// and reported.
//
//   node connect-copy.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "..");
// SITE_APP points at another checkout of the website (a worktree, e.g. when the branch is rebuilt on a new main).
const APP = process.env.SITE_APP ?? path.join(ROOT, "orgtik-website", "landing-directions");
const REF = path.join(APP, "src", "reference");
const DRY = process.argv.includes("--dry");
const { extractCopy, tidy } = await import(pathToFileURL(path.join(ROOT, "local-dev", "apps", "wm", "seed", "copy.mjs")).href);
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "local-dev", "apps", "wm", "seed", "website.json"), "utf8"));
const byId = new Map(seed.entries.map((e) => [e.id, e]));

const PAGES = [
  ["home", "Home.jsx"],
  ["services", "Services.jsx"],
  ["software", "Software.jsx"],
  ["work", "Work.jsx"],
  ["about", "About.jsx"],
  ["insights", "Insights.jsx"],
  ["contact", "Contact.jsx"],
  ["roadmap", "Roadmap.jsx"],
  ["legal", "Legal.jsx"],
  ["signIn", "SignIn.jsx"],
  // Shared components: their copy is the global "Shared components" entry, a section per region.
  ["caseStudy", "CaseStudy.jsx", "gl_components"],
  ["serviceWork", "ServiceWork.jsx", "gl_components"],
  ["testimonials", "Testimonials.jsx", "gl_components"],
  // The purchasing views since c8be7fe: the global "Purchasing" entry.
  ["purchaseUI", "PurchaseUI.jsx", "gl_commerce"],
  ["purchaseControls", "PurchaseControls.jsx", "gl_commerce"],
  ["commerceLayout", "CommerceLayout.jsx", "gl_commerce"],
  ["purchasePlans", "PurchasePlans.jsx", "gl_commerce"],
  ["purchaseCart", "PurchaseCart.jsx", "gl_commerce"],
  ["purchaseCheckout", "PurchaseCheckout.jsx", "gl_commerce"],
  ["siteHeader", "SiteHeader.jsx", "gl_commerce"],
  ["accountControl", "AccountControl.jsx", "gl_commerce"],
  ["paymentDetails", "PaymentDetails.jsx", "gl_commerce"],
];
const INLINE = new Set(["em", "strong", "b", "i", "span", "br", "sup", "sub", "small", "mark", "u"]);
const TAG = /<\/?[a-z][a-z0-9]*\/?>/;
const nameOf = (el) => (el.openingElement.name.type === "JSXIdentifier" ? el.openingElement.name.name : null);
const squash = (s) => s.replace(/\s+/g, " ");

// What React renders for a JSX text node (Babel's cleanJSXElementLiteralChild).
function cook(value) {
  const lines = value.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => /[^ \t]/.test(l) && (last = i));
  let out = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i !== 0) t = t.replace(/^[ ]+/, "");
    if (i !== lines.length - 1) t = t.replace(/[ ]+$/, "");
    if (t) out += t + (i !== last ? " " : "");
  });
  return out;
}

// The block's children as a tree whose text leaves remember the source nodes (runs) they came from.
function tree(children, runs) {
  const out = [];
  for (const c of children) {
    if (c.type === "JSXText") {
      const id = runs.push({ node: c, orig: cook(c.value) }) - 1;
      out.push({ s: squash(c.value), runs: [id] });
    } else if (c.type === "JSXExpressionContainer") {
      if (c.expression.type === "JSXEmptyExpression") continue;
      if (c.expression.type !== "StringLiteral") return null;
      const id = runs.push({ node: c, orig: c.expression.value }) - 1;
      out.push({ s: c.expression.value, runs: [id] });
    } else if (c.type === "JSXElement") {
      const n = nameOf(c);
      if (!n || !INLINE.has(n)) return null;
      if (n === "br") {
        out.push({ br: true });
        continue;
      }
      const kids = tree(c.children, runs);
      if (!kids) return null;
      const plain = c.openingElement.attributes.length === 0 && n !== "span";
      out.push({ tag: plain ? n : "m", kids });
    } else return null;
  }
  return out;
}
const isText = (k) => "s" in k;
const isMark = (k) => k.tag === "m";
const words = (k) => (isText(k) ? k.s : k.br ? "" : k.kids.map(words).join(""));
const merge = (list) =>
  list.reduce((acc, k) => {
    const last = acc[acc.length - 1];
    if (isText(k) && last && isText(last)) return [...acc.slice(0, -1), { s: last.s + k.s, runs: [...last.runs, ...k.runs] }];
    return [...acc, k];
  }, []);

// tidy() (copy.mjs), step for step, on the tree: which runs end up in which segment of the value.
function segmentsOf(children, runs) {
  let root = tree(children, runs);
  if (!root) return null;
  root = merge(root);
  // slot text is trimmed before tidy
  if (root.length && isText(root[0])) root[0] = { ...root[0], s: root[0].s.trimStart() };
  if (root.length && isText(root[root.length - 1])) root[root.length - 1] = { ...root[root.length - 1], s: root[root.length - 1].s.trimEnd() };
  const clean = (kids) =>
    merge(
      kids
        .map((k) => (k.kids ? { ...k, kids: clean(k.kids) } : k))
        .filter((k) => !(isMark(k) && words(k).trim() === ""))
        .map((k) => {
          if (!isMark(k)) return k;
          const inner = k.kids.filter((c) => !(isText(c) && c.s.trim() === ""));
          return inner.length === 1 && !isText(inner[0]) ? inner[0] : k;
        }),
    );
  let kids = clean(root);
  const solid = kids.filter((c) => !(isText(c) && c.s.trim() === ""));
  if (solid.length === 1 && isMark(solid[0])) kids = solid[0].kids;
  // Serialise into tokens: text (with its runs) and tags.
  const tokens = [];
  const out = (list, inMark) =>
    list.forEach((k, i) => {
      if (isText(k)) {
        let t = k.s.replace(/\s+/g, " ");
        if (inMark && i === 0) t = t.trimStart();
        if (inMark && i === list.length - 1) t = t.trimEnd();
        tokens.push({ t, runs: k.runs });
      } else if (k.br) tokens.push({ tag: "<br/>" });
      else {
        tokens.push({ tag: `<${k.tag}>` });
        out(k.kids, true);
        tokens.push({ tag: `</${k.tag}>` });
      }
    });
  out(kids, false);
  // The final whole-string collapse and trim.
  const texts = tokens.filter((x) => "t" in x);
  if (tokens.length && "t" in tokens[0]) tokens[0].t = tokens[0].t.trimStart();
  if (tokens.length && "t" in tokens[tokens.length - 1]) tokens[tokens.length - 1].t = tokens[tokens.length - 1].t.trimEnd();
  for (const x of texts) x.t = x.t.replace(/\s+/g, " ");
  // Segments as String.split(TAG) makes them, with the runs behind each.
  const segs = [{ t: "", runs: [] }];
  let str = "";
  for (const x of tokens) {
    if ("tag" in x) {
      segs.push({ t: "", runs: [] });
      str += x.tag;
    } else {
      segs[segs.length - 1].t += x.t;
      segs[segs.length - 1].runs.push(...x.runs);
      str += x.t;
    }
  }
  // The tidy() output renumbers marks m1, m2… in order; the tags themselves don't matter here.
  return { str, segs };
}

const report = { connected: 0, skipped: [] };
// Runs again over pages already connected: what's done stays, what's new is added.
const TEMPLATES = path.join(APP, "src", "content", "copy-templates.js");
const templates = fs.existsSync(TEMPLATES) ? (await import(`${pathToFileURL(TEMPLATES).href}?t=${Date.now()}`)).default : {};
for (const [pageKey, file, component] of PAGES) {
  const full = path.join(REF, file);
  const { regions, source } = extractCopy(full);
  const edits = [];
  for (const r of regions) {
    const entryId = component ?? (r.key === "header" || r.key === "footer" ? `gl_${r.key}` : `pg_${pageKey}`);
    const entry = byId.get(entryId);
    const region = component ? `${pageKey}-${r.key}` : r.key;
    for (const s of r.slots) {
      const key = `${entryId}|${region}|${s.key}`;
      const published = entry?.locales.en[region]?.[s.key];
      if (published !== s.text) {
        report.skipped.push(`${file} ${key}: ${published === undefined ? "not in the Website Manager" : "differs from the Website Manager"} (${JSON.stringify(s.text).slice(0, 60)})`);
        continue;
      }
      if (templates[key] && pageKey !== "home") {
        // The same global slot on another page: reuse the template when the runs match.
      }
      if (s.form === "attribute") {
        const v = s.node.value;
        const orig = v.type === "StringLiteral" ? v.value : v.expression.value;
        templates[key] ??= { seed: s.text, o: orig };
        if (templates[key].o !== orig) {
          report.skipped.push(`${file} ${key}: same slot, different original`);
          continue;
        }
        edits.push({ start: v.start, end: v.end, text: `{attr(${JSON.stringify(key)})}` });
      } else if (s.form === "text") {
        const orig = cook(s.node.value);
        const t = { seed: s.text, runs: [{ o: orig, s: 0, f: 1 }] };
        templates[key] ??= t;
        if (JSON.stringify(templates[key]) !== JSON.stringify(t)) {
          report.skipped.push(`${file} ${key}: same slot, different original`);
          continue;
        }
        edits.push({ start: s.node.start, end: s.node.end, text: `{run(${JSON.stringify(key)}, 0)}` });
      } else {
        const runs = [];
        const res = segmentsOf(s.node.children, runs);
        if (!res || res.str.replace(/<(\/?)m\d*>/g, "<$1m>") !== tidy(s.source ?? s.text).replace(/<(\/?)m\d+>/g, "<$1m>") || res.str.split(TAG).length !== s.text.split(TAG).length) {
          report.skipped.push(`${file} ${key}: the runs don't line up with the value`);
          continue;
        }
        // Each run: its segment (or none: it sat in a mark that holds no words) and whether it's
        // the first run of that segment with something to show.
        const segOf = new Map();
        const firstOf = new Map();
        res.segs.forEach((seg, i) => {
          for (const id of seg.runs) segOf.set(id, i);
          const first = seg.runs.find((id) => runs[id].orig !== "");
          if (first !== undefined) firstOf.set(i, first);
        });
        const out = runs.map((r, id) => ({ o: r.orig, s: segOf.has(id) ? segOf.get(id) : null, f: segOf.has(id) && firstOf.get(segOf.get(id)) === id ? 1 : 0 }));
        const t = { seed: s.text, runs: out };
        templates[key] ??= t;
        if (JSON.stringify(templates[key]) !== JSON.stringify(t)) {
          report.skipped.push(`${file} ${key}: same slot, different original`);
          continue;
        }
        runs.forEach((r, i) => {
          if (r.orig === "") return; // whitespace React doesn't render: leave it as it is
          edits.push({ start: r.node.start, end: r.node.end, text: `{run(${JSON.stringify(key)}, ${i})}` });
        });
      }
      report.connected++;
    }
  }
  if (!edits.length) continue;
  let out = source;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  const imports = [...out.matchAll(/^import .*;$/gm)];
  const last = imports[imports.length - 1];
  if (!/from "\.\.\/content\/copy"/.test(out)) out = out.slice(0, last.index + last[0].length) + `\nimport { attr, run } from "../content/copy";` + out.slice(last.index + last[0].length);
  if (!DRY) fs.writeFileSync(full, out);
  console.log(`${file}: ${edits.length} replacements`);
}
if (!DRY) {
  fs.writeFileSync(
    path.join(APP, "src", "content", "copy-templates.js"),
    `// Written by orgtik-program/tools/site/connect-copy.mjs: per copy slot, the published English it was\n// built from and each text run's original. Not content to edit (that's the Website Manager): the\n// shape the page falls back to, so it renders exactly as before until a slot changes.\nexport default ${JSON.stringify(templates, null, 1)};\n`,
  );
}
console.log(`\n${report.connected} slots connected, ${report.skipped.length} left as they were:`);
for (const x of report.skipped) console.log("  " + x);
