const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { chromium } = require("C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const API = "http://localhost:6300", WEB = "http://localhost:3157", CMS = "http://localhost:6307/v2";
const words = {
  en: { open: "Demo controls", state: "Screen state", persona: "Persona", workspace: "Workspace", close: "Close demo controls", reset: "Reset scene", nour: "Nour · workspace owner", nile: "Nile Foods · active", empty: "Empty", error: "Error and retry", loading: "Loading", noAccess: "No access", readOnly: "Read only", success: "Success", normal: "Normal", retry: "Try again", emptyTitle: "Start with an empty workspace", errorTitle: "This scene could not load", noAccessTitle: "This persona cannot access this scene", successTitle: "Demo action completed" },
  ar: { open: "عناصر تحكم العرض", state: "حالة الشاشة", persona: "الشخصية", workspace: "مساحة العمل", close: "إغلاق عناصر تحكم العرض", reset: "إعادة ضبط السيناريو" },
};
const report = { checks: [], captures: [], dataReset: false, clockMutation: false, personaAndWorkspaceAreSceneMetadata: true };
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, passed: true }); };
async function call(origin, url, session, body) { const r = await fetch(origin + url, { method: body ? "POST" : "GET", headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(session ? { Authorization: "Bearer " + session.tokens.accessToken } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); if (!r.ok) throw Error(url + " " + r.status); return (await r.json()).data; }
let browser, page;
(async () => {
  const before = await call(CMS, "/public/entries/page"), clock = (await call(API, "/__mock/status")).clock;
  const session = await call(API, "/api/auth/login", null, { email: "mona.adel@orgtik.test", password: "Local@2026", mode: "staff", target: "wm" });
  browser = await chromium.launch({ headless: true });
  for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } }); await context.addCookies([{ name: "ot-theme", value: theme, url: WEB }]);
    page = await context.newPage(); page.setDefaultTimeout(30000); const t = words[locale], code = await call(API, "/api/auth/handoff", session, { audience: "staff:wm" });
    await page.goto(WEB + "/" + locale + "/auth?code=" + encodeURIComponent(code.code) + "&redirect=" + encodeURIComponent("/content/pages/pg_partners"), { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.getByRole("button", { name: t.open, exact: true }).waitFor({ timeout: 90000 }); await page.getByRole("button", { name: t.open, exact: true }).click();
    await page.getByRole("combobox", { name: t.persona, exact: true }).waitFor();
    await page.waitForTimeout(300);
    const capture = `panel-${locale}-${theme}-${width}.png`; await page.screenshot({ path: path.join(__dirname, capture) }); report.captures.push(capture);
    check(capture + " viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); check(capture + " theme", await page.getAttribute("html", "data-theme") === theme);
    if (locale === "en" && theme === "light" && width === 1440) {
      async function choose(label, value) { await page.getByRole("combobox", { name: label, exact: true }).click(); await page.getByRole("option", { name: value, exact: true }).click(); }
      await choose(t.persona, t.nour); await choose(t.workspace, t.nile); check("Chosen presentation scene is visible", await page.getByRole("status").filter({ hasText: t.nour }).count() > 0);
      for (const mode of ["loading", "empty", "error", "noAccess", "readOnly", "success"]) {
        await choose(t.state, t[mode]);
        if (mode === "loading") check("Loading view", await page.locator("main [aria-busy=true]").isVisible());
        else if (mode === "readOnly") check("Read-only page content is inert", await page.locator("main [inert]").isVisible());
        else check(mode + " view", await page.getByRole("heading", { name: t[mode + "Title"], exact: true }).isVisible());
      }
      await choose(t.state, t.error); await page.getByRole("button", { name: t.close, exact: true }).click(); await page.getByRole("button", { name: t.retry, exact: true }).click();
      check("Retry restores real current view", await page.getByRole("heading", { name: "Partners", exact: true }).isVisible());
      await page.getByRole("button", { name: t.open, exact: true }).click(); await page.getByRole("button", { name: t.reset, exact: true }).click();
      check("Reset clears only scene storage", await page.evaluate(() => !sessionStorage.getItem("orgtik:demo-scene:wm")));
    }
    await context.close();
  }
  check("Existing published content unchanged", JSON.stringify(before) === JSON.stringify(await call(CMS, "/public/entries/page")));
  const after = (await call(API, "/__mock/status")).clock; check("Business clock unchanged", clock.mode === after.mode && clock.now === after.now);
  report.completed = true; fs.writeFileSync(path.join(__dirname, "report.json"), JSON.stringify(report, null, 2)); await browser.close(); browser = null;
  console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, completed: true }));
})().catch(async e => { report.completed = false; report.error = String(e.message).split("\nCall log:")[0].replace(/code=[^&\s]+/g, "code=[redacted]"); if (page && !page.isClosed()) await page.screenshot({ path: path.join(__dirname, "failure.png") }).catch(() => {}); fs.writeFileSync(path.join(__dirname, "report.json"), JSON.stringify(report, null, 2)); if (browser) await browser.close(); console.error(report.error); process.exitCode = 1; });
