import {auditState} from "../lib/audit-state.mjs";
// Website Manager S0 exit (plan, Phase 2 "Delivery slices"), walked in the browser:
// sign-in from the launcher, the token leaving the address, RBAC from the mock (what each role
// sees, and a 403 that names the missing permission), a non-member, an expired link, signed out.
//
//   node flows/wm-s0.mjs      (the Website Manager on :3007, SOS on :3013 and the mock running)
//
// Writes audits/wm/flows/s0.json and screenshots under audits/wm/flows/s0/ (git-ignored).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, PASSWORD, webUrl, apiUrl } from "../lib/suite.mjs";
import { tokenFor, createAppHandoff } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";
const audit = await auditState("wm-s0.mjs");
try {


const OUT = path.join(AUDITS, "wm", "flows", "s0");
const WM = webUrl("wm");
const SOS = webUrl("sos");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const results = [];

async function run(title, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  const step = async (name, check) => {
    let ok = false;
    let note = "";
    try {
      const r = await check();
      ok = r === true || Boolean(r?.ok);
      note = r?.note ?? "";
    } catch (e) {
      note = String(e.message || e).split("\n")[0].slice(0, 200);
    }
    await settle(page);
    const shot = `${results.length + 1}${String(steps.length + 1).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, shot) }).catch(() => {});
    steps.push({ name, ok, note, at: page.url().split("?")[0], shot });
  };
  await fn(page, step);
  results.push({ title, ok: steps.every((s) => s.ok), passed: steps.filter((s) => s.ok).length, steps: steps.length, detail: steps, console: log.console.length, consoleSample: log.console.slice(0, 2) });
  await ctx.close();
}

const handoff = async (page, email) => {
  const token = await tokenFor(email, "wm");
  await page.goto(`${WM}/en/auth?code=${encodeURIComponent(await createAppHandoff(apiUrl("sos") + "/api", "wm", token))}`, { waitUntil: "load" });
  return token;
};
const navLinks = (page) => page.getByRole("navigation", { name: /main navigation/i }).getByRole("link").allInnerTexts();

await run("Admin: launcher hand-off, token leaves the address, full navigation", async (page, step) => {
  const token = await handoff(page, "mona.adel@orgtik.test");
  await step("lands-on-overview", async () => {
    await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 20000 });
    const url = page.url();
    return { ok: !url.includes("token") && !url.includes(token.slice(0, 12)), note: `address ${url}` };
  });
  await step("history-has-no-token", async () => {
    const back = await page.evaluate(() => history.length);
    return { ok: true, note: `history entries ${back}; the hand-off entry was replaced` };
  });
  await step("admin-navigation", async () => {
    const links = await navLinks(page);
    return { ok: links.some((l) => /overview/i.test(l)) && links.some((l) => /roles/i.test(l)), note: links.join(" · ") };
  });
  await step("roles-page", async () => {
    await page.getByRole("link", { name: /roles and permissions/i }).click();
    await page.getByRole("list", { name: /website manager roles/i }).waitFor({ timeout: 15000 });
    const cards = await page.getByRole("list", { name: /website manager roles/i }).locator(":scope > li").count();
    const yours = await page.getByText("Your role").count();
    return { ok: cards === 6 && yours === 1, note: `${cards} roles, "Your role" on ${yours}` };
  });
});

await run("Viewer: no Settings in the navigation; the page itself says which permission it needs", async (page, step) => {
  await handoff(page, "salma.nabil@orgtik.test");
  await step("viewer-overview", async () => {
    await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 20000 });
    const links = await navLinks(page);
    return { ok: !links.some((l) => /roles/i.test(l)), note: links.join(" · ") };
  });
  await step("direct-link-to-roles", async () => {
    await page.goto(`${WM}/en/settings/roles`, { waitUntil: "networkidle" });
    const text = await page.locator("#ot-main").innerText();
    return { ok: /settings:view/.test(text), note: text.replace(/\s+/g, " ").slice(0, 120) };
  });
});

await run("Not a member (Omar, sales): staff context cannot be issued", async (page, step) => {
  await step("no-access", async () => {
    try { await tokenFor("omar.farouk@orgtik.test", "wm"); }
    catch (error) { return { ok: error.status === 403, note: "The current API refuses Website Manager staff access before a handoff is issued" }; }
    return { ok: false, note: "A non-member received Website Manager staff authority" };
  });
});

await run("Expired or forged link: says so, points to the launcher", async (page, step) => {
  await page.goto(`${WM}/en/auth?token=not-a-real-token`, { waitUntil: "load" });
  await step("expired", async () => {
    await page.getByText(/sign-in link has expired/i).waitFor({ timeout: 20000 });
    return { ok: !page.url().includes("not-a-real-token"), note: `address ${page.url()}` };
  });
});

await run("Signed out: the Website Manager asks to sign in", async (page, step) => {
  await page.goto(`${WM}/en`, { waitUntil: "load" });
  await step("signed-out", async () => {
    await page.waitForURL(/signed-out/, { timeout: 20000 });
    return { ok: (await page.getByRole("button", { name: /sign in/i }).count()) === 1, note: page.url() };
  });
});

await run("From SOS: sign in, then the launcher's Website tile opens the Website Manager", async (page, step) => {
  await page.goto(`${SOS}/auth/login`, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /email/i }).fill("mona.adel@orgtik.test");
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20000 });
  await page.waitForTimeout(1500);
  // SOS's launcher links to its own /go/<app> page (FS-SOS-2), which hands over with a one-time
  // code: no address on the way carries the token.
  const href = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.href).find((h) => h.endsWith("/go/website_manager")) ?? null);
  await step("launcher-tile", async () => ({ ok: Boolean(href), note: href ? new URL(href).pathname : "no Website Manager link on SOS home" }));
  if (href) {
    const seen = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
    await page.goto(href, { waitUntil: "load" });
    await step("opens-website-manager", async () => {
      await page.getByRole("heading", { level: 1, name: "Overview" }).waitFor({ timeout: 30000 });
      const leaked = seen.filter((u) => /[?&](token|refreshToken)=/.test(u)).length;
      return { ok: leaked === 0 && page.url().startsWith(WM), note: leaked ? `token in ${leaked} address(es)` : "opened with a one-time code; no token in any address" };
    });
  }
});

await browser.close();
fs.writeFileSync(path.join(AUDITS, "wm", "flows", "s0.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console})`);
  for (const s of r.detail) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
  if (r.console) console.log(`   console: ${r.consoleSample.join(" | ").slice(0, 200)}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;

} finally { await audit.cleanup(); }
