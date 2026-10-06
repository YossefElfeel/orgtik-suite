import {auditState} from "../lib/audit-state.mjs";
// Website Manager: Pricing, Media and SEO, walked in the browser.
//   - pricing: an editor changes words but not numbers; the approver changes a price; only an
//     Admin approves and publishes it; the price the website uses changes
//   - media: a file gets its description and rights (a licence needs a holder) and a focal point;
//     an upload goes straight to its page and can be deleted; a file in use can't be
//   - SEO: a chained redirect is refused and fixed; the health view filters by issue; search
//     visibility is changed only with site:visibility, with a reason, and robots.txt follows
//
//   node flows/wm-s2.mjs      (the Website Manager on :3007 and the local-dev mock running)
//
// Resets the mock first. Writes audits/wm/flows/s2.json (screenshots git-ignored).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { tokenFor } from "../lib/session.mjs";
import { settle } from "../lib/checks.mjs";
const audit = await auditState("wm-s2.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s2");
const WM = webUrl("wm");
const API = `${apiUrl("wm")}/v2`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await mock.reset();
await mock.withoutSuggestions();
const browser = await chromium.launch();
const results = [];

async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/status of 4(09|12|22)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const token = await tokenFor(email);
  await page.goto(`${WM}/en/auth?token=${encodeURIComponent(token)}`, { waitUntil: "load" });
  await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 30000 });
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
      await page.screenshot({ path: path.join(OUT, `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`) }).catch(() => {});
    }
    steps.push({ name, ok, note });
  };
  await fn(step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps });
}
const go = async (page, url) => {
  await page.goto(`${WM}${url}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 30000 });
};
const api = async (token, p) => (await (await fetch(`${API}${p}`, { headers: { authorization: `Bearer ${token}` } })).json());
const saveDraft = async (page) => {
  await page.getByRole("button", { name: "Save draft" }).first().click();
  await page.getByText("Draft saved").first().waitFor({ timeout: 15000 });
};

// Since c8be7fe prices live in the website's purchasing catalog (orgtik-website/landing-directions/src/reference/purchase-catalog.js), which the cart and
// checkout read: Pricing, the service families, services and software products are mirrored here
// read-only (owner's choice, 2026-10-03). Their pages' slugs and SEO are still edited here.
await run("Prices are the website's: Pricing mirrors its catalog read-only", async (step) => {
  const mona = await as("mona.adel@orgtik.test");
  await go(mona.page, "/en/content/pricing/pr_software");
  await step(mona.page, "mirror-read-only", async () => {
    const managed = await mona.page.getByRole("note").filter({ hasText: "purchase-catalog.js" }).count();
    const save = await mona.page.getByRole("button", { name: /^Save( draft)?$/ }).count();
    const p = (await api(mona.token, "/admin/pricing")).data;
    return { ok: managed === 1 && save === 0 && p.modules.hr?.monthly === 49 && /purchase-catalog/.test(p.managedIn ?? ""), note: `catalog note ${managed}; save ${save}; hr ${p.modules.hr?.monthly} a month` };
  });
  await step(mona.page, "api-refuses-content", async () => {
    const res = await fetch(`${API}/admin/entries/pricing/pr_software`, { method: "PATCH", headers: { authorization: `Bearer ${mona.token}`, "content-type": "application/json" }, body: JSON.stringify({ locale: "en", fields: { savings: { terms: [] } } }) });
    const body = await res.json();
    return { ok: res.status === 423 && body.error?.code === "managed_in_website", note: `${res.status} ${body.error?.code}` };
  });
  await step(mona.page, "seo-still-here", async () => {
    const e = (await api(mona.token, "/admin/entries/serviceFamily/sf_01")).data;
    const seo = { ...(e.content.seo.en ?? {}), description: "Brand, graphic and interface design for one connected identity." };
    const res = await fetch(`${API}/admin/entries/serviceFamily/sf_01`, { method: "PATCH", headers: { authorization: `Bearer ${mona.token}`, "content-type": "application/json" }, body: JSON.stringify({ locale: "en", seo }) });
    const words = await fetch(`${API}/admin/entries/serviceFamily/sf_01`, { method: "PATCH", headers: { authorization: `Bearer ${mona.token}`, "content-type": "application/json" }, body: JSON.stringify({ locale: "en", fields: { name: "Design!" } }) });
    return { ok: res.ok && words.status === 423, note: `SEO ${res.status}; words ${words.status}` };
  });
  await mona.ctx.close();
});

await run("A file gets its description, rights and focal point; uploads and deletes follow usage", async (step) => {
  const hoda = await as("hoda.ashraf@orgtik.test");
  await go(hoda.page, "/en/media/md_01");
  await step(hoda.page, "licence-needs-holder", async () => {
    await hoda.page.getByRole("textbox", { name: "Description" }).fill("Two OrgTik business cards on dark stone, one dark and one light.");
    await hoda.page.getByRole("combobox", { name: "Who may use it" }).click();
    await hoda.page.getByRole("option", { name: "Licensed" }).click();
    await hoda.page.getByRole("button", { name: "Save", exact: true }).click();
    await hoda.page.getByText("Say who holds the rights.").waitFor({ timeout: 15000 });
    return true;
  });
  await step(hoda.page, "described-and-cleared", async () => {
    await hoda.page.getByLabel("Held by").fill("OrgTik brand photography");
    // A click near the top left moves what stays in view there.
    const pick = hoda.page.getByRole("button", { name: "Set the point that stays in view" });
    const box = await pick.boundingBox();
    await hoda.page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
    await hoda.page.getByRole("button", { name: "Save", exact: true }).click();
    await hoda.page.getByText("Saved", { exact: true }).first().waitFor({ timeout: 15000 });
    const m = (await api(hoda.token, "/admin/media/md_01")).data;
    return { ok: m.issues.length === 0 && m.rights.holder && m.focal.x < 40 && m.focal.y < 50, note: `issues [${m.issues}], focal ${m.focal.x}/${m.focal.y}` };
  });
  await step(hoda.page, "in-use-not-deleted", async () => {
    await go(hoda.page, "/en/media/md_02");
    await hoda.page.getByRole("button", { name: "Delete file" }).click();
    const dialog = hoda.page.getByRole("alertdialog");
    const text = await dialog.innerText();
    await dialog.getByRole("button", { name: "Delete file" }).click();
    await hoda.page.waitForTimeout(1200);
    const still = (await api(hoda.token, "/admin/media/md_02")).data?.id === "md_02";
    return { ok: /used in \d+ places/.test(text) && still, note: text.replace(/\s+/g, " ").slice(0, 110) };
  });
  await step(hoda.page, "upload-then-delete", async () => {
    await hoda.page.keyboard.press("Escape");
    await go(hoda.page, "/en/media");
    const file = path.join(os.tmpdir(), "wm-flow-logo.svg");
    fs.writeFileSync(file, "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'><rect width='40' height='20' fill='#6C3CAA'/></svg>");
    await hoda.page.getByRole("button", { name: "Upload", exact: true }).click();
    await hoda.page.getByRole("dialog").locator("input[type=file]").setInputFiles(file);
    await hoda.page.getByRole("dialog").getByRole("button", { name: "Upload", exact: true }).click();
    await hoda.page.waitForURL(/\/media\/md_\d+/, { timeout: 15000 });
    const id = hoda.page.url().split("/").pop();
    await hoda.page.getByRole("button", { name: "Delete file" }).click();
    await hoda.page.getByRole("alertdialog").getByRole("button", { name: "Delete file" }).click();
    await hoda.page.waitForURL(/\/media$/, { timeout: 15000 });
    const gone = (await api(hoda.token, `/admin/media/${id}`)).error?.code === "not_found";
    return { ok: gone, note: `${id} uploaded, then deleted` };
  });
  await step(null, "no-errors", async () => ({ ok: hoda.errors.length === 0, note: hoda.errors[0] ?? "clean" }));
  await hoda.ctx.close();
});

await run("Redirects are checked; search visibility needs its own permission", async (step) => {
  const laila = await as("laila.mostafa@orgtik.test");
  await go(laila.page, "/en/seo/redirects");
  await step(laila.page, "chain-refused-then-added", async () => {
    await laila.page.getByRole("button", { name: "Add a redirect" }).click();
    const dialog = laila.page.getByRole("dialog");
    await dialog.getByLabel("Old address").fill("/old-pricing");
    await dialog.getByLabel("Goes to").fill("/pricing");
    await dialog.getByRole("button", { name: "Add a redirect" }).click();
    await dialog.getByText("That address redirects again. Point straight at where it ends up.").waitFor({ timeout: 15000 });
    await dialog.getByLabel("Goes to").fill("/software#plan-builder");
    await dialog.getByRole("button", { name: "Add a redirect" }).click();
    await laila.page.getByText("Redirect added").first().waitFor({ timeout: 15000 });
    const pub = (await (await fetch(`${API}/public/redirects`)).json()).data;
    return { ok: pub.some((r) => r.from === "/old-pricing" && r.to === "/software#plan-builder"), note: `${pub.length} public redirects` };
  });
  await step(laila.page, "health-filter", async () => {
    await go(laila.page, "/en/seo");
    await laila.page.getByRole("tab", { name: /No search description/ }).click();
    const expected=(await api(laila.token, "/admin/seo/health?issue=descriptionMissing")).data.length;
    await laila.page.waitForFunction(n => document.querySelectorAll("tbody tr").length === n, expected, { timeout: 15000 });
    return { ok: true, note: `${expected} pages without a search description, matching the API` };
  });
  await step(laila.page, "seo-cannot-change-visibility", async () => {
    await go(laila.page, "/en/seo/indexing");
    const buttons = await laila.page.getByRole("button", { name: /Show in search|Hide from search/ }).count();
    return { ok: buttons === 0, note: `SEO role sees ${buttons} visibility buttons` };
  });
  await laila.ctx.close();
  const mona = await as("mona.adel@orgtik.test");
  await go(mona.page, "/en/seo/indexing");
  await step(mona.page, "admin-shows-in-search", async () => {
    await mona.page.getByRole("button", { name: "Show in search" }).click();
    const dialog = mona.page.getByRole("alertdialog");
    await dialog.getByRole("textbox").fill("Content approved for launch.");
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Show in search" }).click();
    await mona.page.getByText("The website can now appear in search").first().waitFor({ timeout: 15000 });
    const robots = await (await fetch(`${API}/public/robots.txt`)).text();
    return { ok: /Allow: \//.test(robots) && /Sitemap:/.test(robots), note: robots.split("\n")[1] };
  });
  await step(null, "no-errors", async () => ({ ok: mona.errors.length === 0, note: mona.errors[0] ?? "clean" }));
  await mona.ctx.close();
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s2.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
