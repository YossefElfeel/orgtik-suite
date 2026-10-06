import {auditState} from "../lib/audit-state.mjs";
// S3 on the website (D-035, on orgtik-website's cms/connect): every view has a real address.
// The site's views used to live in the URL fragment (/work#/project/x); now the address is real
// (/work/x), old links and the legacy aliases land on it, and moving between views, back and
// forward, never reloads the page.
//
//   node flows/site-paths.mjs     (the website on :4173)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS } from "../lib/suite.mjs";
const audit = await auditState("site-paths.mjs");
try {


// SITE_URL=http://127.0.0.1:4280 runs it against the build (tools/site/host.mjs).
const SITE = process.env.SITE_URL ?? "http://127.0.0.1:4173";
const { routes, aliases } = JSON.parse(fs.readFileSync(path.join(AUDITS, "website", "routes.json"), "utf8"));
const REAL = {
  "/services#/family/": (r) => r.replace("#/family/", "/"),
  "/services#/service/": (r) => r.replace("#/service/", "/"),
  "/software#/product/": (r) => r.replace("#/product/", "/"),
  "/software#/plans/": (r) => r.replace("#/plans/", "/plans/"),
  "/work#/project/": (r) => r.replace("#/project/", "/"),
  "/insights#/article/": (r) => r.replace("#/article/", "/"),
  "/legal#/": (r) => r.replace("#/", "/"),
};
const realOf = (r) => {
  const k = Object.keys(REAL).find((p) => r.startsWith(p));
  return k ? REAL[k](r) : null;
};

const results = [];
const check = async (name, fn) => {
  try {
    const note = await fn();
    results.push({ name, ok: true, note });
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message).split("\n")[0].slice(0, 220) });
  }
};

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const where = () => page.evaluate(() => location.pathname + location.search + location.hash);
const text = () => page.evaluate(() => document.body.innerText);
const open = async (url) => {
  await page.goto(SITE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
};
// Set once per document: still there after a move means no reload happened.
const mark = () => page.evaluate(() => (window.__sameDoc = true));
const sameDoc = () => page.evaluate(() => window.__sameDoc === true);

// Discovery now records real paths. Derive their legacy view links too, so this check
// still exercises every view rather than passing with an empty list after S3.
const legacyOf = (r) => {
  const p = r.split("/").filter(Boolean);
  if (p[0] === "services" && p.length > 1)
    return `/services#/${p.length > 2 ? "service" : "family"}/${p.slice(1).join("/")}`;
  if (p[0] === "software" && p.length > 1)
    return `/software#/${p[1] === "plans" ? p.slice(1).join("/") : `product/${p[1]}`}`;
  if (p[0] === "work" && p.length > 1) return `/work#/project/${p[1]}`;
  if (p[0] === "insights" && p.length > 1) return `/insights#/article/${p[1]}`;
  if (p[0] === "legal" && p.length > 1) return `/legal#/${p[1]}`;
  return null;
};
const views = routes.map((r) => realOf(r) ? r : legacyOf(r)).filter(Boolean);
await check(`every view (${views.length}) has a real address that shows it`, async () => {
  const bad = [];
  for (const r of views) {
    await open(r);
    const addr = await where();
    const viaOld = await text();
    await open(realOf(r));
    const viaReal = await text();
    if (addr !== realOf(r)) bad.push(`${r} → ${addr}`);
    else if (viaOld !== viaReal) bad.push(`${realOf(r)} shows something else`);
  }
  if (bad.length) throw new Error(bad.join("; "));
  return `e.g. ${views[0]} → ${realOf(views[0])}`;
});

await check("the legacy aliases land on real addresses", async () => {
  const bad = [];
  for (const [from, to] of Object.entries(aliases)) {
    await open(from);
    const want = realOf(to) ?? to;
    const got = await where();
    // /platform and /pricing keep sending the visitor to the plan builder.
    if (got !== want && got !== want + "#plan-builder") bad.push(`${from} → ${got} (want ${want})`);
  }
  if (bad.length) throw new Error(bad.join("; "));
  return `${Object.keys(aliases).length} aliases, e.g. /projects/orgtik-identity-system → /work/orgtik-identity-system`;
});

await check("a view link moves to its address without a reload; back and forward follow", async () => {
  await open("/services");
  await mark();
  const link = page.locator('a[href^="#/family/"], a[href*="/services/"]').first();
  const before = await text();
  await link.click();
  await page.waitForTimeout(600);
  const at = await where();
  if (!/^\/services\/[^/#]+/.test(at)) throw new Error(`address after the click: ${at}`);
  if (!(await sameDoc())) throw new Error("the page reloaded");
  if ((await text()) === before) throw new Error("the view didn't change");
  const inView = await text();
  await page.goBack();
  await page.waitForTimeout(600);
  if ((await where()) !== "/services") throw new Error(`after back: ${await where()}`);
  if ((await text()) !== before) throw new Error("back didn't return to the overview");
  await page.goForward();
  await page.waitForTimeout(600);
  if ((await where()) !== at || (await text()) !== inView) throw new Error("forward didn't return to the view");
  if (!(await sameDoc())) throw new Error("the page reloaded on back/forward");
  return `/services → ${at} → back → forward, one document`;
});

await check("a link to another page's view opens that view at its address", async () => {
  await open("/");
  await mark();
  const link = page.locator('a[href^="/work/"]').first();
  const href = await link.getAttribute("href");
  await link.click();
  await page.waitForTimeout(800);
  if ((await where()) !== href) throw new Error(`address: ${await where()}, link: ${href}`);
  if (!(await sameDoc())) throw new Error("the page reloaded");
  await page.goBack();
  await page.waitForTimeout(600);
  if ((await where()) !== "/") throw new Error(`after back: ${await where()}`);
  return `Home → ${href} → back`;
});

await check("switching legal documents updates the address in place", async () => {
  await open("/legal/privacy");
  const n = await page.evaluate(() => history.length);
  await page.getByRole("button", { name: /terms/i }).or(page.getByRole("tab", { name: /terms/i })).or(page.getByRole("link", { name: /^terms/i })).first().click();
  await page.waitForTimeout(500);
  if ((await where()) !== "/legal/terms") throw new Error(`address: ${await where()}`);
  return `/legal/privacy → /legal/terms (history ${n} → ${await page.evaluate(() => history.length)})`;
});

await check("anchors on a page stay anchors", async () => {
  await open("/software#plan-builder");
  if ((await where()) !== "/software#plan-builder") throw new Error(`address: ${await where()}`);
  const y = await page.evaluate(() => scrollY);
  if (y < 200) throw new Error(`not scrolled to the plan builder (scrollY ${y})`);
  return `/software#plan-builder, scrollY ${Math.round(y)}`;
});

await check("an unknown address shows the not-found page", async () => {
  await open("/no-such-page");
  await page.getByText("Page not found.").waitFor({ timeout: 5000 });
  return "/no-such-page → Page not found.";
});

await browser.close();
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.note ? `  — ${r.note}` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;

} finally { await audit.cleanup(); }
