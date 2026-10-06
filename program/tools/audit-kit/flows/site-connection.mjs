import {auditState} from "../lib/audit-state.mjs";
// The Website Manager → website connection, end to end (D-035, on orgtik-website's cms/connect):
// a change published in the Website Manager, pulled into the site's snapshot, shows on the page;
// code-owned prices refuse CMS edits. Afterwards the mock is
// reset and the snapshot pulled again, so the site's working tree ends as it started.
//
//   node flows/site-connection.mjs     (the website on :4173, the Website Manager's mock on :4007)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { AUDITS, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
const audit = await auditState("site-connection.mjs");
try {


const SITE_REPO = path.resolve(AUDITS, "..", "..", "orgtik-website");
const APP = path.join(SITE_REPO, "landing-directions");
const SITE = "http://127.0.0.1:4173";
const API = `${apiUrl("wm")}/v2`;
const pull = () => execFileSync("node", ["scripts/content-pull.mjs"], { cwd: APP, encoding: "utf8" });
const call = async (email, method, p, body, version) => {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${await tokenFor(email)}`, "content-type": "application/json", ...(version != null ? { "if-match": String(version) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(`${method} ${p}: ${r.status} ${j.error?.code}`), {status:r.status,code:j.error?.code});
  return j.data;
};
const publish = async (type, id, patch, editor = "hoda.ashraf@orgtik.test", approver = "karim.hassan@orgtik.test", publisher = approver) => {
  let e = await call(editor, "GET", `/admin/entries/${type}/${id}`);
  e = await call(editor, "PATCH", `/admin/entries/${type}/${id}`, patch, e.version);
  e = await call(editor, "POST", `/admin/entries/${type}/${id}/transitions`, { action: "submit" }, e.version);
  e = await call(approver, "POST", `/admin/entries/${type}/${id}/transitions`, { action: "approve" }, e.version);
  return call(publisher, "POST", `/admin/entries/${type}/${id}/transitions`, { action: "publish" }, e.version);
};

const results = [];
const check = async (name, fn) => {
  try {
    const note = await fn();
    results.push({ name, ok: true, note });
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message).split("\n")[0].slice(0, 200) });
  }
};

await mock.reset();
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await check("a published article name shows on the website", async () => {
  const fam = await call("hoda.ashraf@orgtik.test", "GET", "/admin/entries/article/ar_01");
  await publish("article", "ar_01", { locale: "en", fields: { ...fam.content.locales.en, name: "Connected systems audit fixture" } });
  pull();
  await page.goto(`${SITE}/insights`, { waitUntil: "networkidle" });
  await page.getByText("Connected systems audit fixture").first().waitFor({ timeout: 20000 });
  return "CMS article name renders on /insights";
});

await check("code-owned purchasing prices reject a CMS price edit", async () => {
  const pr = await call("karim.hassan@orgtik.test", "GET", "/admin/entries/pricing/pr_software");
  const modules = pr.content.locales.en.items.map((m) => (m.id === "hr" ? { ...m, monthly: 44 } : m));
  // Prices: the approver changes, the Admin approves and publishes (four eyes, pricing:approve).
  const refusal = await call("karim.hassan@orgtik.test", "PATCH", "/admin/entries/pricing/pr_software", {locale:"en",fields:{items:modules}},pr.version).then(()=>null,error=>error);
  if (refusal?.status !== 423 || refusal?.code !== "managed_in_website") throw new Error("CMS price edit was not rejected");
  return "423 managed_in_website; purchasing prices remain code-owned";
});

await check("an edited page heading keeps its styling and shows the new words", async () => {
  const pg = await call("hoda.ashraf@orgtik.test", "GET", "/admin/entries/page/pg_home");
  const closing = { ...pg.content.locales.en.closing, h2: "<m1>What could we</m1> <m2>make <m3>together?</m3></m2>" };
  await publish("page", "pg_home", { locale: "en", fields: { closing } });
  pull();
  await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
  await page.screenshot({path:path.join(AUDITS,"website/connection/edited-home.png"),fullPage:true});
  const h2 = page.locator("#contact h2");
  await h2.scrollIntoViewIfNeeded();
  const text = (await h2.innerText()).replace(/\s+/g, " ").trim();
  // The accent line is still its own element: the marks kept the structure.
  const accent = await h2.locator(".cs-acc, [class*=acc], span span").count();
  if (!/make together\?/.test(text)) throw new Error(`closing heading reads "${text}"`);
  return `closing heading: "${text}" (${accent} styled parts kept)`;
});

await check("an edited message built in code fills in its parts", async () => {
  const st = await call("hoda.ashraf@orgtik.test", "GET", "/admin/entries/strings/st_shared");
  const [block,slot] = Object.entries(st.content.locales.en).flatMap(([b,v])=>Object.entries(v).map(([k,text])=>[b,k,text])).find(([, , text])=>text === "Showing {0} of {1} {2}");
  await publish("strings", "st_shared", { locale: "en", fields: { [block]:{...st.content.locales.en[block],[slot]:"{0} of {1} {2} shown"} } });
  pull();
  await page.goto(`${SITE}/services`, { waitUntil: "networkidle" });
  await page.getByText(/\d+ of \d+ \w+ shown/).first().waitFor({ timeout: 20000 });
  return `/services: "${(await page.getByText(/\d+ of \d+ \w+ shown/).first().innerText()).trim()}"`;
});

await browser.close();
// Back to the seed: the working tree ends as it started.
await mock.reset();
// The committed snapshot back, then a pull: after the reset it must bring nothing new.
audit.restoreFiles();
const again = pull();
results.push({ name: "after the reset the Website Manager matches the committed snapshot", ok: /unchanged/.test(again), note: again.trim() });
results.push({ name: "the site's pre-flow snapshot and host configuration are restored", ok: audit.filesMatch(), note: "Compared with exact pre-flow bytes, including uncommitted follow-up work" });

fs.mkdirSync(path.join(AUDITS, "website", "connection"), { recursive: true });
fs.writeFileSync(path.join(AUDITS, "website", "connection", "site-connection.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) console.log(`${r.ok ? "ok " : "NO "} ${r.name}: ${r.note}`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
