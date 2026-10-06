import {auditState} from "../lib/audit-state.mjs";
// Website Manager: Preview, the real site with unpublished drafts (plan: "Preview tokens show the
// real site in 390/768/1440 frames, with a fit check").
//   - an editor's draft shows in all three frames while the live site stays as published
//   - the editor's Preview button opens the entry's own address
//   - the token never appears in an address; the drafts can't be read without a valid one
//   - the page works in Arabic (right to left)
//
//   node flows/wm-preview.mjs   (the Website Manager on :3007, the website on :4173, the mock running)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-preview.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "preview");
const WM = webUrl("wm");
const SITE = "http://127.0.0.1:4173";
const API = `${apiUrl("wm")}/v2`;
const DRAFT_NAME = "Identity system, previewed";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.realClock().catch(() => {});
await mock.reset();
const browser = await chromium.launch();
const results = [];

async function as(email, locale = "en") {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(01|03|09|12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email);
  await page.goto(`${WM}/${locale}/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 30000 });
  return { ctx, page, token, errors };
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
      await page.screenshot({ path: path.join(OUT, `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`) }).catch(() => {});
    }
    steps.push({ name, ok, note });
  };
  await fn(step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps });
}
const call = async (token, method, p, body, version) => {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(version != null ? { "if-match": String(version) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return (await r.json()).data;
};

await run("A draft shows in the preview frames, not on the live site", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  const e = await call(hoda.token, "GET", "/admin/entries/caseStudy/cs_01");
  await call(hoda.token, "PATCH", "/admin/entries/caseStudy/cs_01", { locale: "en", fields: { ...e.content.locales.en, name: DRAFT_NAME } }, e.version);
  await step(hoda.page, "editor-preview-button", async () => {
    await hoda.page.goto(`${WM}/en/content/work/cs_01`, { waitUntil: "networkidle" });
    await hoda.page.getByRole("button", { name: "Preview", exact: true }).click();
    await hoda.page.waitForURL(/\/preview\?path=/, { timeout: 15000 });
    const url = new URL(hoda.page.url());
    return { ok: url.searchParams.get("path") === "/work/orgtik-identity-system", note: url.pathname + url.search };
  });
  await step(hoda.page, "three-frames-fit", async () => {
    for (const label of ["Phone", "Tablet", "Desktop"]) await hoda.page.getByRole("figure").filter({ hasText: label }).getByText(/Fits the width|Wider than the screen/).waitFor({ timeout: 30000 });
    const fits = await hoda.page.getByText("Fits the width").count();
    return { ok: fits === 3, note: `${fits}/3 frames fit their width` };
  });
  await step(hoda.page, "draft-in-every-frame", async () => {
    const seen = [];
    for (const key of ["phone", "tablet", "desktop"]) {
      const frame = hoda.page.frameLocator(`iframe[title="${key}"]`);
      await frame.getByText(DRAFT_NAME).first().waitFor({ timeout: 20000 });
      seen.push(key);
    }
    return { ok: seen.length === 3, note: `“${DRAFT_NAME}” in ${seen.join(", ")}` };
  });
  await step(hoda.page, "token-not-in-any-address", async () => {
    const srcs = await hoda.page.locator("iframe").evaluateAll((els) => els.map((f) => f.src));
    const token = await hoda.page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name).filter((n) => n.includes("preview-token")).length);
    return { ok: srcs.length === 3 && srcs.every((s) => /\?preview$/.test(s)), note: `${srcs[0]} (token requests: ${token})` };
  });
  const visitor = await browser.newPage();
  await step(visitor, "live-site-unchanged", async () => {
    await visitor.goto(`${SITE}/work/orgtik-identity-system`, { waitUntil: "networkidle" });
    await visitor.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 20000 });
    const text = await visitor.evaluate(() => document.body.innerText);
    return { ok: !text.includes(DRAFT_NAME) && text.includes("OrgTik identity system"), note: "the live page still says “OrgTik identity system”" };
  });
  // Opened directly (not in a frame), ?preview does nothing: no token is asked for, nothing waits.
  await step(visitor, "preview-flag-outside-a-frame", async () => {
    await visitor.goto(`${SITE}/work/orgtik-identity-system?preview`, { waitUntil: "networkidle" });
    const text = await visitor.evaluate(() => document.body.innerText);
    return { ok: !text.includes(DRAFT_NAME) && text.includes("OrgTik identity system"), note: "published content" };
  });
  await visitor.close();
  await step(null, "console-clean", async () => ({ ok: !hoda.errors.length, note: hoda.errors.slice(0, 2).join(" | ") || "no errors" }));
  await hoda.ctx.close();
});

await run("Drafts can't be read without a preview token", async (step) => {
  await step(null, "no-token-401", async () => {
    const none = await fetch(`${API}/preview/entries/caseStudy`);
    const bogus = await fetch(`${API}/preview/entries/caseStudy`, { headers: { authorization: "Preview not-a-token" } });
    const bearer = await fetch(`${API}/preview/entries/caseStudy`, { headers: { authorization: `Bearer ${await tokenFor("hoda.ashraf@orgtik.test")}` } });
    return { ok: [none.status, bogus.status, bearer.status].every((s) => s === 401), note: `none ${none.status}, bogus ${bogus.status}, a sign-in token ${bearer.status}` };
  });
  await step(null, "viewer-without-content-cannot-mint", async () => {
    const r = await fetch(`${API}/admin/preview-token`, { method: "POST" });
    return { ok: r.status === 401, note: `anonymous: ${r.status}` };
  });
});

await run("Preview works in Arabic", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test", "ar");
  await step(hoda.page, "ar-rtl", async () => {
    // The frames stream the site's videos, so network idle comes and goes: wait for the page itself.
    await hoda.page.goto(`${WM}/ar/preview?path=/services`, { waitUntil: "load" });
    await hoda.page.getByRole("heading", { level: 1, name: "المعاينة" }).waitFor({ timeout: 20000 });
    await hoda.page.getByText("مناسب للعرض").first().waitFor({ timeout: 30000 });
    const dir = await hoda.page.evaluate(() => document.documentElement.dir);
    const overflow = await hoda.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    return { ok: dir === "rtl" && !overflow, note: `dir=${dir}, page overflow ${overflow}` };
  });
  await hoda.ctx.close();
});

await mock.reset();
await browser.close();
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
