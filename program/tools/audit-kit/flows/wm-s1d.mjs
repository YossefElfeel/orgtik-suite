import {roadmapFixture} from "../lib/content-fixtures.mjs";
import {auditState} from "../lib/audit-state.mjs";
// Website Manager S1: Strings, Legal, the Roadmap and its Ideas, walked in the browser.
//   - a message keeps its numbered parts ({0}) or the save is refused; a translation keeps them too
//   - a legal document gets a new version with its date, and only a legal approver publishes it;
//     republishing an existing version number is refused
//   - a roadmap item moves on the timeline; its status is shared by every language
//   - ideas: publish a pending one for voting, merge a duplicate (its votes follow), decline one
//     with a reason; the public list shows only moderated ideas; a viewer can't moderate
//
//   node flows/wm-s1d.mjs      (the Website Manager on :3007 and the local-dev mock running)
//
// Resets the mock first. Writes audits/wm/flows/s1d.json (screenshots git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor, createAppHandoff } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-s1d.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s1d");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
const roadmapId = await roadmapFixture();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email, "wm");
  await page.goto(`${WM}/en/auth?code=${encodeURIComponent(await createAppHandoff(apiUrl("sos") + "/api", "wm", token))}`, { waitUntil: "load" });
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
// The field whose value is `text` (messages share the label "Message").
const fieldWith = async (page, text) => {
  const all = page.locator("input, textarea");
  const i = await all.evaluateAll((els, t) => els.findIndex((e) => e.value === t), text);
  if (i < 0) throw new Error(`no field with ${text}`);
  return all.nth(i);
};
const publish = async (page) => {
  await page.getByRole("button", { name: /^Publish$/ }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: /^Publish$/ }).click();
  return dialog;
};

await run("A message keeps its numbered parts, in English and in translation", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/strings/st_software");
  await step(hoda.page, "placeholder-dropped-refused", async () => {
    const f = await fieldWith(hoda.page, "From {0}/mo");
    await f.fill("From CHF 29/mo");
    await hoda.page.getByRole("button", { name: "Save draft" }).first().click();
    await hoda.page.getByText("The marks must stay as in English.").first().waitFor({ timeout: 15000 });
    return { ok: (await api(hoda.token, "/admin/entries/strings/st_software")).state === "published", note: "refused on the field; nothing saved" };
  });
  await step(hoda.page, "placeholder-kept-saved", async () => {
    const f = await fieldWith(hoda.page, "From CHF 29/mo");
    await f.fill("From {0} a month");
    await saveDraft(hoda.page);
    const e = await api(hoda.token, "/admin/entries/strings/st_software");
    return { ok: e.content.locales.en.b1.s6 === "From {0} a month" || JSON.stringify(e.content.locales.en).includes("From {0} a month"), note: `v${e.version}` };
  });
  await step(hoda.page, "arabic-keeps-placeholder", async () => {
    await hoda.page.getByRole("tab", { name: "العربية" }).click();
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    const f = await fieldWith(hoda.page, "From {0} a month");
    await f.fill("ابتداءً من {0} شهريًا");
    await saveDraft(hoda.page);
    const e = await api(hoda.token, "/admin/entries/strings/st_software");
    return { ok: JSON.stringify(e.content.locales.ar).includes("ابتداءً من {0} شهريًا") && e.translation.ar === "in_progress", note: `ar ${e.translation.ar}` };
  });
  await step(null, "no-errors", async () => ({ ok: hoda.errors.length === 0, note: hoda.errors[0] ?? "clean" }));
  await hoda.ctx.close();
});

await run("A legal document gets a new version; only a legal approver publishes it", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, "/en/content/legal/lg_privacy");
  await step(hoda.page, "new-version-submitted", async () => {
    await hoda.page.getByLabel("Version", { exact: true }).fill("1.0");
    await hoda.page.getByRole("button", { name: "Applies from" }).click();
    // Today, whatever day the flow runs on.
    const now = new Date();
    const day = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await hoda.page.getByRole("button", { name: new RegExp(`(^|[^0-9])${day}`) }).click();
    await hoda.page.getByLabel("Summary").fill("How OrgTik handles personal data on orgtik.ch.");
    await saveDraft(hoda.page);
    await hoda.page.getByRole("button", { name: "Submit for review" }).click();
    await hoda.page.getByText("In review").first().waitFor({ timeout: 15000 });
    const e = await api(hoda.token, "/admin/entries/legalDocument/lg_privacy");
    return { ok: e.content.versionLabel === "1.0" && e.content.effectiveFrom === iso, note: `draft ${e.content.versionLabel} from ${e.content.effectiveFrom}` };
  });
  await hoda.ctx.close();
  const karim = await as("karim.hassan@orgtik.test");
  await open(karim.page, "/en/content/legal/lg_privacy");
  await step(karim.page, "legal-approver-publishes", async () => {
    await karim.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim.page.getByText("Approved").first().waitFor({ timeout: 15000 });
    const dialog = await publish(karim.page);
    await dialog.waitFor({ state: "detached", timeout: 15000 });
    const versions = (await (await fetch(`${API}/public/legal/privacy/versions`)).json()).data;
    return { ok: versions.length === 3 && versions[0].versionLabel === "1.0" && versions[1].versionLabel === "0.2" && versions[2].versionLabel === "0.1", note: versions.map((v) => `${v.versionLabel}@${v.effectiveFrom}`).join(", ") };
  });
  await karim.ctx.close();

  // The same version number again is refused at publish, on the field.
  const hoda2 = await as("hoda.ashraf@orgtik.test");
  await open(hoda2.page, "/en/content/legal/lg_terms");
  await hoda2.page.getByLabel("Summary").fill("The terms for using orgtik.ch.");
  await saveDraft(hoda2.page);
  await hoda2.page.getByRole("button", { name: "Submit for review" }).click();
  await hoda2.page.getByText("In review").first().waitFor({ timeout: 15000 });
  await hoda2.ctx.close();
  const karim2 = await as("karim.hassan@orgtik.test");
  await open(karim2.page, "/en/content/legal/lg_terms");
  await step(karim2.page, "same-version-refused", async () => {
    await karim2.page.getByRole("button", { name: /^Approve$/ }).click();
    await karim2.page.getByText("Approved").first().waitFor({ timeout: 15000 });
    await publish(karim2.page);
    await karim2.page.getByText("This version is already published. Give the new one its own number.").waitFor({ timeout: 15000 });
    const e = await api(karim2.token, "/admin/entries/legalDocument/lg_terms");
    return { ok: e.state === "approved" && e.legalVersions.length === 2, note: `still ${e.state}; ${e.legalVersions.length} published version` };
  });
  await karim2.ctx.close();

  const dina = await as("dina.fathy@orgtik.test");
  await open(dina.page, "/en/content/legal/lg_terms");
  await step(dina.page, "no-legal-approval-no-publish", async () => {
    const buttons = await dina.page.getByRole("button", { name: /^(Approve|Publish)$/ }).count();
    return { ok: buttons === 0, note: `marketing sees ${buttons} approve/publish buttons` };
  });
  await dina.ctx.close();
});

await run("A roadmap item moves on; its status is the same in every language", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await open(hoda.page, `/en/content/roadmap/${roadmapId}`);
  await step(hoda.page, "move-to-planned", async () => {
    await hoda.page.getByRole("combobox", { name: "Where it stands" }).click();
    await hoda.page.getByRole("option", { name: "Planned" }).click();
    const progress = hoda.page.getByLabel("Progress");
    await progress.fill("25");
    await progress.blur();
    await saveDraft(hoda.page);
    const e = await api(hoda.token, `/admin/entries/roadmapItem/${roadmapId}`);
    return { ok: e.content.status === "planned" && e.content.progress === 25, note: `${e.content.status}, ${e.content.progress}%` };
  });
  await step(hoda.page, "status-locked-in-arabic", async () => {
    await hoda.page.getByRole("tab", { name: "العربية" }).click();
    await hoda.page.getByRole("button", { name: "Start from English" }).click();
    const locked = await hoda.page.getByRole("combobox", { name: "Where it stands" }).evaluate((e) => e.getAttribute("aria-readonly") === "true" || e.hasAttribute("data-readonly") || e.getAttribute("aria-disabled") === "true");
    const progressLocked = await hoda.page.getByLabel("Progress").isDisabled();
    return { ok: locked && progressLocked, note: `status locked ${locked}, progress locked ${progressLocked}` };
  });
  await hoda.ctx.close();
});

await run("Ideas are moderated before the roadmap page shows them", async (step) => {
  const dina = await as("dina.fathy@orgtik.test");
  await dina.page.goto(`${WM}/en/marketing/ideas`, { waitUntil: "networkidle" });
  const row = (title) => dina.page.getByRole("row", { name: new RegExp(title) });
  await step(dina.page, "publish-pending", async () => {
    await row("A dark theme for the workspace").getByRole("button", { name: "Publish for voting" }).click();
    await dina.page.getByRole("alertdialog").getByRole("button", { name: "Publish for voting" }).click();
    await dina.page.getByText("Published for voting").first().waitFor({ timeout: 15000 });
    const pub = (await (await fetch(`${API}/public/ideas`)).json()).data;
    return { ok: pub.some((x) => x.id === "sample-dark-mode" && x.status === "open"), note: `public ideas: ${pub.length}` };
  });
  await step(dina.page, "merge-duplicate", async () => {
    const before = (await (await fetch(`${API}/public/ideas`)).json()).data.find((x) => x.id === "workspace-guide").votes;
    await row("Step-by-step guide for new teams").getByRole("button", { name: /More for/ }).click();
    await dina.page.getByRole("menuitem", { name: "Merge into another idea" }).click();
    const dialog = dina.page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await dina.page.getByRole("option", { name: "A clearer workspace setup guide" }).click();
    await dialog.getByRole("button", { name: "Merge into another idea" }).click();
    await dina.page.getByText("Merged").first().waitFor({ timeout: 15000 });
    const ideas = await api(dina.token, "/admin/ideas?status=closed");
    const merged = ideas.find((x) => x.id === "sample-setup-duplicate");
    const after = (await (await fetch(`${API}/public/ideas`)).json()).data.find((x) => x.id === "workspace-guide").votes;
    return { ok: merged?.status === "merged" && merged.mergedInto === "workspace-guide" && after === before + merged.votes, note: `merged into workspace-guide; votes ${before} → ${after}` };
  });
  await step(dina.page, "decline-with-reason", async () => {
    await row("Export invoices to the accounting tool").getByRole("button", { name: /More for/ }).click();
    await dina.page.getByRole("menuitem", { name: "Decline" }).click();
    const dialog = dina.page.getByRole("alertdialog");
    await dialog.getByRole("textbox").fill("Out of scope for the website; passed to the CRM team.");
    await dialog.getByRole("button", { name: "Decline" }).click();
    await dina.page.getByText("Declined").first().waitFor({ timeout: 15000 });
    const closed = await api(dina.token, "/admin/ideas?status=closed");
    const x = closed.find((i) => i.id === "sample-invoice-export");
    const pending = (await api(dina.token, "/admin/ideas?status=pending")).length;
    return { ok: x?.status === "declined" && x.reason.startsWith("Out of scope") && pending === 0, note: `declined with reason; pending left ${pending}` };
  });
  await step(null, "no-errors", async () => ({ ok: dina.errors.length === 0, note: dina.errors[0] ?? "clean" }));
  await dina.ctx.close();
  const salma = await as("salma.nabil@orgtik.test");
  await salma.page.goto(`${WM}/en/marketing/ideas?`, { waitUntil: "networkidle" });
  await step(salma.page, "viewer-cannot-moderate", async () => {
    await salma.page.getByRole("tab", { name: /Open/ }).click();
    await salma.page.waitForTimeout(500);
    const buttons = await salma.page.getByRole("button", { name: /Plan it|Publish for voting|More for/ }).count();
    return { ok: buttons === 0, note: `viewer sees ${buttons} moderation buttons` };
  });
  await salma.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s1d.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
