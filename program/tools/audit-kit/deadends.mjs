// Dead-end detector: presses every named button on every page the sweep loaded, and reports
// the ones where nothing happened. "Something happened" means the URL changed; a dialog, menu,
// listbox, new tab, file chooser, download or native dialog opened; the visible text or the DOM
// changed; or the control's own state changed. A copy to the clipboard with none of those is
// reported separately: it works, but the person gets no feedback. Every link on the page is also
// checked against the route inventory (links into other suite apps included).
//
// Adapted from somion-hq/deadends.mjs for the whole suite:
// - Signs in first; each press runs in a fresh browser context restored from the signed-in
//   state, so a language or theme switch can't leak into the next press.
// - Starts every page from fresh mock data.
// - Skips destructive or session-ending controls by name, so runs are repeatable (their flows
//   get dedicated tests); skipped controls are still listed.
// - Control names come from Playwright's accessibility snapshot, the same names its locators
//   match, so every control found can be located again.
//
//   node deadends.mjs                                  pages from the baseline sweep, all apps
//   node deadends.mjs --apps files --from smoke --label smoke --max-controls 20
//   node deadends.mjs --apps tasks --route /projects   only routes containing "/projects"
//
// Writes audits/<app>/deadends-<label>.json and audits/deadends-<label>.csv (updated after each app;
// rows of apps not in this run are kept).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { APPS, AUDITS, AUDIT_TZ, MIN_FREE_MB, args, freeMB, mergeCsv, readRoutes, webUrl } from "./lib/suite.mjs";
import { mock } from "./lib/mock.mjs";
import { signIn } from "./lib/session.mjs";
import { sampleFor } from "./lib/samples.mjs";
import { settle } from "./lib/checks.mjs";

const opt = args({ as: "mona.adel@orgtik.test", from: "baseline", label: "baseline", "max-controls": "40", locale: "en", "min-free-mb": String(MIN_FREE_MB) });
const wanted = opt.apps ? String(opt.apps).split(",") : Object.keys(APPS);
const maxControls = Number(opt["max-controls"]);
// A --route run covers part of an app, so it never overwrites the full report.
const label = opt.route ? `${opt.label}-subset` : opt.label;
const minFree = Number(opt["min-free-mb"]);

// Pressed only in dedicated flow tests: they destroy data, end the session or leave a call, so
// pressing them here would make the run depend on its own order.
// Unnamed buttons are matched by their icon ("trash-2", "log-out").
const SKIP = /\b(delete|remove|archive|leave|end call|hang up|stop|decline|reject|revoke|rotate|deactivate|terminate|log[ -]?out|sign[ -]?out|record|pay|purchase|trash(-2)?|user-minus|phone-off)\b|reset (demo|data|workspace)/i;

const LOCALE_PREFIX = /^\/(en|ar|de|fr|it)(?=\/|$)/;
const routes = readRoutes();
const patternOf = (route) => new RegExp("^" + route.replace(/:[^/]+/g, "[^/]+").replace(/\*[^/]+/g, ".+") + "/?$");
const knownRoute = (app, pathname) => {
  const p = pathname.replace(LOCALE_PREFIX, "") || "/";
  return routes.some((r) => r.app === app && patternOf(r.route).test(p));
};
const appAt = (origin) => Object.keys(APPS).find((k) => webUrl(k) === origin) || null;
const signInWall = (p) => /\/auth(\/|$)|not-allowed|\/login/.test(p);
const firstLine = (e) => String(e?.message || e).split("\n")[0].slice(0, 200);
// Every step that talks to the page gets a deadline. A control that freezes the page (a modal
// print dialog, a script that never returns) then becomes a "stuck" finding instead of stalling
// the whole run.
const deadline = (promise, ms, what) => {
  let timer;
  const expired = new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(`${what} took over ${ms / 1000}s`)), ms)));
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer));
};
const closeQuietly = (ctx) => deadline(ctx.close(), 15000, "closing the browser context").catch(() => {});
// Why a click failed, from Playwright's call log ("<div> intercepts pointer events", ...).
const clickFailure = (e) => {
  const log = String(e?.message || e);
  const m = log.match(/<[^>]{0,120}>(?: from <[^>]{0,120}>)? subtree intercepts pointer events|<[^>]{0,120}> intercepts pointer events|element is not (?:visible|stable|enabled)|element is outside of the viewport|element was detached from the DOM/);
  return m ? m[0] : firstLine(e);
};

const CONTEXT = { viewport: { width: 1440, height: 900 }, locale: "en-US", timezoneId: AUDIT_TZ, permissions: ["clipboard-read", "clipboard-write"] };

// Counts clipboard writes, so a copy with no visible feedback can be told apart from a dead end.
function clipboardSpy() {
  window.__auditCopies = 0;
  const c = navigator.clipboard;
  for (const m of ["writeText", "write"]) {
    if (!c?.[m]) continue;
    const orig = c[m].bind(c);
    c[m] = (...a) => {
      window.__auditCopies++;
      return orig(...a);
    };
  }
  const exec = document.execCommand.bind(document);
  document.execCommand = (cmd, ...rest) => {
    if (cmd === "copy") window.__auditCopies++;
    return exec(cmd, ...rest);
  };
}

// What the person can see. Tooltips are left out: pointing at a control shows one, and that's
// not the control answering.
const look = (page) =>
  page.evaluate(() => {
    const tips = [...document.querySelectorAll("[role=tooltip]")];
    let text = document.body.innerText;
    for (const t of tips) text = text.replace(t.innerText, "");
    return {
      origin: location.origin,
      url: location.pathname + location.search,
      html: document.body.innerHTML.length - tips.reduce((n, t) => n + t.outerHTML.length, 0),
      text,
      layers: document.querySelectorAll("[role=dialog],[role=alertdialog],[role=listbox],[role=menu]").length,
      copies: window.__auditCopies || 0,
    };
  });
const lookAfter = async (page) => {
  try {
    return await look(page);
  } catch {
    // The press started a full page load: look again once it's done.
    await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
    return look(page).catch(() => ({ origin: "(unreadable)", url: "(unreadable)", html: 0, text: "", layers: 0, copies: 0 }));
  }
};
// The control's own answer: a toggle that flips, a label that changes ("Copy" to "Copied").
const selfState = (el) =>
  el ? `${el.isConnected}|${el.textContent}|${el.getAttribute("aria-pressed")}|${el.getAttribute("aria-expanded")}|${el.getAttribute("aria-checked")}|${el.getAttribute("aria-selected")}|${el.disabled}` : "gone";

// Buttons, and links that go nowhere (href "#" or javascript:), from the accessibility snapshot.
function controlsIn(tree) {
  const lines = tree.split("\n");
  const out = [];
  const seen = new Set();
  lines.forEach((line, i) => {
    const m = line.match(/^\s*- (button|link)(?: "((?:[^"\\]|\\.)*)")?(.*)$/);
    if (!m) return;
    const [, role, raw, attrs] = m;
    if (/\[disabled(=true)?\]/.test(attrs)) return;
    if (role === "button" && /\[(pressed|checked|selected)(=true)?\]/.test(attrs)) return;
    if (role === "link") {
      const url = (lines[i + 1] || "").match(/^\s*- \/url: (.*)$/)?.[1]?.trim();
      if (url !== undefined && url !== "#" && !/^javascript:/i.test(url)) return;
    }
    if (raw === undefined || raw === "") return; // unnamed: see unnamedButtons()
    const name = JSON.parse(`"${raw}"`);
    const key = `${role}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ role, name });
  });
  return out;
}

// Buttons with no accessible name can't be found again by name, so they're located by their DOM
// path (the seed is deterministic, so a reload renders the same tree) and labelled by their icon.
// Runs in the page.
function unnamedButtons() {
  const named = (el) => (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || el.textContent || "").trim();
  const pathOf = (el) => {
    const parts = [];
    for (; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
      let i = 1;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) i++;
      parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${i})`);
    }
    return "body > " + parts.join(" > ");
  };
  const iconOf = (b) => {
    const svg = b.querySelector("svg");
    if (svg) {
      const lucide = [...svg.classList].find((c) => c.startsWith("lucide-") && c !== "lucide-icon");
      if (lucide) return lucide.slice(7);
      let h = 0;
      for (const ch of svg.querySelector("path")?.getAttribute("d") || svg.innerHTML) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return `icon ${h.toString(16).padStart(8, "0").slice(0, 6)}`;
    }
    const img = b.querySelector("img");
    if (img) return `image ${(img.getAttribute("src") || "").split("/").pop().slice(0, 30)}`;
    return "no icon";
  };
  const all = [];
  for (const b of document.querySelectorAll("button, [role=button]")) {
    const r = b.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || b.disabled || b.getAttribute("aria-disabled") === "true" || named(b)) continue;
    all.push({ icon: iconOf(b), css: pathOf(b) });
  }
  return all;
}

async function inventory(ctx, app, url) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 120000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await settle(page);
    const final = new URL(page.url()).pathname;
    const tree = await page.locator("body").ariaSnapshot({ timeout: 15000 }).catch(() => "");
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.href, text: (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) })),
    );
    const broken = new Map();
    for (const { href, text } of hrefs) {
      let u;
      try {
        u = new URL(href);
      } catch {
        continue;
      }
      const target = appAt(u.origin);
      if (!target || /^\/(_next|api)\//.test(u.pathname) || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) continue;
      if (!knownRoute(target, u.pathname)) broken.set(`${target}${u.pathname}`, { target, path: u.pathname, text });
    }
    const unnamed = await page.evaluate(unnamedButtons).catch(() => []);
    const icons = new Set();
    const unnamedControls = unnamed.filter((u) => !icons.has(u.icon) && icons.add(u.icon)).map((u) => ({ role: "button", name: `(unnamed: ${u.icon})`, css: u.css }));
    return { final, controls: controlsIn(tree), unnamed: unnamed.length, unnamedControls, broken: [...broken.values()] };
  } finally {
    await page.close().catch(() => {});
  }
}

const locate = (page, control) => (control.css ? page.locator(control.css) : page.getByRole(control.role, { name: control.name, exact: true })).first();

async function press(ctx, url, control, session) {
  const page = await ctx.newPage();
  const events = [];
  page.on("popup", (p) => {
    events.push("new tab");
    p.close().catch(() => {});
  });
  page.on("dialog", (d) => {
    events.push(`native ${d.type()}`);
    d.dismiss().catch(() => {});
  });
  page.on("filechooser", () => events.push("file chooser"));
  page.on("download", (d) => {
    events.push("download");
    d.cancel().catch(() => {});
  });
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await settle(page);
    const target = locate(page, control);
    if ((await target.count()) === 0) return { outcome: "not found", detail: "not on the page after a reload" };
    if (await target.evaluate((el) => getComputedStyle(el).pointerEvents === "none").catch(() => false)) {
      return { outcome: "skipped", detail: "only reachable on hover (covered by flow tests)" };
    }
    const handle = await target.elementHandle({ timeout: 3000 });
    await handle.hover({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    const before = await look(page);
    const selfBefore = await handle.evaluate(selfState);
    try {
      await handle.click({ timeout: 3000 });
    } catch (e) {
      return { outcome: "not clickable", detail: clickFailure(e) };
    }
    const verdict = async () => {
      const after = await lookAfter(page);
      const selfAfter = await handle.evaluate(selfState).catch(() => "gone");
      if (events.length) return { outcome: "opened", detail: [...new Set(events)].join(", ") };
      if (after.url === "(unreadable)") return { outcome: "navigated", detail: "a new page loaded (not readable)" };
      // Every press starts in a new tab, like following a shared link. A "back" button that uses
      // browser history then lands on about:blank: opened from a link, it leaves the app.
      if (after.origin === "null") return { outcome: "left the app", detail: "went back in browser history; opened from a link, this leaves the app" };
      if (after.url !== before.url || after.origin !== before.origin) {
        const to = after.url.split("?")[0];
        const where = after.origin === before.origin ? to : `${appAt(after.origin) || after.origin} app: ${to}`;
        // Sending a signed-out visitor to sign in is the job of a visitor page, not a wall.
        return session === "signed-in" && signInWall(to) ? { outcome: "sign-in wall", detail: `sent to ${where}` } : { outcome: "navigated", detail: where };
      }
      if (after.layers !== before.layers) return { outcome: "opened", detail: "dialog, menu or listbox" };
      if (after.text !== before.text || Math.abs(after.html - before.html) > 40 || selfAfter !== selfBefore) return { outcome: "changed", detail: "" };
      if (after.copies > before.copies) return { outcome: "copied silently", detail: "copied to the clipboard with no visible feedback" };
      return null;
    };
    await page.waitForTimeout(650);
    let v = await verdict();
    if (!v) {
      // A route change on the dev server can land after a second: look once more.
      await page.waitForTimeout(1500);
      v = await verdict();
    }
    return v || { outcome: "dead end", detail: "nothing visible happened" };
  } catch (e) {
    return { outcome: "not clickable", detail: firstLine(e) };
  } finally {
    await page.close().catch(() => {});
  }
}

// A toggle that's already on (the "Grid view" of a Grid/List switch) does nothing when pressed,
// by design. When it isn't marked aria-pressed or aria-selected the first pass calls it dead, so
// dead controls get a second look: press a neighbouring button in the same group first, and if
// the control then answers, it's the active option. Inconclusive (the dead end stands) if the
// neighbour opened a layer or left the page.
async function pressAfterNeighbour(ctx, url, control) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await settle(page);
    const target = locate(page, control);
    if ((await target.count()) === 0) return null;
    const handle = await target.elementHandle({ timeout: 3000 });
    // The nearest ancestor (up to three levels up) holding another button is the group.
    const neighbour = (
      await handle.evaluateHandle((el) => {
        let box = el.parentElement;
        for (let i = 0; i < 3 && box; i++, box = box.parentElement) {
          const other = [...box.querySelectorAll("button, [role=button]")].find((b) => b !== el && !b.contains(el) && !el.contains(b));
          if (other) return other;
        }
        return null;
      })
    ).asElement();
    if (!neighbour) return null;
    const start = await look(page);
    await neighbour.click({ timeout: 3000 });
    await page.waitForTimeout(650);
    const before = await look(page);
    if (before.url !== start.url || before.layers !== start.layers) return null;
    const selfBefore = await handle.evaluate(selfState);
    await handle.click({ timeout: 3000 });
    await page.waitForTimeout(650);
    const after = await lookAfter(page);
    const selfAfter = await handle.evaluate(selfState).catch(() => "gone");
    const answered = after.url !== before.url || after.layers !== before.layers || after.text !== before.text || Math.abs(after.html - before.html) > 40 || selfAfter !== selfBefore;
    return answered ? { outcome: "active option", detail: "already selected, so pressing it again does nothing; not marked aria-pressed or aria-selected" } : null;
  } catch {
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

function pagesFor(app) {
  const file = path.join(AUDITS, app, `sweep-${opt.from}.json`);
  if (!fs.existsSync(file)) return null;
  const { results } = JSON.parse(fs.readFileSync(file, "utf8"));
  return results
    .filter((r) => r.status >= 200 && r.status < 400 && !r.auth_redirect && r.url)
    .filter((r) => !opt.route || r.route.includes(String(opt.route)))
    .map((r) => {
      let url = r.url;
      // Sampled public links are written redacted; rebuild them from the seed.
      if (url.includes("[redacted]")) {
        const p = sampleFor(app, r.route);
        if (!p) return null;
        url = (LOCALE_PREFIX.exec(url)?.[0] || "") + p;
      }
      return { route: r.route, url: webUrl(app) + url, shown: r.url, session: r.session || "signed-in" };
    })
    .filter(Boolean);
}

const COLS = ["app", "route", "url", "session", "role", "control", "outcome", "detail", "where"];
const rows = [];
const writeCsv = () => mergeCsv(path.join(AUDITS, `deadends-${label}.csv`), COLS, rows);

const browser = await chromium.launch();
const startedAt = new Date().toISOString();
const summary = [];
let stopped = "";
try {
  for (const app of wanted) {
    if (stopped) break;
    const pages = pagesFor(app);
    if (!pages) {
      console.log(`[${app}] no audits/${app}/sweep-${opt.from}.json yet: run the sweep first`);
      continue;
    }
    // Sign in once, then check that a context restored from that state is still signed in.
    // (An app that keeps its session in sessionStorage isn't; it then signs in for every press.)
    const first = await browser.newContext(CONTEXT);
    const auth = await signIn(first, app, opt.as);
    const state = await first.storageState();
    await first.close();
    let fullSignIn = false;
    const home = pages.find((p) => p.session === "signed-in");
    if (home) {
      const probe = await browser.newContext({ ...CONTEXT, storageState: state });
      const pg = await probe.newPage();
      await pg.goto(home.url, { waitUntil: "load", timeout: 120000 }).catch(() => {});
      await pg.waitForTimeout(1500);
      fullSignIn = signInWall(new URL(pg.url()).pathname);
      await probe.close();
    }
    const contextFor = async (session) => {
      const ctx = await browser.newContext({ ...CONTEXT, ...(session === "signed-in" && !fullSignIn ? { storageState: state } : {}) });
      await ctx.addInitScript(clipboardSpy);
      if (session === "signed-in" && fullSignIn) await signIn(ctx, app, opt.as);
      return ctx;
    };

    const report = { app, as: opt.as, from: opt.from, at: startedAt, signIn: { ok: auth.ok, restoredFromState: !fullSignIn }, pages: [] };
    const records = [];
    for (const pg of pages) {
      const free = freeMB();
      if (free < minFree) {
        stopped = `only ${free} MB free on the workspace drive (the floor is ${minFree} MB)`;
        break;
      }
      // Reset under the shared lock; re-taking it per page keeps a long run from looking stale.
      await mock.lock("deadends");
      await deadline(mock.reset(), 30000, "resetting the mock data");
      const ctx = await contextFor(pg.session);
      let inv;
      try {
        inv = await deadline(inventory(ctx, app, pg.url), 180000, "loading the page");
      } catch (e) {
        await closeQuietly(ctx);
        report.pages.push({ route: pg.route, url: pg.shown, session: pg.session, error: firstLine(e) });
        console.log(`[${app}] ${pg.route}: didn't load (${firstLine(e)})`);
        continue;
      }
      await closeQuietly(ctx);
      const pageRow = { route: pg.route, url: pg.shown, session: pg.session, unnamedButtons: inv.unnamed, found: inv.controls.length, truncated: 0, results: [] };
      // One record per control, shared by the JSON and the CSV.
      const add = (control, outcome, detail) => {
        const rec = { app, route: pg.route, url: pg.shown, session: pg.session, role: control.role, control: control.name, outcome, detail, where: control.css || "" };
        pageRow.results.push(rec);
        records.push(rec);
      };
      for (const l of inv.broken) add({ role: "link", name: l.text }, "broken link", `${l.target === app ? "" : `${l.target} app: `}${l.path} matches no route`);
      const named = inv.controls.slice(0, maxControls);
      const unnamed = inv.unnamedControls.slice(0, Math.ceil(maxControls / 2));
      const todo = [...named, ...unnamed];
      pageRow.truncated = inv.controls.length - named.length + (inv.unnamedControls.length - unnamed.length);
      for (const c of todo) {
        if (SKIP.test(c.name)) {
          add(c, "skipped", "destructive or session-ending (covered by flow tests)");
          continue;
        }
        const pctx = await contextFor(pg.session);
        const r = await deadline(press(pctx, pg.url, c, pg.session), 90000, "the press").catch((e) => ({
          outcome: "stuck",
          detail: `${firstLine(e)}: the page stopped answering after this control was pressed`,
        }));
        await closeQuietly(pctx);
        add(c, r.outcome, r.detail);
      }
      report.pages.push(pageRow);
      const quiet = pageRow.results.filter((r) => r.outcome === "dead end").length;
      console.log(`[${app}] ${pg.route}${pg.session === "signed-out" ? " (signed out)" : ""}: ${todo.length} controls${pageRow.truncated ? ` (+${pageRow.truncated} over the limit)` : ""}, ${quiet} with no answer (checked again at the end), ${inv.broken.length} broken links, ${inv.unnamed} unnamed buttons`);
    }

    // A nav item pressed on its own page does nothing, by design. The detector can't tell that
    // from the page when the item isn't marked aria-current, so it learns every control's
    // destination from the other pages, and a "dead" control that leads to the page it's on is
    // the current-page item.
    const leadsTo = new Map();
    for (const r of records) if (r.outcome === "navigated" && !r.where) leadsTo.set(r.control, (leadsTo.get(r.control) || new Set()).add(r.detail));
    for (const r of records) {
      if (r.outcome !== "dead end" || r.where) continue;
      const here = new URL(webUrl(app) + r.url).pathname;
      if (leadsTo.get(r.control)?.has(here)) Object.assign(r, { outcome: "current page", detail: "leads to the page it's on; not marked aria-current" });
    }

    for (const r of records.filter((x) => x.outcome === "dead end")) {
      const pg = pages.find((x) => x.shown === r.url && x.route === r.route);
      const pctx = await contextFor(r.session);
      const second = await deadline(pressAfterNeighbour(pctx, pg.url, { role: r.role, name: r.control, css: r.where || undefined }), 90000, "the second look").catch(() => null);
      await closeQuietly(pctx);
      if (second) Object.assign(r, second);
    }

    const count = (o) => records.filter((r) => r.outcome === o).length;
    const tally = {
      app,
      pages: report.pages.filter((p) => !p.error).length,
      pressed: records.filter((r) => !["skipped", "broken link"].includes(r.outcome)).length,
      "dead end": count("dead end"),
      "copied silently": count("copied silently"),
      "not clickable": count("not clickable"),
      stuck: count("stuck"),
      "not found": count("not found"),
      "sign-in wall": count("sign-in wall"),
      "left the app": count("left the app"),
      "current page": count("current page"),
      "active option": count("active option"),
      skipped: count("skipped"),
      "broken link": count("broken link"),
      "unnamed buttons": report.pages.reduce((n, p) => n + (p.unnamedButtons || 0), 0),
      "over the limit": report.pages.reduce((n, p) => n + (p.truncated || 0), 0),
    };
    rows.push(...records);
    fs.mkdirSync(path.join(AUDITS, app), { recursive: true });
    fs.writeFileSync(path.join(AUDITS, app, `deadends-${label}.json`), JSON.stringify({ ...report, ...(stopped ? { stopped } : {}), tally }, null, 2));
    writeCsv();
    summary.push(tally);
  }
} finally {
  await browser.close();
  await mock.reset().catch(() => {});
}

if (summary.length) console.table(summary);
console.log(`Written: audits/deadends-${label}.csv`);
if (stopped) {
  console.log(`\nStopped early: ${stopped}. Free some space and run it again.`);
  process.exitCode = 2;
}
