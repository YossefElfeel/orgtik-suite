// Visual regression and accessibility for every story, in six theme × language combinations.
//
//   pnpm --filter docs build          # storybook-static/
//   node tests/check.mjs              # compare against tests/baselines/, run axe
//   node tests/check.mjs --update     # accept the current look as the baseline
//   node tests/check.mjs --only display-all
//
// A story counts as changed if any pixel differs (pixelmatch threshold 0.1, 0 pixels allowed).
// Diffs go to tests/results/. axe runs on every combination; critical and serious
// violations fail the run. Report: tests/results/report.md.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import { VISUAL_ENVIRONMENT, createVisualPage, settleVisualStory, visualPageMetadata } from "./visual-environment.mjs";
import { compareVisualBaseline } from "./visual-baseline.mjs";
import { createReferenceResolver, captureStorySemantics, reviewedSemanticErrors } from "./platform-reference.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "storybook-static");
const baselines = path.join(here, "baselines");
const results = path.join(here, "results");
const args = process.argv.slice(2);
const update = args.includes("--update");
const ci = ["true", "1"].includes((process.env.CI ?? "").toLowerCase());
if (update && ci) throw new Error("Review and update references locally; CI must not accept its own snapshots.");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

// en and ar in both themes; de (long words) and fr (another Latin set) once each.
const COMBOS = [
  { id: "en-light", globals: "theme:light;locale:en" },
  { id: "en-dark", globals: "theme:dark;locale:en" },
  { id: "ar-light", globals: "theme:light;locale:ar" },
  { id: "ar-dark", globals: "theme:dark;locale:ar" },
  { id: "de-light", globals: "theme:light;locale:de" },
  { id: "fr-dark", globals: "theme:dark;locale:fr" },
];

if (!fs.existsSync(path.join(root, "index.json"))) {
  console.error("No storybook-static/. Run `pnpm --filter docs build` first.");
  process.exit(2);
}
const index = JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
const stories = Object.values(index.entries)
  .filter((e) => e.type === "story" && !e.id.endsWith("--playground") && (!only || e.id.includes(only)))
  .map((e) => e.id);

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http
  .createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(data);
    });
  })
  .listen(0);
const port = await new Promise((r) => server.on("listening", () => r(server.address().port)));

fs.mkdirSync(baselines, { recursive: true });
fs.rmSync(results, { recursive: true, force: true });
fs.mkdirSync(results, { recursive: true });

const browser = await chromium.launch();
const rows = [];
const rendering = { expected: VISUAL_ENVIRONMENT, platform: process.platform, release: os.release(), browser: browser.version(), referenceProfile: process.env.ORGTIK_VISUAL_REFERENCE_PROFILE ?? "default", sourceCommit: process.env.GITHUB_SHA ?? null, runnerImage: process.env.ImageOS ?? null, runnerImageVersion: process.env.ImageVersion ?? null, renders: [] };
const resolveReference = createReferenceResolver({ defaultDirectory: baselines, ci, requestedProfile: process.env.ORGTIK_VISUAL_REFERENCE_PROFILE ?? "", rendering: { platform: rendering.platform, release: rendering.release, browser: rendering.browser, ...VISUAL_ENVIRONMENT } });
for (const story of stories) {
  for (const combo of COMBOS) {
    const { context, page } = await createVisualPage(browser);
    const errors = [];
    const resourceErrors = [];
    page.on("requestfailed", request => resourceErrors.push({ url: request.url(), failure: request.failure() }));
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`http://localhost:${port}/iframe.html?id=${story}&viewMode=story&globals=${combo.globals}`, { waitUntil: "networkidle" });
    try { await settleVisualStory(page, combo.globals); }
    catch (error) { console.error(JSON.stringify({ story, combo: combo.id, resourceErrors })); throw error; }
    const metadata = await visualPageMetadata(context, page);

    const name = `${story}--${combo.id}.png`;
    const shot = PNG.sync.read(await page.screenshot({ fullPage: true }));
    const reference = resolveReference(name);
    const semantics = reference.review ? await captureStorySemantics(page) : null;
    const reviewErrors = reference.review ? reviewedSemanticErrors(reference.review, semantics, metadata.platformFonts) : [];
    rendering.renders.push({ story, combo: combo.id, referenceProfile: reference.profile, ...metadata, ...(semantics ? { semantics } : {}) });
    const { visual, changed, diff } = compareVisualBaseline(shot, update ? path.join(baselines, name) : reference.path, { update });
    if (visual !== "same" && !update) {
      if (changed) fs.writeFileSync(path.join(results, name.replace(".png", ".diff.png")), PNG.sync.write(diff));
      fs.writeFileSync(path.join(results, name), PNG.sync.write(shot));
    }

    // A page wider than the viewport means something escaped its container (in RTL, often an
    // absolutely placed element under a scroller: VS-1 found one in DataTable).
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => {
      // @ts-ignore
      const r = await window.axe.run(document.querySelector("#storybook-root") ?? document, { resultTypes: ["violations"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    });
    const serious = axe.filter((v) => v.impact === "critical" || v.impact === "serious");
    rows.push({ story, combo: combo.id, visual, axe: serious, minor: axe.length - serious.length, errors, overflow, reviewErrors });
    await context.close();
  }
  process.stdout.write(".");
}
await browser.close();
server.close();

const failedVisual = rows.filter((r) => r.visual !== "same" && !update);
const failedAxe = rows.filter((r) => r.axe.length);
const withErrors = rows.filter((r) => r.errors.length);
const overflowing = rows.filter((r) => r.overflow > 0);
const failedReview = rows.filter(r => r.reviewErrors.length);
const axeById = {};
for (const r of failedAxe) for (const v of r.axe) (axeById[v.id] ??= new Set()).add(`${r.story} (${r.combo})`);

const md = [
  "# Storybook check",
  "",
  `${stories.length} stories × ${COMBOS.length} combinations = ${rows.length} renders${update ? " (baselines updated)" : ""}.`,
  "",
  `- Visual: ${rows.filter((r) => r.visual === "same").length} same, ${rows.filter((r) => r.visual === "updated").length} reviewed baseline updates, ${failedVisual.length} changed/missing`,
  `- axe critical/serious: ${failedAxe.length} renders with violations; ${rows.reduce((n, r) => n + r.minor, 0)} moderate/minor findings in total`,
  `- Console errors: ${withErrors.length} renders`,
  `- Page wider than the viewport: ${overflowing.length} renders`,
  `- Reviewed platform text/layout/fonts: ${failedReview.length} mismatches`,
  "",
  failedVisual.length ? "## Changed\n\n| Story | Combination | Pixels |\n|---|---|---|\n" + failedVisual.map((r) => `| ${r.story} | ${r.combo} | ${r.visual} |`).join("\n") + "\n" : "",
  Object.keys(axeById).length
    ? "## axe (critical and serious)\n\n| Rule | Where |\n|---|---|\n" + Object.entries(axeById).map(([id, where]) => `| ${id} | ${[...where].join(", ")} |`).join("\n") + "\n"
    : "",
  overflowing.length ? "## Page overflow\n\n" + overflowing.map((r) => `- ${r.story} (${r.combo}): ${r.overflow}px`).join("\n") + "\n" : "",
  withErrors.length ? "## Console errors\n\n" + withErrors.map((r) => `- ${r.story} (${r.combo}): ${r.errors[0].slice(0, 200)}`).join("\n") + "\n" : "",
  failedReview.length ? "## Reviewed platform invariants\n\n" + failedReview.map(r => `- ${r.story} (${r.combo}): ${r.reviewErrors.join("; ")}`).join("\n") + "\n" : "",
].join("\n");
fs.writeFileSync(path.join(results, "report.md"), md);
fs.writeFileSync(path.join(results, "environment.json"), JSON.stringify(rendering, null, 2) + "\n");
console.log("\n" + md);
process.exit(failedVisual.length || failedAxe.length || withErrors.length || overflowing.length || failedReview.length ? 1 : 0);
