// USR tools, plans, trials and checkout (spec 05: USR-00, 04…08, 25), walked in SOS's customer
// dashboard. Names and expected messages come from the catalogs (SOS's messages/usr/<locale>/
// tools.json and workspace.json, the platform's tool names, the library's status labels), so the
// same walk runs in every language.
//
//   node flows/usr-tools.mjs [--locale ar] [--only T2]   (SOS on :3013 and the local-dev mock running)
//
// Writes audits/usr/flows[/<locale>]/<walk>/NN-<step>.png and usr-tools.json (the other USR flows
// write walks.json in the same folder).
//
// Nour (the owner of Nile Foods) is a `customer` with the sales scope, and SOS's middleware sends
// such people to the Sales customer portal (T0 records it). Until that changes, the walks that
// need Nour drop "sales" from the SOS scopes cookie after signing in, and say so in their notes.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, WORKSPACE, apiUrl, redact, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const require = createRequire(import.meta.url);
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const SOS_DIR = path.join(WORKSPACE, "somion-sos-frontend-main");
const read = (...p) => JSON.parse(fs.readFileSync(path.join(SOS_DIR, ...p), "utf8"));
const CATALOG = Object.assign({}, read("messages", `${LOCALE}.json`), read("messages", "usr", LOCALE, "tools.json"), read("messages", "usr", LOCALE, "workspace.json"));
const { STATUS_MATRIX } = await import(pathToFileURL(path.join(SOS_DIR, "node_modules", "@orgtik", "ui", "dist", "status", "matrix.js")).href);
const { tools: TOOLS, plans: PLANS } = require(path.join(WORKSPACE, "local-dev", "apps", "admin", "seed-catalog.js"));

const raw = (key) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return text;
};
// A message with its values: plurals pick their branch for the locale, rich tags are dropped.
const rules = new Intl.PluralRules(LOCALE);
const fmt = (n) => new Intl.NumberFormat(LOCALE).format(n);
const m = (key, values = {}) => {
  let s = raw(key);
  s = s.replace(/\{(\w+), plural, ((?:[^{}]|\{[^{}]*\})*)\}/g, (_, name, body) => {
    const n = Number(values[name]);
    const branches = Object.fromEntries([...body.matchAll(/(=\d+|\w+) \{([^{}]*)\}/g)].map((b) => [b[1], b[2]]));
    return (branches[`=${n}`] ?? branches[rules.select(n)] ?? branches.other).replace(/#/g, fmt(n));
  });
  return s.replace(/<\/?\w+>/g, "").replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
};
const toolName = (key) => TOOLS.find((t) => t.key === key).name[LOCALE];
const planName = (id) => PLANS.find((p) => p.id === id).name[LOCALE];
const status = (entity, state) => STATUS_MATRIX[entity][state].label[LOCALE];

const OUT = path.join(AUDITS, "usr", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const PLATFORM = apiUrl("sos"); // /v1/app is mounted on the SOS mock too
const NOUR = "nour.khaled@nilefoods.test";
const MONA = "mona.adel@orgtik.test";
const SALMA = "salma.nabil@orgtik.test"; // `employee`, a member of OrgTik Egypt
const unlock = await mock.lock(`usr-tools flows (session e1a403a7)`);
const browser = await chromium.launch();
const walks = [];

// Customers with the sales scope are sent to the Sales portal by SOS's middleware; see the header.
async function asCustomer(ctx) {
  const c = (await ctx.cookies(SOS)).find((x) => x.name === "SOMION_SOS.scopes");
  if (!c) return;
  const scopes = JSON.parse(decodeURIComponent(c.value)).filter((s) => s.scope !== "sales");
  await ctx.addCookies([{ ...c, value: encodeURIComponent(JSON.stringify(scopes)) }]);
}

async function newContext(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }]);
  if (email) {
    await signIn(ctx, "sos", email);
    if (email === NOUR) await asCustomer(ctx);
  }
  return ctx;
}

async function walk(id, title, email, fn) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await newContext(email);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  let n = 0;
  const step = async (name, action, check, on = page) => {
    n++;
    const started = Date.now();
    let ok = true;
    let note = "";
    try {
      await action();
      await on.waitForTimeout(500);
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
    await on.screenshot({ path: path.join(dir, shot) }).catch(() => {});
    steps.push({ n, name, ok, note, ms: Date.now() - started, url: redact(on.url()), screenshot: `${id}/${shot}` });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${n}. ${name}${note ? ` (${note})` : ""}`);
    return ok;
  };
  console.log(`\n${id}: ${title}`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, locale: LOCALE, as: email, workaround: email === NOUR ? "sales scope dropped from the SOS scopes cookie (middleware sends customers to the Sales portal)" : null, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(SOS + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 15000 }).catch(() => {});
  await settle(page);
};
const card = (page, key) => page.locator(`[data-tool="${key}"]`);
const visible = (loc) => loc.first().waitFor({ state: "visible", timeout: 8000 }).then(() => true, () => false);
const api = async (email, route) => {
  const res = await fetch(`${PLATFORM}/v1/app${route}`, { headers: { authorization: `Bearer ${await tokenFor(email)}` } });
  return (await res.json()).data;
};

// T0: what really happens to Nour today (a customer with the sales scope).
await walk("T0-customer-lands", "Nour signs in to SOS", null, async ({ page, ctx, step }) => {
  await step("Sign in as Nour, no workaround", async () => {
    await signIn(ctx, "sos", NOUR);
    await open(page, "/tools");
  }, async () => {
    const at = new URL(page.url());
    return { ok: at.origin === SOS && at.pathname === "/tools", note: at.origin === SOS ? `on ${at.pathname}` : `sent to ${at.origin}${at.pathname} (middleware: customer with the sales scope)` };
  });
});

// T1: Nour's home: every tool with its state, one way forward, and the most urgent banner.
await walk("T1-home", "Nour's home: tool states and the banner", NOUR, async ({ page, step }) => {
  await step("Open home", () => open(page, "/"), async () => (await visible(page.getByRole("heading", { name: m("Tools.home.title") }))) || "no Your tools heading");
  await step("Tool states", async () => {}, async () => {
    const want = { tasks: "active", files: "active", chat: "trial", hr: "not_subscribed", email: "coming_soon" };
    const wrong = [];
    for (const [k, s] of Object.entries(want)) if (!(await card(page, k).innerText()).includes(status("tool_state", s))) wrong.push(`${k}≠${s}`);
    const chat = await card(page, "chat").innerText();
    const days = m("Tools.line.daysLeft", { count: 2 });
    return { ok: !wrong.length && chat.includes(days), note: wrong.length ? wrong.join(", ") : `chat: ${days}; tasks free plan; files payment due` };
  });
  await step("One way forward per tool", async () => {}, async () => {
    const checks = [
      [card(page, "tasks").getByRole("link", { name: `${m("Tools.actions.open")} ${toolName("tasks")}` }), "tasks: Open"],
      [card(page, "files").getByRole("link", { name: `${m("Tools.actions.payNow")} ${toolName("files")}` }), "files: Pay now"],
      [card(page, "hr").getByRole("link", { name: `${m("Tools.actions.startTrial", { days: 14 })} ${toolName("hr")}` }), "hr: Start trial"],
      [card(page, "email").getByRole("button", { name: `${m("Tools.actions.joinWaitlist")} ${toolName("email")}` }), "email: Join the waitlist"],
    ];
    const missing = [];
    for (const [loc, label] of checks) if (!(await visible(loc))) missing.push(label);
    return { ok: !missing.length, note: missing.length ? `missing ${missing.join(", ")}` : checks.map((c) => c[1]).join("; ") };
  });
  await step("The banner", async () => {}, async () => {
    const title = m("Workspace.banner.payment_failed.title", { tool: toolName("files") });
    return { ok: await visible(page.getByText(title)), note: title };
  });
});

// T2: buy Tasks Pro with a code; a failed payment changes nothing; pay; the invoice; Tasks on home.
await walk("T2-checkout", "Tasks Pro: code, failed payment, pay, invoice", NOUR, async ({ page, step }) => {
  await step("Tasks plans", () => open(page, "/tools/tasks"), async () => (await visible(page.locator('[data-plan="tasks_pro"]'))) || "no Pro plan");
  await step("Choose Pro", async () => {
    await page.getByRole("link", { name: m("Tools.plans.choose", { plan: planName("tasks_pro") }) }).click();
    await page.waitForURL(/\/checkout\?plan=tasks_pro/, { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 15000 }).catch(() => {});
  }, async () => ({ ok: await visible(page.locator("[data-total]")), note: `total ${await page.locator("[data-total]").first().innerText().catch(() => "?")}` }));
  await step("Apply WELCOME100", async () => {
    await page.getByRole("textbox", { name: m("Tools.checkout.codeLabel") }).fill("WELCOME100");
    await page.getByRole("button", { name: m("Tools.checkout.apply") }).click();
  }, async () => {
    const applied = await visible(page.getByText(m("Tools.checkout.codeApplied", { code: "WELCOME100" })));
    return { ok: applied, note: applied ? `applied; total ${await page.locator("[data-total]").first().innerText()}` : "code not applied" };
  });
  await step("The next payment fails", async () => {
    const r = await fetch(`${apiUrl("admin")}/v1/__mock/fail-next-payment`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    if (!r.ok) throw new Error(`fail-next-payment ${r.status}`);
    await page.getByRole("button", { name: new RegExp(m("Tools.checkout.pay", { total: "" }).trim()) }).click();
  }, async () => {
    const said = await visible(page.getByText(m("Tools.checkout.failedTitle")));
    const body = await visible(page.getByText(m("Tools.checkout.failedBody")));
    const tasks = await api(NOUR, "/tools/tasks");
    const unchanged = tasks.line?.planId === "tasks_free";
    return { ok: said && body && unchanged, note: `${said ? m("Tools.checkout.failedTitle") : "no failure message"}; Tasks still ${tasks.line?.planId}` };
  });
  let number = "";
  await step("Pay", async () => {
    await page.getByRole("button", { name: new RegExp(m("Tools.checkout.pay", { total: "" }).trim()) }).click();
    await page.getByRole("heading", { name: m("Tools.checkout.doneTitle") }).waitFor({ timeout: 15000 });
  }, async () => {
    number = await page.locator("[data-invoice-number]").innerText();
    const where = await visible(page.getByRole("link", { name: /<link>(.*?)<\/link>/.exec(raw("Tools.checkout.whereInvoice"))[1] }));
    const body = await visible(page.getByText(m("Tools.checkout.doneBody", { tool: toolName("tasks"), plan: planName("tasks_pro") })));
    return { ok: /^INV-\d{4}-\d+$/.test(number) && where && body, note: `invoice ${number}; link to invoices ${where ? "shown" : "missing"}; ${body ? "says Tasks is on Pro" : "no plan line"}` };
  });
  await step("Tasks is active on home", () => open(page, "/"), async () => {
    const text = await card(page, "tasks").innerText();
    const ok = text.includes(status("tool_state", "active")) && !text.includes(m("Tools.line.freePlan"));
    const line = (await api(NOUR, "/tools/tasks")).line;
    return { ok: ok && line?.planId === "tasks_pro" && line?.state === "active", note: `home: ${text.split("\n").slice(-3).join(" ")}; line ${line?.planId} ${line?.state}` };
  });
});

// T3: a used-up code says so.
await walk("T3-used-up-code", "SUMMER10 is used up", NOUR, async ({ page, step }) => {
  await step("Checkout Tasks Pro", () => open(page, "/checkout?plan=tasks_pro&cycle=monthly"), async () => (await visible(page.locator("[data-total]"))) || "no total");
  await step("Apply SUMMER10", async () => {
    await page.getByRole("textbox", { name: m("Tools.checkout.codeLabel") }).fill("SUMMER10");
    await page.getByRole("button", { name: m("Tools.checkout.apply") }).click();
  }, async () => {
    const text = m("Tools.errors.coupon_used_up");
    return { ok: await visible(page.getByText(text)), note: text };
  });
});

// T4: start a trial where allowed; a second one is refused (G-17, 409 trial_used).
await walk("T4-trial", "HR trial, then the refused second trial", NOUR, async ({ page, ctx, step }) => {
  const stale = await ctx.newPage();
  await step("HR plans", async () => {
    await open(page, "/tools/hr");
    await open(stale, "/tools/hr");
  }, async () => (await visible(page.getByRole("button", { name: m("Tools.plans.startTrial", { days: 14 }) }))) || "no trial button");
  await step("Start the trial", async () => {
    await page.getByRole("button", { name: m("Tools.plans.startTrial", { days: 14 }) }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.waitFor({ timeout: 5000 });
    await dialog.getByRole("button", { name: m("Tools.plans.trialConfirm") }).click();
    await dialog.waitFor({ state: "hidden", timeout: 10000 });
  }, async () => {
    const line = (await api(NOUR, "/tools/hr")).line;
    const badge = await visible(page.getByText(status("tool_state", "trial")));
    return { ok: line?.state === "trialing" && badge, note: `HR ${line?.state}, ${line?.planId}` };
  });
  await step("A second trial is refused", async () => {
    await stale.getByRole("button", { name: m("Tools.plans.startTrial", { days: 14 }) }).click();
    const dialog = stale.getByRole("alertdialog");
    await dialog.waitFor({ timeout: 5000 });
    await dialog.getByRole("button", { name: m("Tools.plans.trialConfirm") }).click();
  }, async () => {
    const title = m("Tools.plans.trialUsedTitle", { tool: toolName("hr") });
    return { ok: await visible(stale.getByText(title)), note: title };
  }, stale);
  await step("The page now says the trial is used", () => open(stale, "/tools/hr"), async () => {
    const onTrial = await visible(stale.getByRole("button", { name: m("Tools.plans.startTrial", { days: 14 }) }));
    return { ok: !onTrial, note: onTrial ? "trial button still offered" : "no trial offered" };
  }, stale);
});

// T5: a member sees "ask the owner" instead of buying.
await walk("T5-member", "A member asks the owner", SALMA, async ({ page, step }) => {
  await step("Home", () => open(page, "/"), async () => {
    const ask = await visible(card(page, "hosting").getByText(m("Tools.actions.askOwner")));
    const buy = await page.getByRole("link", { name: new RegExp(`^(${m("Tools.actions.choosePlan")}|${m("Tools.actions.startTrial", { days: 14 })})`) }).count();
    return { ok: ask && buy === 0, note: `${ask ? m("Tools.actions.askOwner") : "no ask-the-owner"}; ${buy} buy links` };
  });
  await step("Chat plans", () => open(page, "/tools/chat"), async () => {
    const ask = await visible(page.getByText(m("Tools.plans.askOwner")));
    const choose = await page.getByRole("link", { name: m("Tools.plans.choose", { plan: planName("chat_pro") }) }).count();
    const trial = await page.getByRole("button", { name: m("Tools.plans.startTrial", { days: 14 }) }).count();
    return { ok: ask && choose === 0 && trial === 0, note: `ask the owner shown; ${choose} choose, ${trial} trial buttons` };
  });
  // The gate's title misses its {role} today (RequireWorkspaceRole, shared): the body is checked.
  await step("Checkout is the owner's", () => open(page, "/checkout?plan=chat_pro&cycle=monthly"), async () => {
    const gate = m("Workspace.gate.body", { name: "OrgTik Egypt" });
    const pay = await page.getByRole("button", { name: new RegExp(m("Tools.checkout.pay", { total: "" }).trim()) }).count();
    return { ok: (await visible(page.getByText(gate))) && pay === 0, note: `${gate}; ${pay} pay buttons` };
  });
});

// T6: join a waitlist.
await walk("T6-waitlist", "Join the Email waitlist", NOUR, async ({ page, step }) => {
  await step("Tools and plans", () => open(page, "/tools"), async () => (await visible(card(page, "email"))) || "no Email");
  await step("Join the Email waitlist", async () => {
    await card(page, "email").getByRole("button", { name: `${m("Tools.actions.joinWaitlist")} ${toolName("email")}` }).click();
  }, async () => {
    const on = await visible(card(page, "email").getByText(m("Tools.actions.onWaitlist")));
    const listed = (await api(NOUR, "/tools")).find((t) => t.key === "email")?.onWaitlist;
    return { ok: on && listed, note: on ? m("Tools.actions.onWaitlist") : "not shown" };
  });
});

// T7: a custom plan: ask for one, and accept a quote (Mona's OrgTik Egypt has one quoted).
await walk("T7-custom-plan", "Custom plan: request and accept a quote", MONA, async ({ page, step }) => {
  await step("Custom plan", () => open(page, "/tools/custom-plan"), async () => (await visible(page.getByRole("heading", { level: 1, name: m("Tools.custom.title") }))) || "no heading");
  await step("Ask for CRM and Marketing for 40 people", async () => {
    await page.getByRole("checkbox", { name: toolName("crm") }).click();
    await page.getByRole("checkbox", { name: toolName("marketing") }).click();
    await page.getByRole("textbox", { name: m("Tools.custom.seats") }).fill("40");
    await page.getByRole("button", { name: m("Tools.custom.send") }).click();
  }, async () => {
    const reqs = await api(MONA, "/custom-plans");
    const made = reqs.find((r) => r.seats === 40 && r.tools.includes("crm"));
    return { ok: Boolean(made) && (await visible(page.getByText(m("Tools.custom.state.new")))), note: made ? `request ${made.id}, ${made.cycle}` : "not sent" };
  });
  await step("Accept the quote", async () => {
    await page.getByRole("button", { name: m("Tools.custom.accept") }).first().click();
    const dialog = page.getByRole("alertdialog");
    await dialog.waitFor({ timeout: 5000 });
    await dialog.getByRole("button", { name: m("Tools.custom.accept") }).click();
    await dialog.waitFor({ state: "hidden", timeout: 10000 });
  }, async () => {
    const r = (await api(MONA, "/custom-plans")).find((x) => x.id === "cpr_2");
    return { ok: r?.state === "accepted" && (await visible(page.getByText(m("Tools.custom.acceptedBody")))), note: `cpr_2 ${r?.state}` };
  });
});

await browser.close();
await mock.reset();
unlock();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "usr-tools.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "usr-tools.json"))}`);
