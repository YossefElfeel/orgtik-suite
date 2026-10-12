import {auditState} from "../lib/audit-state.mjs";
// The website's forms go live on the mock (S6, D-041). With the forms live in the Website Manager
// and the website's content pulled, a visitor's contact message arrives as a lead and a roadmap
// suggestion as a pending idea; with contact delivery explicitly paused, nothing is sent and the page behaves as
// before. The run puts the mock and the website's content copy back as they were.
//
//   node flows/site-forms.mjs     (website dev server, Website Manager mock, local-dev running)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, WORKSPACE, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { SITE } from "../../qa/lib/site.mjs";
const audit = await auditState("site-forms.mjs");
try {


const WM = `${apiUrl("wm")}/v2`;
const SITE_DIR = path.join(WORKSPACE, "orgtik-website", "landing-directions");
const results = [];
const step = async (name, fn) => {
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note ?? "" });
    console.log(`  ok   ${name}${note ? ` (${note})` : ""}`);
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message).split("\n")[0] });
    console.log(`  FAIL ${name} (${String(e.message).split("\n")[0]})`);
  }
};
const pull = () => execFileSync(process.execPath, ["scripts/content-pull.mjs"], { cwd: SITE_DIR, encoding: "utf8" }).trim().split("\n").pop();
const admin = async (p) => {
  const r = await fetch(`${WM}${p}`, { headers: { Authorization: `Bearer ${await tokenFor("mona.adel@orgtik.test")}` } });
  if (!r.ok) throw new Error(`${p} ${r.status}`);
  return (await r.json()).data;
};

const unlock = () => {};
const browser = await chromium.launch();
const stamp = Date.now().toString(36);
try {
  await mock.reset();
  await step("Forms live in the Website Manager", async () => {
    const r = await fetch(`${WM}/__mock/forms-live`, { method: "POST" });
    const d = (await r.json()).data;
    if (d.forms.mode !== "live" || !d.forms.privacyVersion) throw new Error(JSON.stringify(d));
    return `privacy ${d.forms.privacyVersion} in force`;
  });
  await step("Pull the content into the website", async () => pull());
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.waitForTimeout(2500); // Vite reloads the changed content module

  await step("Contact form sends a lead", async () => {
    await page.goto(`${SITE}/contact?utm_source=walk&utm_campaign=s6`, { waitUntil: "networkidle" });
    const form = page.locator("form").filter({ has: page.locator('[name="message"]') }).first();
    await form.locator('[name="name"]').fill(`Walk ${stamp}`);
    await form.locator('[name="email"]').fill(`walk.${stamp}@example.test`);
    await form.locator('[name="message"]').fill("We'd like a quote for a website and the workspace.");
    const sent = page.waitForResponse((r) => r.url().endsWith("/public/leads") && r.request().method() === "POST");
    await form.locator('[type="submit"]').click();
    const res = await sent;
    if (res.status() !== 201) throw new Error(`leads ${res.status()}`);
    const leads = await admin(`/admin/leads?search=${stamp}`);
    const lead = leads.find((l) => String(l.email ?? "").includes(stamp) || String(l.name ?? "").includes(stamp));
    if (!lead) throw new Error("the lead isn't in the Website Manager");
    return `lead ${lead.id}, utm ${JSON.stringify(lead.utm)}`;
  });

  await step("Roadmap suggestion arrives as a pending idea", async () => {
    await page.goto(`${SITE}/roadmap`, { waitUntil: "networkidle" });
    const form = page.locator("form").filter({ has: page.locator('[name="message"]') }).first();
    await form.scrollIntoViewIfNeeded();
    // The topic chips are buttons inside the form; take the first one.
    await form.locator('button[type="button"]').first().click();
    await form.locator('[name="name"]').fill(`Walk ${stamp}`);
    await form.locator('[name="email"]').fill(`walk.${stamp}@example.test`);
    await form.locator('[name="message"]').fill(`A walk-through for new teams (${stamp}). It would help onboarding.`);
    const sent = page.waitForResponse((r) => r.url().endsWith("/public/ideas") && r.request().method() === "POST");
    await form.locator('[type="submit"]').click();
    const res = await sent;
    if (res.status() !== 201) throw new Error(`ideas ${res.status()}`);
    const ideas = await admin(`/admin/ideas?status=pending&search=${stamp}`);
    if (!ideas.length) throw new Error("the idea isn't waiting for moderation");
    return `idea ${ideas[0].id} pending`;
  });

  await step("Back to preview: reset and pull", async () => {
    await mock.reset();
    const settings = await admin('/admin/settings/site');
    const paused = await fetch(`${WM}/admin/settings/site`, {method:'PATCH',headers:{Authorization:`Bearer ${await tokenFor('mona.adel@orgtik.test')}`,'Content-Type':'application/json','If-Match':String(settings.version)},body:JSON.stringify({formsMode:'preview'})});
    if (!paused.ok) throw new Error(`pause forms ${paused.status}`);
    return pull();
  });
  await step("In preview the form sends nothing", async () => {
    await page.waitForTimeout(2500);
    await page.goto(`${SITE}/contact`, { waitUntil: "networkidle" });
    let calls = 0;
    page.on("request", (r) => r.url().includes("/public/leads") && calls++);
    const form = page.locator("form").filter({ has: page.locator('[name="message"]') }).first();
    await form.locator('[name="name"]').fill("Preview");
    await form.locator('[name="email"]').fill("preview@example.test");
    await form.locator('[name="message"]').fill("Hello.");
    await form.locator('[type="submit"]').click();
    await page.waitForTimeout(1200);
    if (calls) throw new Error(`${calls} request(s) sent in preview`);
    return "no request; the page shows its sent state as before";
  });
} finally {
  await browser.close();
  unlock();
}
const out = path.join(AUDITS, "website", "flows");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "site-forms.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2) + "\n");
console.log(`\n${results.filter((r) => r.ok).length} of ${results.length} steps passed`);

} finally { await audit.cleanup(); }
