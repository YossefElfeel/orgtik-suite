// SOS: the wave's golden flows (audits/sos/wave-plan.md), walked in the browser as Mona. Names
// and expected messages come from SOS's own catalog, so the same walk runs in every language.
//
//   node flows/sos.mjs [--locale ar]   (SOS, Files and the local-dev mock running)
//
// Writes audits/sos/flows[/<locale>]/<flow>/NN-<step>.png and walks.json.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, PASSWORD, WORKSPACE, redact, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const CATALOG = JSON.parse(fs.readFileSync(path.join(WORKSPACE, "somion-sos-frontend-main", "messages", `${LOCALE}.json`), "utf8"));
const m = (key, values = {}) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
};
// The "one" form of an ICU plural message, with # as 1 (enough for "Add 1 role").
const one = (key) => {
  const raw = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  const hit = /one \{([^}]*)\}/.exec(raw);
  if (!hit) throw new Error(`no "one" form in ${key}`);
  return hit[1].replace(/#/g, "1");
};
const OUT = path.join(AUDITS, "sos", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const AS = "mona.adel@orgtik.test";
const AYA = "Aya Hamed";
const unlock = await mock.lock(`sos-flows (session e1a403a7)`);
const browser = await chromium.launch();
const walks = [];

async function newContext(signedIn = true) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }]);
  if (signedIn) await signIn(ctx, "sos", AS);
  return ctx;
}

async function walk(id, title, fn, { signedIn = true } = {}) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await newContext(signedIn);
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
    walks.push({ id, title, locale: LOCALE, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(SOS + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await settle(page);
};
const toast = (page) => page.locator("[data-orgtik-toast]").first().innerText({ timeout: 5000 }).catch(() => "");
const main = (page) => page.locator("main").first();
const personMenu = async (page, name) => {
  await page.getByRole("button", { name: m("People.actionsFor", { name }) }).click();
  await page.getByRole("menu").waitFor({ timeout: 5000 });
};
const findPerson = async (page, name) => {
  await open(page, "/people");
  await page.getByRole("textbox", { name: m("People.searchLabel") }).fill(name.split(" ")[0]);
  await page.waitForTimeout(900);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
};

// S1: sign in with the form, then open Files from the launcher: no token in any address on the way.
await walk("S1-open-app", "Sign in and open an app", async ({ page, step }) => {
  const seen = [];
  page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
  await step("Open sign-in", () => open(page, "/auth/login"), async () => (await page.getByRole("heading", { level: 1, name: m("Auth.title") }).isVisible()) || "no sign-in heading");
  await step("Sign in", async () => {
    await page.getByRole("textbox", { name: m("Auth.email") }).fill(AS);
    await page.getByRole("textbox", { name: m("Auth.password"), exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: m("Auth.submit") }).click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 20000 });
    await settle(page);
  }, async () => ({ ok: await page.getByRole("heading", { name: m("Home.yourApps") }).isVisible(), note: "home lists your apps" }));
  await step("Open Files from Home", async () => {
    await page.getByRole("link", { name: new RegExp(m("Suite.apps.file_manager")) }).first().click();
    await page.waitForURL((u) => u.href.startsWith(webUrl("files")) && !/\/auth/.test(u.pathname), { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  }, async () => {
    const leaked = seen.filter((u) => /[?&](token|refreshToken)=/.test(u));
    return { ok: leaked.length === 0 && !page.url().includes("code="), note: leaked.length ? `token in ${leaked.length} address(es)` : `in Files (${redact(new URL(page.url()).pathname)}), no token in any address` };
  });
}, { signedIn: false });

// S2: give Aya access to Tasks with a role, then take the role away (confirmed).
await walk("S2-access", "Give someone access, then remove a role", async ({ page, step }) => {
  await step("Find Aya in People", () => findPerson(page, AYA), async () => (await main(page).getByText(AYA).first().isVisible()) || "Aya not listed");
  await step("Manage access", async () => {
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.manageAccess") }).click();
    await page.waitForURL(/\/people\/\d+\/scopes/, { timeout: 10000 });
    await settle(page);
  }, async () => (await page.getByRole("heading", { level: 1, name: m("Access.title", { name: AYA }) }).isVisible()) || "no access heading");
  await step("Give access to Tasks", async () => {
    await page.getByRole("button", { name: m("Access.addTool") }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: m("Suite.apps.task_manager"), exact: true }).click();
    await dialog.getByRole("button", { name: m("Access.addTool") }).click();
    await page.waitForTimeout(1200);
  }, async () => {
    const said = await toast(page);
    return { ok: await main(page).getByRole("heading", { name: m("Suite.apps.task_manager"), exact: true }).isVisible(), note: `toast: ${said || "(none)"}` };
  });
  await step("Add a role in Tasks", async () => {
    const card = main(page).locator("li").filter({ has: page.getByRole("heading", { name: m("Suite.apps.task_manager"), exact: true }) });
    await card.getByRole("button", { name: m("Access.addRolesButton") }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: m("Roles.developer"), exact: true }).click();
    await dialog.getByRole("heading").first().click();
    await dialog.getByRole("button", { name: one("Access.addRoles"), exact: true }).click();
    await page.waitForTimeout(1200);
  }, async () => ({ ok: await main(page).getByText(m("Roles.developer"), { exact: true }).first().isVisible(), note: "Developer shows on the Tasks card" }));
  await step("Remove the role (confirmed)", async () => {
    await main(page).getByRole("button", { name: new RegExp(m("Roles.developer")) }).first().click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Access.removeRole") }).click();
    await page.waitForTimeout(1200);
  }, async () => ({ ok: !(await main(page).getByText(m("Roles.developer"), { exact: true }).first().isVisible().catch(() => false)), note: `toast: ${(await toast(page)) || "(none)"}` }));
});

// S3: deactivate Aya (the confirm says what it does), then activate her again.
await walk("S3-deactivate", "Deactivate and reactivate someone", async ({ page, step }) => {
  await step("Find Aya in People", () => findPerson(page, AYA));
  let impact = "";
  await step("Deactivate (confirm says the impact)", async () => {
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.deactivate") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    impact = await confirm.innerText();
    await confirm.getByRole("button", { name: m("People.deactivate") }).click();
    await page.waitForTimeout(1500);
  }, async () => ({
    ok: impact.includes(m("People.deactivateImpact", { name: AYA }).slice(0, 25)) && (await main(page).getByText(m("People.inactive"), { exact: true }).first().isVisible()),
    note: `status ${m("People.inactive")}; toast: ${(await toast(page)) || "(none)"}`,
  }));
  await step("Activate again", async () => {
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.activate") }).click();
    await page.waitForTimeout(1500);
  }, async () => ({ ok: await main(page).getByText(m("People.active"), { exact: true }).first().isVisible(), note: `toast: ${(await toast(page)) || "(none)"}` }));
});

// S4: edit Aya's city; her phone stays as it was.
await walk("S4-edit", "Edit a person; untouched details stay", async ({ page, step }) => {
  let phone = "";
  await step("Open Edit details", async () => {
    await findPerson(page, AYA);
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.edit") }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: m("Person.city") }).waitFor({ timeout: 10000 });
    phone = await page.getByRole("dialog").getByRole("textbox", { name: m("Person.phone") }).inputValue();
  }, async () => ({ note: `phone shows "${phone}"` }));
  await step("Change the city and save", async () => {
    const d = page.getByRole("dialog");
    await d.getByRole("textbox", { name: m("Person.city") }).fill("Alexandria");
    await d.getByRole("button", { name: m("Person.save") }).click();
    await page.waitForTimeout(1500);
  }, async () => ({ note: `toast: ${(await toast(page)) || "(none)"}` }));
  await step("Reopen: city changed, phone kept", async () => {
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.edit") }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: m("Person.city") }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(800);
  }, async () => {
    const d = page.getByRole("dialog");
    const city = await d.getByRole("textbox", { name: m("Person.city") }).inputValue();
    const now = await d.getByRole("textbox", { name: m("Person.phone") }).inputValue();
    return { ok: city === "Alexandria" && now === phone, note: `city "${city}", phone "${now}"` };
  });
});

// S5: forgot password → code → new password → "Password changed" → sign in with it.
await walk("S5-recovery", "Reset a forgotten password", async ({ page, step }) => {
  const fresh = `Walk-${Date.now().toString(36)}`;
  await step("Ask for a code", async () => {
    await open(page, "/auth/forgot-password");
    await page.getByRole("textbox", { name: m("Recovery.email") }).fill("aya.hamed@orgtik.test");
    await page.getByRole("button", { name: m("Recovery.sendCode") }).click();
    await page.waitForURL(/reset-password/, { timeout: 10000 });
    await settle(page);
  }, async () => ({ ok: !new URL(page.url()).search.includes("email"), note: "on the reset page, no email in the address" }));
  await step("Enter the code and a new password", async () => {
    await page.getByRole("textbox", { name: m("Recovery.code") }).fill("123456");
    await page.getByRole("textbox", { name: m("Recovery.newPassword"), exact: true }).fill(fresh);
    await page.getByRole("textbox", { name: m("Recovery.confirmPassword"), exact: true }).fill(fresh);
    await page.getByRole("button", { name: m("Recovery.resetSubmit") }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await settle(page);
  }, async () => ({ ok: await page.getByRole("status").filter({ hasText: m("Auth.passwordChanged") }).isVisible(), note: m("Auth.passwordChanged") }));
  await step("Sign in with the new password", async () => {
    await page.getByRole("textbox", { name: m("Auth.email") }).fill("aya.hamed@orgtik.test");
    await page.getByRole("textbox", { name: m("Auth.password"), exact: true }).fill(fresh);
    await page.getByRole("button", { name: m("Auth.submit") }).click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 20000 });
  }, async () => ({ ok: new URL(page.url()).pathname === "/", note: "signed in" }));
}, { signedIn: false });

// S6: switch the language from My profile; the app flips at once, then back.
await walk("S6-language", "Change the language from My profile", async ({ page, step }) => {
  const other = LOCALE === "ar" ? "en" : "ar";
  const endonym = { en: "English", ar: "العربية" };
  await step("Open My profile", () => open(page, "/profile"), async () => (await page.getByRole("heading", { level: 1, name: m("Profile.title") }).isVisible()) || "no heading");
  await step(`Choose ${endonym[other]}`, async () => {
    await page.getByRole("combobox", { name: m("Profile.language") }).click();
    await page.getByRole("option", { name: endonym[other] }).click();
    await page.waitForFunction((l) => document.documentElement.lang === l, other, { timeout: 15000 });
  }, async () => ({ ok: (await page.evaluate(() => document.documentElement.dir)) === (other === "ar" ? "rtl" : "ltr"), note: `lang ${other}, dir ${await page.evaluate(() => document.documentElement.dir)}` }));
  await step(`Back to ${endonym[LOCALE] ?? LOCALE}`, async () => {
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: endonym[LOCALE] ?? "English" }).click();
    await page.waitForFunction((l) => document.documentElement.lang === l, LOCALE, { timeout: 15000 });
  }, async () => ({ ok: true, note: `lang ${LOCALE}` }));
});

// S7: view as Aya (read-only, D-017), a change is refused, then a second tab returns to your account.
await walk("S7-view-as", "View as someone and come back", async ({ page, ctx, step }) => {
  await step("View as Aya (confirmed)", async () => {
    await findPerson(page, AYA);
    await personMenu(page, AYA);
    await page.getByRole("menuitem", { name: m("People.loginAs") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("People.loginAs") }).click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 15000 });
    await settle(page);
  }, async () => ({ ok: await page.getByText(m("Nav.actingAs", { name: AYA })).isVisible(), note: m("Nav.actingAs", { name: AYA }) }));
  // D-017: viewing is read-only. A change is refused, and the reason is said in the reader's language.
  await step("Try to change Aya's profile", async () => {
    await open(page, "/profile");
    await page.getByLabel(m("Profile.jobTitle"), { exact: false }).fill(`Changed ${Date.now()}`);
    await page.getByRole("button", { name: m("Profile.saveDetails") }).click();
  }, async () => {
    const said = await page.getByText(m("Feedback.readOnly")).first().waitFor({ timeout: 5000 }).then(() => true, () => false);
    return { ok: said, note: said ? m("Feedback.readOnly") : "no read-only message" };
  });
  let tab;
  await step("Open a second tab and go back to your account there", async () => {
    tab = await ctx.newPage();
    await tab.goto(SOS + "/profile", { waitUntil: "load" });
    await tab.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await tab.getByRole("button", { name: m("Nav.exitActingAs") }).click();
    await tab.waitForTimeout(2000);
  }, async () => {
    const gone = !(await tab.getByText(m("Nav.actingAs", { name: AYA })).isVisible().catch(() => false));
    const greeting = await tab.locator("header").first().innerText().catch(() => "");
    return { ok: gone && greeting.includes("Mona"), note: gone ? "banner gone; signed in as Mona" : "still viewing as Aya" };
  });
});

await browser.close();
await mock.reset();
unlock();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "walks.json"))}`);
