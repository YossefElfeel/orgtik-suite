// Content parity: every piece of data the website used to type into its pages, rebuilt from the
// Website Manager's snapshot, must equal the original exactly (D-035; plan: "a parity test per
// adapter"). The originals come from the D-031 baseline commit, not the working tree, so a page
// that already reads the snapshot is still checked against what it replaced.
//
//   node content-parity.mjs [--base 3a66678]
//
// Exits 1 on any difference and prints the first path that differs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "..", "..", "..", "orgtik-website");
// SITE_APP points at another checkout (a worktree, e.g. cms/connect rebuilt on a new main).
const APP = process.env.SITE_APP ?? path.join(SITE, "landing-directions");
const {WEBSITE_REF,ROADMAP_REF}=await import('../../../local-dev/apps/wm/seed/source-overrides.mjs');
const base = (() => {
  const i = process.argv.indexOf("--base");
  return i > 0 ? process.argv[i + 1] : WEBSITE_REF;
})();
const roadmapBase = process.argv.includes("--roadmap-base") ? process.argv[process.argv.indexOf("--roadmap-base") + 1] : ROADMAP_REF;
const { field } = await import(pathToFileURL(path.resolve(here, "..", "..", "..", "local-dev", "apps", "wm", "seed", "fields.mjs")).href);
const { content } = await import(pathToFileURL(path.join(APP, "src", "content", "index.js")).href);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "content-parity-"));
const original = (file) => {
  const out = path.join(tmp, file.replace(/\//g, "_"));
  if (!fs.existsSync(out)) fs.writeFileSync(out, execFileSync("git", ["-C", SITE, "show", `${file === "Roadmap.jsx" ? roadmapBase : base}:landing-directions/src/reference/${file}`], { encoding: "utf8", maxBuffer: 64 << 20 }));
  return out;
};
const moduleOf = async (file) => import("data:text/javascript;charset=utf-8," + encodeURIComponent(fs.readFileSync(original(file), "utf8")));

// [page file, class field, adapter]
// Since c8be7fe the families, software products, plans and prices live in the website's purchasing
// catalogs (read by the cart and checkout); the website keeps them, so they aren't adapters any more.
const FIELDS = [
  ["About.jsx", "SVC_FAM", "FAM"],
  ["Services.jsx", "STORIES", "STORIES"],
  ["Services.jsx", "STEPS", "STEPS"],
  ["Home.jsx", "STEPS", "STEPS"],
  ["Home.jsx", "MODS", "HOME_MODS"],
  ["Home.jsx", "HERO_WORDS", "HERO_WORDS"],
  ["Home.jsx", "SVCS", "SVCS"],
  ["Home.jsx", "FAQS", "FAQS"],
  ["Software.jsx", "STEPS", "SOFTWARE_STEPS"],
  ["Software.jsx", "FLOW", "FLOW"],
  ["Software.jsx", "CTX", "CTX"],
  ["Insights.jsx", "INS", "INS"],
  ["Insights.jsx", "ART", "ART"],
  ["Insights.jsx", "SVC", "SVC"],
  ["About.jsx", "JR", "JR"],
  ["About.jsx", "CAPS", "CAPS"],
  ["Contact.jsx", "TOPICS", "TOPICS"],
  ["Contact.jsx", "PATHS", "PATHS"],
  ["Roadmap.jsx", "RM", "RM"],
  ["Roadmap.jsx", "IDEAS", "IDEAS"],
  ["Legal.jsx", "LG", "LG"],
  ...["Home", "Services", "Software", "Work", "About", "Insights", "Contact", "Roadmap", "Legal", "SignIn"].map((p) => [`${p}.jsx`, "SOCIALS", "SOCIALS"]),
];
const MODULES = [
  ["projects.js", "PROJECTS", "PROJECTS"],
  ["case-studies.js", "CASE_STUDIES", "CASE_STUDIES"],
  ["case-studies.js", "CASE_STUDY_FORMATS", "CASE_STUDY_FORMATS"],
  // The Website Manager's read-only mirror of the catalog's families (About.jsx still reads it).
  ["service-catalog.js", "SERVICE_FAMILIES", "FAM"],
];

// The first path where two values differ (object keys in any order; arrays in order).
function differ(a, b, at = "") {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) return `${at || "(root)"}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return `${at}: length ${a.length} ≠ ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const d = differ(a[i], b[i], `${at}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (a && typeof a === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const d = differ(a[k], b[k], `${at}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return a === b ? null : `${at}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`;
}

let bad = 0;
const report = (name, orig, built) => {
  const d = differ(orig, built);
  if (d) bad++;
  console.log(`${d ? "DIFF" : "same"}  ${name}${d ? `  ${d}` : ""}`);
};
for (const [file, name, adapter] of FIELDS) {
  let baseline;
  try { baseline = field(original(file), name); }
  catch (error) {
    // Main no longer publishes fabricated roadmap items or a full roadmap page.
    if (file === "Roadmap.jsx" && error.message.startsWith(`${name} not found`)) {
      if (name === "RM" || name === "IDEAS") report(`${file} ${name}`, [], content[adapter]());
      continue;
    }
    throw error;
  }
  report(`${file} ${name}`, baseline, content[adapter]());
}
for (const [file, name, adapter] of MODULES) {
  let expected=(await moduleOf(file))[name];
  if(name==='CASE_STUDIES')expected=Object.fromEntries(Object.entries(expected).map(([slug,study])=>[slug,{...study,approved:false,sample:true}]));
  report(`${file} ${name}`,expected,content[adapter]());
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} difference(s) against ${base} / Roadmap ${roadmapBase}` : `\nAll content equals ${base}; restored Roadmap equals ${roadmapBase}.`);
process.exit(bad ? 1 : 0);
