// OrgTik Admin, pricing (spec 03; ADM-08…15), walked in the browser in English and Arabic:
//   1. Finance drafts GCC chat_pro 45 → 50 (the cell reads "from → to").
//   2. Publishing to existing customers "now" is refused (P5), with the reason on the field.
//   3. Publishing with notice succeeds; the log has it; the preview shows AE 49 AED and KW 4.100 KWD.
//   4. A country's currency override without a rate is refused (X2); after adding the rate it saves.
//   5. A currency's rounding changes (CHF up), and the preview follows (CH 10 → 11 CHF).
//   6. Sales sees a view-only grid; Support gets no pricing at all (page and navigation).
//
//   node flows/adm-pricing.mjs      (ADM on :3008 and the platform mock on :4008)
//
// Takes the flow lock and resets the mock before each language. Writes
// audits/admin/flows/adm-pricing.json and screenshots under audits/admin/flows/adm-pricing/.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, WORKSPACE, apiUrl, webUrl } from "../lib/suite.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";
import { mock } from "../lib/mock.mjs";

const OUT = path.join(AUDITS, "admin", "flows", "adm-pricing");
const ADM = webUrl("admin");
const API = `${apiUrl("admin")}/v1/admin`;
const EMAIL = { admin: "mona.adel@orgtik.test", finance: "hany.samir@orgtik.test", sales: "omar.farouk@orgtik.test", support: "mahmoud.gamal@orgtik.test" };
const msgs = (l, area) => JSON.parse(fs.readFileSync(path.join(WORKSPACE, "orgtik-admin", "messages", l, `${area}.json`), "utf8"));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const release = await mock.lock("adm-pricing");
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

const api = async (who, p) => {
  const res = await fetch(API + p, { headers: { authorization: `Bearer ${await tokenFor(EMAIL[who])}` } });
  return (await res.json()).data;
};
const open = async (page, l, route) => {
  // A client-side navigation still settling can abort the next goto: try once more.
  await page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }));
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 30000 }).catch(() => {});
  // Hides the Next.js dev badge: in RTL it sits over a sheet's Save button.
  await settle(page);
};
const rowText = (page, iso) => page.locator("tbody tr").filter({ has: page.locator(`text="${iso}"`) }).first().innerText();
/** Opens a library Select (Base UI) inside `scope`, the n-th one, and picks the option matching `name`. */
const pick = async (page, scope, n, name) => {
  await scope.getByRole("combobox").nth(n).click();
  await page.getByRole("option", { name }).first().click();
  await page.getByRole("listbox").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
};

for (const l of ["en", "ar"]) {
  const P = msgs(l, "pricing").Pricing;
  const C = msgs(l, "common").Common;
  await mock.reset();

  await run(`[${l}] Finance: draft, a refused publish (P5), a publish with notice, the log and the preview`, "finance", async (page, step) => {
    await open(page, l, "/pricing");
    await step("draft-gcc-chat-pro", async () => {
      await page.locator('[data-cell="chat_pro:monthly:gcc"]').click();
      const dialog = page.getByRole("dialog");
      await dialog.locator("input").first().fill("50");
      await dialog.locator('button[type="submit"]').click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const cell = page.locator('[data-cell="chat_pro:monthly:gcc"]');
      await page.waitForFunction(() => document.querySelector('[data-cell="chat_pro:monthly:gcc"]')?.textContent.includes("→"), null, { timeout: 15000 });
      const text = (await cell.innerText()).replace(/\s+/g, " ");
      const draft = (await api("finance", "/grid")).draft;
      const c = draft?.changes.find((x) => x.key === "chat_pro:monthly:gcc");
      return { ok: text.includes("45.00") && text.includes("50.00") && c?.from === 45 && c?.to === 50, note: `cell "${text.trim()}", draft ${JSON.stringify(c)}` };
    });
    await step("publish-existing-now-refused", async () => {
      await page.locator('[data-action="publish"]').click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      const warned = await dialog.locator(".text-warning").count();
      await dialog.getByRole("radio").nth(2).click();
      await dialog.locator("textarea").fill(l === "ar" ? "مراجعة أسعار الخليج" : "GCC price review");
      await dialog.locator('button[type="submit"]').click();
      await dialog.getByText(P.publish.errors.increase_needs_notice).waitFor({ timeout: 15000 });
      const still = (await api("finance", "/grid")).draft;
      return { ok: Boolean(still?.changes.length) && warned > 0, note: `refusal on the field; warned before submit: ${warned > 0}; draft kept (${still?.changes.length} change)` };
    });
    let notified = null;
    await step("publish-with-notice", async () => {
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("radio").nth(1).click();
      await dialog.locator('button[type="submit"]').click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const status = (await page.getByRole("status").filter({ hasText: P.grid.seeLog }).innerText()).replace(/\s+/g, " ");
      const grid = await api("finance", "/grid");
      const logged = (await api("finance", "/pricing-log"))[0];
      notified = logged?.notified;
      return { ok: !grid.draft && grid.priceVersion === 2 && logged?.applyMode === "existing_next_renewal" && notified > 0, note: `${status.slice(0, 140)} · notified ${notified}` };
    });
    await step("log-shows-it", async () => {
      await open(page, l, "/pricing/log");
      const first = (await page.locator("tbody tr").first().innerText()).replace(/\s+/g, " ");
      const reason = l === "ar" ? "مراجعة أسعار الخليج" : "GCC price review";
      return { ok: first.includes(reason) && first.includes(P.publish.modes.existing_next_renewal) && first.includes(String(notified)), note: first.slice(0, 200) };
    });
    await step("preview-ae-49-kw-4.100", async () => {
      await open(page, l, "/pricing/preview?plan=chat_pro");
      await page.locator("tbody tr").filter({ hasText: "KW" }).first().waitFor({ timeout: 20000 });
      const ae = (await rowText(page, "AE")).replace(/\s+/g, " ");
      const kw = (await rowText(page, "KW")).replace(/\s+/g, " ");
      const sa = (await rowText(page, "SA")).replace(/\s+/g, " ");
      return { ok: ae.includes("49.00") && ae.includes(P.source.converted) && kw.includes("4.100") && sa.includes("50.00"), note: `SA "${sa}" · AE "${ae}" · KW "${kw}"` };
    });
  });

  await run(`[${l}] Finance: a currency override without a rate is refused (X2), then saved after adding the rate`, "finance", async (page, step) => {
    await open(page, l, "/pricing/currencies");
    await step("add-currency-jod", async () => {
      await page.locator('[data-action="add-currency"]').click();
      const dialog = page.getByRole("dialog");
      const inputs = dialog.locator("input:not([type=hidden])");
      await inputs.nth(0).fill("JOD");
      await inputs.nth(1).fill(l === "ar" ? "دينار أردني" : "Jordanian dinar");
      await dialog.locator('button[type="submit"]').click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const cur = (await api("finance", "/currencies")).find((c) => c.code === "JOD");
      return { ok: Boolean(cur?.active), note: JSON.stringify(cur) };
    });
    const countrySheet = () => page.getByRole("dialog").filter({ hasText: P.countries.sheetDescription });
    await step("override-without-rate-refused", async () => {
      await open(page, l, "/pricing/zones?country=BH");
      const sheet = countrySheet();
      await sheet.waitFor({ timeout: 20000 });
      await pick(page, sheet, 1, /JOD/);
      await sheet.getByRole("button", { name: C.save, exact: true }).click();
      const message = P.countries.errors.no_rate.replace("{from}", "SAR").replace("{to}", "JOD");
      await sheet.getByText(message).waitFor({ timeout: 15000 });
      const bh = (await api("finance", "/countries")).find((c) => c.iso === "BH");
      const link = await sheet.getByRole("link", { name: P.countries.addRate }).count();
      return { ok: bh.currency === "BHD" && link > 0, note: `message on the field, ${link} link(s) to the rates; BH still ${bh.currency}` };
    });
    await step("add-rate-from-the-link", async () => {
      await countrySheet().getByRole("link", { name: P.countries.addRate }).first().click();
      await page.waitForURL(/\/pricing\/currencies/, { timeout: 20000 });
      const dialog = page.getByRole("dialog").filter({ hasText: P.rates.dialogDescription });
      await dialog.waitFor({ timeout: 20000 });
      const prefilled = (await dialog.innerText()).replace(/\s+/g, " ");
      await dialog.locator("input:not([type=hidden])").last().fill("0.189");
      await dialog.locator('button[type="submit"]').click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const r = (await api("finance", "/rates")).find((x) => x.from === "SAR" && x.to === "JOD");
      return { ok: r?.rate === 0.189 && prefilled.includes("SAR") && prefilled.includes("JOD"), note: `rate ${JSON.stringify(r)}` };
    });
    await step("override-saves-with-rate", async () => {
      await open(page, l, "/pricing/zones?country=BH");
      const sheet = countrySheet();
      await sheet.waitFor({ timeout: 20000 });
      await pick(page, sheet, 1, /JOD/);
      await sheet.getByRole("button", { name: C.save, exact: true }).click();
      await sheet.waitFor({ state: "detached", timeout: 15000 });
      const bh = (await api("finance", "/countries")).find((c) => c.iso === "BH");
      const row = (await rowText(page, "BH")).replace(/\s+/g, " ");
      return { ok: bh.currency === "JOD" && row.includes("JOD") && row.includes(P.countries.ownCurrency), note: `row "${row}"` };
    });
  });

  await run(`[${l}] Finance: a currency's rounding (CHF nearest → up), and the preview follows`, "finance", async (page, step) => {
    const before = (await api("finance", "/price-preview?planId=chat_pro")).find((r) => r.country === "CH");
    await open(page, l, "/pricing/currencies");
    await step("chf-rounding-up", async () => {
      await page.locator('[data-edit="CHF"]').click();
      const dialog = page.getByRole("dialog");
      await pick(page, dialog, 1, P.currencies.modes.up);
      await dialog.locator('button[type="submit"]').click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const chf = (await api("finance", "/currencies")).find((c) => c.code === "CHF");
      const row = (await rowText(page, "CHF")).replace(/\s+/g, " ");
      return { ok: chf.mode === "up" && row.includes(P.currencies.modes.up), note: `CHF ${chf.mode}, step ${chf.step}; row "${row}"` };
    });
    await step("preview-ch-follows", async () => {
      await open(page, l, "/pricing/preview?plan=chat_pro");
      await page.locator("tbody tr").filter({ hasText: "CH" }).first().waitFor({ timeout: 20000 });
      const ch = (await rowText(page, "CH")).replace(/\s+/g, " ");
      return { ok: before.amount === 10 && ch.includes("11.00"), note: `CH ${before.amount} → "${ch}"` };
    });
  });

  await run(`[${l}] Sales: the grid is view-only`, "sales", async (page, step) => {
    await open(page, l, "/pricing");
    await step("view-only-grid", async () => {
      await page.locator("table").first().waitFor({ timeout: 20000 });
      const cells = await page.locator("[data-cell]").count();
      const publish = await page.locator('[data-action="publish"]').count();
      const note = await page.getByRole("note").filter({ hasText: C.viewOnly }).count();
      const rows = await page.locator("tbody tr").count();
      return { ok: cells === 0 && publish === 0 && note === 1 && rows > 0, note: `${rows} plans, ${cells} editable cells, ${publish} publish buttons, view-only note ${note}` };
    });
    await step("view-only-zones", async () => {
      await open(page, l, "/pricing/zones");
      const add = await page.getByRole("button", { name: P.zones.add }).count();
      const off = await page.getByRole("button", { name: new RegExp(P.zones.turnOff) }).count();
      return { ok: add === 0 && off === 0 && (await page.getByRole("note").count()) === 1, note: `add ${add}, turn-off ${off}` };
    });
  });

  await run(`[${l}] Support: no pricing in the navigation; the page says which permission it needs`, "support", async (page, step) => {
    await open(page, l, "/");
    await step("nav-hides-pricing", async () => {
      const N = msgs(l, "common").Nav;
      const links = await page.getByRole("navigation").getByRole("link").allInnerTexts();
      return { ok: links.length > 0 && !links.some((x) => x.includes(N.grid) || x.includes(N.zones) || x.includes(N.pricingLog)), note: links.join(" · ").slice(0, 200) };
    });
    await step("page-no-permission", async () => {
      await open(page, l, "/pricing");
      const text = (await page.locator("#ot-main, main").first().innerText()).replace(/\s+/g, " ");
      return { ok: text.includes("pricing:view") && (await page.locator("table").count()) === 0, note: text.slice(0, 160) };
    });
  });
}

await browser.close();
await mock.reset();
release();
fs.writeFileSync(path.join(AUDITS, "admin", "flows", "adm-pricing.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console})`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
  if (r.console) console.log(`   console: ${r.consoleSample.join(" | ").slice(0, 200)}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
