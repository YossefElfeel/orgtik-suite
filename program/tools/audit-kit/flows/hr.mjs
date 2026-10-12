// HR: the wave's golden flows (audits/hr/wave-plan.md § Golden flows), walked in the browser as
// the person each flow is for, opened from SOS like a person would. Names and expected messages
// come from HR's own catalogs (messages/<locale>.json, ICU via intl-messageformat), so the same
// walk runs in every language.
//
//   node flows/hr.mjs [--locale en] [--only H4]   (SOS, HR and the local-dev mock running)
//
// The mock data is reset under the shared lock before and after the run (flows change data).
// Writes audits/hr/flows[/<locale>]/<flow>/NN-<step>.png and walks.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, WORKSPACE, apiUrl, redact, webUrl } from "../lib/suite.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { mock } from "../lib/mock.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
// A run's period as HR shows it (hooks/useRunPeriod): formatRange in the reader's language, plain spaces.
const runPeriod = (run) => {
  const d = (iso) => new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" })
    .formatRange(d(run.periodStart), d(run.periodEnd)).replace(/[  ]/g, " ");
};
const only = arg("--only", null);
const HR_DIR = path.join(WORKSPACE, "somion-hr-dashboard-main");
const requireHr = createRequire(path.join(HR_DIR, "package.json"));
const { IntlMessageFormat } = requireHr("intl-messageformat");
const CATALOG = JSON.parse(fs.readFileSync(path.join(HR_DIR, "messages", `${LOCALE}.json`), "utf8"));
/** A message from HR's catalog ("payroll.run.freeze.title"), filled as next-intl fills it. */
const m = (key, values) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return String(new IntlMessageFormat(text, LOCALE).format(values));
};
const OUT = path.join(AUDITS, "hr", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const HR = webUrl("hr");
const PEOPLE = { admin: "mona.adel@orgtik.test", hr: "rana.saad@orgtik.test", manager: "karim.hassan@orgtik.test" };
const browser = await chromium.launch();
const walks = [];

/** A browser signed in to SOS as `who`, with HR opened from SOS (the one-time code hand-off). */
async function newContext(who) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }, { name: "NEXT_LOCALE", value: LOCALE, url: HR }]);
  await signIn(ctx, "sos", PEOPLE[who]);
  return ctx;
}

async function intoHr(page, route = "") {
  await page.goto(`${SOS}/go/hr_system${route ? `?redirect=${encodeURIComponent(route)}` : ""}`, { waitUntil: "load" });
  await page.waitForURL((u) => u.origin === HR && !u.pathname.endsWith("/auth"), { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page);
}

const open = async (page, route) => {
  await page.goto(`${HR}/${LOCALE}${route}`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page);
};

async function walk(id, title, who, fn) {
  if (only && !id.startsWith(only)) return;
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await newContext(who);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  let n = 0;
  const step = async (name, action, check) => {
    n++;
    const started = Date.now();
    let ok = true;
    let note = "";
    try {
      await action();
      await page.waitForTimeout(500);
      if (check) {
        const r = await check();
        ok = r === true || (typeof r === "object" && r !== null && r.ok !== false);
        note = typeof r === "object" && r ? r.note || "" : r === true ? "" : String(r);
      }
    } catch (e) {
      ok = false;
      note = String(e.message).split("\n")[0];
    }
    const shot = `${String(n).padStart(2, "0")}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}.png`;
    await page.screenshot({ path: path.join(dir, shot) }).catch(() => {});
    steps.push({ n, name, ok, note, ms: Date.now() - started, url: redact(page.url()), screenshot: `${id}/${shot}` });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${n}. ${name}${note ? ` (${note})` : ""}`);
    return ok;
  };
  console.log(`\n${id}: ${title} (as ${PEOPLE[who]})`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, as: PEOPLE[who], locale: LOCALE, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const dialog = (page) => page.getByRole("alertdialog").or(page.getByRole("dialog")).last();
const visible = (loc) => loc.isVisible().catch(() => false);
/** The run as the API states it, for checks the screen can't show alone. */
async function runFor(frequency, start) {
  const token = await tokenFor(PEOPLE.hr);
  const res = await fetch(`${apiUrl("hr")}/api/payroll/runs?frequency=${frequency}`, { headers: { Authorization: `Bearer ${token}` } });
  const items = (await res.json()).data?.items ?? [];
  return items.find((r) => r.periodStart === start) ?? null;
}

const release = await mock.lock("flows/hr");
await mock.reset();
try {
  // H0: open HR from the suite; no token in any address; a signed-out deep link comes back.
  await walk("H0-from-suite", "Open HR from the suite", "admin", async ({ page, step }) => {
    const seen = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
    await step("Open HR from SOS (/go/hr_system)", () => intoHr(page), async () => {
      const leaked = seen.some((u) => /[?&](token|accessToken)=/.test(u));
      const coded = seen.some((u) => /\/auth\?code=/.test(u));
      return { ok: !leaked && coded, note: leaked ? "a token was in an address" : `via a one-time code, ${seen.length} addresses, none with a token` };
    });
    await step("The page is in the reader's language", async () => {}, async () => {
      const { lang, dir } = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }));
      return { ok: lang === LOCALE && dir === (LOCALE === "ar" ? "rtl" : "ltr"), note: `lang ${lang}, dir ${dir}` };
    });
    await step("A deep link opened through SOS lands on its page", () => intoHr(page, "/payroll?tab=monthly"), async () => {
      const u = new URL(page.url());
      return { ok: u.pathname === `/${LOCALE}/payroll`, note: redact(page.url()) };
    });
  });

  // H4: a payroll run, start to finance. Every step that moves money or people is confirmed, says
  // how many people and how much, and waits for the API.
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const period = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(now);
  await walk("H4-payroll-run", "Payroll run: start, freeze, submit, approve, send to finance", "hr", async ({ page, step }) => {
    await step("Open Payroll", () => intoHr(page, "/payroll"), async () => {
      const empty = await visible(page.getByRole("heading", { name: m("payroll.run.empty.title", { period }) }));
      return { ok: empty, note: empty ? `no run for ${period} yet` : "expected the empty state" };
    });
    await step("A click on the empty state doesn't start a run", async () => {
      await page.getByText(m("payroll.run.empty.body")).click();
      await page.waitForTimeout(1500);
    }, async () => ({ ok: !(await runFor("monthly", monthStart)), note: "no run created" }));
    await step("Start the run", async () => {
      await page.getByRole("button", { name: m("payroll.run.empty.start", { period }) }).click();
      await page.getByRole("button", { name: m("payroll.status.freezeRun") }).waitFor({ timeout: 20000 });
    }, async () => {
      const run = await runFor("monthly", monthStart);
      return { ok: Boolean(run && run.status === "open"), note: run ? `${run.title}: ${run.itemCount} people, open` : "no run" };
    });
    await step("Freeze asks first, with the people and the money", async () => {
      await page.getByRole("button", { name: m("payroll.status.freezeRun") }).click();
      await dialog(page).waitFor();
    }, async () => {
      const run = await runFor("monthly", monthStart);
      const text = await dialog(page).innerText();
      const names = text.includes(m("payroll.run.freeze.title", { period: runPeriod(run) }));
      const people = text.includes(String(run.itemCount));
      return { ok: names && people && run.status === "open", note: text.replace(/\s+/g, " ").slice(0, 160) };
    });
    await step("Confirm: the run is frozen", async () => {
      await dialog(page).getByRole("button", { name: m("payroll.run.freeze.confirm") }).click();
      await page.getByRole("button", { name: m("payroll.status.reOpen") }).waitFor({ timeout: 20000 });
    }, async () => {
      const run = await runFor("monthly", monthStart);
      return { ok: run.status !== "open", note: `status ${run.status}` };
    });
    // "Select all" ticks the rows on this page (10 of 12): the button says how many go.
    let picked = 0;
    await step("Select the page's rows and submit them to the admin", async () => {
      await page.getByRole("checkbox").first().check();
      picked = (await page.getByRole("row").filter({ has: page.getByRole("checkbox", { checked: true }) }).count()) - 1;
      await page.getByRole("button", { name: m("payroll.status.submit", { count: picked }) }).click();
      await dialog(page).getByRole("button", { name: m("payroll.submit.confirm") }).click();
      await dialog(page).waitFor({ state: "hidden", timeout: 20000 });
    }, async () => {
      const run = await runFor("monthly", monthStart);
      return { ok: run.submittedCount === picked, note: `${run.submittedCount} of ${run.itemCount} submitted` };
    });
  });

  await walk("H4b-approve", "Payroll run: the admin approves all (confirmed)", "admin", async ({ page, step }) => {
    const run = await runFor("monthly", monthStart);
    await step("Open the batch from Pending approvals", async () => {
      await intoHr(page, "/payroll");
      await page.getByRole("link", { name: m("payroll.admin.review") }).first().click();
      await page.waitForURL((u) => /\/payroll\/\d+$/.test(u.pathname), { timeout: 20000 });
      await settle(page);
    }, async () => ({ ok: new URL(page.url()).pathname.endsWith(`/payroll/${run.id}`), note: redact(page.url()) }));
    await step("Approve all asks first, with the people and the money", async () => {
      await page.getByRole("button", { name: m("payroll.adminDetail.approveAll", { count: run.submittedCount }) }).click();
      await dialog(page).waitFor();
    }, async () => {
      const text = await dialog(page).innerText();
      return { ok: text.includes(String(run.submittedCount)) && /\d/.test(text), note: text.replace(/\s+/g, " ").slice(0, 160) };
    });
    await step("Confirm: everyone is approved", async () => {
      await dialog(page).getByRole("button", { name: m("payroll.adminDetail.approveAllConfirm.confirm") }).click();
      await page.waitForTimeout(2500);
    }, async () => {
      const after = await runFor("monthly", monthStart);
      return { ok: after.approvedCount === run.submittedCount, note: `${after.approvedCount} approved` };
    });
  });

  await walk("H4c-to-finance", "Payroll run: HR sends the approved pay to finance (confirmed)", "hr", async ({ page, step }) => {
    const run = await runFor("monthly", monthStart);
    await step("Send to finance asks first, with the amount", async () => {
      await intoHr(page, "/payroll");
      await page.getByRole("button", { name: m("payroll.status.pay") }).click();
      await dialog(page).waitFor();
    }, async () => {
      const text = await dialog(page).innerText();
      return { ok: text.includes(m("payroll.run.queue.title", { period: runPeriod(run) })) && text.includes(String(run.approvedCount)), note: text.replace(/\s+/g, " ").slice(0, 180) };
    });
    await step("Cancel: nothing is sent", async () => {
      await dialog(page).getByRole("button", { name: m("payroll.run.cancel") }).click();
      await page.waitForTimeout(800);
    }, async () => {
      const after = await runFor("monthly", monthStart);
      return { ok: after.queuedCount === 0, note: `${after.queuedCount} queued` };
    });
    await step("Confirm: the approved pay is in the finance queue", async () => {
      await page.getByRole("button", { name: m("payroll.status.pay") }).click();
      await dialog(page).getByRole("button", { name: m("payroll.run.queue.confirm") }).click();
      await page.waitForTimeout(2500);
    }, async () => {
      const after = await runFor("monthly", monthStart);
      return { ok: after.queuedCount === run.approvedCount, note: `${after.queuedCount} queued for payout` };
    });
  });

  // H1: add an employee with a Swiss address. One sheet from start to finish (a second one used to
  // open over it after step 1); a 4-digit Swiss post code is accepted (5 digits were required).
  await walk("H1-add-employee", "Add an employee with a Swiss address", "hr", async ({ page, step }) => {
    const email = `lea.keller.${Date.now().toString(36)}@orgtik.test`;
    const sheet = () => page.getByRole("dialog").last();
    const sheets = () => page.getByRole("dialog").count();
    const field = (key) => m(`createUpdateEmployee.fields.${key}`);
    await step("Open Add employee: one sheet", async () => {
      await intoHr(page, "/employees");
      await page.getByRole("button", { name: m("createUpdateEmployee.addEmployee") }).click();
      await sheet().getByRole("heading", { name: m("createUpdateEmployee.steps.personal.heading") }).waitFor();
    }, async () => ({ ok: (await sheets()) === 1, note: `${await sheets()} sheet(s)` }));
    await step("Fill the personal details, Zürich, post code 801", async () => {
      const s = sheet();
      await s.getByRole("textbox", { name: new RegExp(`^${field("firstName")}`) }).fill("Lea");
      await s.getByRole("textbox", { name: new RegExp(`^${field("lastName")}`) }).fill("Keller");
      await s.getByRole("textbox", { name: new RegExp(`^${field("password")}`) }).fill("Walk-Pass-2026");
      await s.getByRole("button", { name: new RegExp(`^${field("birthDate")}`) }).click();
      // The date picker is @orgtik/ui's, so its select names come from the library's catalog.
      await page.getByRole("combobox", { name: /Year|السنة|Jahr|Année|Anno/ }).selectOption("1990");
      await page.getByRole("combobox", { name: /Month|الشهر|Monat|Mois|Mese/ }).selectOption({ index: 2 });
      await page.getByRole("grid").getByRole("button", { name: /15/ }).first().click();
      await s.getByRole("radio", { name: m("createUpdateEmployee.options.gender.female") }).check().catch(async () => {
        await s.getByRole("radio").nth(1).click();
      });
      await s.getByRole("combobox", { name: new RegExp(`^${field("nationality")}`) }).click();
      await page.getByRole("option", { name: "Switzerland", exact: true }).click();
      await s.getByRole("textbox", { name: new RegExp(`^${field("phoneNumber")}`) }).fill("+41 44 123 45 67");
      await s.getByRole("textbox", { name: new RegExp(`^${field("email")}`) }).fill(email);
      await s.getByRole("textbox", { name: new RegExp(`^${field("nationalId")}`) }).fill("756.1234.5678.97");
      await s.getByRole("radio", { name: m("createUpdateEmployee.steps.personal.accommodationOptions.own.label") }).click();
      await s.getByRole("combobox", { name: new RegExp(`^${field("addressState")}`) }).click();
      await page.getByRole("option", { name: "Switzerland", exact: true }).click();
      await s.getByRole("textbox", { name: new RegExp(`^${field("addressCity")}`) }).fill("Zürich");
      await s.getByRole("textbox", { name: new RegExp(`^${field("addressLine1")}`) }).fill("Bahnhofstrasse 1");
      await s.getByRole("textbox", { name: new RegExp(`^${field("addressPostal")}`) }).fill("801");
      await s.getByRole("button", { name: m("createUpdateEmployee.nav.next") }).click();
    }, async () => {
      const said = m("createUpdateEmployee.errors.postCodeFor", { country: new Intl.DisplayNames([LOCALE], { type: "region" }).of("CH"), example: "8001" });
      const shown = await visible(sheet().getByText(said));
      return { ok: shown, note: shown ? said : "no post code message" };
    });
    await step("Post code 8001: on to step 2, still one sheet", async () => {
      await sheet().getByRole("textbox", { name: new RegExp(`^${field("addressPostal")}`) }).fill("8001");
      await sheet().getByRole("button", { name: m("createUpdateEmployee.nav.next") }).click();
      await sheet().getByRole("heading", { name: m("createUpdateEmployee.steps.employee.heading") }).waitFor({ timeout: 20000 });
      await page.waitForTimeout(1500);
    }, async () => {
      const u = new URL(page.url());
      const n = await sheets();
      return { ok: n === 1 && u.searchParams.has("employee_id") && !u.searchParams.has("mode"), note: `${n} sheet(s), ${u.search}` };
    });
    await step("Lea Keller exists", async () => {}, async () => {
      const token = await tokenFor(PEOPLE.hr);
      const res = await fetch(`${apiUrl("hr")}/api/employees?search=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}` } });
      const items = (await res.json()).data?.items ?? [];
      return { ok: items.length === 1, note: items[0] ? `${items[0].fullName}, ${items[0].email}` : "not found" };
    });
    await step("Close: the list is back, the wizard's place is gone from the address", async () => {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }, async () => {
      const u = new URL(page.url());
      return { ok: (await sheets()) === 0 && !u.searchParams.has("employee_id"), note: u.pathname + u.search };
    });
    await step("A row's edit action opens the edit sheet, and only it", async () => {
      await page.getByRole("button", { name: m("employeeTable.tooltips.edit") }).first().click();
      await sheet().getByRole("heading", { name: m("createUpdateEmployee.editEmployee") }).waitFor({ timeout: 20000 });
    }, async () => ({ ok: (await sheets()) === 1, note: `${await sheets()} sheet(s), ${new URL(page.url()).search}` }));
  });

  // H1b: Export downloads the list on screen (filters from the address), as a spreadsheet-safe CSV.
  await walk("H1b-export", "Export the filtered people list", "hr", async ({ page, step }) => {
    let csv = "";
    await step("Search for Salma, then Export", async () => {
      await intoHr(page, "/employees?q=salma");
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30000 }),
        page.getByRole("button", { name: m("employees.export") }).click(),
      ]);
      csv = fs.readFileSync(await download.path(), "utf8");
    }, async () => {
      const bom = csv.charCodeAt(0) === 0xfeff;
      const rows = csv.trim().split(/\r\n/);
      const header = rows[0].replace(/^﻿/, "");
      const ok = bom && header.includes(m("employeeTable.columns.employeeName")) && rows.length === 2 && /Salma/.test(rows[1]);
      return { ok, note: `${bom ? "UTF-8 with BOM" : "no BOM"}, ${rows.length - 1} row(s): ${rows[1]?.slice(0, 80)}` };
    });
  });

  // H3: decide on leave. Submit can't send without a choice; HR approves; the admin can act too.
  const leave = async (id) => {
    const token = await tokenFor(PEOPLE.hr);
    const res = await fetch(`${apiUrl("hr")}/api/attendance/time-offs/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).data;
  };
  const pendingLeave = async (skip = []) => {
    const token = await tokenFor(PEOPLE.hr);
    const res = await fetch(`${apiUrl("hr")}/api/attendance/time-offs/requests?status=pending&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    const items = body.data?.items ?? body.data ?? [];
    return items.find((r) => r.hrActionStatus === "pending" && !skip.includes(r.id));
  };
  const openDecision = async (page, request) => {
    await intoHr(page, "/time-off");
    const row = page.getByRole("row").filter({ hasText: request.employee?.fullName ?? request.requestCode });
    await row.first().getByRole("button", { name: m("timeOffTable.tooltips.viewEdit") }).click();
    await dialog(page).waitFor();
    await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.submitDecision") }).waitFor({ timeout: 20000 });
  };
  let decided = null;
  await walk("H3-decide-leave", "Decide on a leave request (HR)", "hr", async ({ page, step }) => {
    const request = await pendingLeave();
    decided = request?.id ?? null;
    await step("Open a pending request", () => openDecision(page, request), async () => ({ ok: Boolean(request), note: request ? `${request.requestCode}, ${request.employee?.fullName}` : "no pending request" }));
    await step("Submit is off until a decision is chosen", async () => {}, async () => {
      const submit = dialog(page).getByRole("button", { name: m("timeOffDialog.actions.submitDecision") });
      const off = await submit.isDisabled();
      const said = await visible(dialog(page).getByText(m("timeOffDialog.decision.choose")));
      return { ok: off && said, note: off ? m("timeOffDialog.decision.choose") : "Submit is pressable with nothing chosen" };
    });
    await step("Choose Approve: it says it's on, Submit turns on", async () => {
      await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.approve") }).click();
    }, async () => {
      const pressed = await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.approve") }).getAttribute("aria-pressed");
      const on = await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.submitDecision") }).isEnabled();
      return { ok: pressed === "true" && on, note: `aria-pressed ${pressed}, Submit ${on ? "on" : "off"}` };
    });
    await step("Submit: HR's decision is approved", async () => {
      await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.submitDecision") }).click();
      await dialog(page).waitFor({ state: "hidden", timeout: 20000 });
    }, async () => {
      const after = await leave(request.id);
      return { ok: after.hrActionStatus === "approved", note: `HR ${after.hrActionStatus}, request ${after.status}` };
    });
  });
  await walk("H3b-admin-decides", "The admin can decide on leave", "admin", async ({ page, step }) => {
    const request = await pendingLeave(decided ? [decided] : []);
    await step("Open a pending request as the admin", () => openDecision(page, request), async () => ({ ok: Boolean(request), note: request ? request.requestCode : "no pending request" }));
    await step("Reject with a note", async () => {
      await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.reject") }).click();
      await dialog(page).getByRole("textbox").fill("Overlaps the payroll cut-off; please pick other dates.");
      await dialog(page).getByRole("button", { name: m("timeOffDialog.actions.submitDecision") }).click();
      await dialog(page).waitFor({ state: "hidden", timeout: 20000 });
    }, async () => {
      const after = await leave(request.id);
      return { ok: after.hrActionStatus === "rejected", note: `HR ${after.hrActionStatus}, request ${after.status}` };
    });
  });

  // H6: delete a department. The confirm names it and says what happens to its people; Cancel keeps it.
  await walk("H6-delete-department", "Delete a department", "hr", async ({ page, step }) => {
    const token = await tokenFor(PEOPLE.hr);
    const api = async (p) => (await fetch(`${apiUrl("hr")}/api${p}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const depts = (await api("/departments?limit=50")).data?.items ?? [];
    const dept = depts.find((d) => (d.employees?.length ?? 0) > 0) ?? depts[0];
    const row = () => page.getByRole("row").filter({ hasText: dept.name });
    await step("Open Department, press the row's delete", async () => {
      await intoHr(page, "/department");
      await row().first().getByRole("button", { name: m("departmentPage.table.tooltips.deleteDepartment") }).click();
      await dialog(page).waitFor();
    }, async () => {
      const text = await dialog(page).innerText();
      const named = text.includes(m("deleteDialog.department.title", { name: dept.name }));
      const impact = text.includes(m("deleteDialog.department.impact", { count: dept.employees?.length ?? 0 }));
      return { ok: named && impact, note: text.replace(/\s+/g, " ").slice(0, 170) };
    });
    await step("Cancel: it's still there", async () => {
      await dialog(page).getByRole("button", { name: m("deleteDialog.cancel") }).click();
      await page.waitForTimeout(800);
    }, async () => ({ ok: (await api("/departments?limit=50")).data.items.some((d) => d.id === dept.id), note: `${dept.name} kept` }));
    await step("Delete: it's gone, its people stay", async () => {
      await row().first().getByRole("button", { name: m("departmentPage.table.tooltips.deleteDepartment") }).click();
      await dialog(page).getByRole("button", { name: m("deleteDialog.department.confirm") }).click();
      await dialog(page).waitFor({ state: "hidden", timeout: 20000 });
    }, async () => {
      const gone = !(await api("/departments?limit=50")).data.items.some((d) => d.id === dept.id);
      return { ok: gone && !(await visible(row().first())), note: gone ? `${dept.name} deleted` : "still there" };
    });
  });

  // H6b: a list's place survives a reload (page and search in the address).
  await walk("H6b-list-in-address", "A list keeps its page through a reload", "hr", async ({ page, step }) => {
    await step("Employees, page 2, reload", async () => {
      await intoHr(page, "/employees?view=table&limit=5&page=2");
      await page.reload({ waitUntil: "networkidle" });
      await settle(page);
    }, async () => {
      const current = await page.locator("[data-slot=pagination-link][aria-current=page]").first().innerText().catch(() => "");
      const u = new URL(page.url());
      return { ok: current.trim() === "2" && u.searchParams.get("page") === "2", note: `current page ${current.trim()}, ${u.search}` };
    });
  });

  // H8: a ticket message with markup that runs script renders as text (HR-004).
  await walk("H8-ticket-markup", "A ticket message with script doesn't run it", "hr", async ({ page, step }) => {
    const token = await tokenFor(PEOPLE.hr);
    const tickets = (await (await fetch(`${apiUrl("hr")}/api/tickets?limit=5`, { headers: { Authorization: `Bearer ${token}` } })).json()).data?.items ?? [];
    const ticket = tickets[0];
    await step("Post a message carrying script, open the ticket", async () => {
      await fetch(`${apiUrl("hr")}/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: `<p><b>Walk check</b></p><img src="x" onerror="window.__xss=1"><script>window.__xss=2</script><a href="javascript:window.__xss=3">link</a>` }),
      });
      await intoHr(page, `/tickets/${ticket.id}`);
      await page.waitForTimeout(1500);
    }, async () => {
      const ran = await page.evaluate(() => window.__xss);
      const bold = await visible(page.locator("b, strong").filter({ hasText: "Walk check" }).first());
      const js = await page.locator('a[href^="javascript:"]').count();
      return { ok: ran === undefined && bold && js === 0, note: `script ${ran === undefined ? "didn't run" : `ran (${ran})`}, formatting ${bold ? "kept" : "lost"}, javascript: links ${js}` };
    });
  });

  // H7: a manager opens payroll: a no-access state that says why, not a blank page.
  await walk("H7-no-access", "A manager opens payroll", "manager", async ({ page, step }) => {
    await step("Open Payroll as a manager", () => intoHr(page, "/payroll"), async () => {
      const said = await visible(page.getByRole("heading", { name: m("errors.noAccessTitle") }));
      return { ok: said, note: said ? m("errors.noAccessTitle") : "no no-access state" };
    });
  });
} finally {
  await browser.close();
  await mock.reset().catch(() => {});
  release();
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "walks.json"))}`);
