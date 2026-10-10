// Read-only hosted audit. Local mode additionally exercises a disposable article draft.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../../apps/docs/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const live = process.argv.includes("--live");
const interactions = process.argv.includes("--interactions");
const web =
  process.env.WM_AUDIT_WEB ??
  (live ? "https://orgtik-suite-wm.vercel.app" : "http://localhost:3107");
const api =
  process.env.WM_AUDIT_API ??
  (live
    ? "https://orgtik-suite-mock.vercel.app/wm/v2"
    : "http://localhost:5007/v2");
const sos =
  process.env.WM_AUDIT_SOS ??
  (live
    ? "https://orgtik-suite-mock.vercel.app/sos/api"
    : "http://localhost:5000/api");
const site =
  process.env.WM_AUDIT_SITE ??
  (live ? "https://orgtik-suite-website.vercel.app" : "http://localhost:4273");
if (
  !live &&
  [web, api, sos].some(
    (value) => !["localhost", "127.0.0.1"].includes(new URL(value).hostname),
  )
)
  throw new Error("Mutating checks require isolated localhost services.");
const out =
  process.env.WM_AUDIT_OUT ??
  path.resolve("program/audits/wm/comment-audit", live ? "live" : "local");
fs.mkdirSync(out, { recursive: true });
const results = [],
  lists = {};
async function check(name, fn) {
  if (
    interactions &&
    !/^(View mode|article builder|Overview chart|Arabic)/.test(name)
  )
    return;
  try {
    const evidence = await fn();
    results.push({ name, ok: true, evidence });
    console.log("PASS " + name);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log("FAIL " + name + ": " + error.message.split("\n")[0]);
  }
}
const login = await fetch(sos + "/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    email: "mona.adel@orgtik.test",
    password: "Local@2026",
    mode: "staff",
    target: "wm",
  }),
});
assert.equal(login.status, 200);
const envelope = (await login.json()).data;
const token = envelope.tokens.accessToken;
async function call(route, method = "GET", body, version) {
  if (live && method !== "GET")
    throw new Error("Hosted content writes are forbidden in this audit.");
  const response = await fetch(api + route, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(version != null ? { "if-match": String(version) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(response.ok, `${method} ${route}: ${response.status}`);
  return response.status === 204 ? null : response.json();
}
for (const type of [
  "page",
  "global",
  "strings",
  "serviceFamily",
  "service",
  "softwareModule",
  "caseStudy",
  "article",
  "roadmapItem",
  "review",
])
  await check(`${type}: workflow examples and ten-row API pages`, async () => {
    const all = await call(`/admin/entries/${type}?pageSize=100`);
    lists[type] = all.data;
    const states = [...new Set(all.data.map((item) => item.state))];
    for (const state of [
      "draft",
      "in_review",
      "approved",
      "scheduled",
      "published",
    ])
      assert.ok(states.includes(state), `${type} missing ${state}`);
    const filtered = await call(
      `/admin/entries/${type}?pageSize=10&state=in_review`,
    );
    assert.ok(filtered.data.every((item) => item.state === "in_review"));
    assert.ok(filtered.data.length <= 10);
    return { states, total: all.meta.total };
  });
await check(
  "lead New and Opened sets are disjoint and all statuses have data",
  async () => {
    const fresh = (await call("/admin/leads?status=new&pageSize=100")).data;
    const opened = (await call("/admin/leads?status=open&pageSize=100")).data;
    assert.ok(fresh.length && opened.length);
    assert.ok(fresh.every((item) => item.status === "new"));
    assert.ok(
      opened.every((item) =>
        ["contacted", "qualified", "quoted"].includes(item.status),
      ),
    );
    assert.ok(
      !fresh.some((item) => opened.some((other) => item.id === other.id)),
    );
    const all = (await call("/admin/leads?pageSize=100")).data;
    lists.leads = all;
    return [...new Set(all.map((item) => item.status))];
  },
);
for (const [key, route] of Object.entries({
  ideas: "/admin/ideas",
  media: "/admin/media",
  redirects: "/admin/seo/redirects",
  indexing: "/admin/seo/indexing",
  health: "/admin/seo/health",
  users: "/admin/users",
  audit: "/admin/audit",
}))
  await check(`${key}: data and pagination`, async () => {
    const response = await call(route + "?pageSize=10");
    lists[key] = response.data;
    if (Array.isArray(response.data)) assert.ok(response.data.length <= 10);
    return {
      total: response.meta?.total,
      count: Array.isArray(response.data) ? response.data.length : undefined,
    };
  });
await check("media previews resolve real website/library assets", async () => {
  const media = (await call("/admin/media?pageSize=100")).data;
  const assets = await Promise.all(
    media.map(async (item) => {
      const url = item.url
        ? api.replace(/\/v2$/, "") + item.url
        : site + "/assets/" + item.file;
      const response = await fetch(url, { method: "HEAD" });
      return { file: item.file, status: response.status };
    }),
  );
  assert.ok(
    assets.every((item) => item.status === 200),
    JSON.stringify(assets.filter((item) => item.status !== 200)),
  );
  return assets.length;
});

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await context.addInitScript((session) => {
  sessionStorage.setItem("orgtik.tab-session.v1", JSON.stringify(session));
}, envelope);
if (live)
  await context.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort(),
  );
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const go = async (route) => {
  await page.goto(web + "/en" + route, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.locator("h1").first().waitFor();
  assert.ok(!page.url().includes("signed-out"));
};
const routes = [
  "",
  "/content/pages",
  "/content/global",
  "/content/strings",
  "/content/services",
  "/content/services?type=service",
  "/content/software",
  "/content/work",
  "/content/insights",
  "/content/reviews",
  "/content/roadmap",
  "/localization",
  "/preview",
  "/media",
  "/seo",
  "/seo/redirects",
  "/seo/indexing",
  "/marketing/leads",
  "/marketing/ideas",
  "/settings/site",
  "/settings/users",
  "/settings/roles",
  "/settings/audit",
  "/content/pages/pg_home?view=1",
  "/content/pages/pg_plans",
  "/content/pages/pg_cart",
  "/content/pages/pg_checkout",
  "/content/pages/pg_signUp",
  "/content/insights/ar_02?section=body",
  "/content/services/sf_01",
  "/seo/content/pg_home",
  ...(lists.leads?.[0] ? [`/marketing/leads/${lists.leads[0].id}`] : []),
  ...(lists.ideas?.[0] ? [`/marketing/ideas/${lists.ideas[0].id}`] : []),
];
for (const route of routes)
  await check("screen " + (route || "Overview"), async () => {
    const start = errors.length;
    await go(route);
    const text = await page.locator("main").innerText();
    assert.ok(
      !/This (page|entry) (does not|doesn’t) exist|Something went wrong/.test(
        text,
      ),
    );
    assert.deepEqual(errors.slice(start), []);
    const tables = await page.locator("table:visible").count();
    for (let n = 0; n < tables; n++)
      assert.ok(
        (await page
          .locator("table:visible")
          .nth(n)
          .locator("tbody tr")
          .count()) <= 10,
        "More than ten visible table rows",
      );
    if (
      [
        "",
        "/content/pages/pg_home?view=1",
        "/content/insights/ar_02?section=body",
      ].includes(route)
    )
      await page.screenshot({
        path: path.join(
          out,
          (route
            ? route.includes("insights")
              ? "article"
              : "view-mode"
            : "overview") + ".png",
        ),
        fullPage: true,
      });
    return { heading: await page.locator("h1").first().innerText(), tables };
  });
if (!live) {
  await check(
    "View mode exposes Edit, retains list state, and explains empty media",
    async () => {
      await go(
        "/content/pages/pg_home?view=1&returnTo=%2Fcontent%2Fpages%3Fstate%3Din_review&section=software",
      );
      assert.ok(
        await page
          .getByText("You are viewing this record.", { exact: false })
          .isVisible(),
      );
      assert.ok(
        await page
          .getByText("No media attached to this section.")
          .first()
          .isVisible(),
      );
      await page
        .getByRole("button", { name: "Edit", exact: true })
        .first()
        .click();
      await page.waitForURL((url) => !url.searchParams.has("view"));
      assert.equal(
        new URL(page.url()).searchParams.get("returnTo"),
        "/content/pages?state=in_review",
      );
      assert.ok(
        await page
          .getByRole("button", { name: "Select media", exact: true })
          .first()
          .isVisible(),
      );
      await page
        .getByRole("button", { name: /brand-cards\.webp/ })
        .first()
        .waitFor();
      await page
        .getByRole("button", { name: /brand-cards\.webp/ })
        .first()
        .locator("..")
        .locator("..")
        .screenshot({ path: path.join(out, "visual-media-picker.png") });
    },
  );
  await check(
    "article builder inserts media between paragraphs and persists saved order on refresh",
    async () => {
      const record = (
        await call("/admin/entries/article", "POST", {
          name: "Disposable article audit",
          slug: "disposable-article-audit-" + Date.now(),
          from: "ar_02",
        })
      ).data;
      try {
        await go(`/content/insights/${record.id}?section=body`);
        // Insert immediately after the first text block; choose using its thumbnail and filename.
        await page
          .getByRole("button", { name: "Add image", exact: true })
          .nth(1)
          .click();
        await page
          .getByRole("group", { name: "Image 2", exact: true })
          .getByRole("button", { name: /brand-cards\.webp/ })
          .click();
        await page
          .getByRole("textbox", { name: "Caption", exact: true })
          .first()
          .fill("Inserted between paragraphs");
        await page
          .getByRole("button", { name: "Add section", exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Heading", exact: true })
          .last()
          .fill("A new section");
        await page
          .getByRole("textbox", { name: "Text", exact: true })
          .last()
          .fill("A new paragraph");
        await page
          .getByRole("button", { name: /^Move up: Section/ })
          .last()
          .click();
        await page
          .getByRole("button", { name: "Save draft", exact: true })
          .first()
          .click();
        await page
          .getByText("Draft saved", { exact: false })
          .waitFor()
          .catch(() => {});
        const saved = (await call(`/admin/entries/article/${record.id}`)).data;
        const body = saved.content.locales.en.sections;
        assert.ok(body.some((item) => item.heading === "A new section"));
        const mediaSection = body.find((item) =>
          item.blocks?.some(
            (block) => block.caption === "Inserted between paragraphs",
          ),
        );
        assert.equal(mediaSection.blocks[1].kind, "image");
        assert.equal(mediaSection.blocks[1].src, "brand-cards.webp");
        assert.equal(mediaSection.blocks[0].kind, "text");
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("group", { name: "Image 2", exact: true })
          .locator('img[src$="brand-cards.webp"]')
          .waitFor();
        assert.equal(
          await page
            .getByRole("textbox", { name: "Caption", exact: true })
            .first()
            .inputValue(),
          "Inserted between paragraphs",
        );
        await page.screenshot({
          path: path.join(out, "article-builder.png"),
          fullPage: true,
        });
      } finally {
        await call(`/admin/entries/article/${record.id}`, "DELETE");
      }
    },
  );
}
await check(
  "Overview chart refinements retain counts and table alternatives",
  async () => {
    await go("");
    for (const [name, file] of [
      ["Visits", "visits-chart"],
      ["Most visited pages", "pages-chart"],
      ["Services people ask about", "services-chart"],
      ["Article views by topic", "topics-chart"],
    ]) {
      const card = page
        .getByRole("heading", { name, exact: true })
        .locator("..")
        .locator("..");
      await card.screenshot({ path: path.join(out, file + ".png") });
      await card.locator("summary").click();
      assert.ok(await card.getByRole("table").isVisible());
      await card.locator("summary").click();
    }
    assert.ok(
      await page
        .getByText("Software System", { exact: true })
        .first()
        .isVisible(),
    );
  },
);
await check(
  "Arabic and dark Overview layouts fit a narrow viewport",
  async () => {
    await context.addCookies([{ name: "ot-theme", value: "dark", url: web }]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(web + "/ar", { waitUntil: "networkidle", timeout: 90000 });
    await page.locator("h1").first().waitFor();
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: path.join(out, "overview-ar-dark-mobile.png"),
      fullPage: true,
    });
  },
);
await context.close();
await browser.close();
const report = {
  at: new Date().toISOString(),
  web,
  api,
  live,
  passed: results.filter((item) => item.ok).length,
  total: results.length,
  results,
};
fs.writeFileSync(
  path.join(out, interactions ? "checks-interactions.json" : "checks.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`${report.passed}/${report.total} passed`);
if (report.passed !== report.total) process.exitCode = 1;
