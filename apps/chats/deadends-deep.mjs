/**
 * SOMION HQ - DEAD END DETECTOR, SECOND PASS
 *
 * deadends.mjs clicks every button a page shows when it opens. This pass goes
 * where that one does not:
 *
 *   - links, not only buttons, and whether each href lands on a real page;
 *   - controls that only exist once something is open - a picker, a menu, a
 *     pane, a tab - found by pressing every opener and diffing what appeared;
 *   - the phone layout, where the sidebar is gone and the tabs carry the app;
 *   - pages the first pass never visits: the meeting detail and call, setup,
 *     transparency, the chat index, the signed-out screen, the warning.
 *
 * The test is the same: press it, and ask whether anything a person could
 * see changed. Destructive labels are skipped by name so the run repeats.
 *
 * Run against the dev server: node deadends-deep.mjs
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const DESKTOP = { width: 1560, height: 1000 };
const PHONE = { width: 390, height: 780 };

const PAGES = [
  { path: "/hq/office", vp: DESKTOP },
  { path: "/hq/chat/c-design", vp: DESKTOP },
  { path: "/hq/chat/catch-up", vp: DESKTOP },
  { path: "/hq/chat/search?q=invoice", vp: DESKTOP },
  { path: "/hq/meetings", vp: DESKTOP },
  { path: "/hq/meetings/mt-1", vp: DESKTOP },
  { path: "/hq/meetings/mt-1/call", vp: DESKTOP },
  { path: "/hq/insights", vp: DESKTOP },
  { path: "/hq/insights/transparency", vp: DESKTOP },
  { path: "/hq/settings", vp: DESKTOP },
  { path: "/hq/setup", vp: DESKTOP },
  { path: "/hq/activate", vp: DESKTOP },
  { path: "/hq/whiteboard", vp: DESKTOP },
  { path: "/hq/settings/emails", vp: DESKTOP },
  { path: "/hq/me", vp: DESKTOP },
  { path: "/tasks/t-4471", vp: DESKTOP },
  { path: "/guest/mt-1", vp: DESKTOP },
  { path: "/hq/office", vp: PHONE },
  { path: "/hq/chat", vp: PHONE },
  { path: "/hq/chat/c-design", vp: PHONE },
  { path: "/hq/meetings", vp: PHONE },
  { path: "/hq/me", vp: PHONE },
];

const SKIP = /delete|leave|remove|end call|hang up|stop|decline|reset|sign out|admit|record|previous month|next month|previous week|next week/i;
/* Openers whose reveal is worth sweeping even though they carry no popup attribute. */
const TAB_OPENERS = /^(Calendar|Past|Week|Month|Table view|Table|Details|Members|Files|Pins|About|Schedule|Add people|Custom)$/;
/* Per opener, at most this many revealed controls that share one shape. */
const PER_SHAPE = 3;

const browser = await chromium.launch();
const findings = [];
const visited = new Set();
const deadLinks = [];

const snapshot = (p) =>
  p.evaluate(() => ({
    url: location.pathname + location.search,
    html: document.body.innerHTML.length,
    text: document.body.innerText,
    dialogs: document.querySelectorAll("[role=dialog],[role=alertdialog],[role=listbox],[role=menu],aside").length,
  }));

/* Focus moving to the pressed control is not a response. The control's own
   state and text are: a toggle that flips its label has answered. */
const selfState = (el) =>
  el ? `${el.isConnected}|${el.textContent}|${el.getAttribute("aria-pressed")}|${el.getAttribute("aria-expanded")}|${el.getAttribute("aria-checked")}|${el.getAttribute("aria-selected")}|${el.disabled}` : "gone";

/* Any visible words changed counts: a caption that swaps is an answer. */
const changed = (a, b) => a.url !== b.url || a.dialogs !== b.dialogs || Math.abs(a.html - b.html) > 40 || a.text !== b.text;

/** Every visible, enabled control with a name: buttons and links. */
const controls = (p) =>
  p.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, [role=button], a[href], [role=option], [role=radio], [role=tab]").forEach((el) => {
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return;
      /* The active option of a set is a no-op by design, like a checked radio. */
      if (el.getAttribute("aria-pressed") === "true" || el.hasAttribute("aria-current") || el.getAttribute("aria-selected") === "true" || el.getAttribute("aria-checked") === "true") return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (getComputedStyle(el).pointerEvents === "none") return;
      const name = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
      if (!name) return;
      const tag = el.tagName === "A" ? "link" : "button";
      const opener =
        el.hasAttribute("aria-haspopup") || el.hasAttribute("aria-expanded") || el.getAttribute("aria-pressed") === "false";
      out.push({ name, tag, href: el.getAttribute("href") || "", shape: `${el.tagName}.${(el.className || "").toString().slice(0, 32)}`, opener });
    });
    return out;
  });

const locate = (p, c) => (c.tag === "link" ? p.getByRole("link", { name: c.name, exact: true }).first() : p.getByRole("button", { name: c.name, exact: true }).first());

async function press(p, c) {
  const before = await snapshot(p);
  const target = locate(p, c);
  if ((await target.count()) === 0) return "missing";
  /* Hold the element itself: a label that changes on press must not send
     the check looking for the old name. */
  const handle = await target.elementHandle({ timeout: 3000 });
  const selfBefore = await handle.evaluate(selfState);
  await handle.click({ timeout: 3000 });
  await p.waitForTimeout(650);
  const after = await snapshot(p);
  const selfAfter = await handle.evaluate(selfState).catch(() => "gone");
  if (changed(before, after) || selfBefore !== selfAfter) return "ok";
  /* A route change on the dev server can land after a second. Look once
     more before calling it nothing. */
  await p.waitForTimeout(1500);
  const later = await snapshot(p);
  const selfLater = await handle.evaluate(selfState).catch(() => "gone");
  return changed(before, later) || selfBefore !== selfLater ? "ok" : "nothing";
}

for (const { path, vp } of PAGES) {
  const label = `${path} @${vp.width}`;
  const page = await browser.newPage({ viewport: vp });
  try {
    await page.goto(BASE + path, { waitUntil: "load", timeout: 45000 });
  } catch {
    findings.push({ page: label, control: "(the page itself)", note: "did not load" });
    await page.close();
    continue;
  }
  await page.waitForTimeout(900);
  const first = await controls(page);

  /* Pass one: every control on the page as it opens. */
  const seen = new Set();
  for (const c of first) {
    const key = `${c.tag}:${c.name}`;
    if (seen.has(key) || SKIP.test(c.name)) continue;
    seen.add(key);
    if (c.tag === "link") {
      if (!c.href || c.href === "#") {
        deadLinks.push({ page: label, link: c.name, href: c.href || "(none)" });
        continue;
      }
      if (c.href.startsWith("http") || c.href.startsWith("mailto:")) continue;
      const clean = c.href.split("#")[0];
      if (!visited.has(clean)) {
        visited.add(clean);
        const probe = await browser.newPage({ viewport: vp });
        try {
          const res = await probe.goto(BASE + clean, { waitUntil: "load", timeout: 30000 });
          await probe.waitForTimeout(500);
          /* Only the router's own not-found page counts; a bare "404" can be a number in a chart. */
          const notFound = (await probe.getByText(/This page could not be found/i).count()) > 0;
          if (!res || res.status() >= 400 || notFound) deadLinks.push({ page: label, link: c.name, href: c.href });
        } catch {
          deadLinks.push({ page: label, link: c.name, href: c.href, note: "did not load" });
        }
        await probe.close();
      }
      continue;
    }
    const fresh = await browser.newPage({ viewport: vp });
    try {
      await fresh.goto(BASE + path, { waitUntil: "load" });
      await fresh.waitForTimeout(500);
      const r = await press(fresh, c);
      if (r === "nothing") findings.push({ page: label, control: c.name });
    } catch {
      findings.push({ page: label, control: c.name, note: "not clickable" });
    }
    await fresh.close();
  }

  /* Pass two: press each opener, then everything it revealed. */
  const openers = first.filter((c) => c.tag === "button" && !SKIP.test(c.name) && (c.opener || TAB_OPENERS.test(c.name)));
  for (const o of openers) {
    const fresh = await browser.newPage({ viewport: vp });
    try {
      await fresh.goto(BASE + path, { waitUntil: "load" });
      await fresh.waitForTimeout(500);
      const before = new Set(first.map((c) => `${c.tag}:${c.name}`));
      const opener = locate(fresh, o);
      if ((await opener.count()) === 0) {
        await fresh.close();
        continue;
      }
      await opener.click({ timeout: 3000 });
      await fresh.waitForTimeout(500);
      const revealed = (await controls(fresh)).filter((c) => !before.has(`${c.tag}:${c.name}`) && !SKIP.test(c.name));
      const perShape = new Map();
      for (const c of revealed) {
        const n = perShape.get(c.shape) ?? 0;
        if (n >= PER_SHAPE) continue;
        perShape.set(c.shape, n + 1);
        if (c.tag === "link") {
          if (!c.href || c.href === "#") deadLinks.push({ page: `${label} > ${o.name}`, link: c.name, href: c.href || "(none)" });
          continue;
        }
        const again = await browser.newPage({ viewport: vp });
        try {
          await again.goto(BASE + path, { waitUntil: "load" });
          await again.waitForTimeout(500);
          await locate(again, o).click({ timeout: 3000 });
          await again.waitForTimeout(450);
          const r = await press(again, c);
          if (r === "nothing") findings.push({ page: `${label} > ${o.name}`, control: c.name });
        } catch {
          findings.push({ page: `${label} > ${o.name}`, control: c.name, note: "not clickable" });
        }
        await again.close();
      }
    } catch {
      /* An opener that cannot be pressed is already reported by pass one. */
    }
    await fresh.close();
  }
  await page.close();
}

/* The two surfaces only time or a sign-out can reach. */
{
  const page = await browser.newPage({ viewport: DESKTOP });
  await page.goto(`${BASE}/hq/office`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /^Available/ }).click();
  await page.getByRole("dialog", { name: /Set your status/ }).getByRole("button", { name: "Sign out" }).click();
  await page.waitForTimeout(500);
  const r = await press(page, { tag: "button", name: "Sign in again" });
  if (r !== "ok") findings.push({ page: "signed-out screen", control: "Sign in again", note: r });
  await page.close();

  const ctx = await browser.newContext({ viewport: DESKTOP });
  const pw = await ctx.newPage();
  await pw.clock.install();
  await pw.goto(`${BASE}/hq/settings`, { waitUntil: "load" });
  await pw.waitForTimeout(800);
  await pw.getByLabel("Sign out after inactivity").selectOption("5");
  await pw.clock.fastForward(4 * 60_000 + 5_000);
  await pw.waitForTimeout(300);
  for (const name of ["I am here", "Watch the whole computer instead"]) {
    if ((await pw.getByRole("button", { name }).count()) === 0) continue;
    const r = await press(pw, { tag: "button", name });
    if (r === "nothing") findings.push({ page: "inactivity warning", control: name });
    await pw.clock.fastForward(4 * 60_000 + 5_000);
    await pw.waitForTimeout(300);
  }
  await ctx.close();
}

await browser.close();

if (findings.length === 0 && deadLinks.length === 0) {
  console.log("Every control does something, and every link lands.");
} else {
  if (findings.length) {
    console.log(`CONTROLS THAT DID NOTHING (${findings.length}):`);
    console.table(findings);
  }
  if (deadLinks.length) {
    console.log(`LINKS THAT GO NOWHERE (${deadLinks.length}):`);
    console.table(deadLinks);
  }
  process.exitCode = 1;
}
