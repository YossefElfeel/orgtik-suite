// Local mutations use only a disposable review. Hosted mode blocks content writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(
  new URL("../../../apps/docs/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const live = process.argv.includes("--live");
const web =
  process.env.WM_AUDIT_WEB ??
  (live ? "https://orgtik-suite-wm.vercel.app" : "http://localhost:3107");
const api = live
  ? "https://orgtik-suite-mock.vercel.app/wm/v2"
  : "http://localhost:5007/v2";
const sos = live
  ? "https://orgtik-suite-mock.vercel.app/sos/api"
  : "http://localhost:5000/api";
if (!live && !["localhost", "127.0.0.1"].includes(new URL(web).hostname))
  throw new Error("Local checks require localhost");
const out = path.join(
  fileURLToPath(new URL("../../../program/audits/wm", import.meta.url)),
  "reviews-actions",
  live ? "live" : "local",
);
fs.mkdirSync(out, { recursive: true });
const results = [];
const response = await fetch(sos + "/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    email: "mona.adel@orgtik.test",
    password: "Local@2026",
    mode: "staff",
    target: "wm",
  }),
});
assert.equal(response.status, 200);
const envelope = (await response.json()).data;
const token = envelope.tokens.accessToken;
async function call(url, method = "GET", body, version) {
  if (live && method !== "GET")
    throw new Error("Hosted content writes are forbidden");
  const response = await fetch(api + url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(version != null ? { "if-match": String(version) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(response.ok, `${method} ${url}: ${response.status}`);
  return response.status === 204 ? null : (await response.json()).data;
}
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await context.addInitScript(
  (session) =>
    sessionStorage.setItem("orgtik.tab-session.v1", JSON.stringify(session)),
  envelope,
);
if (live)
  await context.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort(),
  );
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && message.text().includes("MISSING_MESSAGE"))
    errors.push(message.text());
});
async function go(route, locale = "en") {
  await page.goto(web + "/" + locale + route, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.locator("h1").first().waitFor();
  assert.ok(
    new URL(page.url()).origin === web,
    "Expected Website Manager, not a protection screen",
  );
}
async function check(name, work) {
  try {
    await work();
    results.push({ name, ok: true });
    console.log("PASS " + name);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log("FAIL " + name + ": " + error.message.split("\n")[0]);
  }
}
await check(
  "labeled Actions controls expose usable menus across all dashboard tables",
  async () => {
    for (const route of [
      "/content/pages",
      "/content/reviews",
      "/content/queue",
      "/localization",
      "/marketing/leads",
      "/marketing/ideas",
      "/seo/redirects",
      "/settings/users",
    ]) {
      await go(route);
      const action = page.getByRole("button", { name: /^Actions:/ }).first();
      await action.waitFor();
      assert.equal((await action.innerText()).trim(), "Actions");
      const bounds = await action.boundingBox();
      assert.ok(
        bounds.width >= 100 && bounds.height >= 30,
        `${route}: Actions target is too small`,
      );
      const before = page.url();
      await action.focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("menuitem", { name: "View", exact: true })
        .first()
        .waitFor();
      assert.equal(
        page.url(),
        before,
        "Menu opening must not navigate the row",
      );
      if (route === "/content/pages")
        await page.screenshot({
          path: path.join(out, "actions-menu-desktop.png"),
        });
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        (node) => node === document.activeElement,
        await action.elementHandle(),
        { timeout: 3000 },
      );
    }
  },
);
await check(
  "Reviews list exposes author context, quote, order and publication visibility",
  async () => {
    await go("/content/reviews");
    await page
      .getByRole("columnheader", { name: "Order", exact: true })
      .waitFor();
    assert.ok(
      await page
        .getByRole("columnheader", { name: "Author", exact: true })
        .isVisible(),
    );
    assert.ok((await page.locator("tbody p").count()) > 0);
    assert.ok((await page.locator("tbody tr").count()) <= 10);
    await page.screenshot({ path: path.join(out, "reviews-list.png") });
  },
);
const review = (await call("/admin/entries/review?pageSize=100"))[0];
await check(
  "Review editor and image description retain usable widths at desktop, tablet and mobile",
  async () => {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 900, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await go(`/content/reviews/${review.id}`);
      const description = page.getByRole("textbox", {
        name: "Image description",
        exact: true,
      });
      const bounds = await description.boundingBox();
      assert.ok(
        bounds.width >= 240,
        `Image description is squeezed at ${viewport.width}px: ${bounds.width}`,
      );
      assert.ok(
        await page
          .getByRole("complementary", { name: "Review preview", exact: true })
          .isVisible(),
      );
      const photo = page.getByRole("region", {
        name: "Author photo",
        exact: true,
      });
      assert.ok(
        await photo
          .getByRole("button", { name: "Upload image", exact: true })
          .isVisible(),
      );
      assert.equal(
        await photo
          .getByRole("button", { name: "Upload image or video", exact: true })
          .count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await description.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, `review-editor-${viewport.width}.png`),
      });
    }
  },
);
await check(
  "Arabic and dark Review controls keep shared settings protected and fit mobile",
  async () => {
    await context.addCookies([{ name: "ot-theme", value: "dark", url: web }]);
    await page.setViewportSize({ width: 390, height: 844 });
    await go(`/content/reviews/${review.id}?lang=ar`, "ar");
    const start = page.getByRole("button", {
      name: "ابدأ من الإنجليزية",
      exact: true,
    });
    if (await start.isVisible()) await start.click();
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    assert.ok(
      await page
        .getByRole("switch", { name: "تقييم تجريبي", exact: true })
        .isDisabled(),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    const description = page.getByRole("textbox", {
      name: "وصف الصورة",
      exact: true,
    });
    assert.ok((await description.boundingBox()).width >= 240);
    await description.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(out, "review-editor-ar-dark.png"),
    });
    const discard = page
      .locator("div.fixed.inset-x-0.bottom-0")
      .getByRole("button")
      .first();
    if (await discard.isVisible()) await discard.click();
    await context.addCookies([{ name: "ot-theme", value: "light", url: web }]);
  },
);
if (!live)
  await check(
    "Review preview responds to edits and saved fields/media survive reload",
    async () => {
      const record = await call("/admin/entries/review", "POST", {
        name: "Disposable review UI audit",
        from: review.id,
      });
      try {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await go(`/content/reviews/${record.id}`);
        await page
          .getByRole("textbox", { name: "Quote", exact: true })
          .fill("An editable quote for the review preview.");
        await page
          .getByRole("textbox", { name: "Author", exact: true })
          .fill("Review Preview Author");
        const photo = page.getByRole("region", {
          name: "Author photo",
          exact: true,
        });
        const choose = photo.getByRole("button", {
          name: /^(Select media|Replace media)$/,
        });
        if ((await choose.getAttribute("aria-expanded")) === "false")
          await choose.click();
        await photo.getByRole("button", { name: /brand-cards\.webp/ }).click();
        await page
          .getByRole("textbox", { name: "Image description", exact: true })
          .fill("Portrait of the review author");
        const preview = page.getByRole("complementary", {
          name: "Review preview",
          exact: true,
        });
        assert.ok(
          await preview
            .getByText("An editable quote for the review preview.", {
              exact: true,
            })
            .isVisible(),
        );
        assert.ok(
          await preview
            .getByText("Review Preview Author", { exact: true })
            .isVisible(),
        );
        await page
          .getByRole("button", { name: "Save draft", exact: true })
          .first()
          .click();
        await page.getByText("Draft saved", { exact: false }).waitFor();
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(
          await page
            .getByRole("textbox", { name: "Quote", exact: true })
            .inputValue(),
          "An editable quote for the review preview.",
        );
        assert.equal(
          await page
            .getByRole("textbox", { name: "Image description", exact: true })
            .inputValue(),
          "Portrait of the review author",
        );
        assert.ok(
          await page
            .getByRole("complementary", { name: "Review preview", exact: true })
            .locator('img[src$="brand-cards.webp"]')
            .isVisible(),
        );
      } finally {
        await call(`/admin/entries/review/${record.id}`, "DELETE");
      }
    },
  );
await check(
  "Reviews View mode offers readable fields without edit or publishing controls",
  async () => {
    await go(`/content/reviews/${review.id}?view=1`);
    assert.ok(
      (await page
        .getByRole("textbox", { name: "Quote", exact: true })
        .getAttribute("readonly")) !== null,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Upload image", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
  },
);
await context.close();
await browser.close();
const report = {
  at: new Date().toISOString(),
  web,
  live,
  passed: results.filter((row) => row.ok).length,
  total: results.length,
  results,
};
fs.writeFileSync(
  path.join(out, "checks.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`${report.passed}/${report.total} passed`);
if (report.passed !== report.total) process.exitCode = 1;
