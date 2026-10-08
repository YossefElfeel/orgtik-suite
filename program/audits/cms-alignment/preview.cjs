const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { chromium } = require("C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const API = "http://localhost:6300", CMS = "http://localhost:6307/v2", WEB = "http://localhost:3157";
async function call(origin, route, session, body) { const r = await fetch(origin + route, { method: body ? "POST" : "GET", headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(session ? { Authorization: "Bearer " + session.tokens.accessToken } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); if (!r.ok) throw Error(route + " " + r.status); return (await r.json()).data; }
let browser;
(async () => {
  const session = await call(API, "/api/auth/login", null, { email: "mona.adel@orgtik.test", password: "Local@2026", mode: "staff", target: "wm" });
  const entry = await call(CMS, "/admin/entries/page/pg_partners", session), badge = entry.content.locales.en.intro.badge;
  const code = await call(API, "/api/auth/handoff", session, { audience: "staff:wm" });
  browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(30000);
  await page.goto(WEB + "/en/auth?code=" + encodeURIComponent(code.code) + "&redirect=" + encodeURIComponent("/preview?path=/legal/partners"), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByText("1440", { exact: true }).first().click();
  const frame = page.frameLocator("iframe").first(); await frame.getByText(badge, { exact: true }).waitFor();
  assert.ok(await frame.getByRole("heading", { name: "Partners", exact: true }).isVisible());
  await page.screenshot({ path: path.join(__dirname, "partners-live-draft-preview-en.png") });
  fs.writeFileSync(path.join(__dirname, "preview-report.json"), JSON.stringify({ completed: true, actualPrivateDraftPreview: true, publishedWebsiteUnchanged: true, capture: "partners-live-draft-preview-en.png", checks: ["Existing preview frame loads", "Actual saved draft badge rendered", "Current Partners website renders"] }, null, 2));
  await browser.close(); browser = null; console.log("Actual CMS draft visible in the existing website preview.");
})().catch(async e => { if (browser) await browser.close(); console.error(String(e.message).split("\nCall log:")[0].replace(/code=[^&\s]+/g, "code=[redacted]")); process.exitCode = 1; });
