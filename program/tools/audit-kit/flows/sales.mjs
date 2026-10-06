// Sales (CRM): the wave's golden flows (audits/sales/wave-plan.md, S1–S8), walked in the browser.
// Names and messages come from Marketing's catalog and the library's strings, so the same walk runs
// in every language. Flows are added as their screens are migrated.
//
//   node flows/sales.mjs [--locale ar] [--only S3]   (Sales, SOS and the mock API running)
//
// Takes the shared flow lock before it resets the mock (lib/mock.mjs), so it never runs at the same
// time as another session's flows. Writes audits/sales/flows[/<locale>]/<flow>/NN-<step>.png and
// walks.json.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, PASSWORD, WORKSPACE, redact, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const APP_DIR = path.join(WORKSPACE, "sales-dashboardv2-main");
const CATALOG = JSON.parse(fs.readFileSync(path.join(APP_DIR, "messages", `${LOCALE}.json`), "utf8"));
const { STRINGS } = await import("file:///" + path.join(APP_DIR, "node_modules", "@orgtik", "ui", "dist", "i18n", "strings.js").replace(/\\/g, "/"));
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
// The app's own message; ICU plurals give their "other" form with # as the count.
const m = (key, values = {}) => {
  const raw = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof raw !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  const plural = /\{\w+, plural,.*other \{([^}]*)\}\}/.exec(raw);
  return fill(plural ? plural[1].replace(/#/g, String(values.count ?? "")) : raw, values).replace(/[⁨⁩]/g, "");
};
const SOS_CATALOG = JSON.parse(fs.readFileSync(path.join(WORKSPACE, "somion-sos-frontend-main", "messages", `${LOCALE}.json`), "utf8"));
const sos = (key) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), SOS_CATALOG);
const { STATUS_MATRIX } = await import("file:///" + path.join(APP_DIR, "node_modules", "@orgtik", "ui", "dist", "status", "matrix.js").replace(/\\/g, "/"));
const stage = (s) => STATUS_MATRIX.lead.statuses?.[s]?.label?.[LOCALE] ?? STATUS_MATRIX.lead[s]?.label?.[LOCALE];
const L = (key, values = {}) => fill(String(STRINGS[LOCALE]?.[key] ?? STRINGS.en[key]), values);

const OUT = path.join(AUDITS, "sales", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const APP = webUrl("sales");
const API = `${apiUrl("sales")}/api`;
const MONA = "mona.adel@orgtik.test"; // admin
const SHERIF = "sherif.magdy@orgtik.test"; // manager
const TAMER = "tamer.wagdy@orgtik.test"; // salesman
const NOUR = "nour.khaled@nilefoods.test"; // customer
const SALMA = "salma.nabil@orgtik.test"; // no CRM access
const OMAR = "omar.farouk@orgtik.test"; // salesman of Nile Foods (Nour)
const stamp = Date.now().toString(36).slice(-4);

const call = async (email, method, url, body) => {
  const token = await tokenFor(email);
  const r = await fetch(API + url, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
};

const browser = await chromium.launch();
const walks = [];
const unlock = await mock.lock("sales-flows (Sales wave session)");

// A walk starts from fresh seed data, unless it continues the previous one (`{ continues: true }`).
async function walk(id, title, as, fn, { continues = false } = {}) {
  if (only && !only.split(",").some((o) => id.startsWith(o))) return;
  if (!continues) await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  if (as) await signIn(ctx, "sales", as);
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
  console.log(`\n${id}: ${title}`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, locale: LOCALE, as, steps, console: log.console.slice(0, 10), uncaught: log.page.slice(0, 5), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(`${APP}/${LOCALE}${route === "/" ? "" : route}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page);
};
const toastText = (page) => page.locator("[data-orgtik-toast]").allInnerTexts().then((t) => t.join(" | ")).catch(() => "");
const money = (s) => Number(String(s).replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", "."));
const shared = { offerId: null, projectId: null };
// The plan the offer sells, by its catalog name in either language (the UI shows the app language's).
const PLAN = /Corporate Web Presence|الحضور الرقمي للشركات/;
const newCtx = async (as) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await signIn(c, "sales", as);
  return c;
};

try {
  // S1: the suite hands Sales a one-time code; nothing secret stays in any address.
  await walk("S1-open-from-suite", "Open Sales from the suite", null, async ({ page, step }) => {
    const seen = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
    await step("Arrive with a one-time code", async () => {
      const token = await tokenFor(MONA);
      const code = (await (await fetch(`${apiUrl("sos")}/api/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).json()).data.code;
      await page.goto(`${APP}/${LOCALE}/auth?code=${code}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
      await settle(page);
    }, async () => {
      const leaked = seen.filter((u) => /[?&](token|code)=/.test(u) && !/\/auth\?code=/.test(u));
      const p = new URL(page.url()).pathname;
      return { ok: !leaked.length && !page.url().includes("code=") && (p === `/${LOCALE}` || p === `/${LOCALE}/`), note: `landed on ${p}` };
    });
    await step("Back doesn't reopen the hand-off", () => page.goBack().catch(() => {}), async () => !/code=/.test(page.url()) || `back went to ${redact(page.url())}`);
    await step("A forged redirect is ignored", async () => {
      const token = await tokenFor(MONA);
      const code = (await (await fetch(`${apiUrl("sos")}/api/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).json()).data.code;
      await page.goto(`${APP}/${LOCALE}/auth?code=${code}&redirect=${encodeURIComponent("https://example.org/")}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
    }, async () => page.url().startsWith(APP) || `left the app for ${redact(page.url())}`);
  });

  // S1b: signed out, a Sales link goes through the suite's sign-in and comes back to that page.
  await walk("S1b-deep-link-after-sign-in", "Sign in again and land on the page you opened", null, async ({ page, ctx, step }) => {
    const target = `/${LOCALE}/customers`;
    await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: webUrl("sos") }]);
    await step("Open a Sales link while signed out", async () => {
      await page.goto(APP + target, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => u.href.startsWith(webUrl("sos")) && /login/.test(u.pathname), { timeout: 60000 });
      await settle(page);
    }, async () => /\/auth\/login/.test(page.url()) || `not on the sign-in page (${redact(page.url())})`);
    await step("Sign in", async () => {
      await page.getByRole("textbox", { name: sos("Auth.email") }).fill(MONA);
      await page.getByRole("textbox", { name: sos("Auth.password"), exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: sos("Auth.submit") }).click();
      await page.waitForURL((u) => u.href.startsWith(APP) && !/\/auth/.test(u.pathname), { timeout: 90000 });
      await settle(page);
    }, async () => ({ ok: new URL(page.url()).pathname === target && !/[?&](code|token)=/.test(page.url()), note: `landed on ${new URL(page.url()).pathname}` }));
  });

  // S1c: someone without the CRM in their apps isn't let in (they used to become an admin).
  await walk("S1c-no-access", "No access without the CRM", SALMA, async ({ page, step }) => {
    await step("Open the dashboard", () => open(page, "/"), async () => {
      const h1 = await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => "");
      return { ok: /\/auth\/not-allowed$/.test(new URL(page.url()).pathname) && h1 === m("Errors.appNoAccessTitle"), note: h1 };
    });
  });
  // S2: a salesman builds an offer for his own customer: 12 months, in installments, VAT; it saves
  // as chosen and an edit doesn't re-price it.
  await walk("S2-create-offer", "Create and send an offer", OMAR, async ({ page, step }) => {
    const dlg = () => page.getByRole("dialog", { name: m("Deal.titleNewOffer") });
    await step("New offer for Nile Foods", async () => {
      await open(page, "/offers");
      await page.getByRole("button", { name: m("Offers.newOffer"), exact: true }).click();
      await dlg().getByRole("searchbox").fill("Nile");
      await dlg().getByRole("radio", { name: /Nour Khaled/ }).click({ force: true });
      await dlg().getByRole("button", { name: m("Deal.next"), exact: true }).click();
    }, async () => dlg().getByRole("region", { name: m("Deal.standardSection") }).isVisible());
    await step("A standard plan, 12 months, in installments", async () => {
      await dlg().getByRole("combobox", { name: m("Deal.addPlan") }).click();
      await page.getByRole("option", { name: PLAN }).click();
      await dlg().getByRole("combobox", { name: m("Deal.durationLabel") }).click();
      await page.getByRole("option", { name: /^(12|١٢)\s/ }).click();
      await dlg().getByText(m("Deal.payInstallments"), { exact: true }).click();
      await dlg().getByRole("combobox", { name: m("Deal.termLabel") }).click();
      await page.getByRole("option").last().click();
    }, async () => {
      const checked = await dlg().getByRole("radio", { checked: true }).count();
      const term = await dlg().getByRole("combobox", { name: m("Deal.termLabel") }).innerText();
      return { ok: checked === 1, note: `${checked} payment option(s) selected; term ${term.trim()}` };
    });
    let review = "";
    await step("Terms, then review", async () => {
      await dlg().getByRole("button", { name: m("Deal.next"), exact: true }).click();
      await dlg().getByRole("button", { name: m("Deal.next"), exact: true }).click();
      review = await dlg().innerText();
    }, async () => {
      const vat = m("Deal.vatRow", { rate: "@@", country: "@@" }).split("@@")[0].trim();
      const line = review.split("\n").find((l) => l.includes(vat)) ?? "";
      return { ok: Boolean(line), note: line };
    });
    await step("Send", async () => {
      await dlg().getByRole("button", { name: m("Deal.sendOffer"), exact: true }).click();
      await page.waitForURL((u) => /\/offers\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
      shared.offerId = new URL(page.url()).pathname.split("/").pop();
    }, async () => {
      const o = (await call(OMAR, "GET", `/offers/${shared.offerId}`)).data;
      const line = (o?.summary?.lines ?? []).find((l) => PLAN.test(String(l.planName)));
      const ok = line?.durationMonths === 12 && /install/.test(String(line?.paymentMethod)) && Number(line?.installmentMonths) >= 12 && Boolean(o?.vatCountryCode);
      return { ok, note: `${o?.status}; ${line?.durationMonths} months, ${line?.paymentMethod} × ${line?.installmentMonths}; VAT ${o?.vatCountryCode}; total ${o?.quotedTotal}` };
    });
  });

  // S3: the customer counters at a lower total; the salesman accepts; the agreed total is the counter
  // everywhere and a project appears.
  await walk("S3-counter-accept", "Counter and accept", NOUR, async ({ page, step }) => {
    if (!shared.offerId) return;
    const before = (await call(OMAR, "GET", `/offers/${shared.offerId}`)).data;
    const total = Number(before?.quotedTotal ?? 0);
    const counter = Math.round(total * 0.9);
    await step("Nour counters at 90%", async () => {
      await open(page, `/offers/${shared.offerId}`);
      await page.getByRole("button", { name: m("Offers.counter"), exact: true }).first().click();
      const d = page.getByRole("dialog");
      await d.getByRole("textbox").first().fill(String(counter));
      await d.getByRole("button", { name: new RegExp(`^${m("Offers.counterSubmitAmount", { amount: "@@" }).split("@@")[0]}`) }).click();
      await page.waitForTimeout(1500);
    }, async () => {
      const o = (await call(OMAR, "GET", `/offers/${shared.offerId}`)).data;
      return { ok: o?.status === "countered", note: `${o?.status}; counter ${o?.counterTotal}` };
    });
    const ctx2 = await newCtx(OMAR);
    const omar = await ctx2.newPage();
    try {
      await step("Omar accepts (with a confirmation)", async () => {
        await open(omar, `/offers/${shared.offerId}`);
        await omar.getByRole("button", { name: m("Offers.accept"), exact: true }).first().click();
        await omar.getByRole("alertdialog").getByRole("button", { name: new RegExp(m("Offers.acceptConfirm", { amount: "@@" }).split("@@")[0]) }).click();
        await omar.waitForTimeout(2000);
      }, async () => {
        const o = (await call(OMAR, "GET", `/offers/${shared.offerId}`)).data;
        shared.projectId = o?.projectId ?? null;
        const shown = await omar.locator("main").innerText();
        return { ok: o?.status === "accepted" && Boolean(o?.projectId), note: `${o?.status}; project ${o?.projectId ? "created" : "none"}; counter shown: ${shown.includes(String(counter).slice(0, 3))}` };
      });
      await step("The project shows on Projects without a reload", async () => {
        await omar.getByRole("link", { name: new RegExp(m("Offers.openProject")) }).first().click();
        await omar.waitForURL((u) => /\/projects\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
      }, async () => new URL(omar.url()).pathname.endsWith(shared.projectId ?? "x") || `on ${new URL(omar.url()).pathname}`);
    } finally {
      await ctx2.close();
    }
  }, { continues: true });

  // S4: the customer uploads the signed contract; a manager approves with 8%; the salesman sees the
  // commission as money.
  await walk("S4-approve-contract", "Approve a contract", NOUR, async ({ page, step }) => {
    if (!shared.projectId) return;
    const pdf = path.join(os.tmpdir(), "orgtik-signed-contract.pdf");
    fs.writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    await step("Nour uploads the signed contract", async () => {
      await open(page, `/projects/${shared.projectId}`);
      await page.getByRole("button", { name: m("Projects.uploadSigned"), exact: true }).first().click();
      const d = page.getByRole("dialog");
      await d.locator('input[type="file"]').setInputFiles(pdf);
      await d.getByRole("button", { name: m("Projects.uploadSignedSubmit"), exact: true }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const c = (await call(OMAR, "GET", `/contracts?projectId=${shared.projectId}`)).data;
      const ct = (c?.items ?? c ?? [])[0];
      return { ok: Boolean(ct?.isSigntuerd), note: `contract ${ct?.status}, signed ${Boolean(ct?.isSigntuerd)}` };
    });
    const ctx2 = await newCtx(SHERIF);
    const sherif = await ctx2.newPage();
    try {
      await step("Sherif approves with 8% (preview, then confirm)", async () => {
        await open(sherif, `/projects/${shared.projectId}`);
        await sherif.getByRole("button", { name: m("Projects.approve"), exact: true }).first().click();
        const d = sherif.getByRole("dialog");
        await d.getByText(m("Projects.commissionPercentage"), { exact: true }).click();
        await d.getByRole("textbox", { name: m("Projects.commissionPercentLabel") }).fill("8");
        await d.getByRole("button", { name: m("Projects.continue"), exact: true }).click();
        await sherif.getByRole("alertdialog").getByRole("button", { name: m("Projects.approveConfirm"), exact: true }).click();
        await sherif.waitForTimeout(2000);
      }, async () => {
        const c = (await call(SHERIF, "GET", `/contracts?projectId=${shared.projectId}`)).data;
        const ct = (c?.items ?? c ?? [])[0];
        return { ok: ct?.status === "approved" && ct?.commissionMode === "percentage", note: `${ct?.status}; ${ct?.commissionMode} ${ct?.commissionPercentage}; ${ct?.commissionAmount}` };
      });
    } finally {
      await ctx2.close();
    }
    const ctx3 = await newCtx(OMAR);
    const omar = await ctx3.newPage();
    try {
      await step("Omar's commissions show it as money", () => open(omar, "/commissions"), async () => {
        const row = omar.getByRole("row").filter({ hasText: PLAN }).first();
        const text = (await row.innerText().catch(() => "")).replace(/\s+/g, " ");
        return { ok: /EGP|ج\.م/.test(text) && !/\b8\.00\b/.test(text), note: text.slice(0, 120) };
      });
    } finally {
      await ctx3.close();
    }
  }, { continues: true });

  // S5: an admin pays part of a commission with a reference; what's due is the remainder; a manager
  // is offered no Pay.
  await walk("S5-pay-commission", "Pay a commission", MONA, async ({ page, step }) => {
    const list = (await call(MONA, "GET", "/commissions?limit=50")).data;
    const cm = (list?.items ?? list ?? []).find((c) => c.status === "unpaid" || c.payoutStatus === "unpaid");
    if (!cm) return;
    const due = Number(cm.amount);
    const part = Math.max(1, Math.floor(due / 3));
    await step("Pay a third, with a reference", async () => {
      await open(page, "/commissions");
      await page.getByRole("button", { name: m("Team.commissions.payAria", { reference: cm.reference }), exact: true }).click();
      const d = page.getByRole("dialog");
      await d.getByRole("textbox", { name: m("Team.payout.amount") }).fill(String(part));
      await d.getByRole("textbox", { name: m("Team.payout.reference") }).fill("TRX-2026-0042");
      await d.getByRole("button", { name: m("Team.payout.review"), exact: true }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: new RegExp(m("Team.payout.confirmLabel", { amount: "@@" }).split("@@")[0]) }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const after = (await call(MONA, "GET", "/commissions?limit=50")).data;
      const c = (after?.items ?? after ?? []).find((x) => x.id === cm.id);
      return { ok: /partial/.test(String(c?.status ?? c?.payoutStatus)) && Math.abs(Number(c?.paidAmount) - part) < 1, note: `${c?.status ?? c?.payoutStatus}; paid ${c?.paidAmount} of ${c?.amount}` };
    });
    const ctx2 = await newCtx(SHERIF);
    const sherif = await ctx2.newPage();
    try {
      await step("Sherif (manager) is offered no Pay", () => open(sherif, "/commissions"), async () => {
        const n = await sherif.getByRole("button", { name: new RegExp(`^${m("Team.commissions.pay")}`) }).count();
        return n === 0 || `${n} Pay buttons`;
      });
    } finally {
      await ctx2.close();
    }
  });

  // S6: a website lead arrives through the intake; a manager sees it in the pipeline as "Website",
  // qualifies it, then loses it with a reason (D-028).
  await walk("S6-website-lead", "A website lead", SHERIF, async ({ page, step }) => {
    const name = `Laila Hassan ${stamp}`;
    const email = `laila.${stamp}@example.test`;
    const findLead = async () => {
      const r = (await call(SHERIF, "GET", `/customers?limit=200&search=${encodeURIComponent(email)}`)).data;
      return (r?.items ?? r ?? []).find((c) => c.email === email);
    };
    await step("The website sends a lead", async () => {
      const r = await fetch(`${API}/leads/intake`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "website", name, email, company: "Delta Bakeries", page: "/pricing", bundle: "starter", utm: { utm_source: "google" }, locale: LOCALE }) });
      if (r.status !== 201) throw new Error(`intake ${r.status}`);
    }, async () => {
      const l = await findLead();
      return { ok: l?.status === "new" && l?.source === "website", note: `${l?.status}, ${l?.source}` };
    });
    const card = () => page.locator("li, article, [role=listitem]").filter({ hasText: name }).first();
    await step("It's in the pipeline, marked Website, with its page", () => open(page, "/customers/pipeline"), async () => {
      const text = (await card().innerText().catch(() => "")).replace(/\s+/g, " ");
      return { ok: text.includes(m("Customers.source.website")), note: text.slice(0, 120) };
    });
    const move = async (stage) => {
      await page.getByRole("button", { name: m("Customers.moveTo", { title: name }), exact: true }).click();
      await page.getByRole("menuitem", { name: stage, exact: true }).click();
    };
    await step("Move it to Qualified", async () => {
      await move(stage("qualified"));
      await page.waitForTimeout(1500);
    }, async () => ((await findLead())?.status === "qualified") || `still ${(await findLead())?.status}`);
    await step("Lose it: a reason is required", async () => {
      await move(stage("lost"));
      const d = page.getByRole("alertdialog");
      await d.getByRole("textbox").fill("Chose another provider");
      await d.getByRole("button", { name: m("Customers.lost.confirm"), exact: true }).click();
      await page.waitForTimeout(1500);
    }, async () => {
      const l = await findLead();
      return { ok: l?.status === "lost" && /another provider/.test(String(l?.lostReason)), note: `${l?.status}: ${l?.lostReason}` };
    });
  });

  // S7: View as (D-017): an admin views Sales as a salesman, read-only, with the banner.
  await walk("S7-view-as", "View as, read-only", null, async ({ page, step }) => {
    const omarId = (await (await fetch(`${apiUrl("sos")}/api/auth/me`, { headers: { Authorization: `Bearer ${await tokenFor(OMAR)}` } })).json()).data?.user?.id;
    await step("Start View as from SOS and open Sales", async () => {
      const r = await (await fetch(`${apiUrl("sos")}/api/auth/login-as/${omarId}`, { method: "POST", headers: { Authorization: `Bearer ${await tokenFor(MONA)}` } })).json();
      const token = r.data?.tokens?.accessToken ?? r.data?.accessToken;
      await page.goto(`${APP}/${LOCALE}/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
      await settle(page);
    }, async () => {
      const banner = await page.getByText(m("Shell.viewingAs", { name: "@@" }).split("@@")[0].trim()).first().isVisible().catch(() => false);
      return banner || "no View as banner";
    });
    await step("Customers: nothing to create or change", () => open(page, "/customers"), async () => {
      const create = await page.getByRole("button", { name: m("Customers.create.open"), exact: true }).count();
      return create === 0 || "a New customer button is offered";
    });
    await step("Offers: no New offer", () => open(page, "/offers"), async () => {
      const n = await page.getByRole("button", { name: m("Offers.newOffer"), exact: true }).count();
      return n === 0 || "a New offer button is offered";
    });
  });

  // S8: a salesman's customer lifecycle: create with an invitation, a note, a meeting in the org zone.
  await walk("S8-customer-lifecycle", "A customer's lifecycle", OMAR, async ({ page, step }) => {
    const name = `Karim Saleh ${stamp}`;
    const email = `karim.saleh.${stamp}@example.test`;
    let id = null;
    await step("Create a customer with an invitation", async () => {
      await open(page, "/customers?new=1");
      const d = page.getByRole("dialog");
      await d.getByRole("textbox", { name: m("Customers.form.fullName") }).fill(name);
      await d.getByRole("textbox", { name: m("Customers.form.email") }).fill(email);
      await d.getByRole("textbox", { name: m("Customers.form.phone") }).fill("+20 100 000 0000");
      await d.getByRole("textbox", { name: m("Customers.form.address") }).fill("12 Tahrir St, Cairo");
      const egypt = new Intl.DisplayNames([LOCALE], { type: "region" }).of("EG");
      await d.getByRole("combobox", { name: m("Customers.form.country") }).click();
      await page.keyboard.type(egypt.slice(0, 3));
      await page.getByRole("option", { name: new RegExp(egypt) }).first().click();
      await d.getByRole("textbox", { name: m("Customers.form.company") }).fill("Saleh Trading");
      // Invitations are on by default.
      await d.getByRole("checkbox", { name: m("Customers.form.sendInvite") }).check();
      await d.getByRole("button", { name: new RegExp(`^(${m("Customers.create.submitInvite")}|${m("Customers.create.submit")})$`) }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const r = (await call(OMAR, "GET", `/customers?limit=200&search=${encodeURIComponent(email)}`)).data;
      const c = (r?.items ?? r ?? []).find((x) => x.email === email);
      id = c?.id ?? null;
      return { ok: c?.access === "invited", note: `access ${c?.access}` };
    });
    if (!id) return;
    await step("Add a note", async () => {
      await page.keyboard.press("Escape").catch(() => {});
      await open(page, `/customers/${id}`);
      await page.getByRole("textbox", { name: m("Customers.notes.newLabel") }).fill("Wants a quote for the online store.");
      await page.getByRole("button", { name: m("Customers.notes.add"), exact: true }).click();
      await page.waitForTimeout(1500);
    }, async () => {
      const c = (await call(OMAR, "GET", `/customers/${id}`)).data;
      return (c?.notes ?? []).some((n) => /online store/.test(n.note)) || "note not saved";
    });
    await step("A meeting names the org time zone", async () => {
      await page.getByRole("button", { name: m("Customers.actions.meeting"), exact: true }).first().click();
    }, async () => {
      const lead = L("timeZoneNoteNamed", { zone: "@@", offset: "@@" }).split("@@")[0];
      const note = await page.getByRole("dialog").getByText(lead).first().innerText().catch(() => "");
      return { ok: Boolean(note), note };
    });
  });

} finally {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
  const all = walks.flatMap((w) => w.steps);
  console.log(`\n${all.filter((s) => s.ok).length}/${all.length} steps ok (${LOCALE})`);
  await mock.reset().catch(() => {});
  unlock();
  await browser.close();
}
