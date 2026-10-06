// OrgTik Admin, Catalog (ADM-03…07, 29), walked in the browser in English and Arabic:
// a tool's status change with the confirmation and its impact (the waitlist it notifies), a new
// tool refused without its Arabic name then saved, a plan's limits edited, a feature added then
// deleted and an in-use delete refused with the plans named, view-only roles with no edit
// controls, unknown keys answered with a not-found page, and no console errors.
//
//   node flows/adm-catalog.mjs      (OrgTik Admin on :3008 and the local-dev mock running)
//
// Takes the flow lock and resets the mock first. Writes audits/admin/flows/catalog.json
// (screenshots under audits/admin/flows/catalog/, git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, apiUrl, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const OUT = path.join(AUDITS, "admin", "flows", "catalog");
const ADM = webUrl("admin");
const API = `${apiUrl("admin")}/v1/admin`;
const MONA = "mona.adel@orgtik.test"; // Super Admin
const KARIM = "karim.hassan@orgtik.test"; // Product Manager (tools E, plans E, waitlist F)
const OMAR = "omar.farouk@orgtik.test"; // Sales (tools V, plans V, waitlist V)
const MAHMOUD = "mahmoud.gamal@orgtik.test"; // Support (tools V, plans V, no waitlist)

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const release = await mock.lock("adm-catalog");
await mock.reset();
const browser = await chromium.launch();
const results = [];

const api = async (email, p) => {
  const res = await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${await tokenFor(email)}` } });
  return (await res.json()).data;
};
// The browser logs a failed fetch it was asked to make (a 404 for an unknown key): those are expected answers, not errors.
const realErrors = (log) => [...log.page, ...(log.where ?? []).filter((m) => !/Failed to load resource: the server responded with a status of (404|409|422)/.test(m))];

async function run(title, email, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const signed = await signIn(ctx, "admin", email);
  const page = await ctx.newPage();
  const log = watch(page);
  // Console errors with the address they happened on, so a failure says where to look.
  page.on("console", (m) => m.type() === "error" && (log.where ??= []).push(`${m.text().slice(0, 240)} (on ${page.url().replace(ADM, "")})`));
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
    await page.screenshot({ path: path.join(OUT, `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`) }).catch(() => {});
    steps.push({ name, ok, note });
  };
  if (!signed.ok) steps.push({ name: "sign-in", ok: false, note: `landed on ${signed.landed}` });
  else await fn(page, step);
  const errs = realErrors(log);
  steps.push({ name: "no-console-errors", ok: errs.length === 0, note: errs[0] ?? "" });
  await ctx.close();
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps });
}

const open = async (page, url, h1) => {
  await page.goto(`${ADM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: h1 }).first().waitFor({ timeout: 30000 });
};
const dialog = (page) => page.getByRole("alertdialog");

// ---- ADM-03: status change, confirmation with impact ----
await run("EN: a status change says whom it notifies, and General can't be retired", MONA, async (page, step) => {
  await open(page, "/en/tools", "Tools");
  await step("general-retire-blocked", async () => {
    await page.getByRole("button", { name: "Change the status of General" }).click();
    const retire = page.getByRole("menuitem", { name: /Retire/ });
    const disabled = (await retire.getAttribute("aria-disabled")) === "true" || (await retire.getAttribute("data-disabled")) !== null;
    const hint = await retire.innerText();
    await page.keyboard.press("Escape");
    return { ok: disabled && /Every workspace has it/.test(hint), note: `Retire disabled ${disabled}; "${hint.replace(/\s+/g, " ")}"` };
  });
  await step("email-to-beta-impact", async () => {
    await page.getByRole("button", { name: "Change the status of Email" }).click();
    await page.getByRole("menuitem").first().waitFor();
    const items = await page.getByRole("menuitem").allInnerTexts();
    await page.getByRole("menuitem", { name: "Move to beta" }).click();
    const text = await dialog(page).innerText();
    return { ok: /Move Email to beta\?/.test(text) && /Notifies 2 people on its waitlist\./.test(text) && items.length === 2, note: `menu: ${items.join(" | ")}; dialog: ${text.replace(/\s+/g, " ").slice(0, 160)}` };
  });
  await step("email-to-beta-confirmed", async () => {
    await dialog(page).getByRole("button", { name: "Move to beta" }).click();
    await dialog(page).waitFor({ state: "detached", timeout: 15000 });
    await page.getByRole("row", { name: /Email/ }).getByText("Beta", { exact: true }).waitFor({ timeout: 15000 });
    const tool = (await api(MONA, "/tools")).find((t) => t.key === "email");
    const wl = await api(MONA, "/waitlist?tool=email");
    return { ok: tool.status === "beta" && wl.every((w) => w.notified), note: `email ${tool.status}; ${wl.filter((w) => w.notified).length}/${wl.length} on its waitlist notified` };
  });
  await step("waitlist-shows-notified", async () => {
    await open(page, "/en/waitlist?tool=email", "Waitlist");
    const notified = await page.getByRole("row").filter({ hasText: "Notified" }).filter({ hasText: "Email" }).count();
    return { ok: notified === 2 && /tool=email/.test(page.url()), note: `${notified} notified rows, filter in the address` };
  });
});

await run("AR: making a tool live from its page, with the impact in Arabic", KARIM, async (page, step) => {
  await open(page, "/ar/tools/website", "الموقع");
  await step("confirm-impact-ar", async () => {
    await page.getByRole("button", { name: "تغيير الحالة" }).click();
    await page.getByRole("menuitem", { name: "إتاحة الأداة" }).click();
    const text = await dialog(page).innerText();
    return { ok: /إتاحة الموقع للعملاء؟/.test(text) && /سيُبلَّغ شخص واحد من قائمة انتظارها/.test(text), note: text.replace(/\s+/g, " ").slice(0, 160) };
  });
  await step("live-saved", async () => {
    await dialog(page).getByRole("button", { name: "إتاحة الأداة" }).click();
    await dialog(page).waitFor({ state: "detached", timeout: 15000 });
    await page.getByText("متاحة", { exact: true }).first().waitFor({ timeout: 15000 });
    const tool = (await api(KARIM, "/tools")).find((t) => t.key === "website");
    return { ok: tool.status === "live" && tool.next.join() === "retired", note: `website ${tool.status}, next: ${tool.next.join(",")}` };
  });
});

// ---- ADM-04: add a tool, D-014 (EN and AR names required) ----
const createTool = (lang, key, names, labels) =>
  run(`${lang.toUpperCase()}: a new tool without its Arabic name is refused on the field, then saved`, MONA, async (page, step) => {
    await open(page, `/${lang}/tools/new`, labels.h1);
    await step("arabic-name-missing", async () => {
      await page.getByLabel(labels.key).fill(key);
      await page.getByLabel(`${labels.name} (English)`).fill(names.en);
      await page.getByLabel(`${labels.short} (English)`).fill(names.shortEn);
      await page.getByRole("tab", { name: /^العربية/ }).last().click();
      await page.getByLabel(`${labels.short} (العربية)`).fill(names.shortAr);
      await page.getByRole("button", { name: labels.submit }).click();
      const input = page.getByLabel(`${labels.name} (العربية)`);
      await input.waitFor({ timeout: 10000 });
      const invalid = await input.getAttribute("aria-invalid");
      const msg = await page.getByText(labels.required, { exact: true }).count();
      const made = (await api(MONA, "/tools")).some((t) => t.key === key);
      return { ok: invalid === "true" && msg > 0 && !made && /\/tools\/new$/.test(page.url()), note: `Arabic name tab open and invalid (${invalid}), "${labels.required}" shown, nothing created` };
    });
    await step("fixed-and-saved", async () => {
      await page.getByLabel(`${labels.name} (العربية)`).fill(names.ar);
      await page.getByRole("button", { name: labels.submit }).click();
      await page.waitForURL(new RegExp(`/${lang}/tools/${key}$`), { timeout: 15000 });
      await page.getByRole("heading", { level: 1, name: lang === "ar" ? names.ar : names.en }).waitFor({ timeout: 15000 });
      const t = await api(MONA, `/tools/${key}`);
      return { ok: t.name.en === names.en && t.name.ar === names.ar && t.status === "coming_soon", note: `${key}: ${t.name.en} / ${t.name.ar}, ${t.status}` };
    });
  });
await createTool("en", "calendar", { en: "Calendar", ar: "التقويم", shortEn: "Shared calendars and bookings.", shortAr: "تقويمات مشتركة وحجوزات." }, { h1: "Add a tool", key: "Tool key", name: "Name", short: "Short description", submit: "Add tool", required: "Required" });
await createTool("ar", "bookings", { en: "Bookings", ar: "الحجوزات", shortEn: "Appointments with customers.", shortAr: "مواعيد مع العملاء." }, { h1: "إضافة أداة", key: "مفتاح الأداة", name: "الاسم", short: "وصف مختصر", submit: "إضافة الأداة", required: "مطلوب" });

// ---- ADM-07: a plan's limits ----
await run("EN: editing a plan's limits saves one value per limit", MONA, async (page, step) => {
  await open(page, "/en/plans/chat_pro", "Pro");
  await step("price-not-here", async () => {
    const grid = await page.getByRole("link", { name: "Open the price grid" }).getAttribute("href");
    const moneyInputs = (await page.getByRole("textbox", { name: /price/i }).count()) + (await page.getByRole("spinbutton", { name: /price/i }).count());
    return { ok: /\/pricing\?tool=chat$/.test(grid ?? "") && moneyInputs === 0, note: `price grid link ${grid}; no price input` };
  });
  await step("limit-saved", async () => {
    const field = page.getByLabel("chat.history_days");
    await field.fill("7300");
    await field.blur();
    await page.getByLabel("Trial days").fill("30");
    await page.getByLabel("Trial days").blur();
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByText("Saved", { exact: true }).first().waitFor({ timeout: 15000 });
    const p = await api(MONA, "/plans/chat_pro");
    return { ok: p.limits["chat.history_days"] === 7300 && p.trialDays === 30 && p.flags["chat.meetings"] === true, note: `history_days ${p.limits["chat.history_days"]}, trial ${p.trialDays}, flags kept` };
  });
  await step("english-name-required", async () => {
    await page.getByLabel("Name (English)").fill("");
    await page.getByRole("button", { name: "Save" }).click();
    const invalid = await page.getByLabel("Name (English)").getAttribute("aria-invalid");
    const p = await api(MONA, "/plans/chat_pro");
    return { ok: invalid === "true" && p.name.en === "Pro", note: `English name invalid (${invalid}); still "${p.name.en}" in the API` };
  });
});

await run("AR: a limit set to unlimited", KARIM, async (page, step) => {
  await open(page, "/ar/plans/tasks_pro", "احترافي");
  await step("unlimited-saved", async () => {
    const row = page.locator("div.grid").filter({ has: page.getByLabel("tasks.projects") }).last();
    await row.getByRole("checkbox", { name: "غير محدود" }).click();
    const disabled = await page.getByLabel("tasks.projects").isDisabled();
    await page.getByRole("button", { name: "حفظ" }).click();
    await page.getByText("تم الحفظ", { exact: true }).first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const p = await api(KARIM, "/plans/tasks_pro");
    return { ok: disabled && p.limits["tasks.projects"] === null && p.limits["tasks.guests"] === 5, note: `number field disabled ${disabled}; tasks.projects ${JSON.stringify(p.limits["tasks.projects"])}, guests ${p.limits["tasks.guests"]}` };
  });
});

// ---- ADM-05: features and limits ----
const features = (lang, key, labels) =>
  run(`${lang.toUpperCase()}: a feature added then deleted; an in-use delete refused with its plans`, KARIM, async (page, step) => {
    await open(page, `/${lang}/plans/features?tool=chat`, labels.h1);
    await step("added", async () => {
      await page.getByRole("button", { name: labels.add }).click();
      const dlg = page.getByRole("dialog", { name: labels.addTitle });
      const prefilled = await dlg.getByLabel(labels.key).inputValue();
      await dlg.getByLabel(labels.key).fill(key);
      await dlg.getByRole("radio", { name: labels.flag }).click();
      await dlg.getByRole("button", { name: labels.addConfirm }).click();
      await dlg.waitFor({ state: "detached", timeout: 15000 });
      await page.getByRole("row", { name: new RegExp(key.replace(".", "\\.")) }).waitFor({ timeout: 15000 });
      const f = (await api(KARIM, "/features?tool=chat")).find((x) => x.key === key);
      return { ok: prefilled === "chat." && f?.kind === "flag", note: `key prefilled "${prefilled}"; ${key} is ${f?.kind}` };
    });
    await step("deleted", async () => {
      await page.getByRole("button", { name: labels.deleteFor(key) }).click();
      const text = await dialog(page).innerText();
      await dialog(page).getByRole("button", { name: labels.delete }).click();
      await dialog(page).waitFor({ state: "detached", timeout: 15000 });
      await page.getByRole("row", { name: new RegExp(key.replace(".", "\\.")) }).waitFor({ state: "detached", timeout: 15000 });
      const gone = !(await api(KARIM, "/features")).some((x) => x.key === key);
      return { ok: gone && labels.unused.test(text), note: `impact: ${text.replace(/\s+/g, " ").slice(0, 120)}; gone from the API ${gone}` };
    });
    await step("in-use-refused", async () => {
      await page.getByRole("button", { name: labels.deleteFor("chat.meetings") }).click();
      await dialog(page).getByRole("button", { name: labels.delete }).click();
      await dialog(page).waitFor({ state: "detached", timeout: 15000 });
      const alert = page.getByRole("alert").filter({ hasText: "chat.meetings" });
      await alert.waitFor({ timeout: 15000 });
      const links = await alert.getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      const still = (await api(KARIM, "/features")).some((x) => x.key === "chat.meetings");
      return { ok: still && links.length === 3 && links.every((h) => /\/plans\/chat_/.test(h)), note: `refused; plans linked: ${links.join(", ")}` };
    });
  });
await features("en", "chat.polls", { h1: "Plans and features", add: "Add feature", key: "Feature key", flag: /On\/off/, addConfirm: "Add feature", addTitle: "Add a feature or limit", deleteFor: (k) => `Delete ${k}`, delete: "Delete feature", unused: /No plan uses it/ });
await features("ar", "chat.reactions", { h1: "الخطط والميزات", add: "إضافة ميزة", key: "مفتاح الميزة", flag: /تشغيل\/إيقاف/, addConfirm: "إضافة الميزة", addTitle: "إضافة ميزة أو حد", deleteFor: (k) => `حذف ${k}`, delete: "حذف الميزة", unused: /لا تستخدمها أي خطة/ });

// ---- view-only roles ----
await run("EN: Sales sees the catalog with no edit controls and a view-only note", OMAR, async (page, step) => {
  const VIEW_ONLY = "View only: your role can't change this.";
  await open(page, "/en/tools", "Tools");
  await step("tools-view-only", async () => {
    const change = await page.getByRole("button", { name: /Change (the )?status/ }).count();
    const add = await page.getByRole("link", { name: "Add tool" }).count();
    const note = await page.getByRole("note").filter({ hasText: VIEW_ONLY }).count();
    return { ok: change === 0 && add === 0 && note === 1, note: `status buttons ${change}, add ${add}, view-only note ${note}` };
  });
  await step("tool-view-only", async () => {
    await open(page, "/en/tools/chat", "Chat");
    const save = await page.getByRole("button", { name: "Save" }).count();
    const inputs = await page.getByRole("textbox").count();
    const table = await page.getByRole("table", { name: "Name and description in each language" }).count();
    return { ok: save === 0 && inputs === 0 && table === 1, note: `save ${save}, text inputs ${inputs}, texts table ${table}` };
  });
  await step("plan-view-only", async () => {
    await open(page, "/en/plans/chat_pro", "Pro");
    const save = await page.getByRole("button", { name: "Save" }).count();
    const ro = await page.getByLabel("chat.history_days").evaluate((e) => e.readOnly);
    const note = await page.getByRole("note").filter({ hasText: VIEW_ONLY }).count();
    return { ok: save === 0 && ro && note === 1, note: `save ${save}, limit read-only ${ro}, note ${note}` };
  });
  await step("features-view-only", async () => {
    await open(page, "/en/plans/features", "Plans and features");
    const del = await page.getByRole("button", { name: /^Delete / }).count();
    const add = await page.getByRole("button", { name: "Add feature" }).count();
    return { ok: del === 0 && add === 0, note: `delete buttons ${del}, add ${add}` };
  });
  await step("not-found", async () => {
    await open(page, "/en/tools/nope", "There's no such tool");
    const back = await page.getByRole("link", { name: "Back to tools" }).getAttribute("href");
    await open(page, "/en/plans/nope", "There's no such plan");
    return { ok: /\/en\/tools$/.test(back ?? ""), note: `tool and plan 404 pages; back link ${back}` };
  });
});

await run("AR: Support can view tools but not the waitlist", MAHMOUD, async (page, step) => {
  await open(page, "/ar/tools", "الأدوات");
  await step("tools-view-only-ar", async () => {
    const change = await page.getByRole("button", { name: /تغيير/ }).count();
    const note = await page.getByRole("note").count();
    return { ok: change === 0 && note === 1, note: `status buttons ${change}, view-only note ${note}` };
  });
  await step("waitlist-no-permission", async () => {
    await page.goto(`${ADM}/ar/waitlist`, { waitUntil: "networkidle" });
    const text = await page.locator("main").innerText();
    return { ok: /waitlist:view/.test(text), note: text.replace(/\s+/g, " ").slice(0, 120) };
  });
});

await browser.close();
release();
fs.writeFileSync(path.join(AUDITS, "admin", "flows", "catalog.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
