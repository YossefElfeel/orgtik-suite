// Marketing: the wave's golden flows (audits/marketing/wave-plan.md, M1–M8), walked in the browser.
// Names and messages come from Marketing's catalog and the library's strings, so the same walk runs
// in every language. Flows are added as their screens are migrated.
//
//   node flows/marketing.mjs [--locale ar] [--only M3]   (Marketing, SOS and the mock API running)
//
// Takes the shared flow lock before it resets the mock (lib/mock.mjs), so it never runs at the same
// time as another session's flows. Writes audits/marketing/flows[/<locale>]/<flow>/NN-<step>.png and
// walks.json.
import fs from "node:fs";
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
const APP = path.join(WORKSPACE, "digital-marketing-frontend-main");
const CATALOG = JSON.parse(fs.readFileSync(path.join(APP, "messages", `${LOCALE}.json`), "utf8"));
const { STRINGS } = await import("file:///" + path.join(APP, "node_modules", "@orgtik", "ui", "dist", "i18n", "strings.js").replace(/\\/g, "/"));
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
const L = (key, values = {}) => fill(String(STRINGS[LOCALE]?.[key] ?? STRINGS.en[key]), values);

const OUT = path.join(AUDITS, "marketing", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const MKT = webUrl("marketing");
const API = apiUrl("marketing");
const KARIM = "karim.hassan@orgtik.test";
const DINA = "dina.fathy@orgtik.test"; // marketing specialist
const HODA = "hoda.ashraf@orgtik.test"; // content writer
const NOUR = "nour.khaled@nilefoods.test"; // client reviewer (Nile Foods)
const MONA = "mona.adel@orgtik.test";
const stamp = Date.now().toString(36).slice(-4);

const call = async (email, method, url, body) => {
  const token = await tokenFor(email, "marketing");
  const r = await fetch(API + url, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
};

const browser = await chromium.launch();
const walks = [];
const unlock = await mock.lock("marketing-flows (Marketing wave session)");

async function walk(id, title, as, fn) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  if (as) await signIn(ctx, "marketing", as);
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
  await page.goto(`${MKT}/${LOCALE}${route}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page);
};
const toastText = (page) => page.locator("[data-orgtik-toast]").allInnerTexts().then((t) => t.join(" | ")).catch(() => "");
// The instant a wall-clock date and time are at in a zone (as the app's DateTimePicker computes it).
const wallIn = (at, tz) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const g = (t) => parts.find((x) => x.type === t)?.value ?? "00";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
};
const offsetAt = (ms, tz) => {
  const w = wallIn(new Date(ms), tz);
  const [y, mo, d] = w.date.split("-").map(Number);
  const [h, mi] = w.time.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - Math.floor(ms / 60000) * 60000;
};
const instantOf = (date, time, tz) => {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(guess - offsetAt(guess - offsetAt(guess, tz), tz)).toISOString();
};
const ZONE = "Africa/Cairo";
const tomorrow = wallIn(new Date(Date.now() + 864e5), ZONE).date;
const at10 = instantOf(tomorrow, "10:00", ZONE);
const post = (email, id) => call(email, "GET", `/publishing/posts/${id}`).then((j) => j.data);

// Writes a post to Facebook and Instagram for tomorrow 10:00 Cairo with Nour as its approver, and
// sends it for approval. Returns the new post's id.
async function composeForApproval(page, step, title) {
  await step("Write the post", async () => {
    await open(page, "/posts/create-post");
    await page.getByRole("textbox", { name: m("PostComposer.titleLabel"), exact: true }).fill(title);
    await page.getByRole("checkbox", { name: /^Facebook / }).check();
    await page.getByRole("checkbox", { name: /^Instagram / }).check();
    await page.getByRole("textbox", { name: m("PostComposer.textLabel"), exact: true }).fill("Tomorrow at ten: our new recipe.");
    await page.getByRole("button", { name: m("PostComposer.next", { step: m("PostComposer.stepMedia") }) }).click();
    // Instagram needs an image: pick one from the gallery.
    await page.getByRole("button", { name: m("PostComposer.chooseMedia") }).first().click();
    const picker = page.getByRole("dialog");
    await picker.getByRole("list").getByRole("button").first().click();
    await picker.getByRole("button", { name: m("MediaLibrary.useChosen") }).click();
    await page.getByRole("button", { name: m("PostComposer.next", { step: m("PostComposer.stepSchedule") }) }).click();
  }, async () => page.getByRole("heading", { name: m("PostComposer.stepSchedule"), level: 2 }).isVisible());
  await step("Tomorrow 10:00, in the project's time zone", async () => {
    await page.getByRole("button", { name: m("PostComposer.date"), exact: true }).click();
    // The day by its spoken name, formatted as the library's calendar does ("Saturday, 3 October 2026").
    const tag = { en: "en-GB", ar: "ar-u-nu-latn", de: "de-CH", fr: "fr-CH", it: "it-CH" }[LOCALE];
    const dayName = new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${tomorrow}T12:00:00Z`));
    await page.getByRole("dialog").getByRole("button", { name: dayName }).click();
    await page.getByRole("textbox", { name: m("PostComposer.time"), exact: true }).fill("10:00");
  }, async () => {
    const lead = L("timeZoneNoteNamed", { zone: "@@", offset: "@@" }).split("@@")[0];
    const note = await page.getByText(lead).first().innerText().catch(() => "");
    return { ok: Boolean(note), note };
  });
  await step("Nour approves it first", async () => {
    await page.getByRole("button", { name: m("PostComposer.addApprovers") }).click();
    const dlg = page.getByRole("dialog", { name: m("ApproversDialog.title") });
    await dlg.getByRole("checkbox", { name: /^Nour Khaled/ }).check();
    await dlg.getByRole("button", { name: m("ApproversDialog.apply") }).click();
  }, async () => page.getByText("Nour Khaled").first().isVisible());
  let id = null;
  await step("Send for approval", async () => {
    await page.getByRole("button", { name: m("PostComposer.submitApproval") }).click();
    await page.waitForURL((u) => /\/posts\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
    id = new URL(page.url()).pathname.split("/").pop();
  }, async () => {
    const p = await post(HODA, id);
    const when = JSON.stringify(p).includes(at10);
    return { ok: Boolean(p) && when, note: `${p?.status}; ${when ? "10:00 Cairo" : "time differs from " + at10}` };
  });
  return id;
}

try {
  // M1: the suite hands Marketing a one-time code; nothing secret stays in any address.
  await walk("M1-open-from-suite", "Open Marketing from the suite", null, async ({ page, step }) => {
    const seen = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
    await step("Arrive with a one-time code", async () => {
      const token = await tokenFor(MONA, "marketing");
      const code = (await (await fetch(`${apiUrl("sos")}/api/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).json()).data.code;
      await page.goto(`${MKT}/${LOCALE}/auth?code=${code}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
      await settle(page);
    }, async () => {
      const leaked = seen.filter((u) => /[?&](token|code)=/.test(u) && !/\/auth\?code=/.test(u));
      const path_ = new URL(page.url()).pathname;
      return { ok: !leaked.length && !page.url().includes("code=") && path_ === `/${LOCALE}/dashboard`, note: `landed on ${path_}` };
    });
    await step("Back doesn't reopen the hand-off", () => page.goBack().catch(() => {}), async () => !/code=/.test(page.url()) || `back went to ${redact(page.url())}`);
    await step("A forged redirect is ignored", async () => {
      const token = await tokenFor(MONA, "marketing");
      const code = (await (await fetch(`${apiUrl("sos")}/api/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).json()).data.code;
      await page.goto(`${MKT}/${LOCALE}/auth?code=${code}&redirect=${encodeURIComponent("https://example.org/")}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
    }, async () => page.url().startsWith(MKT) || `left the app for ${redact(page.url())}`);
  });

  // M1b: signed out, a Marketing link goes through the suite's sign-in and comes back to that page.
  await walk("M1b-deep-link-after-sign-in", "Sign in again and land on the page you opened", null, async ({ page, ctx, step }) => {
    const target = `/${LOCALE}/posts`;
    await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: webUrl("sos") }]);
    await step("Open a Marketing link while signed out", async () => {
      await page.goto(MKT + target, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => u.href.startsWith(webUrl("sos")) && /login/.test(u.pathname), { timeout: 60000 });
      await settle(page);
    }, async () => /\/auth\/login/.test(page.url()) || `not on the sign-in page (${redact(page.url())})`);
    await step("Sign in", async () => {
      await page.getByRole("textbox", { name: sos("Auth.email") }).fill(MONA);
      await page.getByRole("textbox", { name: sos("Auth.password"), exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: sos("Auth.submit") }).click();
      await page.waitForURL((u) => u.href.startsWith(MKT) && !/\/auth/.test(u.pathname), { timeout: 90000 });
      await settle(page);
    }, async () => ({ ok: new URL(page.url()).pathname === target && !/[?&](code|token)=/.test(page.url()), note: `landed on ${new URL(page.url()).pathname}` }));
  });

  // M7: switching project leaves nothing of the previous one on screen.
  await walk("M7-switch-project", "Switch project", KARIM, async ({ page, step }) => {
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const switcher = () => page.getByRole("button", { name: new RegExp(m("Shell.switchProjectCurrent", { name: "@@NAME@@" }).split("@@NAME@@").map(esc).join(".+")) }).first();
    await step("Dashboard of the active project", () => open(page, "/dashboard"), async () => {
      const name = (await switcher().innerText().catch(() => "")).trim();
      return { ok: Boolean(name), note: name };
    });
    await step("Switch to Sahel Resorts", async () => {
      await switcher().click();
      await page.getByRole("menuitemradio", { name: "Sahel Resorts" }).click();
      await page.waitForURL((u) => u.pathname === `/${LOCALE}/dashboard`, { timeout: 30000 });
      await page.waitForTimeout(1500);
      await settle(page);
    }, async () => {
      const label = (await switcher().innerText().catch(() => "")).trim();
      return { ok: /Sahel Resorts/.test(label), note: label };
    });
  });
  // M2: a specialist sets up a Google Search campaign; it survives a reload; it goes for approval.
  await walk("M2-google-search", "Run a Google Search campaign", DINA, async ({ page, step }) => {
    const name = `Flow search ${stamp}`;
    const pickChip = (label) => page.locator("label").filter({ hasText: label }).first().click();
    let id = null;
    await step("Details: Google Search, a name, a category", async () => {
      await open(page, "/campaigns/new");
      await page.getByRole("textbox", { name: m("CampaignDetailsStep.name"), exact: true }).fill(name);
      await pickChip(m("CampaignEnums.category.FOOD_BEVERAGE"));
      await page.getByRole("button", { name: m("CampaignWizard.next"), exact: true }).click();
      await page.waitForURL((u) => u.searchParams.has("id"), { timeout: 30000 });
      id = new URL(page.url()).searchParams.get("id");
      await settle(page);
    }, async () => page.getByRole("heading", { name: m("CampaignGoogle.settingsTitle") }).isVisible());
    await step("Settings: the Google Ads account; the budget is in its currency", async () => {
      await page.getByRole("combobox", { name: m("CampaignGoogle.account") }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: m("CampaignGoogle.budgetAmount") }).fill("500");
      const countries = page.getByRole("combobox", { name: m("CampaignGoogle.locations") });
      const egypt = new Intl.DisplayNames([{ en: "en-GB", ar: "ar", de: "de-CH", fr: "fr-CH", it: "it-CH" }[LOCALE]], { type: "region" }).of("SA");
      await countries.fill(egypt);
      await page.getByRole("option", { name: egypt, exact: true }).click();
    }, async () => {
      const lead = m("CampaignGoogle.currencyFromAccount", { currency: "SAR", account: "@@" }).split("@@")[0];
      const note = await page.getByText(lead).first().innerText().catch(() => "");
      return { ok: Boolean(note), note };
    });
    await step("Next, then reload: still there", async () => {
      await page.getByRole("button", { name: m("CampaignWizard.next"), exact: true }).click();
      await page.getByRole("heading", { name: m("CampaignGoogle.adGroupsTitle") }).first().waitFor({ timeout: 30000 });
      await page.reload({ waitUntil: "load" });
      await settle(page);
    }, async () => {
      const c = await call(DINA, "GET", `/campaigns/${id}`).then((j) => j.data);
      const ok = c && c.name === name && JSON.stringify(c).includes("500");
      return { ok: Boolean(ok) && (await page.getByRole("heading", { name: m("CampaignGoogle.adGroupsTitle") }).first().isVisible()), note: c ? `${c.name}; ${c.status}` : "no campaign" };
    });
    await step("An ad group with a keyword and a search ad", async () => {
      await page.getByRole("button", { name: m("CampaignGoogle.addAdGroup") }).first().click();
      const group = page.getByRole("region").filter({ has: page.getByRole("textbox", { name: m("CampaignGoogle.adGroupName") }) }).first();
      await group.getByRole("textbox", { name: m("CampaignGoogle.keywords"), exact: true }).fill("koshary delivery");
      await group.getByRole("button", { name: m("CampaignGoogle.addKeyword"), exact: true }).click();
      await group.getByRole("button", { name: m("CampaignGoogle.addResponsiveAd") }).click();
      const dlg = page.getByRole("dialog");
      await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.name") }).fill("Koshary – Riyadh");
      await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.finalUrl") }).fill("https://nilefoods.com/ksa");
      for (const h of ["Koshary in 20 minutes", "Hot meals delivered", "Order Nile Foods"]) {
        await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.headlines") }).fill(h);
        await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.headlines") }).press("Enter");
      }
      for (const d of ["Egyptian classics, cooked fresh and delivered hot.", "Order now and get it in 30 minutes across Riyadh."]) {
        await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.descriptions") }).fill(d);
        await dlg.getByRole("textbox", { name: m("CampaignDialogs.rsa.descriptions") }).press("Enter");
      }
      await dlg.getByRole("button", { name: m("CampaignDialogs.rsa.add") }).click();
    }, async () => (await page.getByText("Koshary – Riyadh").first().isVisible()) || "the ad isn't in the group");
    await step("Review, and a reload keeps everything", async () => {
      await page.getByRole("button", { name: m("CampaignWizard.next"), exact: true }).click();
      await page.getByRole("heading", { name: m("CampaignReview.title"), level: 2 }).waitFor({ timeout: 30000 });
      await page.reload({ waitUntil: "load" });
      await settle(page);
    }, async () => {
      const missing = await page.getByText(m("CampaignReview.missingBody")).count();
      return { ok: missing === 0 && (await page.getByText(name).first().isVisible()), note: missing ? "steps reported missing" : "" };
    });
    await step("Publish: the confirm names the spend", async () => {
      await page.getByRole("button", { name: m("CampaignReview.publish"), exact: true }).click();
      const confirm = page.getByRole("alertdialog");
      await confirm.waitFor({ timeout: 10000 });
      const text = await confirm.innerText();
      if (!/SAR|ر\.س/.test(text)) throw new Error(`no SAR in "${text.slice(0, 120)}"`);
      await confirm.getByRole("button", { name: m("CampaignReview.confirmPublish") }).click();
      await page.waitForTimeout(2500);
    }, async () => {
      const c = await call(DINA, "GET", `/campaigns/${id}`).then((j) => j.data);
      return { ok: Boolean(c?.publishedAt) || /READY|RUNNING|AWAITING/.test(String(c?.status) + String(c?.workflowState)), note: `${c?.status} / ${c?.workflowState}` };
    });
  });

  // M3: a writer schedules a post for two platforms; the client approves it; it's on the calendar.
  await walk("M3-schedule-with-approval", "Schedule a post with approval", HODA, async ({ page, step }) => {
    const title = `Flow post ${stamp}`;
    const id = await composeForApproval(page, step, title);
    if (!id) return;
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
    await signIn(ctx2, "marketing", NOUR);
    const nour = await ctx2.newPage();
    try {
      await step("Nour approves with a note", async () => {
        await open(nour, `/posts/${id}`);
        await nour.getByRole("button", { name: m("PostDetails.approve"), exact: true }).first().click();
        const dlg = nour.getByRole("alertdialog");
        await dlg.getByRole("textbox", { name: m("PostDetails.approveNote") }).fill("Looks good to us.");
        await dlg.getByRole("button", { name: m("PostDetails.approve"), exact: true }).click();
        await nour.waitForTimeout(1500);
      }, async () => {
        const p = await post(HODA, id);
        const r = JSON.stringify(p ?? {});
        return { ok: /APPROVED/.test(r) && /Looks good to us/.test(r), note: p?.status };
      });
    } finally {
      await ctx2.close();
    }
    await step("It's on the calendar at 10:00", () => open(page, "/calendar"), async () => {
      const chip = page.getByText(title).first();
      const box = await chip.locator("xpath=ancestor-or-self::*[self::a or self::button][1]").innerText().catch(() => "");
      return { ok: /10[:.]00|١٠:٠٠/.test(box), note: box.replace(/\s+/g, " ").slice(0, 80) };
    });
  });

  // M6: the client reviewer sees her project, reviews, and isn't offered changes.
  await walk("M6-client-reviewer", "Review as the client", NOUR, async ({ page, step }) => {
    await step("Only Nile Foods, and no setup in the menu", () => open(page, "/dashboard"), async () => {
      const nav = await page.getByRole("navigation", { name: L("mainNavigation") }).innerText().catch(() => "");
      const hidden = [m("Shell.integrations"), m("Shell.settings"), m("Shell.boosts"), m("Shell.labels")].filter((x) => nav.includes(x));
      const sw = await page.getByRole("button", { name: /Nile Foods/ }).first().innerText().catch(() => "");
      return { ok: !hidden.length && /Nile Foods/.test(sw), note: hidden.length ? `shown: ${hidden.join(", ")}` : sw.trim() };
    });
    await step("Posts: no Create", () => open(page, "/posts"), async () => {
      const create = await page.getByRole("link", { name: m("Posts.newPost") }).count().catch(() => 0);
      return create === 0 || "a Create link is offered";
    });
    await step("Writing a post isn't offered", () => open(page, "/posts/create-post"), async () => {
      const h1 = await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => "");
      return { ok: h1 === m("PostComposer.noAccessTitle"), note: h1 };
    });
  });

  // M4: a specialist boosts a published post: the total is in the ad account's currency and asks
  // to be confirmed. A refused boost says so, and the dialog stays.
  await walk("M4-boost", "Boost a post", DINA, async ({ page, step }) => {
    const list = await call(DINA, "GET", "/publishing/posts?limit=50&status=PUBLISHED").then((j) => j.data?.items ?? j.data ?? []);
    const target = list.find((p) => p.status === "PUBLISHED" && JSON.stringify(p).includes("FACEBOOK"));
    const boostFor = new RegExp(m("Boost.boostFor", { total: "@@" }).split("@@").map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".+"));
    const before = await call(DINA, "GET", "/ads/executions?limit=100").then((j) => (j.data?.items ?? j.data ?? []).length);
    const fillBudget = async () => {
      const dlg = page.getByRole("dialog", { name: m("Boost.title") });
      await dlg.getByRole("textbox", { name: m("Boost.dailyBudget") }).fill("200");
      await dlg.getByRole("textbox", { name: m("Boost.days") }).fill("7");
      await dlg.getByRole("textbox", { name: m("Boost.days") }).press("Tab");
      // Required: where the audience is. Country names are in the reader's language.
      const egypt = new Intl.DisplayNames([{ en: "en-GB", ar: "ar", de: "de-CH", fr: "fr-CH", it: "it-CH" }[LOCALE]], { type: "region" }).of("EG");
      const country = dlg.getByRole("combobox", { name: m("Boost.country") });
      // The dialog keeps the last boost's choices when it opens again.
      if ((await country.inputValue().catch(() => "")) !== egypt) {
        await country.fill(egypt);
        await page.getByRole("option", { name: egypt, exact: true }).click();
      }
      return dlg;
    };
    let label = "";
    await step("200 a day for 7 days, in the account's currency", async () => {
      await open(page, `/posts/${target.id}`);
      await page.getByRole("button", { name: m("PostDetails.boost"), exact: true }).first().click();
      const dlg = await fillBudget();
      label = await dlg.getByRole("button", { name: boostFor }).innerText();
    }, async () => ({ ok: /SAR|ر.س/.test(label) && /1[,.\u066c\u00a0\u202f']?400/.test(label), note: label.trim() }));
    await step("Confirm the spend", async () => {
      await page.getByRole("dialog", { name: m("Boost.title") }).getByRole("button", { name: boostFor }).click();
      const confirm = page.getByRole("alertdialog");
      await confirm.waitFor({ timeout: 10000 });
      await confirm.getByRole("button", { name: boostFor }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const after = await call(DINA, "GET", "/ads/executions?limit=100").then((j) => (j.data?.items ?? j.data ?? []).length);
      const open_ = await page.getByRole("dialog", { name: m("Boost.title") }).isVisible().catch(() => false);
      return { ok: after === before + 1 && !open_, note: `${after - before} new boost; dialog ${open_ ? "still open" : "closed"}` };
    });
    await step("A refused boost: an error, and the dialog stays", async () => {
      await mock.addFault({ app: "marketing", method: "POST", match: "/ads/boost", status: 500, times: 1 });
      // The success toast from the first boost sits over the dialog's footer until it times out.
      await page.locator("[data-orgtik-toast]").first().waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
      await page.getByRole("button", { name: m("PostDetails.boost"), exact: true }).first().click();
      const dlg = await fillBudget();
      await dlg.getByRole("button", { name: boostFor }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: boostFor }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const open_ = await page.getByRole("dialog", { name: m("Boost.title") }).isVisible().catch(() => false);
      const toasts = await toastText(page);
      const green = toasts.includes(m("Feedback.boostStarted"));
      return { ok: open_ && !green, note: `dialog ${open_ ? "open" : "closed"}; ${toasts.slice(0, 80)}` };
    });
    await mock.clearFaults().catch(() => {});
  });

  // M5: a manager connects another Facebook account through the (simulated) consent screen; a
  // forged return is refused without asking the API.
  await walk("M5-connect-account", "Connect a social account", KARIM, async ({ page, step }) => {
    const count = () => call(KARIM, "GET", "/integrations/project").then((j) => (j.data?.items ?? j.data ?? []).filter((i) => i.platform === "FACEBOOK").length);
    const before = await count();
    await step("Sign in to Facebook and come back", async () => {
      await open(page, "/integrations?tab=add");
      await page.getByRole("link", { name: /Facebook/ }).first().click();
      await page.waitForURL((u) => /\/wizard\/FACEBOOK\/1$/.test(u.pathname), { timeout: 30000 });
      await settle(page);
      await page.getByRole("button", { name: m("ConnectWizard.continueTo", { platform: "Facebook" }) }).click();
      await page.waitForURL((u) => /\/wizard\/FACEBOOK\/2$/.test(u.pathname) && u.searchParams.has("session"), { timeout: 60000 });
      await settle(page);
    }, async () => ({ ok: new URL(page.url()).pathname.startsWith(`/${LOCALE}/`) && !/[?&](code|state)=/.test(page.url()), note: new URL(page.url()).pathname }));
    await step("Refresh keeps the connection going", async () => {
      await page.reload({ waitUntil: "load" });
      await settle(page);
    }, async () => page.getByRole("button", { name: m("ConnectWizard.next"), exact: true }).isVisible());
    await step("Pick the page, review and connect", async () => {
      await page.getByRole("button", { name: m("ConnectWizard.next"), exact: true }).click();
      await page.getByRole("button", { name: m("ConnectWizard.finish", { platform: "Facebook" }) }).click();
      await page.waitForURL((u) => /\/integrations$/.test(u.pathname), { timeout: 30000 });
    }, async () => {
      const after = await count();
      return { ok: new URL(page.url()).pathname === `/${LOCALE}/integrations` && after >= before, note: `${new URL(page.url()).pathname}; Facebook accounts ${before} → ${after}` };
    });
    await step("A forged return is refused", async () => {
      await page.goto(`${MKT}/${LOCALE}/integrations/platform/FACEBOOK/callback?code=x&state=forged`, { waitUntil: "load", timeout: 120000 });
      await settle(page);
    }, async () => page.getByText(m("ConnectWizard.mismatchTitle")).first().isVisible());
  });

  // M8: a manager exports last month's daily figures.
  await walk("M8-monthly-report", "Monthly report", KARIM, async ({ page, step }) => {
    await step("Reports, last month", async () => {
      await open(page, "/our-reports");
      await page.getByRole("combobox", { name: m("Insights.periodPreset") }).first().click();
      await page.getByRole("option", { name: m("Insights.preset.lastMonth") }).click();
      await page.waitForTimeout(1500);
      await settle(page);
    }, async () => /[?&]from=/.test(page.url()) || `period not in the URL (${redact(page.url())})`);
    let csv = "";
    await step("Export the daily figures as CSV", async () => {
      const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.getByRole("button", { name: m("Reports.exportDaily") }).first().click()]);
      csv = fs.readFileSync(await dl.path(), "utf8");
    }, async () => {
      const rows = csv.trim().split(/\r?\n/).length;
      return { ok: rows > 1, note: `${rows} lines` };
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
