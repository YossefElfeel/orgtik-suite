import {auditState} from "../lib/audit-state.mjs";
import {fixtureCall} from "../lib/content-fixtures.mjs";
// S3 on the website (D-035, on orgtik-website's cms/connect): what visitors and search engines
// get from the host. Every address has its own HTML whose head is its SEO record in the Website
// Manager; old addresses answer with a permanent redirect; an unknown one with a real 404; the
// sitemap and robots.txt come from the Website Manager too. Then the end to end: a slug changed
// and published there moves the page to its new address, and the old one redirects to it.
// Afterwards the mock is reset and the committed snapshot restored, so the tree ends as it started.
//
//   node flows/site-heads.mjs   (the Website Manager's mock on :4007; the build served by
//                                tools/site/host.mjs on :4280; this rebuilds the site as it goes)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { AUDITS, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
const audit = await auditState("site-heads.mjs");
try {


const SITE_REPO = path.resolve(AUDITS, "..", "..", "orgtik-website");
const APP = path.join(SITE_REPO, "landing-directions");
const HOST = "http://127.0.0.1:4280";
const API = `${apiUrl("wm")}/v2`;
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: APP, encoding: "utf8", shell: process.platform === "win32" });
const pull = () => sh("node", ["scripts/content-pull.mjs"]);
const build = () => sh("npm", ["run", "build"]);
const heads = async () => import(`${pathToFileURL(path.join(APP, "src", "content", "heads.js")).href}?t=${Date.now()}`);
const call = async (email, method, p, body, version) => {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${await tokenFor(email)}`, "content-type": "application/json", ...(version != null ? { "if-match": String(version) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(`${method} ${p}: ${r.status} ${j.error?.code}`), { body: j });
  return j.data;
};
const get = (p) => fetch(HOST + p, { redirect: "manual" });
const tag = (html, re) => (re.exec(html) ?? [])[1] ?? null;
const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const results = [];
const check = async (name, fn) => {
  try {
    const note = await fn();
    results.push({ name, ok: true, note });
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message).split("\n")[0].slice(0, 240) });
  }
};

await mock.reset();
pull();
build();
let H = await heads();

await check("every address answers 200 with its own head", async () => {
  const bad = [];
  for (const a of H.addresses()) {
    const want = H.headFor(a);
    const res = await get(a);
    const html = await res.text();
    const title = decode(tag(html, /<title>([^<]*)<\/title>/));
    const canonical = decode(tag(html, /<link rel="canonical" href="([^"]*)"/));
    const robots = tag(html, /<meta name="robots" content="([^"]*)"/);
    const ld = tag(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (res.status !== 200) bad.push(`${a}: ${res.status}`);
    else if (title !== want.title) bad.push(`${a}: title “${title}”`);
    else if (canonical !== want.canonical) bad.push(`${a}: canonical ${canonical}`);
    else if (robots !== want.robots) bad.push(`${a}: robots ${robots}`);
    else if (want.jsonLd && JSON.stringify(JSON.parse(ld)) !== JSON.stringify(want.jsonLd)) bad.push(`${a}: structured data`);
    if ((html.match(/<title>/g) ?? []).length !== 1 || (html.match(/name="description"/g) ?? []).length !== 1) bad.push(`${a}: duplicate head tags`);
  }
  if (bad.length) throw new Error(bad.slice(0, 5).join("; "));
  return `${H.addresses().length} addresses, e.g. /work/orgtik-identity-system → “${H.headFor("/work/orgtik-identity-system").title}”`;
});

await check("old addresses redirect permanently to the real ones", async () => {
  const want = { "/projects/orgtik-identity-system": "/work/orgtik-identity-system", "/platform/hr": "/software/hr", "/privacy": "/legal/privacy", "/projects": "/work", "/pricing": "/software#plan-builder" };
  const bad = [];
  for (const [from, to] of Object.entries(want)) {
    const res = await get(from);
    const loc = res.headers.get("location")?.replace(HOST, "");
    if (![301, 308].includes(res.status) || loc !== to) bad.push(`${from}: ${res.status} → ${loc}`);
  }
  if (bad.length) throw new Error(bad.join("; "));
  return Object.entries(want).map(([a, b]) => `${a} → ${b}`).slice(0, 3).join(", ");
});

await check("an unknown address is a real 404 that shows the not-found page", async () => {
  for (const p of ["/no-such-page", "/work/no-such-project"]) {
    const res = await get(p);
    const html = await res.text();
    if (res.status !== 404) throw new Error(`${p}: ${res.status}`);
    if (!/noindex/.test(tag(html, /<meta name="robots" content="([^"]*)"/) ?? "")) throw new Error(`${p}: indexable`);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(HOST + "/work/no-such-project", { waitUntil: "networkidle" });
  const shown = await page.getByText("Page not found.").isVisible();
  await browser.close();
  if (!shown) throw new Error("the app didn't show the not-found view");
  return "/no-such-page and /work/no-such-project: 404, noindex, “Page not found.”";
});

await check("sitemap.xml and robots.txt are the Website Manager's", async () => {
  const xml = await (await get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const cms = await (await fetch(`${API}/public/sitemap.xml`)).text();
  // Plus the HTML sitemap: a view of the legal page the site builds from its routes.
  const cmsLocs = [...cms.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).concat("https://orgtik.ch/legal/sitemap").sort();
  if (JSON.stringify(locs) !== JSON.stringify(cmsLocs)) throw new Error(`site ${locs.length} URLs, Website Manager ${cmsLocs.length}: ${locs.filter((x) => !cmsLocs.includes(x)).concat(cmsLocs.filter((x) => !locs.includes(x))).slice(0, 4).join(", ")}`);
  const robots = await (await get("/robots.txt")).text();
  const cmsRobots = await (await fetch(`${API}/public/robots.txt`)).text();
  if (robots !== cmsRobots) throw new Error("robots.txt differs");
  return `${locs.length} URLs, the same as the Website Manager's; robots.txt: ${robots.split("\n").find((l) => l.startsWith("Disallow") || l.startsWith("Allow"))}`;
});

await check("a slug changed in the Website Manager moves the page; the old address redirects", async () => {
  const editor = "hoda.ashraf@orgtik.test", approver = "karim.hassan@orgtik.test";
  let e = await call(editor, "GET", "/admin/entries/caseStudy/cs_01");
  const was = `/work/${e.content?.slug?.en ?? e.live?.slug?.en ?? e.draft?.slug?.en}`;
  // Another project's slug is refused: two pages can't share an address.
  const other = await fixtureCall(editor, "POST", "/admin/entries/caseStudy", {name:"Slug collision fixture",slug:"audit-slug-collision",department:"design"});
  const taken = await call(editor, "PATCH", "/admin/entries/caseStudy/cs_01", { locale: "en", slug: (other.content ?? other.draft ?? other.live).slug.en }, e.version).then(() => null, (x) => x.body?.error?.fieldErrors?.["slug.en"]);
  if (taken !== "slug_taken") throw new Error(`a taken slug was ${taken ?? "accepted"}`);
  e = await call(editor, "PATCH", "/admin/entries/caseStudy/cs_01", { locale: "en", slug: "orgtik-brand-identity" }, e.version);
  e = await call(editor, "POST", "/admin/entries/caseStudy/cs_01/transitions", { action: "submit" }, e.version);
  e = await call(approver, "POST", "/admin/entries/caseStudy/cs_01/transitions", { action: "approve" }, e.version);
  await call(approver, "POST", "/admin/entries/caseStudy/cs_01/transitions", { action: "publish" }, e.version);
  const redirects = await (await fetch(`${API}/public/redirects`)).json();
  if (!redirects.data.some((r) => r.from === was && r.to === "/work/orgtik-brand-identity")) throw new Error("the Website Manager made no redirect");
  pull();
  build();
  H = await heads();
  const now = await get("/work/orgtik-brand-identity");
  const title = tag(await now.text(), /<title>([^<]*)<\/title>/);
  const old = await get(was);
  if (now.status !== 200) throw new Error(`new address: ${now.status}`);
  if (![301, 308].includes(old.status) || old.headers.get("location")?.replace(HOST, "") !== "/work/orgtik-brand-identity") throw new Error(`old address: ${old.status} → ${old.headers.get("location")}`);
  return `${was} → /work/orgtik-brand-identity (${old.status}); the new address has “${decode(title)}”`;
});

await mock.reset();
// The committed snapshot and host config back, then a pull: after the reset it must bring nothing new.
audit.restoreFiles();
const again = pull();
results.push({ name: "after the reset the Website Manager matches the committed snapshot", ok: /unchanged/.test(again) && !/vercel\.json/.test(again), note: again.trim() });
build();

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.note ? `  — ${r.note}` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;

} finally { await audit.cleanup(); }
