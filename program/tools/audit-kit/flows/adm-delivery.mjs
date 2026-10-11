// OrgTik Admin, delivery and system (ADM-24…26, ADM-30…33), walked in the browser in English and Arabic:
//   1. The Service Manager takes SR-211 from new to under review, then sends a quote in the
//      workspace's currency with the subscriber discount as its own line.
//   2. Laila (Service Team) acts on her own request (SR-213) but sees no actions on Youssef's
//      (SR-214); the API answers 403 when she tries.
//   3. Support replies to TK-3301 and adds an internal note; the customer's own view of the ticket
//      has the reply and not the note.
//   4. Mona gives Salma a role; her own Super Admin role can't be removed (locked, and the API 409).
//   5. Mona saves platform settings; Finance sees them view-only.
//   6. Reports render (figures, two charts, the payments with their day's rate).
//
//   node flows/adm-delivery.mjs      (ADM on :3008 and the platform mock on :4008)
//
// Takes the flow lock and resets the mock before each language. Writes
// audits/admin/flows/adm-delivery.json and screenshots under audits/admin/flows/adm-delivery/.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, WORKSPACE, apiUrl, webUrl } from "../lib/suite.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";
import { mock } from "../lib/mock.mjs";

const OUT = path.join(AUDITS, "admin", "flows", "adm-delivery");
const ADM = webUrl("admin");
const BASE = apiUrl("admin");
const EMAIL = {
  admin: "mona.adel@orgtik.test",
  finance: "hany.samir@orgtik.test",
  serviceMgr: "sherif.magdy@orgtik.test",
  laila: "laila.mostafa@orgtik.test",
  support: "mahmoud.gamal@orgtik.test",
  customer: "nour.khaled@nilefoods.test",
};
const msgs = (l, area) => JSON.parse(fs.readFileSync(path.join(WORKSPACE, "orgtik-admin", "messages", l, `${area}.json`), "utf8"));
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const release = await mock.lock("adm-delivery");
const browser = await chromium.launch();
const results = [];

async function run(title, who, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const signed = await signIn(ctx, "admin", EMAIL[who]);
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
      note = String(e.message || e).replace(/\s+/g, " ").slice(0, 400);
    }
    await settle(page);
    const shot = `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, shot) }).catch(() => {});
    steps.push({ name, ok, note, at: page.url().split("?")[0], shot });
  };
  if (!signed.ok) steps.push({ name: "sign-in", ok: false, note: `landed on ${signed.landed}` });
  else await fn(page, step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps, console: log.console.length, consoleSample: log.console.slice(0, 2) });
  await ctx.close();
}

const call = async (who, method, p, body) => {
  const res = await fetch(BASE + p, { method, headers: { authorization: `Bearer ${await tokenFor(EMAIL[who], "admin")}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json.data, error: json.error };
};
const api = async (who, p) => (await call(who, "GET", `/v1/admin${p}`)).data;
const open = async (page, l, route) => {
  await page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }));
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 30000 }).catch(() => {});
  await settle(page);
};
const byNumber = async (who, list, number) => (await api(who, `/${list}?pageSize=100`)).find((x) => x.number === number);

for (const l of ["en", "ar"]) {
  const S = msgs(l, "services").Services;
  const T = msgs(l, "support").Support;
  const Y = msgs(l, "system").System;
  const C = msgs(l, "common").Common;
  const R = msgs(l, "common").App.roles;
  await mock.reset();

  await run(`[${l}] Service Manager: SR-211 from new to under review to quoted`, "serviceMgr", async (page, step) => {
    const sr = await byNumber("serviceMgr", "service-requests", "SR-211");
    await open(page, l, `/service-requests/${sr.id}`);
    await step("review", async () => {
      await page.getByRole("button", { name: S.detail.review }).click();
      await page.getByRole("button", { name: S.detail.quote }).waitFor({ timeout: 15000 });
      const now = await api("serviceMgr", `/service-requests/${sr.id}`);
      return { ok: now.state === "under_review", note: `state ${now.state}` };
    });
    await step("quote-with-discount-line", async () => {
      await page.getByRole("button", { name: S.detail.quote }).click();
      const dialog = page.getByRole("dialog", { name: fmt(S.quote.title, { number: "SR-211" }) });
      const head = (await dialog.innerText()).replace(/\s+/g, " ");
      await dialog.getByLabel(fmt(S.quote.lineAmount, { n: 1 })).fill("80000");
      await dialog.getByLabel(fmt(S.quote.lineAmount, { n: 1 })).blur();
      const summary = (await dialog.locator("dl").last().innerText()).replace(/\s+/g, " ");
      await dialog.getByRole("button", { name: S.quote.send }).click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const now = await api("serviceMgr", `/service-requests/${sr.id}`);
      const q = now.quote;
      const discount = q?.lines.find((x) => x.amount < 0);
      return {
        ok: now.state === "quoted" && q.currency === "EGP" && q.lines.length === 2 && discount?.amount === -8000 && q.total === 72000 && head.includes("EGP"),
        note: `state ${now.state}; ${q?.currency} lines ${JSON.stringify(q?.lines)} total ${q?.total}; dialog summary "${summary}"`,
      };
    });
    await step("quote-shown", async () => {
      const table = page.getByRole("table", { name: S.detail.quoteTitle });
      await table.waitFor({ timeout: 10000 });
      const text = (await table.innerText()).replace(/\s+/g, " ");
      return { ok: /72[,.]?000/.test(text), note: text.slice(0, 200) };
    });
  });

  await run(`[${l}] Laila (Service Team): her own request yes, Youssef's no`, "laila", async (page, step) => {
    const mine = await byNumber("laila", "service-requests", "SR-213");
    const theirs = await byNumber("laila", "service-requests", "SR-214");
    await open(page, l, `/service-requests/${mine.id}`);
    await step("acts-on-own-request", async () => {
      const deliver = await page.getByRole("button", { name: S.detail.deliver, exact: true }).count();
      const text = l === "ar" ? "تقويم نوفمبر جاهز للمراجعة." : "The November calendar is ready for review.";
      await page.getByLabel(S.detail.writeMessage).fill(text);
      await page.getByRole("button", { name: S.detail.send }).click();
      await page.getByText(text).first().waitFor({ timeout: 15000 });
      const now = await api("laila", `/service-requests/${mine.id}`);
      return { ok: deliver === 1 && now.messages.some((m) => m.text === text && m.author === "u8"), note: `deliver button ${deliver}; message saved by ${now.messages.at(-1)?.author}` };
    });
    await open(page, l, `/service-requests/${theirs.id}`);
    await step("no-actions-on-youssefs", async () => {
      const note = fmt(S.detail.othersRequest, { name: theirs.assigneeName });
      await page.getByText(note).waitFor({ timeout: 15000 });
      const buttons = await page.getByRole("button", { name: new RegExp([S.detail.deliver, S.detail.hold, S.detail.assign, S.detail.reassign, S.detail.send].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")) }).count();
      const composer = await page.getByLabel(S.detail.writeMessage).count();
      const r = await call("laila", "POST", `/v1/admin/service-requests/${theirs.id}/actions`, { action: "message", text: "hi" });
      return { ok: buttons === 0 && composer === 0 && r.status === 403, note: `"${note}"; action buttons ${buttons}, composer ${composer}; API ${r.status} ${r.error?.code}` };
    });
  });

  await run(`[${l}] Support: a reply and an internal note on TK-3301; the customer sees only the reply`, "support", async (page, step) => {
    const tk = await byNumber("support", "tickets", "TK-3301");
    await open(page, l, `/tickets/${tk.id}`);
    const reply = l === "ar" ? "تحققنا من الدفع، يُرجى المحاولة مرة أخرى." : "We checked the payment: please try again.";
    const note = l === "ar" ? "البنك رفض بسبب 3DS، لا تخبر العميل بعد." : "Bank declined on 3DS; don't tell the customer yet.";
    await step("reply", async () => {
      await page.getByRole("textbox", { name: T.detail.replyLabel }).fill(reply);
      await page.getByRole("button", { name: T.detail.send, exact: true }).click();
      await page.getByRole("list", { name: T.detail.conversation }).getByText(reply).waitFor({ timeout: 15000 });
      return { ok: true, note: "reply in the conversation" };
    });
    await step("internal-note", async () => {
      await page.getByRole("checkbox", { name: T.detail.internal }).click();
      await page.getByRole("textbox", { name: T.detail.noteLabel }).fill(note);
      await page.getByRole("button", { name: T.detail.addNote }).click();
      const item = page.getByRole("list", { name: T.detail.conversation }).getByRole("listitem").filter({ hasText: note });
      await item.waitFor({ timeout: 15000 });
      const marked = await item.getByText(T.detail.internalBadge).count();
      return { ok: marked === 1, note: `the note carries "${T.detail.internalBadge}"` };
    });
    await step("customer-view-hides-note", async () => {
      const r = await call("customer", "GET", `/v1/app/tickets/${tk.id}`);
      const texts = (r.data?.messages ?? []).map((m) => m.text);
      const staff = (await api("support", `/tickets/${tk.id}`)).messages.map((m) => m.text);
      return { ok: r.status === 200 && texts.includes(reply) && !texts.includes(note) && staff.includes(note), note: `customer sees ${texts.length} messages (reply ${texts.includes(reply)}, note ${texts.includes(note)}); staff see ${staff.length}` };
    });
  });

  await run(`[${l}] Mona: staff roles, and her own Super Admin role stays`, "admin", async (page, step) => {
    await open(page, l, "/staff");
    await step("give-salma-content", async () => {
      await page.getByRole("button", { name: fmt(Y.staff.editFor, { name: "Salma Nabil" }) }).click();
      const dialog = page.getByRole("dialog", { name: fmt(Y.staff.editTitle, { name: "Salma Nabil" }) });
      await dialog.getByRole("checkbox", { name: R.content }).click();
      await dialog.getByRole("button", { name: Y.staff.saveRoles }).click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const salma = (await api("admin", "/staff")).find((s) => s.key === "employee");
      const row = (await page.locator("tbody tr", { hasText: "Salma Nabil" }).innerText()).replace(/\s+/g, " ");
      return { ok: salma.roles.join() === "content" && row.includes(R.content), note: `roles ${JSON.stringify(salma.roles)}; row "${row}"` };
    });
    await step("self-lockout", async () => {
      await page.getByRole("button", { name: fmt(Y.staff.editFor, { name: "Mona Adel" }) }).click();
      const dialog = page.getByRole("dialog", { name: fmt(Y.staff.editTitle, { name: "Mona Adel" }) });
      const box = dialog.getByRole("checkbox", { name: R.super_admin });
      const disabled = (await box.getAttribute("aria-disabled")) === "true" || (await box.getAttribute("data-disabled")) !== null || (await box.isDisabled());
      const said = await dialog.getByText(Y.staff.selfLocked).count();
      await dialog.getByRole("button", { name: C.cancel }).click();
      const r = await call("admin", "PUT", "/v1/admin/staff/admin/roles", { roles: ["finance"] });
      const mona = (await api("admin", "/staff")).find((s) => s.key === "admin");
      return { ok: disabled && said === 1 && r.status === 409 && r.error?.code === "self_lockout" && mona.roles.includes("super_admin"), note: `checkbox disabled ${disabled}, explained ${said === 1}; API ${r.status} ${r.error?.code}; roles ${JSON.stringify(mona.roles)}` };
    });
  });

  await run(`[${l}] Mona saves platform settings`, "admin", async (page, step) => {
    await open(page, l, "/settings");
    await step("save-settings", async () => {
      await page.getByLabel(Y.settings.autoApproveDays).fill("10");
      await page.getByLabel(Y.settings.noticeDays).fill("45");
      await page.getByLabel(Y.settings.noticeDays).blur();
      await page.getByRole("button", { name: Y.settings.save }).click();
      await page.getByText(Y.settings.saved).first().waitFor({ timeout: 15000 });
      const s = await api("admin", "/settings");
      const gaps = await page.getByText(C.notDecided).count();
      return { ok: s.services.autoApproveDays === 10 && s.priceChange.noticeDays === 45 && gaps === 6, note: `autoApprove ${s.services.autoApproveDays}, notice ${s.priceChange.noticeDays}; ${gaps} open questions say "${C.notDecided}"` };
    });
    await step("dunning-order-refused", async () => {
      await page.getByLabel(Y.settings.cancelAfterDays).fill("5");
      await page.getByLabel(Y.settings.cancelAfterDays).blur();
      await page.getByRole("button", { name: Y.settings.save }).click();
      await page.getByText(Y.settings.errors.dunning).waitFor({ timeout: 10000 });
      const s = await api("admin", "/settings");
      return { ok: s.dunning.cancelAfterDays === 37, note: `"${Y.settings.errors.dunning}"; saved value stays ${s.dunning.cancelAfterDays}` };
    });
  });

  await run(`[${l}] Finance: platform settings are view-only`, "finance", async (page, step) => {
    await open(page, l, "/settings");
    await step("finance-view-only", async () => {
      await page.getByText(Y.settings.viewOnly).waitFor({ timeout: 15000 });
      const save = await page.getByRole("button", { name: Y.settings.save }).count();
      const disabled = await page.getByLabel(Y.settings.autoApproveDays).isDisabled();
      return { ok: save === 0 && disabled, note: `no Save button (${save}); fields disabled ${disabled}` };
    });
  });

  await run(`[${l}] Mona: reports in USD`, "admin", async (page, step) => {
    await open(page, l, "/reports");
    await step("reports-render", async () => {
      await page.getByRole("heading", { level: 1, name: Y.reports.title }).waitFor({ timeout: 15000 });
      const charts = await page.getByText(Y.reports.byTool).count() + (await page.getByText(Y.reports.byCountry).count());
      const rows = await page.getByRole("table", { name: Y.reports.payments }).locator("tbody tr").count();
      const first = (await page.getByRole("table", { name: Y.reports.payments }).locator("tbody tr").first().innerText()).replace(/\s+/g, " ");
      return { ok: charts >= 2 && rows >= 1 && /48[.,]5/.test(first), note: `charts ${charts}; ${rows} payments; first "${first}"` };
    });
  });
}

release();
fs.writeFileSync(path.join(AUDITS, "admin", "flows", "adm-delivery.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console})`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
  if (r.console) console.log(`   console: ${r.consoleSample.join(" | ").slice(0, 200)}`);
}
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
