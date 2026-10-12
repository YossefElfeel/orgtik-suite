import {auditState} from "../lib/audit-state.mjs";
// Website Manager: the Overview's website numbers (parity with the old content dashboard's
// overview: KPI cards, visits against the previous period, top services and articles, article views
// by topic), with the work queue above them.
//   - the numbers say they're samples until analytics is connected
//   - a period switch changes every figure; each chart can be read as a table
//   - Arabic reads right to left without overflow; the viewer role sees it too
//
//   node flows/wm-overview.mjs   (the Website Manager on :3007, the mock running)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-overview.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "overview");
const WM = webUrl("wm");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
const browser = await chromium.launch();
const results = [];

async function as(email, locale = "en", scheme = "light") {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(01|03|09|12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email);
  await page.goto(`${WM}/${locale}/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 30000 });
  return { ctx, page, errors };
}
async function run(title, fn) {
  const steps = [];
  const step = async (page, name, check) => {
    let ok = false;
    let note = "";
    try {
      const r = await check();
      ok = r === true || Boolean(r?.ok);
      note = r?.note ?? "";
    } catch (e) {
      note = String(e.message || e).split("\n")[0].slice(0, 220);
    }
    if (page) {
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`), fullPage: true }).catch(() => {});
    }
    steps.push({ name, ok, note });
  };
  await fn(step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps });
}
const figure = (page, name) => page.getByRole("figure", { name });
// A Stat: its label, then its figure, inside one card.
const statValue = (page, label) => page.getByText(label, { exact: true }).first().locator("xpath=ancestor::div[contains(@class,'rounded-card')][1]").locator(".font-display").first().innerText();

await run("The Overview shows the website's numbers, marked as samples", async (step) => {
  const mona = await as("mona.adel@orgtik.test");
  await step(mona.page, "sample-badge-and-stats", async () => {
    await mona.page.getByText("Sample data").waitFor({ timeout: 20000 });
    await figure(mona.page, "Visits").locator("svg").first().waitFor({ timeout: 20000 });
    const charts = await mona.page.getByRole("figure").count();
    const visits = await statValue(mona.page, "Visits");
    return { ok: charts === 4 && /\d/.test(visits), note: `${charts} charts; visits ${visits}` };
  });
  await step(mona.page, "period-switch", async () => {
    const before = await statValue(mona.page, "Visits");
    await mona.page.getByRole("button", { name: "12 months" }).click();
    await mona.page.getByText("The last 12 months, month by month, against the year before").waitFor({ timeout: 15000 });
    await mona.page.waitForTimeout(500);
    const after = await statValue(mona.page, "Visits");
    return { ok: before !== after, note: `30 days ${before} → 12 months ${after}` };
  });
  await step(mona.page, "table-view", async () => {
    const pages = figure(mona.page, "Most visited pages");
    await pages.getByRole("button", { name: "Table" }).click();
    const rows = await pages.locator("tbody tr").count();
    const first = await pages.locator("tbody tr").first().innerText();
    return { ok: rows === 8 && first.startsWith("/"), note: `${rows} rows; first: ${first.replace(/\s+/g, " ")}` };
  });
  await step(mona.page, "work-queue-still-first", async () => {
    const order = await mona.page.evaluate(() => [...document.querySelectorAll("h2")].map((h) => h.textContent));
    return { ok: order[0] === "Your work queue" && order[1] === "The website", note: order.join(" › ") };
  });
  await step(null, "console-clean", async () => ({ ok: !mona.errors.length, note: mona.errors.slice(0, 2).join(" | ") || "no errors" }));
  await mona.ctx.close();
});

await run("Arabic, dark, and the viewer role", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test", "ar", "dark");
  await step(hoda.page, "ar-dark-rtl", async () => {
    await hoda.page.getByText("بيانات تجريبية").waitFor({ timeout: 20000 });
    await hoda.page.getByRole("figure", { name: "الزيارات" }).locator("svg").first().waitFor({ timeout: 20000 });
    const dir = await hoda.page.evaluate(() => document.documentElement.dir);
    const overflow = await hoda.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    return { ok: dir === "rtl" && !overflow, note: `dir=${dir}, page overflow ${overflow}` };
  });
  await hoda.ctx.close();
});

await browser.close();
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
