import {auditState} from "../lib/audit-state.mjs";
// Website Manager: an entry's whole SEO block (plan: "Metadata and slugs on everything", and the
// old content dashboard's keywords and JSON-LD), end to end to the website's head.
//   - an editor writes the search title and description against a pixel-measured preview, a focus
//     keyphrase and keywords (the checks follow), a link preview and indexing; the canonical and
//     custom structured data are closed to them
//   - the SEO team changes only the SEO block, including the canonical and custom JSON-LD; such a
//     draft goes through the SEO fast lane
//   - once published and pulled, the site's head carries it
// The mock is reset and the site's committed snapshot restored afterwards.
//
//   node flows/wm-seo.mjs   (the Website Manager on :3007, the mock, and tools/site/host.mjs on :4280)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-seo.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "seo");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
const HOST = "http://127.0.0.1:4280";
const SITE_REPO = path.resolve(AUDITS, "..", "..", "orgtik-website");
const APP = path.join(SITE_REPO, "landing-directions");
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: APP, encoding: "utf8", shell: process.platform === "win32" });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
await mock.withoutSuggestions();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(01|03|09|12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email);
  await page.goto(`${WM}/en/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 30000 });
  return { ctx, page, token, errors };
}
async function run(title, fn) {
  const steps = [];
  const step = async (page, name, check) => {
    let ok = false;
    let note = "";
    try {
      const r = await check();
      ok = r === true || Boolean(r?.ok);
      note = r?.note ?? "";
    } catch (e) {
      note = String(e.message || e).split("\n")[0].slice(0, 220);
    }
    if (page) {
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`), fullPage: true }).catch(() => {});
    }
    steps.push({ name, ok, note });
  };
  await fn(step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps });
}
const call = async (token, method, p, body, version) => {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(version != null ? { "if-match": String(version) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j.data, error: j.error };
};
const openSeo = async (page, url) => {
  await page.goto(`${WM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "SEO", exact: true }).click();
  await page.getByText("In search results").waitFor({ timeout: 15000 });
};
const saveDraft = async (page) => {
  await page.getByRole("button", { name: "Save draft" }).first().click();
  await page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
};

const FOCUS = "connected website";
await run("An editor writes the SEO block; the canonical and custom JSON-LD aren't theirs", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await openSeo(hoda.page, "/en/content/insights/ar_01");
  const checks = async () => (await hoda.page.getByText(/^\d+ of 8$/).innerText()).split(" ")[0];
  await step(hoda.page, "preview-and-checks", async () => {
    const before = await checks();
    await hoda.page.getByLabel("Focus keyphrase").fill(FOCUS);
    const kw = hoda.page.getByPlaceholder("Add a keyword");
    await kw.fill("digital operations");
    await kw.press("Enter");
    await kw.fill("website workflow");
    await kw.press("Enter");
    const shown = await hoda.page.getByRole("img", { name: "Search result preview" }).innerText();
    return { ok: shown.includes("When a website becomes part of the operating system") && shown.includes("orgtik.ch/insights/connected-digital-system"), note: `checks ${before}/8 before the keyphrase` };
  });
  await step(hoda.page, "social-and-indexing", async () => {
    await hoda.page.getByLabel("Title for link previews").fill("A website that runs with the business");
    await hoda.page.getByRole("checkbox", { name: "Include in the sitemap" }).click();
    const preview = await hoda.page.getByRole("img", { name: "Link preview" }).innerText();
    const canonicalLocked = await hoda.page.getByLabel("Canonical address").getAttribute("readonly");
    const jsonLocked = await hoda.page.getByLabel("Additional structured data (JSON-LD)").getAttribute("readonly");
    return { ok: preview.includes("A website that runs with the business") && canonicalLocked !== null && jsonLocked !== null, note: `canonical locked ${canonicalLocked !== null}, JSON-LD locked ${jsonLocked !== null}` };
  });
  await step(hoda.page, "saved", async () => {
    await saveDraft(hoda.page);
    const e = (await call(hoda.token, "GET", "/admin/entries/article/ar_01")).data;
    const s = e.content.seo.en;
    return { ok: s.focus === FOCUS && s.keywords?.length === 2 && s.ogTitle === "A website that runs with the business" && s.inSitemap === false, note: `focus “${s.focus}”, ${s.keywords?.length} keywords, sitemap ${s.inSitemap}` };
  });
  await step(null, "api-refuses-canonical-for-editor", async () => {
    const e = (await call(hoda.token, "GET", "/admin/entries/article/ar_01")).data;
    const r = await call(hoda.token, "PATCH", "/admin/entries/article/ar_01", { locale: "en", seo: { canonical: "https://orgtik.ch/insights" } }, e.version);
    const j = await call(hoda.token, "PATCH", "/admin/entries/article/ar_01", { locale: "en", seo: { jsonLd: { "@type": "FAQPage" } } }, e.version);
    return { ok: r.status === 403 && r.error?.required === "seo:edit" && j.status === 403 && j.error?.required === "seo:custom-jsonld", note: `canonical ${r.status} (${r.error?.required}), JSON-LD ${j.status} (${j.error?.required})` };
  });
  // Back to the published version, so the next run starts from the same place.
  const e = (await call(hoda.token, "GET", "/admin/entries/article/ar_01")).data;
  await call(hoda.token, "POST", "/admin/entries/article/ar_01/transitions", { action: "discard" }, e.version);
  await step(null, "console-clean", async () => ({ ok: !hoda.errors.length, note: hoda.errors.slice(0, 2).join(" | ") || "no errors" }));
  await hoda.ctx.close();
});

const CANONICAL = "https://orgtik.ch/services";
await run("The SEO team changes only the SEO block, through the fast lane, and the site's head carries it", async (step) => {
  const laila = await as("laila.mostafa@orgtik.test");
  await openSeo(laila.page, "/en/content/services/sf_02");
  await step(laila.page, "content-read-only-seo-editable", async () => {
    const desc = laila.page.getByLabel("Description", { exact: true });
    const editable = (await desc.getAttribute("readonly")) === null;
    await desc.fill("Web and app development in Switzerland: fast, accessible sites and custom apps, built to be looked after.");
    await laila.page.getByLabel("Canonical address").fill("http://not-https.example");
    return { ok: editable, note: "SEO fields editable for the SEO role" };
  });
  await step(laila.page, "invalid-canonical-refused", async () => {
    await laila.page.getByRole("button", { name: "Save draft" }).first().click();
    await laila.page.getByText("Use a full https:// address.").waitFor({ timeout: 15000 });
    return { ok: true, note: "http:// refused with a message" };
  });
  await step(laila.page, "canonical-and-jsonld-saved", async () => {
    await laila.page.getByLabel("Canonical address").fill(CANONICAL);
    const box = laila.page.getByLabel("Additional structured data (JSON-LD)");
    await box.fill('{ "@type": "FAQPage", "mainEntity": [');
    await laila.page.getByText("This isn't valid JSON yet.").waitFor({ timeout: 5000 });
    await box.fill('{ "@type": "FAQPage", "mainEntity": [] }');
    await saveDraft(laila.page);
    return { ok: true, note: "saved as a draft by the SEO role" };
  });
  await step(laila.page, "fast-lane-submit", async () => {
    const e = (await call(laila.token, "GET", "/admin/entries/serviceFamily/sf_02")).data;
    await laila.page.getByRole("button", { name: "Submit for review" }).click();
    await laila.page.getByText("In review").first().waitFor({ timeout: 15000 });
    return { ok: e.seoOnly === true, note: `seoOnly ${e.seoOnly}; Laila submitted it` };
  });
  await laila.ctx.close();
  // Four eyes: someone else approves; the Admin publishes.
  const mona = await tokenFor("mona.adel@orgtik.test");
  await step(null, "approved-and-published", async () => {
    const e = (await call(mona, "GET", "/admin/entries/serviceFamily/sf_02")).data;
    const a = await call(mona, "POST", "/admin/entries/serviceFamily/sf_02/transitions", { action: "approve" }, e.version);
    if (a.status !== 200) throw new Error(`approve from ${e.state}: ${a.status} ${a.error?.code} ${a.error?.message ?? ""}`);
    const p = await call(mona, "POST", "/admin/entries/serviceFamily/sf_02/transitions", { action: "publish" }, a.data.version);
    return { ok: p.status === 200, note: `approve ${a.status}, publish ${p.status}` };
  });
  await step(null, "site-head-carries-it", async () => {
    sh("node", ["scripts/content-pull.mjs"]);
    sh("npm", ["run", "build"]);
    const html = await (await fetch(`${HOST}/services/development`)).text();
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    const description = /<meta name="description" content="([^"]+)"/.exec(html)?.[1];
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "{}");
    const types = (ld["@graph"] ?? []).map((n) => n["@type"]);
    return { ok: canonical === CANONICAL && description?.startsWith("Web and app development in Switzerland") && types.includes("FAQPage") && types.includes("Service"), note: `canonical ${canonical}; JSON-LD ${types.join(", ")}` };
  });
});

await mock.reset();
audit.restoreFiles();
sh("npm", ["run", "build"]);
await browser.close();
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
