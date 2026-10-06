// OrgTik Admin, commerce (ADM-16…19), walked in the browser in English and Arabic:
//   1. Mona creates a fixed coupon in SAR and AED; the dialog says it only works in those two.
//   2. A coupon already used (LAUNCH20) shows its discount locked; the API refuses a change (409);
//      ending it from the dialog works.
//   3. The tax rules show G-12 as an open question; Finance sets Saudi Arabia's rule.
//   4. The route tester answers EG / EGP with Paymob, then Fawry.
//   5. Bundles list their example prices in SA, AE, EG and DE.
//
//   node flows/adm-commerce.mjs      (ADM on :3008 and the platform mock on :4008)
//
// Takes the flow lock and resets the mock before each language. Writes
// audits/admin/flows/adm-commerce.json and screenshots under audits/admin/flows/adm-commerce/.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, WORKSPACE, apiUrl, webUrl } from "../lib/suite.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";
import { mock } from "../lib/mock.mjs";

const OUT = path.join(AUDITS, "admin", "flows", "adm-commerce");
const ADM = webUrl("admin");
const API = `${apiUrl("admin")}/v1/admin`;
const EMAIL = { admin: "mona.adel@orgtik.test", finance: "hany.samir@orgtik.test" };
const msgs = (l, area) => JSON.parse(fs.readFileSync(path.join(WORKSPACE, "orgtik-admin", "messages", l, `${area}.json`), "utf8"));
/** Fills simple {name} placeholders (no plurals). */
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const release = await mock.lock("adm-commerce");
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
  const res = await fetch(API + p, { method, headers: { authorization: `Bearer ${await tokenFor(EMAIL[who])}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json.data, error: json.error };
};
const api = async (who, p) => (await call(who, "GET", p)).data;
const open = async (page, l, route) => {
  await page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => page.goto(`${ADM}/${l}${route}`, { waitUntil: "networkidle", timeout: 90000 }));
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 30000 }).catch(() => {});
  await settle(page);
};
/** Opens a library Select (Base UI) inside `scope`, the n-th one, and picks the option matching `name`. */
const pick = async (page, scope, n, name) => {
  await scope.getByRole("combobox").nth(n).click();
  await page.getByRole("option", { name, exact: true }).first().click();
  await page.getByRole("listbox").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
};
const country = (l, iso) => new Intl.DisplayNames([l], { type: "region" }).of(iso);

for (const l of ["en", "ar"]) {
  const K = msgs(l, "commerce").Commerce;
  const C = msgs(l, "common").Common;
  await mock.reset();

  await run(`[${l}] Mona: a fixed coupon in SAR and AED, and a used coupon that keeps its discount`, "admin", async (page, step) => {
    await open(page, l, "/coupons");
    const code = l === "ar" ? "GULFAR50" : "GULF50";
    await step("fixed-coupon-sar-aed", async () => {
      await page.getByRole("button", { name: K.coupons.create }).first().click();
      const dialog = page.getByRole("dialog", { name: K.coupons.createTitle });
      await dialog.getByLabel(K.coupons.code).fill(code);
      await dialog.getByRole("radio", { name: K.coupons.kindFixed }).click();
      await pick(page, dialog, 0, "SAR");
      await dialog.getByLabel(K.coupons.amount, { exact: true }).nth(0).fill("50");
      await dialog.getByRole("button", { name: K.coupons.addCurrency }).click();
      await pick(page, dialog, 1, "AED");
      await dialog.getByLabel(K.coupons.amount, { exact: true }).nth(1).fill("50");
      await dialog.getByLabel(K.coupons.amount, { exact: true }).nth(1).blur();
      const notice = (await dialog.getByRole("status").innerText()).replace(/\s+/g, " ");
      await dialog.getByRole("button", { name: K.coupons.create }).click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      await page.locator("tbody tr", { hasText: code }).waitFor({ timeout: 15000 });
      const saved = (await api("admin", "/coupons")).find((c) => c.code === code);
      const row = (await page.locator("tbody tr", { hasText: code }).innerText()).replace(/\s+/g, " ");
      return {
        ok: notice.includes("SAR") && notice.includes("AED") && saved?.kind === "fixed" && saved.amounts?.SAR === 50 && saved.amounts?.AED === 50 && Object.keys(saved.amounts).length === 2,
        note: `notice "${notice}"; saved ${JSON.stringify(saved?.amounts)}; row "${row.slice(0, 140)}"`,
      };
    });
    await step("used-coupon-discount-locked", async () => {
      await page.getByRole("button", { name: fmt(K.coupons.editFor, { code: "LAUNCH20" }) }).click();
      const dialog = page.getByRole("dialog", { name: fmt(K.coupons.editTitle, { code: "LAUNCH20" }) });
      await dialog.getByRole("heading", { name: K.coupons.discountLocked }).waitFor({ timeout: 10000 });
      const editable = await dialog.getByRole("radio", { name: K.coupons.kindPercent }).count();
      return { ok: editable === 0, note: `discount shown read-only with "${K.coupons.discountLocked}"; percent/fixed choice shown: ${editable}` };
    });
    await step("api-refuses-change-409", async () => {
      const r = await call("admin", "PATCH", "/coupons/LAUNCH20", { value: 30 });
      const after = (await api("admin", "/coupons")).find((c) => c.code === "LAUNCH20");
      return { ok: r.status === 409 && r.error?.code === "redeemed" && after.value === 20, note: `PATCH value 30 → ${r.status} ${r.error?.code}; value stays ${after.value}` };
    });
    await step("end-used-coupon", async () => {
      const dialog = page.getByRole("dialog", { name: fmt(K.coupons.editTitle, { code: "LAUNCH20" }) });
      await dialog.getByRole("button", { name: K.coupons.end }).click();
      const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog").filter({ hasText: fmt(K.coupons.endTitle, { code: "LAUNCH20" }) })).last();
      await confirm.getByRole("button", { name: K.coupons.end }).click();
      await page.waitForFunction(() => document.querySelectorAll('[role="dialog"][aria-modal="true"], [role="alertdialog"]').length === 0, null, { timeout: 15000 });
      const after = (await api("admin", "/coupons")).find((c) => c.code === "LAUNCH20");
      await page.locator("tbody tr", { hasText: "LAUNCH20" }).getByText(K.coupons.states.ended).waitFor({ timeout: 10000 });
      return { ok: after.active === false && after.value === 20, note: `active ${after.active}, value ${after.value}; row says "${K.coupons.states.ended}"` };
    });
  });

  await run(`[${l}] Finance: G-12 is an open question; Saudi Arabia's tax rule; the EG/EGP route`, "finance", async (page, step) => {
    await open(page, l, "/tax");
    await step("g12-open-question", async () => {
      const box = page.locator("section", { has: page.getByRole("heading", { name: K.tax.g12Title }) });
      const text = (await box.innerText()).replace(/\s+/g, " ");
      const cells = await page.locator("tbody tr").getByText(K.tax.openShort).count();
      return { ok: text.includes(C.notDecided) && text.includes("G-12") && cells === 6, note: `"${text.slice(0, 120)}…"; ${cells} rules say "${K.tax.openShort}"` };
    });
    await step("set-sa-rule", async () => {
      await page.getByRole("button", { name: fmt(K.tax.editFor, { country: country(l, "SA") }) }).click();
      const dialog = page.getByRole("dialog", { name: fmt(K.tax.editTitle, { country: country(l, "SA") }) });
      await dialog.getByLabel(K.tax.rate).fill("15.5");
      await dialog.getByLabel(K.tax.eInvoicing).fill("ZATCA phase 2: B2B invoices cleared before they're sent");
      await dialog.getByRole("button", { name: C.save }).click();
      await dialog.waitFor({ state: "detached", timeout: 15000 });
      const sa = (await api("finance", "/tax-rules")).find((r) => r.country === "SA");
      const row = (await page.locator("tbody tr", { hasText: country(l, "SA") }).innerText()).replace(/\s+/g, " ");
      return { ok: sa.rate === 15.5 && sa.inclusive === null && /phase 2/.test(sa.eInvoicing), note: `saved rate ${sa.rate}, inclusive ${sa.inclusive} (still open); row "${row.slice(0, 120)}"` };
    });
    await step("route-eg-egp", async () => {
      await page.getByRole("tab", { name: K.tax.tabGateways }).click();
      await page.waitForURL(/tab=gateways/, { timeout: 10000 });
      await page.getByRole("button", { name: K.gateways.routeRun }).click();
      const list = page.getByRole("list", { name: K.gateways.routeListLabel });
      await list.waitFor({ timeout: 15000 });
      const items = (await list.getByRole("listitem").allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim());
      return { ok: items.length === 2 && items[0].includes("Paymob") && items[1].includes("Fawry"), note: items.join(" | ") };
    });
  });

  await run(`[${l}] Mona: bundles with their example prices in SA, AE, EG and DE`, "admin", async (page, step) => {
    await open(page, l, "/bundles");
    await step("bundle-examples", async () => {
      const heads = (await page.locator("thead th").allInnerTexts()).map((s) => s.trim());
      const row = (await page.locator("tbody tr").first().innerText()).replace(/\s+/g, " ");
      const want = ["SA", "AE", "EG", "DE"].map((c) => country(l, c));
      return { ok: want.every((w) => heads.includes(w)) && /382[.,]50/.test(row) && /450[.,]00/.test(row), note: `columns ${want.join(", ")}; first row "${row.slice(0, 160)}"` };
    });
  });
}

release();
fs.writeFileSync(path.join(AUDITS, "admin", "flows", "adm-commerce.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console})`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
  if (r.console) console.log(`   console: ${r.consoleSample.join(" | ").slice(0, 200)}`);
}
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
