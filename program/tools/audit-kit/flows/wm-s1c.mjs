import {auditState} from "../lib/audit-state.mjs";
// Website Manager S1, Pages and Global, walked in the browser: a page's copy edited with its
// marks kept (and refused when they're dropped); a section translated into Arabic; the footer's
// links changed, reviewed and published to the public API; a social network's icon shared by
// every language; a page's search description filling an SEO gap in the overview.
//
//   node flows/wm-s1c.mjs      (the Website Manager on :3007 and the local-dev mock running)
//
// Resets the mock first. Writes audits/wm/flows/s1c.json (screenshots git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-s1c.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s1c");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
await mock.withoutSuggestions();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email);
  await page.goto(`${WM}/en/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 30000 });
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

const open = async (page, url) => {
  await page.goto(`${WM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("tablist").first().waitFor({ timeout: 30000 });
};
const api = async (token, p) => (await (await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${token}` } })).json()).data;
const saveDraft = async (page) => {
  await page.getByRole("button", { name: "Save draft" }).first().click();
  await page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
};
const HEADLINE = "<m1>What could we</m1> <m2>make <m3>together?</m3></m2>";

await run("A page's copy changes with its marks kept; dropping them is refused", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/pages/pg_home");
  await hoda.page.getByRole("tab", { name: "What could we build together?" }).click();
  const heading = hoda.page.getByRole("tabpanel").getByLabel("Heading");
  await step(hoda.page, "marks-dropped-refused", async () => {
    await heading.fill("What could we make together?");
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    await hoda.page.getByText("The marks must stay as in English.").waitFor({ timeout: 15000 });
    const e = await api(hoda.token, "/admin/entries/page/pg_home");
    return { ok: e.state === "published", note: "422 shown on the field; nothing saved" };
  });
  await step(hoda.page, "marks-kept-saved", async () => {
    await heading.fill(HEADLINE);
    await saveDraft(hoda.page);
    const e = await api(hoda.token, "/admin/entries/page/pg_home");
    return { ok: e.content.locales.en.closing.h2 === HEADLINE && e.state === "draft", note: `v${e.version}, ${e.state}` };
  });
  await step(hoda.page, "arabic-section", async () => {
    await hoda.page.getByRole("tab", { name: "العربية" }).click();
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    await hoda.page.getByRole("tab", { name: "What could we build together?" }).click();
    await hoda.page.getByRole("tabpanel").getByLabel("Heading").fill("<m1>ماذا يمكننا</m1> <m2>أن نصنع <m3>معًا؟</m3></m2>");
    await hoda.page.getByRole("tabpanel").getByLabel("Paragraph").fill("فكرتك التالية. طموحنا المشترك.");
    await saveDraft(hoda.page);
    const e = await api(hoda.token, "/admin/entries/page/pg_home");
    return { ok: e.translation.ar === "in_progress" && e.content.locales.ar.closing.p === "فكرتك التالية. طموحنا المشترك.", note: `ar ${e.translation.ar}` };
  });
  // The refused save above is a 422 on purpose; the browser logs it. Anything else is a fault.
  await step(null, "no-errors", async () => {
    const faults = hoda.errors.filter((e) => !/status of 422/.test(e));
    return { ok: faults.length === 0, note: faults[0] ?? "no console errors besides the expected 422" };
  });
  await hoda.ctx.close();
});

await run("The footer's links go through review to the website", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/global/gl_footer");
  await step(hoda.page, "edit-and-submit", async () => {
    await hoda.page.getByRole("tab", { name: "Explore links" }).click();
    await hoda.page.getByRole("tabpanel").getByLabel("Label").nth(2).fill("Our work");
    await saveDraft(hoda.page);
    await hoda.page.getByRole("button", { name: "Submit for review" }).click();
    await hoda.page.getByText("In review").first().waitFor({ timeout: 15000 });
    const seo = await hoda.page.getByRole("tab", { name: "SEO" }).count();
    return { ok: seo === 0, note: `in review; SEO tab on a global element: ${seo}` };
  });
  await hoda.ctx.close();
  const karim = await as("karim.hassan@orgtik.test");
  await open(karim.page, "/en/content/global/gl_footer");
  await step(karim.page, "approve-publish", async () => {
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor({ timeout: 15000 });
    await karim.page.getByRole("button", { name: /^Publish$/ }).click();
    const dialog = karim.page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: /^Publish$/ }).click();
    await dialog.waitFor({ state: "detached", timeout: 15000 });
    const pub = await (await fetch(`${API}/public/entries/global`)).json();
    const footer = pub.data.find((x) => x.id === "gl_footer");
    return { ok: footer.locales.en.explore[2].label === "Our work" && footer.locales.en.explore[2].href === "/work", note: `public: ${JSON.stringify(footer.locales.en.explore[2])}` };
  });
  await karim.ctx.close();
});

await run("A social network's icon is the same in every language", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/global/gl_socials");
  await step(hoda.page, "icon-locked-in-arabic", async () => {
    await hoda.page.getByRole("tab", { name: "العربية" }).click();
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    const icon = hoda.page.getByLabel("Icon").first();
    const name = hoda.page.getByLabel("Name").first();
    const iconLocked = await icon.evaluate((e) => e.readOnly);
    const nameOpen = !(await name.evaluate((e) => e.readOnly));
    await name.fill("فيسبوك");
    await saveDraft(hoda.page);
    const e = await api(hoda.token, "/admin/entries/global/gl_socials");
    return { ok: iconLocked && nameOpen && e.content.locales.ar.networks[0].name === "فيسبوك" && e.content.locales.ar.networks[0].icon === e.content.locales.en.networks[0].icon, note: `icon locked ${iconLocked}, name editable ${nameOpen}` };
  });
  await hoda.ctx.close();
});

await run("A page's search description closes an SEO gap", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  const before = (await api(hoda.token, "/admin/overview")).queue.seoIssues;
  await open(hoda.page, "/en/content/pages/pg_services");
  await step(hoda.page, "seo-description", async () => {
    await hoda.page.getByRole("tab", { name: "SEO" }).click();
    const address = hoda.page.getByLabel("Address", { exact: true });
    const fixed = (await address.evaluate((e) => e.readOnly)) && (await address.inputValue()) === "orgtik.ch/services";
    await hoda.page.getByLabel("Description", { exact: true }).fill("Design, development, marketing, IT support and hosting from one Swiss digital partner.");
    await saveDraft(hoda.page);
    const after = (await api(hoda.token, "/admin/overview")).queue.seoIssues;
    return { ok: fixed && after === before - 1, note: `address fixed ${fixed}; SEO issues ${before} → ${after}` };
  });
  await hoda.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s1c.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
