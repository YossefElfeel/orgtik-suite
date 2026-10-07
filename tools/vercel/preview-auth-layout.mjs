// Hosted milestone gate. Mutating API checks run only on the isolated preview sandbox;
// browser outages are intercepted locally and never change store settings or real accounts.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../..");
const load = createRequire(path.join(root, "program/tools/audit-kit/package.json"));
const { chromium } = load("playwright");
const urls = JSON.parse(process.env.SUITE_WEB_URLS || "{}");
const mock = process.env.MOCK_PUBLIC_URL;
assert.equal(new URL(mock).hostname, "orgtik-suite-mock-preview.vercel.app", "Use the existing isolated preview mock");
for (const key of ["sos", "website"]) assert.match(urls[key] || "", /^https:\/\/orgtik-suite-[\w-]+-preview\.vercel\.app$/);
const out = path.join(root, "program/audits/auth-layout/preview");
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = async (name, fn) => {
  await fn();
  results.push({ name, ok: true });
  console.log(`PASS ${name}`);
};
const api = async (method, endpoint, body, token) => {
  const response = await fetch(mock + endpoint, {
    method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000),
  });
  return { status: response.status, body: await response.json() };
};
const login = (email, password) => api("POST", "/sos/api/auth/login", { email, password });
const seedEmail = "mona.adel@orgtik.test";
const seedPassword = "Local@2026";
const freshEmail = `vercel-milestone-${randomUUID()}@orgtik.test`;
const freshPassword = `Preview-${randomUUID()}!`;
const changedPassword = `Changed-${randomUUID()}!`;
let browser;

try {
  await check("hosted mock uses the preview data sandbox", async () => {
    const status = await api("GET", "/sos/__mock/status");
    assert.equal(status.status, 200);
    assert.equal(status.body.data.journal?.sandbox, "preview");
  });
  const seeded = await login(seedEmail, seedPassword);
  assert.equal(seeded.status, 200);
  const seedId = seeded.body.data.user.id;
  const seedToken = seeded.body.data.tokens.accessToken;
  await check("wrong passwords and missing/reused handoffs are rejected", async () => {
    assert.equal((await login(seedEmail, "WrongPreviewPassword!")).status, 401);
    assert.equal((await api("POST", "/sos/api/auth/handoff/exchange", { code: "expired-or-missing-preview-code" })).status, 400);
    const code = (await api("POST", "/sos/api/auth/handoff", null, seedToken)).body.data.code;
    const first = await api("POST", "/sos/api/auth/handoff/exchange", { code });
    assert.equal(first.status, 200);
    assert.ok(first.body.data.tokens.refreshToken);
    const refreshed = await api("POST", "/sos/api/auth/refresh", { refreshToken: first.body.data.tokens.refreshToken });
    assert.equal(refreshed.status, 200);
    assert.equal((await api("POST", "/sos/api/auth/handoff/exchange", { code })).status, 400);
  });
  await check("registration, password changes and data reset retain the same account and workspace", async () => {
    const created = await api("POST", "/sos/api/auth/register", { name: "Vercel Milestone Fixture", company: "Preview Fixture", email: freshEmail, password: freshPassword });
    assert.equal(created.status, 201);
    const id = created.body.data.user.id;
    const token = created.body.data.tokens.accessToken;
    const workspace = (await api("GET", "/sos/v1/app/me", null, token)).body.data.workspace.id;
    assert.equal((await api("POST", "/sos/api/auth/register", { name: "Duplicate Fixture", email: freshEmail.toUpperCase(), password: freshPassword })).status, 409);
    assert.equal((await api("POST", "/sos/api/auth/change-password", { oldPassword: "WrongPreviewPassword!", newPassword: changedPassword }, token)).status, 400);
    assert.equal((await api("POST", "/sos/api/auth/change-password", { oldPassword: freshPassword, newPassword: changedPassword }, token)).status, 200);
    assert.equal((await login(freshEmail, freshPassword)).status, 401);
    const { mock: controls } = await import(pathToFileURL(path.join(root, "program/tools/audit-kit/lib/mock.mjs")));
    const previous = process.env.MOCK_RESET_TEST_ACCOUNTS;
    process.env.MOCK_RESET_TEST_ACCOUNTS = "0";
    try { await controls.reset(); } finally {
      if (previous === undefined) delete process.env.MOCK_RESET_TEST_ACCOUNTS;
      else process.env.MOCK_RESET_TEST_ACCOUNTS = previous;
    }
    const signedIn = await login(freshEmail, changedPassword);
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.body.data.user.id, id);
    assert.equal((await api("GET", "/sos/v1/app/me", null, signedIn.body.data.tokens.accessToken)).body.data.workspace.id, workspace);
    assert.equal((await api("PATCH", `/sos/api/users/${id}`, { isActive: false }, seedToken)).status, 200);
    assert.equal((await login(freshEmail, changedPassword)).status, 403);
  });

  browser = await chromium.launch();
  const userCookie = async context => {
    const cookie = (await context.cookies(urls.sos)).find(item => item.name === "SOMION_SOS.user");
    assert.ok(cookie, "SOS user cookie remains present");
    return JSON.parse(decodeURIComponent(cookie.value));
  };
  const waitHome = async page => {
    await page.waitForURL(url => url.origin === urls.sos && !url.pathname.startsWith("/auth"), { timeout: 60000 });
    await page.locator("#ot-main").waitFor({ timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 30000 });
  };
  const websiteLogin = async (page, locale = "en") => {
    await page.goto(`${urls.website}${locale === "en" ? "" : `/${locale}`}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.locator('#signin input[name="email"]').fill(seedEmail);
    await page.locator('#signin input[name="password"]').fill(seedPassword);
    await page.locator('#signin button[type="submit"]').click();
    await waitHome(page);
  };
  const directLogin = async page => {
    await page.goto(`${urls.sos}/auth/login`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(seedEmail);
    await page.locator('input[name="password"]').fill(seedPassword);
    await page.locator('button[type="submit"]').click();
    await waitHome(page);
  };

  for (const locale of ["en", "ar"]) for (const viewport of [{ width: 1595, height: 767 }, { width: 390, height: 844 }]) {
    await check(`${locale} ${viewport.width}: website/SOS sign-in, refresh and shell scrolling`, async () => {
      const context = await browser.newContext({ viewport, locale, reducedMotion: "reduce" });
      try {
        await context.addCookies([{ name: "NEXT_LOCALE", value: locale, url: urls.sos }]);
        const page = await context.newPage();
        if (viewport.width > 1000) await websiteLogin(page, locale);
        else await directLogin(page);
        assert.equal((await userCookie(context)).id, seedId);
        const tokenCookie = (await context.cookies(urls.sos)).find(item => item.name === "SOMION_SOS.token");
        assert.ok(JSON.parse(decodeURIComponent(tokenCookie.value)).refreshToken);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitHome(page);
        assert.equal((await userCookie(context)).id, seedId);
        const checkPosition = async () => {
          const facts = await page.evaluate(() => {
            const main = document.querySelector("#ot-main");
            const shell = main.parentElement.parentElement;
            return { top: shell.getBoundingClientRect().top, height: shell.getBoundingClientRect().height, viewport: innerHeight,
              scroll: document.scrollingElement.scrollTop, docHeight: document.scrollingElement.scrollHeight,
              docWidth: document.scrollingElement.scrollWidth, width: innerWidth, direction: document.documentElement.dir };
          });
          assert.ok(Math.abs(facts.top) <= 1, "Shell stays at viewport top");
          assert.ok(Math.abs(facts.height - facts.viewport) <= 1, "Shell fills viewport");
          assert.equal(facts.scroll, 0, "The outer page cannot scroll above the shell");
          assert.ok(facts.docHeight <= facts.viewport + 1, "No blank area below the viewport");
          assert.ok(facts.docWidth <= facts.width + 1, "No horizontal page overflow");
          assert.equal(facts.direction, locale === "ar" ? "rtl" : "ltr");
        };
        await page.locator("#ot-main").focus();
        await page.keyboard.press("Control+End");
        await page.mouse.wheel(0, 3000);
        await page.waitForTimeout(150);
        await checkPosition();
        if (viewport.width < 1000) {
          await page.locator("header button.lg\\:hidden").click();
          const nav = page.getByRole("dialog");
          await nav.waitFor();
          await nav.locator("nav").last().evaluate(element => element.scrollTop = element.scrollHeight);
          const reachable = await nav.locator("nav").last().evaluate(element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1);
          assert.ok(reachable, "Mobile navigation reaches its final item");
          await page.keyboard.press("Escape");
        } else {
          for (const nav of await page.locator("nav").all()) {
            await nav.evaluate(element => element.scrollTop = element.scrollHeight);
            assert.ok(await nav.evaluate(element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1), "Navigation scrolls independently");
          }
        }
        await checkPosition();
        await page.screenshot({ path: path.join(out, `${locale}-${viewport.width}.png`) });
      } finally { await context.close(); }
    });
  }

  await check("temporary handoff/profile and website errors preserve the valid session", async () => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      await websiteLogin(page);
      const code = (await api("POST", "/sos/api/auth/handoff", null, seedToken)).body.data.code;
      let profileFailed = false;
      let exchanges = 0;
      page.on("request", request => { if (request.url() === `${mock}/sos/api/auth/handoff/exchange`) exchanges++; });
      await context.route(`${mock}/sos/api/auth/me`, route => {
        if (!profileFailed) { profileFailed = true; return route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Preview outage fixture"}' }); }
        return route.continue();
      });
      await page.goto(`${urls.sos}/auth/handoff?code=${encodeURIComponent(code)}`);
      await page.getByRole("button", { name: /try again/i }).click();
      assert.equal((await userCookie(context)).id, seedId);
      await waitHome(page);
      assert.equal(exchanges, 1, "Retry reuses the exchanged session");
      await context.unroute(`${mock}/sos/api/auth/me`);
      await context.route(`${mock}/sos/api/auth/me`, route => route.fulfill({ status: 401, contentType: "application/json", body: '{"message":"Preview expired access fixture"}' }));
      await context.route(`${mock}/sos/api/auth/refresh`, route => route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Preview outage fixture"}' }));
      const failedRefresh = page.waitForResponse(response => response.url() === `${mock}/sos/api/auth/refresh` && response.status() === 503);
      await page.goto(`${urls.sos}/profile`);
      await failedRefresh;
      assert.equal((await userCookie(context)).id, seedId, "A refresh outage keeps the valid account");
      assert.ok((await context.cookies(urls.sos)).find(item => item.name === "SOMION_SOS.token"), "A refresh outage keeps the session tokens");
      await context.unroute(`${mock}/sos/api/auth/me`);
      await context.unroute(`${mock}/sos/api/auth/refresh`);
      await context.route(`${mock}/sos/api/auth/me`, route => route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Preview outage fixture"}' }));
      const failedWebsiteProfile = page.waitForResponse(response => response.url() === `${mock}/sos/api/auth/me` && response.status() === 503);
      await page.goto(`${urls.website}/sign-in`);
      await failedWebsiteProfile;
      const saved = await page.evaluate(() => Boolean(JSON.parse(localStorage.getItem("orgtik.suite-session.v1") || "null")?.token));
      assert.ok(saved, "The website keeps its existing session on a temporary store failure");
    } finally { await context.close(); }
  });
} catch (error) {
  results.push({ name: "Milestone failure", ok: false, note: String(error.message).replace(/([?&](?:code|token)=)[^&\s]+/g, "$1[redacted]") });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify(results, null, 2) + "\n");
  if (results.some(result => !result.ok)) console.error(results.at(-1).note);
}
