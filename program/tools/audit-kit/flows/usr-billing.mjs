// USR billing (spec 05 USR-09…12): the owner's golden flows, walked in the browser. Names and
// expected messages come from SOS's own catalogs, so the same walk runs in every language.
//
//   node flows/usr-billing.mjs [--locale ar] [--only B3]   (SOS and the local-dev mock running)
//
// Writes audits/usr/flows[/<locale>]/<flow>/NN-<step>.png and usr-billing.json.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, WORKSPACE, apiUrl, redact, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const SOS_DIR = path.join(WORKSPACE, "somion-sos-frontend-main", "messages");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const CATALOG = Object.assign({}, read(path.join(SOS_DIR, `${LOCALE}.json`)), read(path.join(SOS_DIR, "usr", LOCALE, "workspace.json")), read(path.join(SOS_DIR, "usr", LOCALE, "billing.json")));
const raw = (key) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return text;
};
const m = (key, values = {}) => raw(key).replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
// A message with placeholders as a pattern: its fixed words must all be there, in order.
const like = (key) => new RegExp(raw(key).replace(/<\w+><\/\w+>/g, "\u0000").replace(/\{\w+\}/g, "\u0000").split("\u0000").map((s) => s.trim().replace(/[.*+?^$()|[\]\\]/g, "\\$&")).filter(Boolean).join("[\\s\\S]*?"));

// Tool and plan names as the platform gives them (spec catalogue), in the walk's language.
const TOOLS = { files: { en: "Files", ar: "الملفات" }, tasks: { en: "Tasks", ar: "المهام" }, chat: { en: "Chat", ar: "المحادثات" } };
const FREE = { en: "Free", ar: "مجاني" };
const tool = (key) => TOOLS[key][LOCALE] ?? TOOLS[key].en;
const country = (code) => new Intl.DisplayNames([LOCALE], { type: "region" }).of(code);

const OUT = path.join(AUDITS, "usr", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const PLATFORM = apiUrl("admin");
const NOUR = "nour.khaled@nilefoods.test";
const MONA = "mona.adel@orgtik.test";
const KARIM = "karim.hassan@orgtik.test";
const unlock = await mock.lock(`usr-billing flows (${LOCALE})`);
const browser = await chromium.launch();
const walks = [];

async function walk(id, title, as, fn) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }]);
  await signIn(ctx, "sos", as);
  // SOS's middleware sends a customer with a Sales scope to CRM from every page (middleware.ts,
  // isCustomerWithSalesScope), so Nour, a customer who owns Nile Foods, can't reach /billing.
  // Until that's settled, the walks as Nour drop "sales" from the SOS scopes cookie (as usr-tools).
  if (as === NOUR) {
    const c = (await ctx.cookies(SOS)).find((x) => x.name === "SOMION_SOS.scopes");
    if (c) await ctx.addCookies([{ ...c, value: encodeURIComponent(JSON.stringify(JSON.parse(decodeURIComponent(c.value)).filter((x) => x.scope !== "sales"))) }]);
  }
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
    await fn({ page, step });
  } finally {
    walks.push({ id, title, locale: LOCALE, as, workaround: as === NOUR ? "sales scope dropped from the SOS scopes cookie (middleware sends customers to the Sales portal)" : null, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(SOS + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 20000 }).catch(() => {});
  await settle(page);
};
const toast = (page) => page.locator("[data-orgtik-toast]").first().innerText({ timeout: 6000 }).catch(() => "");
// The toast that says what the step did (newer toasts stack on top of older ones).
const saw = (page, key) => page.locator("[data-orgtik-toast]").filter({ hasText: like(key) }).first().innerText({ timeout: 6000 }).catch(() => "");
const main = (page) => page.locator("main").first();
const line = (page, key) => main(page).getByRole("listitem").filter({ has: page.getByRole("heading", { name: tool(key), exact: true }) });
const dialog = (page) => page.getByRole("alertdialog");
const confirm = async (page, label) => {
  await dialog(page).getByRole("button", { name: label, exact: true }).click();
  await dialog(page).waitFor({ state: "hidden", timeout: 10000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
};
// The banner slot: between the top bar and the page, in the shell's main column.
const bannerText = (page) => page.evaluate(() => document.querySelector("#ot-main")?.previousElementSibling?.innerText ?? "");

// B1: Nour pays the past-due Files renewal: the first try fails (nothing changes, the cards are
// pointed to), the second goes through; the line is active and the banner moves on to the trial.
await walk("B1-retry", "Retry a failed renewal: it fails, then it goes through", NOUR, async ({ page, step }) => {
  await step("Open subscriptions", () => open(page, "/billing"), async () => {
    const top = await bannerText(page);
    return { ok: (await line(page, "files").getByRole("button", { name: m("Billing.lines.retry") }).isVisible()) && like("Workspace.banner.payment_failed.title").test(top), note: "Files past due, payment-failed banner" };
  });
  await step("Retry: the card is declined", async () => {
    const r = await mock.control("admin", "/v1/__mock/fail-next-payment", { body: { count: 1 } });
    if (!r.ok) throw new Error(`fail-next-payment -> ${r.status}`);
    await line(page, "files").getByRole("button", { name: m("Billing.lines.retry") }).click();
    await confirm(page, m("Billing.confirm.retry"));
  }, async () => {
    const card = line(page, "files");
    const said = await card.getByText(m("Billing.errors.paymentFailed")).isVisible();
    const link = await card.getByRole("link", { name: m("Billing.lines.toCards") }).first().isVisible();
    const still = await card.getByRole("button", { name: m("Billing.lines.retry") }).isVisible();
    return { ok: said && link && still, note: `failure said: ${said}, link to cards: ${link}, still past due: ${still}` };
  });
  await step("Retry again: paid", async () => {
    await line(page, "files").getByRole("button", { name: m("Billing.lines.retry") }).click();
    await confirm(page, m("Billing.confirm.retry"));
  }, async () => {
    const said = await saw(page, "Billing.done.paid");
    const card = line(page, "files");
    const retry = await card.getByRole("button", { name: m("Billing.lines.retry") }).isVisible().catch(() => false);
    const top = await bannerText(page);
    const moved = like("Workspace.banner.trial_ending.title").test(top) && top.includes(tool("chat"));
    return { ok: !retry && moved && Boolean(said), note: `toast: ${said}; banner now trial ending for ${tool("chat")}: ${moved}` };
  });
});

// B2: Mona cancels Tasks (at the period's end), then resumes it.
await walk("B2-cancel-resume", "Cancel a line, then resume it", MONA, async ({ page, step }) => {
  await step("Open subscriptions", () => open(page, "/billing"), async () => (await line(page, "tasks").getByRole("button", { name: m("Billing.lines.cancel"), exact: true }).isVisible()) || "no cancel on Tasks");
  await step("Cancel Tasks", async () => {
    await line(page, "tasks").getByRole("button", { name: m("Billing.lines.cancel"), exact: true }).click();
    const impact = await dialog(page).innerText();
    if (!like("Billing.confirm.cancelImpact").test(impact)) throw new Error("the dialog doesn't state the consequence");
    await confirm(page, m("Billing.confirm.cancel", { tool: tool("tasks") }));
  }, async () => {
    const said = await saw(page, "Billing.done.cancelled");
    const resume = await line(page, "tasks").getByRole("button", { name: m("Billing.lines.resume") }).isVisible();
    return { ok: resume && Boolean(said), note: `toast: ${said}` };
  });
  await step("Resume Tasks", async () => {
    await line(page, "tasks").getByRole("button", { name: m("Billing.lines.resume") }).click();
    await confirm(page, m("Billing.confirm.resume", { tool: tool("tasks") }));
  }, async () => {
    const said = await saw(page, "Billing.done.resumed");
    const back = await line(page, "tasks").getByRole("button", { name: m("Billing.lines.cancel"), exact: true }).isVisible();
    return { ok: back && Boolean(said), note: `toast: ${said}` };
  });
});

// B3: Mona schedules Tasks' move to Free at the period's end, then keeps her plan.
await walk("B3-downgrade", "Schedule a downgrade, then cancel it", MONA, async ({ page, step }) => {
  const move = m("Billing.lines.moveTo", { plan: FREE[LOCALE] ?? FREE.en });
  await step("Open subscriptions", () => open(page, "/billing"), async () => (await line(page, "tasks").getByRole("button", { name: move }).isVisible()) || "no move to Free on Tasks");
  await step("Schedule the move to Free", async () => {
    await line(page, "tasks").getByRole("button", { name: move }).click();
    await confirm(page, m("Billing.confirm.downgrade"));
  }, async () => {
    const said = await saw(page, "Billing.done.downgraded");
    const card = line(page, "tasks");
    const scheduled = like("Billing.lines.downgradeTitle").test(await card.innerText());
    const keep = await card.getByRole("button", { name: m("Billing.lines.keepPlan") }).isVisible();
    return { ok: scheduled && keep && Boolean(said), note: `toast: ${said}` };
  });
  await step("Keep my plan", async () => {
    await line(page, "tasks").getByRole("button", { name: m("Billing.lines.keepPlan") }).click();
    await confirm(page, m("Billing.lines.keepPlan"));
  }, async () => {
    const said = await saw(page, "Billing.done.keptPlan");
    const gone = !(await line(page, "tasks").getByRole("button", { name: m("Billing.lines.keepPlan") }).isVisible());
    return { ok: gone && Boolean(said) && (await line(page, "tasks").getByRole("button", { name: move }).isVisible()), note: `toast: ${said}` };
  });
});

// B4: Mona's invoices, then one invoice.
await walk("B4-invoices", "Open the invoice list and an invoice", MONA, async ({ page, step }) => {
  let number = "";
  await step("Open invoices", () => open(page, "/billing/invoices"), async () => {
    const rows = await main(page).getByRole("row").count();
    number = (await main(page).getByRole("table").getByRole("link").first().innerText()).trim();
    return { ok: rows > 1 && Boolean(number), note: `${rows - 1} rows, first ${number}` };
  });
  await step("Open the newest invoice", async () => {
    await main(page).getByRole("table").getByRole("link").first().click();
    await page.waitForURL(/\/billing\/invoices\/[^/]+$/, { timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await settle(page);
  }, async () => {
    const h1 = await page.getByRole("heading", { level: 1 }).innerText();
    const text = await main(page).innerText();
    const ok = h1.includes(number) && text.includes(m("Billing.invoice.billedTo")) && text.includes(m("Billing.invoice.subtotal")) && (await page.getByRole("button", { name: m("Billing.invoice.print") }).isVisible());
    return { ok, note: h1 };
  });
});

// B5: Mona's cards: an expired one is refused, a valid one is added, made the default, and the
// old one removed; the last working card can't go while renewals depend on it.
await walk("B5-cards", "Add a card (expired refused), make it default, remove the old one", MONA, async ({ page, step }) => {
  // By its name: a toast is a dialog too.
  const add = () => page.getByRole("dialog", { name: m("Billing.cards.add.title") });
  await step("Open payment methods", () => open(page, "/billing/payment-methods"), async () => (await main(page).getByText("Visa •••• 4242").isVisible()) || "Visa 4242 not listed");
  await step("Add a card with a past expiry: refused", async () => {
    await main(page).getByRole("button", { name: m("Billing.cards.addCard") }).first().click();
    await add().getByRole("textbox", { name: m("Billing.cards.add.last4") }).fill("1111");
    await add().getByRole("textbox", { name: m("Billing.cards.add.expires") }).fill("01/24");
    await add().getByRole("button", { name: m("Billing.cards.add.submit") }).click();
  }, async () => ({ ok: await add().getByText(m("Billing.cards.add.expired")).isVisible(), note: "said on the expiry field" }));
  let added = "";
  await step("Add a valid card", async () => {
    await add().getByRole("textbox", { name: m("Billing.cards.add.expires") }).fill("12/30");
    await add().getByRole("button", { name: m("Billing.cards.add.submit") }).click();
    await add().waitFor({ state: "hidden", timeout: 10000 });
    added = await saw(page, "Billing.cards.add.added");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  }, async () => ({ ok: (await main(page).getByText("Visa •••• 1111").isVisible()) && Boolean(added), note: `toast: ${added}` }));
  const item = (label) => main(page).getByRole("listitem").filter({ hasText: label });
  await step("Make it the default", async () => {
    await item("Visa •••• 1111").getByRole("button", { name: m("Billing.cards.makeDefault") }).click();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
  }, async () => ({ ok: await item("Visa •••• 1111").getByText(m("Billing.cards.default"), { exact: true }).isVisible(), note: `toast: ${await saw(page, "Billing.cards.defaultSet")}` }));
  await step("Remove the old card", async () => {
    await page.getByRole("button", { name: m("Billing.cards.removeLabel", { card: "Visa •••• 4242" }) }).click();
    await confirm(page, m("Billing.cards.removeConfirm"));
  }, async () => ({ ok: !(await main(page).getByText("Visa •••• 4242").isVisible()), note: `toast: ${await saw(page, "Billing.cards.removed")}` }));
  await step("Remove the last working card: refused, with why", async () => {
    await page.getByRole("button", { name: m("Billing.cards.removeLabel", { card: "Visa •••• 1111" }) }).click();
    await confirm(page, m("Billing.cards.removeConfirm"));
  }, async () => ({ ok: (await item("Visa •••• 1111").getByText(m("Billing.cards.lastMethodTitle")).isVisible()) && (await main(page).getByText("Visa •••• 1111").isVisible()), note: "409 last_method said on the card" }));
});

// B6: Nour edits the billing details (same country).
await walk("B6-details", "Edit billing details", NOUR, async ({ page, step }) => {
  const address = "26th of July Corridor, Sheikh Zayed, Giza";
  await step("Open billing details", () => open(page, "/billing/details"), async () => {
    const text = await main(page).innerText();
    return { ok: text.includes(m("Billing.details.taxTitle")) && like("Billing.details.taxRule").test(text), note: "tax rule shown" };
  });
  await step("Change the address and tax ID, save", async () => {
    await main(page).getByRole("textbox", { name: m("Billing.details.address") }).fill(address);
    await main(page).getByRole("textbox", { name: m("Billing.details.taxId") }).fill("EG-200-100-300");
    await main(page).getByRole("button", { name: m("Billing.details.save") }).click();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  }, async () => {
    const said = await saw(page, "Billing.details.saved");
    return { ok: Boolean(said), note: `toast: ${said}` };
  });
  await step("Reload: the change is kept", () => open(page, "/billing/details"), async () => ({ ok: (await main(page).getByRole("textbox", { name: m("Billing.details.address") }).inputValue()) === address }));
});

// B7: Mona moves OrgTik Egypt to Saudi Arabia: the currency is locked, so support gets the move.
await walk("B7-country", "A country change with a locked currency queues a migration", MONA, async ({ page, step }) => {
  await step("Open billing details", () => open(page, "/billing/details"), async () => (await main(page).getByRole("combobox", { name: m("Billing.details.country") }).isVisible()) || "no country field");
  await step("Choose Saudi Arabia", async () => {
    await main(page).getByRole("combobox", { name: m("Billing.details.country") }).click();
    await page.getByRole("option", { name: country("SA"), exact: true }).click();
  }, async () => ({ ok: await main(page).getByText(m("Billing.details.moveTitle", { country: country("SA") })).isVisible(), note: "says it goes through support" }));
  await step("Save and request the move", async () => {
    await main(page).getByRole("button", { name: m("Billing.details.saveAndRequest") }).click();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
  }, async () => {
    const queued = await main(page).getByText(m("Billing.details.queuedTitle", { country: country("SA") })).isVisible();
    const kept = await main(page).getByRole("combobox", { name: m("Billing.details.country") }).innerText();
    return { ok: queued && kept.includes(country("EG")), note: `queued: ${queued}; billing country still ${kept.trim()}` };
  });
});

// B8: Karim is an admin of OrgTik Egypt, not its owner: billing isn't for him.
await walk("B8-gate", "An admin is refused by the owner gate", KARIM, async ({ page, step }) => {
  for (const route of ["/billing", "/billing/invoices", "/billing/payment-methods", "/billing/details"]) {
    await step(`Open ${route}`, () => open(page, route), async () => {
      // The gate's own words: its title names the role, its body the workspace.
      const text = await main(page).innerText();
      const h1 = await page.getByRole("heading", { level: 1 }).innerText().catch(() => "");
      const gated = like("Workspace.gate.body").test(text) && (await page.getByRole("link", { name: m("Workspace.gate.toHome") }).isVisible());
      const leaked = text.includes(m("Billing.summary.monthly")) || text.includes(m("Billing.invoices.tableLabel")) || text.includes(m("Billing.cards.addCard")) || text.includes(m("Billing.details.legalName"));
      const title = h1 === m("Workspace.gate.title", { role: m("Workspace.roles.owner") });
      return { ok: gated && title && !leaked, note: title ? "gate shown; nothing of billing on the page" : `title reads "${h1}"` };
    });
  }
});

await browser.close();
await mock.reset();
unlock();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "usr-billing.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "usr-billing.json"))}`);
