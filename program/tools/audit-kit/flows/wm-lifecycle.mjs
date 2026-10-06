import {auditState} from "../lib/audit-state.mjs";
// Website Manager: new entries and taking them off the site (plan: "a separate public lifecycle of
// unpublished / published / archived"; parity with the old dashboard's add and delete).
//   - an editor starts a new article from one on the site; it stays off the site until reviewed and
//     published, then the website shows it at its own address, in the list and in the sitemap
//   - an approver takes it off the site: its address redirects to the list; it can go back
//   - something never published can be deleted; families, services and modules can't be added
//   - a new case study joins the Work page without breaking its layout
// The mock is reset and the site's committed snapshot restored afterwards.
//
//   node flows/wm-lifecycle.mjs   (the Website Manager on :3007, the mock, tools/site/host.mjs on :4280)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-lifecycle.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "lifecycle");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
const HOST = "http://127.0.0.1:4280";
const SITE_REPO = path.resolve(AUDITS, "..", "..", "orgtik-website");
const APP = path.join(SITE_REPO, "landing-directions");
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: APP, encoding: "utf8", shell: process.platform === "win32" });
const publishSite = () => (sh("node", ["scripts/content-pull.mjs"]), sh("npm", ["run", "build"]));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
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
const karim = await tokenFor("karim.hassan@orgtik.test");
const approveAndPublish = async (type, id) => {
  let e = (await call(karim, "GET", `/admin/entries/${type}/${id}`)).data;
  const a = await call(karim, "POST", `/admin/entries/${type}/${id}/transitions`, { action: "approve" }, e.version);
  if (a.status !== 200) throw new Error(`approve: ${a.status} ${a.error?.code}`);
  const p = await call(karim, "POST", `/admin/entries/${type}/${id}/transitions`, { action: "publish" }, a.data.version);
  if (p.status !== 200) throw new Error(`publish: ${p.status} ${p.error?.code}`);
  return p.data;
};
const NAME = "Designing one site for five languages";
const SLUG = "designing-one-site-for-five-languages";

let articleId = null;
await run("A new article: off the site until published, then at its own address", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await hoda.page.goto(`${WM}/en/content/insights`, { waitUntil: "networkidle" });
  await step(hoda.page, "create-from-existing", async () => {
    await hoda.page.getByRole("button", { name: "New article" }).click();
    const dialog = hoda.page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(NAME);
    const address = await dialog.getByLabel("Address").inputValue();
    await dialog.getByRole("button", { name: "Create" }).click();
    await hoda.page.waitForURL(/\/content\/insights\/ar_\d+/, { timeout: 15000 });
    articleId = hoda.page.url().split("/").pop();
    await hoda.page.getByText("Not on the site yet").first().waitFor({ timeout: 15000 });
    return { ok: address === SLUG, note: `${articleId} at /insights/${address}` };
  });
  await step(hoda.page, "not-on-site-until-published", async () => {
    const pub = (await (await fetch(`${API}/public/entries/article`)).json()).data;
    await hoda.page.getByRole("button", { name: "Submit for review" }).click();
    await hoda.page.getByText("In review").first().waitFor({ timeout: 15000 });
    return { ok: !pub.some((a) => a.id === articleId), note: `${pub.length} public articles, the new one not among them` };
  });
  await step(null, "published-and-on-the-site", async () => {
    const e = await approveAndPublish("article", articleId);
    publishSite();
    const html = await (await fetch(`${HOST}/insights/${SLUG}`)).text();
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    const sitemap = await (await fetch(`${HOST}/sitemap.xml`)).text();
    return { ok: e.visibility === "live" && title === `${NAME} | OrgTik` && sitemap.includes(`/insights/${SLUG}`), note: `visibility ${e.visibility}; “${title}”; in the sitemap` };
  });
  const visitor = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await step(visitor, "in-the-insights-list", async () => {
    await visitor.goto(`${HOST}/insights`, { waitUntil: "networkidle" });
    await visitor.getByText(NAME).first().waitFor({ timeout: 15000 });
    const overflow = await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    return { ok: !overflow, note: "listed on /insights; no overflow" };
  });
  await visitor.close();
  await step(null, "console-clean", async () => ({ ok: !hoda.errors.length, note: hoda.errors.slice(0, 2).join(" | ") || "no errors" }));
  await hoda.ctx.close();
});

await run("Taken off the site, its address goes to the list; it can come back", async (step) => {
  const k = await as("karim.hassan@orgtik.test");
  await k.page.goto(`${WM}/en/content/insights/${articleId}`, { waitUntil: "networkidle" });
  await step(k.page, "take-off", async () => {
    await k.page.getByRole("button", { name: "Take off the site" }).click();
    const dialog = k.page.getByRole("alertdialog");
    const impact = await dialog.innerText();
    await dialog.getByRole("button", { name: "Take off the site" }).click();
    await k.page.getByText("Off the site").first().waitFor({ timeout: 15000 });
    return { ok: impact.includes(`/insights/${SLUG} will redirect to /insights`), note: impact.split("\n").find((l) => l.includes("redirect")) };
  });
  await step(null, "address-redirects", async () => {
    publishSite();
    const r = await fetch(`${HOST}/insights/${SLUG}`, { redirect: "manual" });
    return { ok: [301, 308].includes(r.status) && r.headers.get("location")?.replace(HOST, "") === "/insights", note: `${r.status} → ${r.headers.get("location")?.replace(HOST, "")}` };
  });
  await step(k.page, "put-back", async () => {
    await k.page.getByRole("button", { name: "Put back on the site" }).click();
    await k.page.getByText("Back on the site.").first().waitFor({ timeout: 15000 });
    const redirects = (await (await fetch(`${API}/public/redirects`)).json()).data;
    return { ok: !redirects.some((r) => r.from === `/insights/${SLUG}`), note: "its redirect is gone" };
  });
  await k.ctx.close();
});

await run("Deleting is for what never reached the site; fixed sets can't grow", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await step(null, "delete-never-published", async () => {
    const created = await call(hoda.token, "POST", "/admin/entries/article", { name: "A draft to throw away", slug: "a-draft-to-throw-away", from: "ar_01" });
    const del = await call(hoda.token, "DELETE", `/admin/entries/article/${created.data.id}`);
    const again = await call(hoda.token, "GET", `/admin/entries/article/${created.data.id}`);
    const published = await call(hoda.token, "DELETE", `/admin/entries/article/ar_01`);
    return { ok: created.status === 201 && del.status === 204 && again.status === 404 && published.status === 409, note: `create ${created.status}, delete ${del.status}, then ${again.status}; a published one: ${published.status} ${published.error?.code}` };
  });
  await step(hoda.page, "fixed-set-note", async () => {
    await hoda.page.goto(`${WM}/en/content/services`, { waitUntil: "networkidle" });
    await hoda.page.getByText("The site's design has a place for each of these").waitFor({ timeout: 15000 });
    const button = await hoda.page.getByRole("button", { name: /^New / }).count();
    const api = await call(hoda.token, "POST", "/admin/entries/serviceFamily", { name: "X", slug: "x", from: "sf_01" });
    return { ok: button === 0 && api.status === 405, note: `no New button; API ${api.status} ${api.error?.code}` };
  });
  await step(null, "slug-taken", async () => {
    const r = await call(hoda.token, "POST", "/admin/entries/article", { name: "Copy", slug: "connected-digital-system", from: "ar_01" });
    return { ok: r.status === 422 && r.error?.fieldErrors?.["slug.en"] === "slug_taken", note: `${r.status} ${JSON.stringify(r.error?.fieldErrors)}` };
  });
  await hoda.ctx.close();
});

await run("A new case study joins the Work page", async (step) => {
  const hoda = await tokenFor("hoda.ashraf@orgtik.test");
  const created = await call(hoda, "POST", "/admin/entries/caseStudy", { name: "Studio launch system", slug: "studio-launch-system", from: "cs_01" });
  let e = created.data;
  const expected = (await (await fetch(`${API}/public/entries/caseStudy`)).json()).data.length + 1;
  e = (await call(hoda, "POST", `/admin/entries/caseStudy/${e.id}/transitions`, { action: "submit" }, e.version)).data;
  await approveAndPublish("caseStudy", e.id);
  publishSite();
  const visitor = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await step(visitor, "work-index", async () => {
    await visitor.goto(`${HOST}/work`, { waitUntil: "networkidle" });
    // The page shows the first three and a "View N more projects" button (its own design).
    const more = visitor.getByRole("button", { name: /View \d+ more projects/ });
    if (await more.count()) await more.click();
    await visitor.getByText("Studio launch system").first().waitFor({ timeout: 15000 });
    const overflow = await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const count = (await (await fetch(`${API}/public/entries/caseStudy`)).json()).data.length;
    return { ok: count === expected && !overflow, note: `${count} public projects; new card visible; overflow ${overflow}` };
  });
  await step(visitor, "its-page", async () => {
    const r = await fetch(`${HOST}/work/studio-launch-system`);
    await visitor.goto(`${HOST}/work/studio-launch-system`, { waitUntil: "networkidle" });
    await visitor.getByRole("heading", { level: 1, name: "Studio launch system" }).waitFor({ timeout: 15000 });
    const narrative = await visitor.getByText("Narrative disabled").count();
    return { ok: r.status === 200, note: `${r.status}; project header renders with its copied narrative disabled (${narrative} editor-only notices on the website)` };
  });
  await visitor.close();
});

await mock.reset();
audit.restoreFiles();
sh("npm", ["run", "build"]);
await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "lifecycle.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
