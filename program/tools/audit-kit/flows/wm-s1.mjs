import {caseFixtures} from "../lib/content-fixtures.mjs";
import {auditState} from "../lib/audit-state.mjs";
// Website Manager S1 (CMS side), walked in the browser on the case studies (D-032, D-034):
//   an editor saves and submits; an approver approves and publishes and the public API changes;
//   a translation starts from English with the numbers locked; two people editing at once meet
//   the "someone else changed this" dialog; a viewer gets a read-only editor.
//
//   node flows/wm-s1.mjs      (the Website Manager on :3007 and the local-dev mock running)
//
// Resets the mock first. Writes audits/wm/flows/s1.json (screenshots git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor, createAppHandoff } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";
const audit = await auditState("wm-s1.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s1");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
const fixtureIds = await caseFixtures();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const token = await tokenFor(email, "wm");
  await page.goto(`${WM}/en/auth?code=${encodeURIComponent(await createAppHandoff(apiUrl("sos") + "/api", "wm", token))}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 30000 });
  return { ctx, page, token, log: watch(page) };
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

const openEditor = async (page, id) => {
  await page.goto(`${WM}/en/content/work/${id}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Brief" }).waitFor({ timeout: 30000 });
};
const api = async (token, p) => (await (await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${token}` } })).json()).data;
const GOAL = "Grow qualified leads from the website without growing ad spend.";

await run("Editor saves and submits; approver approves and publishes; the site's API changes", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await openEditor(hoda.page, fixtureIds["cs_04"]);
  await step(hoda.page, "edit-goal", async () => {
    await hoda.page.getByLabel("The goal").fill(GOAL);
    return { ok: (await hoda.page.getByText("Unsaved changes").count()) === 1, note: "the save bar appears" };
  });
  await step(hoda.page, "save-draft", async () => {
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    await hoda.page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
    const e = await api(hoda.token, `/admin/entries/caseStudy/${fixtureIds["cs_04"]}`);
    return { ok: e.state === "draft" && e.content.locales.en.goal === GOAL, note: `state ${e.state}, v${e.version}` };
  });
  await step(hoda.page, "submit", async () => {
    await hoda.page.getByRole("button", { name: "Submit for review" }).click();
    await hoda.page.getByText("In review").first().waitFor({ timeout: 15000 });
    const approveButtons = await hoda.page.getByRole("button", { name: /^Approve$/ }).count();
    return { ok: approveButtons === 0, note: `in review; the editor sees ${approveButtons} Approve buttons` };
  });
  await hoda.ctx.close();

  const karim = await as("karim.hassan@orgtik.test");
  await openEditor(karim.page, fixtureIds["cs_04"]);
  await step(karim.page, "approve", async () => {
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor({ timeout: 15000 });
    return true;
  });
  await step(karim.page, "publish", async () => {
    await karim.page.getByRole("button", { name: /^Publish$/ }).click();
    const dialog = karim.page.getByRole("alertdialog");
    await dialog.waitFor({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^Publish$/ }).click();
    await dialog.waitFor({ state: "detached", timeout: 15000 });
    const pub = await (await fetch(`${API}/public/case-studies`)).json();
    const live = pub.data.find((x) => x.id === fixtureIds["cs_04"]).locales.en.goal;
    return { ok: live === GOAL, note: `public goal: ${live.slice(0, 60)}` };
  });
  await karim.ctx.close();
});

await run("A translation starts from English; numbers stay English's", async (step) => {
  const karim = await as("karim.hassan@orgtik.test");
  await openEditor(karim.page, fixtureIds["cs_03"]);
  await step(karim.page, "arabic-not-started", async () => {
    await karim.page.getByRole("tab", { name: "العربية" }).click();
    return { ok: (await karim.page.getByRole("button", { name: "Start from English" }).count()) === 1, note: "empty state offers Start from English" };
  });
  await step(karim.page, "start-and-save", async () => {
    await karim.page.getByRole("button", { name: "Start from English" }).click();
    await karim.page.getByLabel("Name").fill("حضور رقمي مُدار");
    await karim.page.getByRole("button", { name: "Save draft" }).first().click();
    await karim.page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
    const e = await api(karim.token, `/admin/entries/caseStudy/${fixtureIds["cs_03"]}`);
    return { ok: e.translation.ar === "in_progress" && e.content.locales.ar.name === "حضور رقمي مُدار", note: `ar ${e.translation.ar}` };
  });
  await step(karim.page, "numbers-locked", async () => {
    await karim.page.getByRole("tab", { name: "The results" }).click();
    const numbers = karim.page.locator('[role="tabpanel"] input[inputmode]');
    const count = await numbers.count();
    const disabled = await numbers.evaluateAll((els) => els.filter((e) => e.disabled || e.readOnly).length);
    return { ok: count > 0 && count === disabled, note: `${disabled} of ${count} number fields locked in Arabic` };
  });
  await karim.ctx.close();
});

await run("Two people edit at once: the second save says so instead of overwriting", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  const karim = await as("karim.hassan@orgtik.test");
  await openEditor(hoda.page, fixtureIds["cs_02"]);
  await openEditor(karim.page, fixtureIds["cs_02"]);
  await step(karim.page, "first-save", async () => {
    await karim.page.getByLabel("Timeline").fill("14 weeks");
    await karim.page.getByRole("button", { name: "Save draft" }).first().click();
    await karim.page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
    return true;
  });
  await step(hoda.page, "second-save-conflict", async () => {
    await hoda.page.getByLabel("Team").fill("Engineering and design");
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    const dialog = hoda.page.getByRole("alertdialog");
    await dialog.waitFor({ timeout: 15000 });
    const text = await dialog.innerText();
    return { ok: /Someone else changed this/.test(text) && /Karim Hassan/.test(text), note: text.replace(/\s+/g, " ").slice(0, 120) };
  });
  await hoda.ctx.close();
  await karim.ctx.close();
});

await run("Four eyes: whoever wrote the draft can't approve it", async (step) => {
  const karim = await as("karim.hassan@orgtik.test");
  await openEditor(karim.page, fixtureIds["cs_05"]);
  await step(karim.page, "own-draft-in-review", async () => {
    await karim.page.getByLabel("Timeline").fill("Six weeks, then monthly");
    await karim.page.getByRole("button", { name: "Save draft" }).first().click();
    await karim.page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
    await karim.page.getByRole("button", { name: "Submit for review" }).click();
    await karim.page.getByText("In review").first().waitFor({ timeout: 15000 });
    const approve = karim.page.getByRole("button", { name: /^Approve$/ });
    const disabled = await approve.isDisabled();
    const note = await karim.page.getByText("someone else has to approve", { exact: false }).count();
    return { ok: disabled && note > 0, note: `Approve disabled: ${disabled}; explanation shown: ${note > 0}` };
  });
  await karim.ctx.close();
});

await run("A viewer can read a case study but not change it", async (step) => {
  const salma = await as("salma.nabil@orgtik.test");
  await openEditor(salma.page, "cs_01");
  await step(salma.page, "read-only", async () => {
    const saves = await salma.page.getByRole("button", { name: /Save draft|Submit for review|Discard draft/ }).count();
    const readOnly = await salma.page.getByLabel("Name").evaluate((e) => e.readOnly);
    return { ok: saves === 0 && readOnly, note: `${saves} write buttons; Name read-only: ${readOnly}` };
  });
  await salma.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s1.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
