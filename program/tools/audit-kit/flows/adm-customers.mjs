// OrgTik Admin, Customers and Billing (ADM-20…23, spec 06 state tables), walked in the browser in
// English and Arabic: find a workspace, extend a trial, View as (with a reason), suspend and
// reactivate, approve a migration, quote a custom plan, refund over the cap then within it, void an
// invoice, mark a past-due invoice paid and see its line come back, and the view-only roles.
//
//   node flows/adm-customers.mjs      (ADM on :3008 and the platform mock on :4008)
//
// Takes the flow lock and resets the mock before each language. Writes
// audits/admin/flows/adm-customers.json and screenshots under audits/admin/flows/adm-customers/.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, WORKSPACE, webUrl } from "../lib/suite.mjs";
import { signIn } from "../lib/session.mjs";
import { mock } from "../lib/mock.mjs";
import { settle, watch } from "../lib/checks.mjs";
import { pathToFileURL } from "node:url";

const OUT = path.join(AUDITS, "admin", "flows", "adm-customers");
const ADM = webUrl("admin");
const ROOT = path.join(WORKSPACE, "orgtik-admin");
const { STATUS_MATRIX } = await import(pathToFileURL(path.join(ROOT, "node_modules", "@orgtik", "ui", "dist", "status", "matrix.js")).href);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const PEOPLE = { admin: "mona.adel@orgtik.test", finance: "hany.samir@orgtik.test", u10: "rana.saad@orgtik.test", sales: "omar.farouk@orgtik.test", u15: "sherif.magdy@orgtik.test" };
const msgs = (loc) => {
  const read = (a) => JSON.parse(fs.readFileSync(path.join(ROOT, "messages", loc, `${a}.json`), "utf8"));
  return { ...read("common"), ...read("customers"), ...read("billing") };
};
// A message by dotted key with {placeholders} filled (plural messages are not used for names here).
const M = (m, key, vars = {}) => key.split(".").reduce((o, k) => o?.[k], m).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
const status = (entity, state, loc) => STATUS_MATRIX[entity][state].label[loc];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const browser = await chromium.launch();
const results = [];
const release = await mock.lock("adm-customers");

async function run(title, who, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const signed = await signIn(ctx, "admin", PEOPLE[who]);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  const step = async (name, check) => {
    let ok = false;
    let note = "";
    try {
      const r = await check();
      ok = r === true || Boolean(r?.ok);
      note = r?.note ?? "";
    } catch (e) {
      note = String(e.message || e).split("\n")[0].slice(0, 220);
    }
    await settle(page);
    const shot = `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, shot) }).catch(() => {});
    steps.push({ name, ok, note, at: page.url().split("?")[0], shot });
  };
  if (!signed.ok) steps.push({ name: "sign-in", ok: false, note: `landed on ${signed.landed}` });
  else await fn(page, step, ctx);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps, console: log.console.length, consoleSample: log.console.slice(0, 2) });
  await ctx.close();
}

const go = async (page, loc, route) => {
  await page.goto(`${ADM}/${loc}${route}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 30000 }).catch(() => {});
};
const h1 = (page) => page.getByRole("heading", { level: 1 });
// Opens the first invoice in the list and waits for its own page (the list's h1 is there until then).
const openFirstInvoice = async (page) => {
  await page.locator("table tbody tr").first().getByRole("link").first().click();
  await page.waitForURL(/\/invoices\/inv_/, { timeout: 20000 });
  await page.getByRole("heading", { level: 1, name: /^INV-/ }).waitFor({ timeout: 20000 });
};
const confirmDialog = (page) => page.getByRole("alertdialog");
const dialog = (page) => page.getByRole("dialog");

for (const loc of ["en", "ar"]) {
  const m = msgs(loc);
  const T = (k, v) => M(m, k, v);
  await mock.reset();

  await run(`[${loc}] Super Admin: find Nile Foods, extend its chat trial, View as with a reason`, "admin", async (page, step, ctx) => {
    await go(page, loc, "/workspaces");
    await step("search-nile", async () => {
      await page.getByRole("searchbox", { name: T("Customers.list.search") }).fill("nile");
      await page.waitForURL(/[?&]q=nile/, { timeout: 15000 });
      await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length === 1, null, { timeout: 15000 });
      const rows = await page.locator("table tbody tr").count();
      return { ok: rows === 1 && (await page.getByRole("link", { name: "Nile Foods" }).count()) === 1, note: `${rows} row(s) for "nile"; the address keeps ?q` };
    });
    await step("open-detail", async () => {
      await page.getByRole("link", { name: "Nile Foods" }).click();
      await h1(page).filter({ hasText: "Nile Foods" }).waitFor({ timeout: 20000 });
      const sections = await page.locator("section, [role=region]").filter({ has: page.getByRole("heading", { level: 2 }) }).count();
      return { ok: sections >= 8, note: `${sections} sections (summary, lines, invoices, members, payment, billing, tickets, requests, notes, audit)` };
    });
    const chat = page.locator("li").filter({ has: page.getByRole("heading", { level: 3, name: new RegExp(esc(T("Customers.tools.chat"))) }) });
    let before = "";
    await step("extend-trial-asks-reason", async () => {
      before = await chat.innerText();
      await chat.getByRole("button", { name: T("Customers.trial.extend") }).click();
      const d = dialog(page);
      await d.waitFor({ timeout: 10000 });
      await d.getByRole("button", { name: T("Customers.trial.submit") }).click();
      const err = await d.getByText(T("Common.required")).count();
      return { ok: err >= 1, note: "submitting without a reason shows Required on the field" };
    });
    await step("extend-trial-new-end", async () => {
      const d = dialog(page);
      await d.getByRole("textbox", { name: new RegExp(esc(T("Customers.reason"))) }).fill(loc === "ar" ? "طلب العميل وقتًا إضافيًا للتجربة" : "Customer asked for more time to evaluate");
      await d.getByRole("button", { name: T("Customers.trial.submit") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      let after = before;
      for (let i = 0; i < 40 && after === before; i++) {
        await page.waitForTimeout(250);
        after = await chat.innerText();
      }
      const end = (txt) => txt.split("\n").map((l) => l.trim()).filter(Boolean).find((_, i, a) => a[i - 1] === T("Customers.line.trialEnd")) ?? "?";
      return { ok: after !== before && end(after) !== end(before), note: `${T("Customers.line.trialEnd")}: ${end(before)} → ${end(after)}` };
    });
    await step("view-as-needs-reason", async () => {
      await page.getByRole("button", { name: T("Customers.actions.viewAs") }).click();
      const d = confirmDialog(page);
      await d.waitFor({ timeout: 10000 });
      const confirm = d.getByRole("button", { name: T("Customers.actions.viewAsConfirm") });
      const disabledFirst = await confirm.isDisabled();
      await d.getByRole("textbox").fill(loc === "ar" ? "تذكرة TK-3301: مراجعة ما يراه المالك" : "Ticket TK-3301: check what the owner sees");
      const popup = ctx.waitForEvent("page", { timeout: 15000 }).catch(() => null);
      await confirm.click();
      const p = await popup;
      const url = p ? p.url() : "";
      await p?.close().catch(() => {});
      await page.getByRole("status").filter({ hasText: T("Customers.viewAs.opened") }).waitFor({ timeout: 10000 });
      return { ok: disabledFirst && /viewAs=/.test(decodeURIComponent(url)), note: `confirm disabled until a reason: ${disabledFirst}; opened ${url}` };
    });
    await step("audit-records-view-as", async () => {
      const audit = page.getByRole("region", { name: T("Customers.detail.audit") });
      const text = await audit.innerText();
      return { ok: text.includes(T("Customers.audit.view_as")) && text.includes("TK-3301"), note: text.replace(/\s+/g, " ").slice(0, 160) };
    });
  });

  await run(`[${loc}] Super Admin: suspend Gulf Retail, then reactivate it`, "admin", async (page, step) => {
    await go(page, loc, "/workspaces/ws_gulf");
    await step("suspend", async () => {
      await page.getByRole("button", { name: T("Customers.actions.more", { name: "Gulf Retail" }) }).click();
      await page.getByRole("menuitem", { name: T("Customers.actions.suspend") }).click();
      const d = confirmDialog(page);
      await d.getByRole("textbox").fill(loc === "ar" ? "مراجعة احتيال في الدفع" : "Payment fraud review");
      await d.getByRole("button", { name: T("Customers.actions.suspend") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      const badge = status("workspace", "suspended", loc);
      await page.getByText(badge, { exact: true }).first().waitFor({ timeout: 15000 });
      return { ok: true, note: `badge "${badge}"` };
    });
    await step("reactivate", async () => {
      await page.getByRole("button", { name: T("Customers.actions.reactivate") }).click();
      const d = confirmDialog(page);
      await d.getByRole("textbox").fill(loc === "ar" ? "انتهت المراجعة" : "Review closed");
      await d.getByRole("button", { name: T("Customers.actions.reactivate") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      await page.getByRole("button", { name: T("Customers.actions.reactivate") }).waitFor({ state: "detached", timeout: 15000 });
      const audit = await page.getByRole("region", { name: T("Customers.detail.audit") }).innerText();
      return { ok: audit.includes(T("Customers.audit.suspend")) && audit.includes(T("Customers.audit.reactivate")), note: "both recorded in the audit trail with their reasons" };
    });
  });

  await run(`[${loc}] Super Admin: approve mig_1, quote cpr_1`, "admin", async (page, step) => {
    await go(page, loc, "/migrations");
    await step("approve-migration", async () => {
      await page.getByRole("button", { name: T("Customers.migrations.approveFor", { name: "Gulf Retail" }) }).click();
      const d = confirmDialog(page);
      const impact = (await d.innerText()).replace(/\s+/g, " ");
      await d.getByRole("button", { name: T("Customers.migrations.approve") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      await page.getByText(T("Customers.migrations.state.scheduled"), { exact: true }).waitFor({ timeout: 15000 });
      return { ok: impact.includes("SAR") && impact.includes("AED"), note: `impact: ${impact.slice(0, 200)}` };
    });
    await go(page, loc, "/custom-plans");
    await step("quote-custom-plan", async () => {
      await page.getByRole("button", { name: T("Customers.customPlans.quoteFor", { name: "Gulf Retail" }) }).click();
      const d = dialog(page);
      await d.getByRole("textbox", { name: new RegExp(esc(T("Customers.quote.amount", { currency: "AED" }))) }).fill("90000");
      await d.getByRole("button", { name: T("Customers.quote.send") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      const row = page.locator("tr").filter({ hasText: "Gulf Retail" });
      await row.getByText(T("Customers.customPlans.state.quoted"), { exact: true }).waitFor({ timeout: 15000 });
      const text = (await row.innerText()).replace(/\s+/g, " ");
      return { ok: /90[,.\s ]?000/.test(text), note: text.slice(0, 160) };
    });
  });

  await run(`[${loc}] Super Admin: refund over the cap, then within it; void; mark Nile paid`, "admin", async (page, step) => {
    await go(page, loc, "/invoices?state=partially_refunded");
    await step("open-paid-invoice", async () => {
      await openFirstInvoice(page);
      return { ok: (await page.getByRole("region", { name: T("Billing.detail.creditNotes") }).locator("li").count()) === 1, note: "one credit note before" };
    });
    await step("refund-over-max", async () => {
      await page.getByRole("button", { name: T("Billing.actions.refund") }).first().click();
      const d = dialog(page);
      await d.getByRole("textbox", { name: new RegExp(esc(T("Billing.refund.amount", { currency: "AED" }))) }).fill("99999");
      await d.getByRole("textbox", { name: new RegExp(esc(T("Billing.reason"))) }).fill(loc === "ar" ? "تعويض عن انقطاع الخدمة" : "Service outage credit");
      const answered = page.waitForResponse((r) => r.url().includes("/refund"), { timeout: 15000 });
      await d.getByRole("button", { name: T("Billing.actions.refund") }).click();
      const res = await answered;
      const body = await res.json();
      const shown = (await d.innerText()).replace(/\s+/g, " ");
      const max = body?.error?.max;
      return { ok: res.status() === 422 && typeof max === "number" && /602[.,٫]10/.test(shown), note: `422 with max ${max}; dialog says: ${shown.slice(0, 200)}` };
    });
    await step("refund-partial-credit-note", async () => {
      const d = dialog(page);
      await d.getByRole("textbox", { name: new RegExp(esc(T("Billing.refund.amount", { currency: "AED" }))) }).fill("50");
      await d.getByRole("button", { name: T("Billing.actions.refund") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      const notes = page.getByRole("region", { name: T("Billing.detail.creditNotes") });
      await notes.locator("li").nth(1).waitFor({ timeout: 15000 });
      const text = (await notes.innerText()).replace(/\s+/g, " ");
      return { ok: (await notes.locator("li").count()) === 2 && /CN-2026-0000\d\d/.test(text), note: text.slice(0, 200) };
    });
    await go(page, loc, "/invoices?state=open");
    await step("void-open-invoice", async () => {
      await openFirstInvoice(page);
      const number = (await h1(page).innerText()).trim();
      await page.getByRole("button", { name: T("Billing.actions.more", { number }) }).click();
      await page.getByRole("menuitem", { name: T("Billing.actions.void") }).click();
      const d = confirmDialog(page);
      await d.getByRole("textbox").fill(loc === "ar" ? "أُصدرت بالخطأ" : "Issued by mistake");
      await d.getByRole("button", { name: T("Billing.actions.void") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      await page.getByText(status("invoice", "void", loc), { exact: true }).first().waitFor({ timeout: 15000 });
      return { ok: true, note: `${number} is void` };
    });
    await go(page, loc, "/invoices?state=past_due&workspace=ws_nile");
    await step("mark-nile-paid", async () => {
      await openFirstInvoice(page);
      await page.getByRole("button", { name: T("Billing.actions.markPaid") }).click();
      const d = dialog(page);
      await d.getByRole("textbox", { name: new RegExp(esc(T("Billing.markPaid.reference"))) }).fill("BT-20261003-118");
      await d.getByRole("button", { name: T("Billing.actions.markPaid") }).click();
      await d.waitFor({ state: "detached", timeout: 15000 });
      await page.getByText(status("invoice", "paid", loc), { exact: true }).first().waitFor({ timeout: 15000 });
      const pay = (await page.getByRole("region", { name: T("Billing.detail.payments") }).innerText()).replace(/\s+/g, " ");
      return { ok: pay.includes("BT-20261003-118") && pay.includes(T("Billing.method.bank_transfer")), note: pay.slice(0, 200) };
    });
    await go(page, loc, "/invoices");
    await step("manual-invoice-draft", async () => {
      await page.getByRole("button", { name: T("Billing.create.open") }).click();
      const d = dialog(page);
      await d.getByRole("combobox").fill("Quill");
      await page.getByRole("option", { name: /Quill/ }).click();
      await d.getByRole("textbox", { name: T("Billing.create.lineLabel", { n: 1 }) }).fill(loc === "ar" ? "ورشة تدريب" : "Onboarding workshop");
      await d.getByRole("textbox", { name: T("Billing.create.lineAmount", { n: 1 }) }).fill("1200");
      await d.getByRole("button", { name: T("Billing.create.submit") }).click();
      await page.waitForURL(/\/invoices\/inv_/, { timeout: 20000 });
      await page.getByRole("heading", { level: 1, name: /^INV-/ }).waitFor({ timeout: 20000 });
      const draft = await page.getByText(status("invoice", "draft", loc), { exact: true }).count();
      const lines = (await page.getByRole("region", { name: T("Billing.detail.lines") }).innerText()).replace(/\s+/g, " ");
      return { ok: draft >= 1 && /SAR|ر\.س/.test(lines) && lines.includes("1,200"), note: lines.slice(0, 200) };
    });
    await step("files-line-active", async () => {
      await go(page, loc, "/workspaces/ws_nile");
      const files = page.locator("li").filter({ has: page.getByRole("heading", { level: 3, name: new RegExp(esc(T("Customers.tools.files"))) }) });
      const text = await files.innerText();
      return { ok: text.includes(status("subscription_line", "active", loc)), note: text.replace(/\s+/g, " ").slice(0, 120) };
    });
  });

  // View-only roles: Service Manager (workspaces V, no billing), Finance (workspaces V, billing F),
  // Sales and Support (workspaces E, billing V).
  await run(`[${loc}] Service Manager (view only): no actions anywhere, no invoices`, "u15", async (page, step) => {
    await go(page, loc, "/workspaces/ws_nile");
    await step("workspace-no-actions", async () => {
      await h1(page).filter({ hasText: "Nile Foods" }).waitFor({ timeout: 20000 });
      const actions = await page.getByRole("button", { name: new RegExp(`${esc(T("Customers.actions.note"))}|${esc(T("Customers.actions.viewAs"))}|${esc(T("Customers.trial.extend"))}`) }).count();
      return { ok: actions === 0 && (await page.getByText(T("Common.viewOnly")).count()) === 1, note: `${actions} action buttons; says view only` };
    });
    await go(page, loc, "/migrations");
    await step("migrations-no-actions", async () => ({ ok: (await page.getByRole("button", { name: T("Customers.migrations.approve") }).count()) === 0 && (await page.getByText(T("Common.viewOnly")).count()) === 1, note: "no Approve/Reject" }));
    await go(page, loc, "/custom-plans");
    await step("custom-plans-no-actions", async () => ({ ok: (await page.getByRole("button", { name: T("Customers.customPlans.quote") }).count()) === 0, note: "no Send quote" }));
    await go(page, loc, "/invoices");
    await step("invoices-no-permission", async () => {
      const text = await page.locator("#ot-main, main").first().innerText();
      return { ok: text.includes("billing:view"), note: text.replace(/\s+/g, " ").slice(0, 120) };
    });
  });

  await run(`[${loc}] Finance: workspaces view only, invoices with actions`, "finance", async (page, step) => {
    await go(page, loc, "/workspaces/ws_spree");
    await step("workspace-no-actions", async () => {
      await h1(page).filter({ hasText: "Spree Studio" }).waitFor({ timeout: 20000 });
      return { ok: (await page.getByRole("button", { name: T("Customers.actions.viewAs") }).count()) === 0, note: "no View as / note / suspend" };
    });
    await go(page, loc, "/invoices?state=past_due");
    await step("invoice-actions", async () => {
      await openFirstInvoice(page);
      return { ok: (await page.getByRole("button", { name: T("Billing.actions.markPaid") }).count()) === 1, note: "Mark paid offered to Finance" };
    });
  });

  for (const who of ["sales", "u10"]) {
    await run(`[${loc}] ${who === "sales" ? "Sales" : "Support (Rana)"}: invoices view only`, who, async (page, step) => {
      await go(page, loc, "/invoices?state=past_due");
      await step("invoice-list-view-only", async () => ({ ok: (await page.getByRole("button", { name: T("Billing.create.open") }).count()) === 0 && (await page.getByText(T("Common.viewOnly")).count()) === 1, note: "no New invoice; says view only" }));
      await step("invoice-detail-no-actions", async () => {
        await openFirstInvoice(page);
        const n = await page.getByRole("button", { name: new RegExp(`${esc(T("Billing.actions.markPaid"))}|${esc(T("Billing.actions.retry"))}|${esc(T("Billing.actions.refund"))}`) }).count();
        return { ok: n === 0, note: `${n} invoice actions` };
      });
    });
  }
}

await mock.reset();
release();
await browser.close();
fs.writeFileSync(path.join(AUDITS, "admin", "flows", "adm-customers.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console})`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
  if (r.console) console.log(`   console: ${r.consoleSample.join(" | ").slice(0, 200)}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
