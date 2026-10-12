import {auditState} from "../lib/audit-state.mjs";
// Website Manager S1, the other content types (services, software, insights), walked in the
// browser: an article's shared fields and image description saved and published to the public
// API; shared fields locked outside English while the description stays per language; the
// services list filtered by family with the addresses the website uses; a module's price shown
// as coming from Pricing.
//
//   node flows/wm-s1b.mjs      (the Website Manager on :3007 and the local-dev mock running)
//
// Resets the mock first. Writes audits/wm/flows/s1b.json (screenshots git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-s1b.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s1b");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
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

const open = async (page, url, tab) => {
  await page.goto(`${WM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: tab }).first().waitFor({ timeout: 30000 });
};
const api = async (token, p) => (await (await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${token}` } })).json()).data;
const ALT = "A tablet showing a connected dashboard on a desk.";
const ALT_AR = "جهاز لوحي يعرض لوحة معلومات متصلة على مكتب.";

await run("An article's shared fields and image description go through review to the website", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/insights/ar_01", "Details");
  await step(hoda.page, "edit-shared", async () => {
    const minutes = hoda.page.getByLabel("Reading time (minutes)");
    await minutes.fill("8");
    await minutes.blur();
    await hoda.page.getByLabel("Image description").fill(ALT);
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    await hoda.page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
    const e = await api(hoda.token, "/admin/entries/article/ar_01");
    return { ok: e.content.readingMinutes === 8 && e.content.image.alt.en === ALT && e.state === "draft", note: `minutes ${e.content.readingMinutes}, alt.en set: ${e.content.image.alt.en === ALT}` };
  });
  await step(hoda.page, "arabic-shared-locked-alt-open", async () => {
    await hoda.page.getByRole("tab", { name: "العربية" }).click();
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    const minutesLocked = await hoda.page.getByLabel("Reading time (minutes)").isDisabled();
    const alt = hoda.page.getByLabel("Image description");
    const altEditable = await alt.isEditable();
    await alt.fill(ALT_AR);
    // The previous step's "Draft saved" may still be showing: wait for this save's own toast.
    const toasts = await hoda.page.getByText("Draft saved").count();
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    await hoda.page.waitForFunction((n) => [...document.querySelectorAll("*")].filter((x) => x.childElementCount === 0 && x.textContent === "Draft saved").length > n, toasts, { timeout: 15000 });
    const e = await api(hoda.token, "/admin/entries/article/ar_01");
    return { ok: minutesLocked && altEditable && e.content.image.alt.ar === ALT_AR && e.content.image.alt.en === ALT, note: `minutes locked ${minutesLocked}; alt editable ${altEditable}; alt.ar saved ${e.content.image.alt.ar === ALT_AR} (${JSON.stringify(e.content.image.alt)}, state ${e.state}, v${e.version})` };
  });
  await step(hoda.page, "submit", async () => {
    await hoda.page.getByRole("button", { name: "Submit for review" }).click();
    await hoda.page.getByText("In review").first().waitFor({ timeout: 15000 });
    return { ok: hoda.errors.length === 0, note: hoda.errors[0] ?? "" };
  });
  await hoda.ctx.close();
  const karim = await as("karim.hassan@orgtik.test");
  await open(karim.page, "/en/content/insights/ar_01", "Details");
  await step(karim.page, "approve-publish", async () => {
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor({ timeout: 15000 });
    await karim.page.getByRole("button", { name: /^Publish$/ }).click();
    const dialog = karim.page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: /^Publish$/ }).click();
    await dialog.waitFor({ state: "detached", timeout: 15000 });
    const pub = await (await fetch(`${API}/public/entries/article`)).json();
    const a = pub.data.find((x) => x.id === "ar_01");
    return { ok: a.readingMinutes === 8 && a.image.alt.en === ALT && a.image.alt.ar === ALT_AR, note: `public: ${a.readingMinutes} min, alt en/ar set` };
  });
  await karim.ctx.close();
});

await run("Services: families and services, filtered by family, at the website's addresses", async (step) => {
  const salma = await as("salma.nabil@orgtik.test");
  await open(salma.page, "/en/content/services", "Service families");
  await step(salma.page, "families", async () => {
    const rows = await salma.page.getByRole("row").count();
    const count = await salma.page.getByRole("row", { name: /Development services/ }).getByText("2 services").count();
    return { ok: rows === 6 && count === 1, note: `${rows - 1} families; Development shows 2 services: ${count === 1}` };
  });
  await step(salma.page, "services-by-family", async () => {
    await salma.page.getByRole("tab", { name: "Services" }).click();
    await salma.page.waitForURL(/type=service/);
    await salma.page.getByRole("combobox", { name: "Family" }).click();
    await salma.page.getByRole("option", { name: "Development services" }).click();
    await salma.page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 2, null, { timeout: 15000 });
    const addr = await salma.page.getByText("/services/development/web-development").count();
    return { ok: addr === 1, note: `2 services; address /services/development/web-development shown: ${addr === 1}` };
  });
  await step(salma.page, "service-read-only", async () => {
    await salma.page.getByRole("link", { name: "Web development and programming" }).click();
    await salma.page.getByRole("tab", { name: "Details" }).waitFor();
    const ro = await salma.page.getByLabel("Name").evaluate((e) => e.readOnly);
    const writes = await salma.page.getByRole("button", { name: /Save draft|Submit for review/ }).count();
    return { ok: ro && writes === 0, note: `viewer: Name read-only ${ro}, ${writes} write buttons` };
  });
  await salma.ctx.close();
});

// Since c8be7fe the software products live in the website's purchasing catalog (the cart and checkout
// read it too): the Website Manager mirrors them read-only, price included (owner's choice, 2026-10-03).
await run("A software product shows its catalog price and is read-only here", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/software/sm_01", "Details");
  await step(hoda.page, "price-note", async () => {
    const note = await hoda.page.getByText(/a month on the website, from its purchasing catalog/).innerText();
    const tabs = await hoda.page.getByRole("tab").allInnerTexts();
    return { ok: /49/.test(note) && tabs.includes("Highlights") && tabs.includes("Use cases"), note: note.replace(/s+/g, " ") };
  });
  await step(hoda.page, "read-only-mirror", async () => {
    const managed = await hoda.page.getByRole("note").filter({ hasText: "software-catalog.js" }).count();
    const save = await hoda.page.getByRole("button", { name: /^Save( draft)?$/ }).count();
    return { ok: managed === 1 && save === 0, note: `catalog note ${managed}; save buttons ${save}` };
  });
  await hoda.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s1b.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
