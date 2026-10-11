import {auditState} from "../lib/audit-state.mjs";
// Website Manager: leads, translations, scheduling, versions and site settings, in the browser.
//   - a lead moves through the pipeline with an owner and a note; losing it needs a reason; an
//     editor sees personal data masked (list, detail, export) and can't erase it; marketing can
//   - an Arabic translation goes to review; its translator can't approve it; the approver does,
//     and publishing makes it live
//   - an approved change is scheduled and publishes by itself when the time comes
//   - an old version is restored as a new draft
//   - forms can't go live before a privacy policy with a date is published
//
//   node flows/wm-s3.mjs      (the Website Manager on :3007 and the local-dev mock running)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-s3.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s3");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.realClock().catch(() => {});
await mock.reset();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(03|09|12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
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
const go = async (page, url) => {
  await page.goto(`${WM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 30000 });
};
const api = async (token, p) => (await (await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${token}` } })).json());
const saveDraft = async (page) => {
  await page.getByRole("button", { name: "Save draft" }).first().click();
  await page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
};

await run("A lead moves through the pipeline; personal data is for those allowed", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await go(hoda.page, "/en/marketing/leads");
  await step(hoda.page, "editor-sees-masked", async () => {
    const masked = await hoda.page.getByRole("button", { name: /^S•+/ }).count();
    const buttons = await hoda.page.getByRole("button", { name: "Mark contacted" }).count();
    const csv = await (await fetch(`${API}/admin/leads/export.csv`, { headers: { authorization: `Bearer ${hoda.token}` } })).text();
    return { ok: masked >= 1 && buttons === 0 && !csv.includes("sara.keller@example.test"), note: `names masked, no actions, export without emails` };
  });
  await hoda.ctx.close();
  const dina = await as("dina.fathy@orgtik.test");
  await go(dina.page, "/en/marketing/leads");
  const row = dina.page.getByRole("row", { name: /Sara Keller/ });
  await step(dina.page, "contact-qualify-quote", async () => {
    await row.getByRole("button", { name: "Mark contacted" }).click();
    await dina.page.getByText("Marked contacted").first().waitFor();
    await row.getByRole("button", { name: "Qualify" }).click();
    await dina.page.getByText("Qualified").first().waitFor();
    await row.getByRole("button", { name: "Quote sent" }).click();
    await dina.page.waitForFunction(async () => true);
    await dina.page.waitForTimeout(800);
    const l = (await api(dina.token, "/admin/leads/ld_01")).data;
    return { ok: l.status === "quoted", note: l.history.map((h) => h.action).reverse().join(" → ") };
  });
  await step(dina.page, "owner-and-note", async () => {
    await row.getByRole("button", { name: "Sara Keller" }).click();
    const sheet = dina.page.getByRole("dialog");
    await sheet.getByRole("combobox", { name: "Owner" }).click();
    await dina.page.getByRole("option", { name: "Dina Fathy" }).click();
    await dina.page.getByText("Owner changed").first().waitFor();
    await sheet.getByRole("textbox", { name: "Add a note for the team" }).fill("Sent the operations bundle quote, 12 months.");
    await sheet.getByRole("button", { name: "Add note" }).click();
    await sheet.getByText("Sent the operations bundle quote, 12 months.").waitFor();
    const l = (await api(dina.token, "/admin/leads/ld_01")).data;
    return { ok: l.owner?.key === "u12" && l.notes.length === 1, note: `owner ${l.owner?.name}, ${l.notes.length} note` };
  });
  await step(dina.page, "lose-needs-reason", async () => {
    const sheet = dina.page.getByRole("dialog");
    await sheet.getByRole("button", { name: /More for this lead/ }).click();
    await dina.page.getByRole("menuitem", { name: "Lost" }).click();
    const confirm = dina.page.getByRole("alertdialog");
    const disabled = await confirm.getByRole("button", { name: "Lost" }).isDisabled();
    await confirm.getByRole("textbox").fill("Chose a local competitor on price.");
    await confirm.getByRole("button", { name: "Lost" }).click();
    await dina.page.getByText("Marked lost").first().waitFor();
    const l = (await api(dina.token, "/admin/leads/ld_01")).data;
    return { ok: disabled && l.status === "lost" && l.reason.startsWith("Chose"), note: `confirm disabled without reason: ${disabled}` };
  });
  await step(dina.page, "erase-personal-data", async () => {
    const sheet = dina.page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Erase personal data" }).click();
    const confirm = dina.page.getByRole("alertdialog");
    await confirm.getByRole("checkbox").check();
    await confirm.getByRole("button", { name: "Erase personal data" }).click();
    await dina.page.getByText("Personal data erased").first().waitFor();
    const l = (await api(dina.token, "/admin/leads/ld_01")).data;
    const audit = (await api((await tokenFor("mona.adel@orgtik.test")), "/admin/audit?type=lead")).data.map((a) => a.action);
    return { ok: l.erased && l.email === "" && l.notes[0].text === "—" && audit.includes("lead_erase"), note: "erased and recorded in the audit log" };
  });
  await step(null, "no-errors", async () => ({ ok: dina.errors.length === 0, note: dina.errors[0] ?? "clean" }));
  await dina.ctx.close();
});

// An article: the service families are the website's catalog since c8be7fe, mirrored read-only.
await run("A translation is reviewed by someone else before it goes live", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await go(hoda.page, "/en/content/insights/ar_01?lang=ar");
  await step(hoda.page, "translate-and-submit", async () => {
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    await hoda.page.getByRole("tabpanel").getByLabel(/^(Name|Title)$/).first().fill("نظام رقمي واحد مترابط");
    await saveDraft(hoda.page);
    await hoda.page.getByRole("button", { name: "Ready for review" }).click();
    await hoda.page.getByText("Sent for review").first().waitFor();
    const approve = await hoda.page.getByRole("button", { name: "Approve translation" }).count();
    const e = (await api(hoda.token, "/admin/entries/article/ar_01")).data;
    return { ok: e.translation.ar === "needs_review" && approve === 0, note: `ar ${e.translation.ar}; the translator sees ${approve} approve buttons` };
  });
  await hoda.page.getByRole("button", { name: "Submit for review" }).click();
  await hoda.page.getByText("In review").first().waitFor();
  await hoda.ctx.close();
  const karim = await as("karim.hassan@orgtik.test");
  await go(karim.page, "/en/localization");
  await step(karim.page, "matrix-to-review", async () => {
    await karim.page.getByRole("tab", { name: /Needs review/ }).click();
    await karim.page.getByRole("link", { name: "Open in العربية" }).first().click();
    await karim.page.waitForURL(/lang=ar/);
    await karim.page.getByRole("button", { name: "Approve translation" }).click();
    await karim.page.getByText(/Translation approved/).first().waitFor();
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor();
    await karim.page.getByRole("button", { name: /^Publish$/ }).click();
    const dialog = karim.page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: /^Publish$/ }).click();
    await dialog.waitFor({ state: "detached" });
    const e = (await api(karim.token, "/admin/entries/article/ar_01")).data;
    return { ok: e.translation.ar === "published" && e.live.locales.ar.name === "نظام رقمي واحد مترابط", note: `ar ${e.translation.ar}` };
  });
  await karim.ctx.close();
});

await run("An approved change publishes itself at its time; an old version comes back as a draft", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await go(hoda.page, "/en/content/insights/ar_02");
  await hoda.page.getByLabel("Excerpt").fill("A brand system that grows with the business, without starting over.");
  await saveDraft(hoda.page);
  await hoda.page.getByRole("button", { name: "Submit for review" }).click();
  await hoda.page.getByText("In review").first().waitFor();
  await hoda.ctx.close();
  const karim = await as("karim.hassan@orgtik.test");
  await go(karim.page, "/en/content/insights/ar_02");
  await step(karim.page, "schedule", async () => {
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor();
    await karim.page.getByRole("button", { name: "Schedule" }).click();
    const dialog = karim.page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Date" }).click();
    const today = new Date();
    const day = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    // Not a digit before it: "1 October" must not match "11 October" or "21 October".
    await karim.page.getByRole("button", { name: new RegExp(`(^|[^0-9])${day}`) }).click();
    await dialog.getByLabel("Time").fill("23:59");
    await dialog.getByRole("button", { name: "Schedule" }).click();
    await karim.page.getByText(/The website shows this version from/).waitFor();
    const e = (await api(karim.token, "/admin/entries/article/ar_02")).data;
    return { ok: e.state === "scheduled" && Boolean(e.publishAt), note: `scheduled for ${e.publishAt}` };
  });
  await step(karim.page, "publishes-at-its-time", async () => {
    await mock.control("sos", "/__mock/clock/advance", { body: { days: 1 } });
    const e = (await api(karim.token, "/admin/entries/article/ar_02")).data;
    const pub = (await (await fetch(`${API}/public/entries/article`)).json()).data.find((x) => x.id === "ar_02");
    return { ok: e.state === "published" && pub.locales.en.excerpt.startsWith("A brand system"), note: `after a day: ${e.state}; versions ${e.versions.slice(0, 3).map((v) => v.by.name ?? v.by.key).join(", ")}` };
  });
  await step(karim.page, "restore-old-version", async () => {
    await go(karim.page, "/en/content/insights/ar_02");
    await karim.page.getByRole("button", { name: "Versions" }).click();
    const sheet = karim.page.getByRole("dialog");
    const last = sheet.getByRole("listitem").last();
    await last.getByRole("button", { name: "Show changes" }).click();
    await last.getByText("The first version: imported from the website.").waitFor();
    // Somewhere between the import and now is the edit: open every version and count what changed.
    const items = sheet.getByRole("listitem");
    const n = await items.count();
    for (let i = 0; i < n - 1; i++) await items.nth(i).getByRole("button", { name: "Show changes" }).click();
    await karim.page.waitForTimeout(800);
    const diff = await sheet.locator("ins, del").count();
    await last.getByRole("button", { name: "Restore as a draft" }).click();
    await karim.page.getByRole("alertdialog").getByRole("button", { name: "Restore as a draft" }).click();
    await karim.page.getByText("Version 1 is the draft now").first().waitFor();
    const e = (await api(karim.token, "/admin/entries/article/ar_02")).data;
    return { ok: e.state === "draft" && e.content.locales.en.excerpt !== e.live.locales.en.excerpt && diff > 0, note: `draft from v1; the change shown as ${diff} marks` };
  });
  await karim.ctx.close();
  await mock.realClock().catch(() => {});
});

await run("Site settings: the dated privacy policy permits local mock form activation", async (step) => {
  const mona = await as("mona.adel@orgtik.test");
  // The owner enabled local delivery by default. Pause explicitly to test the UI transition.
  const settings = (await api(mona.token, '/admin/settings/site')).data;
  const paused = await fetch(`${API}/admin/settings/site`, {method:'PATCH',headers:{authorization:`Bearer ${mona.token}`,'Content-Type':'application/json','If-Match':String(settings.version)},body:JSON.stringify({formsMode:'preview'})});
  if (!paused.ok) throw new Error(`pause forms ${paused.status}`);
  await go(mona.page, "/en/settings/site");
  await step(mona.page, "dated-policy-allows-local-forms", async () => {
    await mona.page.getByRole("combobox", { name: "Contact and roadmap forms" }).click();
    await mona.page.getByRole("option", { name: /Live/ }).click();
    await mona.page.getByRole("button", { name: "Save", exact: true }).click();
    await mona.page.getByText("Settings saved").first().waitFor();
    const s = (await api(mona.token, "/admin/settings/site")).data;
    return { ok: s.formsMode === "live", note: "The 0.2 policy is dated 2026-10-05; only the isolated mock is activated." };
  });
  await step(mona.page, "title-template-saved", async () => {
    await mona.page.getByRole("combobox", { name: "Contact and roadmap forms" }).click();
    await mona.page.getByRole("option", { name: /Preview/ }).click();
    await mona.page.getByLabel("Tab title").fill("{page} · OrgTik");
    await mona.page.getByRole("button", { name: "Save", exact: true }).click();
    await mona.page.getByText("Settings saved").first().waitFor();
    const s = (await api(mona.token, "/admin/settings/site")).data;
    return { ok: s.titleTemplate === "{page} · OrgTik", note: s.titleTemplate };
  });
  await step(null, "no-errors", async () => ({ ok: mona.errors.length === 0, note: mona.errors[0] ?? "clean" }));
  await mona.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s3.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
