const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const { chromium } = require("C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const API = "http://localhost:6300", CMS = "http://localhost:6307/v2", WEB = "http://localhost:3157";
const report = { realm: "cms-alignment-local", dataReset: false, clockMutation: false, websiteMutation: false, checks: [], captures: [], source: {} };
for (const file of ["apps/wm/lib/cmsLabels.ts", "apps/wm/lib/contentTypes.ts", "apps/wm/components/content/PricingAuthority.tsx", "apps/wm/components/content/EntryEditor.tsx", "apps/wm/components/content/EntryList.tsx", ...["en", "ar", "de", "fr", "it"].map(l => `apps/wm/messages/${l}.json`)]) report.source[file] = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const check = (name, passed) => { assert.ok(passed, name); report.checks.push({ name, passed: true }); };
const safe = e => String(e.message || e).split("\nCall log:")[0].replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, "[redacted]").replace(/code=[^&\s]+/g, "code=[redacted]");
async function request(origin, route, session, body) {
  const response = await fetch(origin + route, { method: body ? "POST" : "GET", headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(session ? { Authorization: "Bearer " + session.tokens.accessToken } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const value = await response.json(); if (!response.ok || value.success === false) throw Error(route + " " + response.status);
  return value.data;
}
let browser, page;
(async () => {
  const initial = await request(API, "/__mock/status"); check("Isolated frozen demo", initial.journal.sandbox === report.realm && initial.clock.mode === "frozen"); report.initialClock = { mode: initial.clock.mode, now: initial.clock.now };
  const session = await request(API, "/api/auth/login", null, { email: "mona.adel@orgtik.test", password: "Local@2026", mode: "staff", target: "wm" });
  const liveBefore = await request(CMS, "/public/entries/page");
  browser = await chromium.launch({ headless: true });
  for (const variant of [{ locale: "en", width: 1440, theme: "light" }, { locale: "ar", width: 390, theme: "dark" }]) {
    const { locale, width, theme } = variant, messages = JSON.parse(fs.readFileSync(`apps/wm/messages/${locale}.json`));
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    await context.addCookies([{ name: "ot-theme", value: theme, url: WEB }]); page = await context.newPage(); page.setDefaultTimeout(30000);
    const code = await request(API, "/api/auth/handoff", session, { audience: "staff:wm" });
    await page.goto(WEB + "/" + locale + "/auth?code=" + encodeURIComponent(code.code) + "&redirect=" + encodeURIComponent("/content/pages/pg_partners"), { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.getByRole("heading", { name: messages.EntryNames.pg_partners, exact: true }).waitFor({ timeout: 90000 });
    const shot = async name => { await page.screenshot({ path: path.join(__dirname, name + ".png") }); report.captures.push(name + ".png"); check(name + " fits viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); check(name + " catalog complete", !/MISSING_MESSAGE|Fields\.(partners|partner)|EntryNames\.pg_/.test(await page.locator("body").innerText())); };
    check(locale + " introduction localized", await page.getByRole("tab", { name: messages.Fields.partnersIntro, exact: true }).isVisible());
    check(locale + " profile tab localized", await page.getByRole("tab", { name: messages.Fields.partnerProfiles, exact: true }).isVisible());
    check(locale + " controls localized", await page.getByText(messages.Fields.scrollLabel, { exact: true }).isVisible());
    await shot("partners-intro-" + locale + "-" + width + "-" + theme);
    if (locale === "en") {
      const field = page.getByRole("textbox", { name: messages.Fields.badge, exact: true });
      const badge = await field.inputValue() === "Prototype partner collection" ? "Example partner collection" : "Prototype partner collection";
      await field.fill(badge);
      await page.getByRole("button", { name: messages.Editor.save, exact: true }).first().click();
      await page.getByRole("button", { name: messages.Editor.submit, exact: true }).first().waitFor();
      const saved = await request(CMS, "/admin/entries/page/pg_partners", session);
      check("Actual draft saved", saved.content.locales.en.intro.badge === badge && saved.hasDraft);
      await shot("partners-saved-draft-en");
    }
    await page.getByRole("tab", { name: messages.Fields.partnerProfiles, exact: true }).click();
    check(locale + " profile fields localized", await page.getByText(messages.Fields.partnerWebsite, { exact: true }).first().isVisible());
    check(locale + " raw profile labels absent", !/Anchor ID|Profile URL|Show partner/.test(locale === "ar" ? await page.locator("body").innerText() : ""));
    await shot("partners-profiles-" + locale + "-" + width + "-" + theme);
    await page.goto(WEB + "/" + locale + "/content/pages");
    await page.getByRole("link", { name: messages.EntryNames.pg_checkout, exact: true }).waitFor();
    for (const id of ["pg_plans", "pg_cart", "pg_checkout", "pg_partners"]) check(locale + " page name " + id, await page.getByRole("link", { name: messages.EntryNames[id], exact: true }).isVisible());
    await shot("pages-" + locale + "-" + width + "-" + theme);
    await page.goto(WEB + "/" + locale + "/content/software");
    await page.getByText(messages.Editor.platformPricingTitle, { exact: true }).waitFor();
    await page.locator('a[href*="/content/software/"]').first().waitFor();
    await page.getByText(messages.Editor.platformPricingSource, { exact: true }).first().waitFor();
    check(locale + " actual software rows loaded", await page.getByText(messages.Editor.platformPricingSource, { exact: true }).count() > 0);
    check(locale + " old module prices hidden", !/49\.00|CHF\s*49|CHF\s*19/.test(await page.locator("body").innerText()));
    await shot("software-" + locale + "-" + width + "-" + theme);
    await page.goto(WEB + "/" + locale + "/content/pricing/pr_software");
    await page.getByText(messages.Editor.platformPricingTitle, { exact: true }).waitFor();
    check(locale + " historical reference labeled", await page.getByText(messages.Editor.historicalPricingBody, { exact: true }).first().isVisible());
    await shot("pricing-reference-" + locale + "-" + width + "-" + theme);
    await page.goto(WEB + "/" + locale + "/content/strings/st_platformPricing");
    await page.getByRole("heading", { name: messages.EntryNames.st_platformPricing, exact: true }).waitFor();
    check(locale + " offer messages localized", await page.getByRole("tab", { name: messages.Fields.offerPaymentStates, exact: true }).isVisible());
    await shot("offer-messages-" + locale + "-" + width + "-" + theme);
    await context.close();
  }
  check("Draft did not change published website", JSON.stringify(await request(CMS, "/public/entries/page")) === JSON.stringify(liveBefore));
  const finalClock = (await request(API, "/__mock/status")).clock; report.finalClock = { mode: finalClock.mode, now: finalClock.now }; check("Clock unchanged", JSON.stringify(report.initialClock) === JSON.stringify(report.finalClock));
  for (const [file, hash] of Object.entries(report.source)) check("Frozen source " + file, crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") === hash);
  report.completed = true; report.passed = report.checks.length; fs.writeFileSync(path.join(__dirname, "report.json"), JSON.stringify(report, null, 2)); await browser.close(); browser = null;
  console.log(JSON.stringify({ passed: report.passed, captures: report.captures.length, sourceHashes: Object.keys(report.source).length }));
})().catch(async error => { report.completed = false; report.error = safe(error); if (page && !page.isClosed()) await page.screenshot({ path: path.join(__dirname, "failure.png") }).catch(() => {}); fs.writeFileSync(path.join(__dirname, "report.json"), JSON.stringify(report, null, 2)); if (browser) await browser.close(); console.error(report.error); process.exitCode = 1; });
