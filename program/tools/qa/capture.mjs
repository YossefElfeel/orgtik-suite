// Captures every website route at every width: a full-page screenshot, plus the visible text, the
// headings and the accessibility tree. Two captures of the same site commit must be identical;
// that is the harness checking itself before it checks anyone's change.
//
//   node capture.mjs --label pre-cms                       every route, every width
//   node capture.mjs --label try --widths 1440 --only /services
//
// Writes audits/website/parity/<label>/: <route>__<width>.png and .json, and manifest.json.
// The PNGs aren't committed (git ignores them); the JSON snapshots and the manifest are.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { CLOCK_START, OUT, SETTLE_MS, SITE, VIEWPORTS, args, load, newContext, readRoutes, siteCommit, slug, snapshot } from "./lib/site.mjs";

const opt = args({ label: "check" });
const widths = opt.widths ? String(opt.widths).split(",").map(Number) : Object.keys(VIEWPORTS).map(Number);
const routes = readRoutes().filter((r) => (!opt.only || r.includes(String(opt.only))) && (!opt.exact || String(opt.exact).split(",").includes(r)) && (!opt.exclude || r !== String(opt.exclude)));
const dir = path.join(OUT, "parity", String(opt.label));
fs.mkdirSync(dir, { recursive: true });

const commit = siteCommit();
if (commit.dirty) console.log(`Note: the website has uncommitted changes (HEAD ${commit.head}).`);

const browser = await chromium.launch();
const captures = opt.append && fs.existsSync(path.join(dir,"manifest.json")) ? JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8")).captures.filter(c => !routes.includes(c.route)) : [];
const started = Date.now();
try {
  for (const route of routes) {
    for (const width of widths) {
      const name = `${slug(route)}__${width}`;
      const context = await newContext(browser, width);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 200)));
      try {
        const rendered = await load(page, route);
        await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true, animations: "disabled", caret: "hide" });
        const snap = await snapshot(page);
        fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ route, width, rendered, errors, ...snap }, null, 2) + "\n");
        captures.push({ name, route, width, rendered, errors: errors.length });
        console.log(`${name}${rendered ? "" : "  (never rendered)"}${errors.length ? `  (${errors.length} page errors)` : ""}`);
      } catch (e) {
        captures.push({ name, route, width, failed: String(e.message).split("\n")[0] });
        console.log(`${name}  FAILED ${String(e.message).split("\n")[0]}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify({ label: opt.label, site: SITE, commit, at: new Date().toISOString(), clock: { start: CLOCK_START.toISOString(), settleMs: SETTLE_MS }, widths, captures }, null, 2) + "\n",
);
const failed = captures.filter((c) => c.failed || !c.rendered).length;
console.log(`\n${captures.length} captures in ${Math.round((Date.now() - started) / 1000)}s, ${failed} failed -> audits/website/parity/${opt.label}/`);
if (failed) process.exitCode = 1;
