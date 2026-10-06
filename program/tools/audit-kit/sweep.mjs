// Route sweep: visits every route of every app as one person, and records how each page
// behaves. Static routes are visited first. Dynamic ones (/projects/:id) are then filled in
// from links found on the pages already visited, or from a seeded sample (lib/samples.mjs).
// Pages meant for people who aren't signed in (sign-in pages, public share and guest links)
// come last, in a separate signed-out browser context: that way they can't end the session the
// other routes run in, and they're seen the way their real audience sees them.
//
//   node sweep.mjs                                   all apps, as Mona (sees everything)
//   node sweep.mjs --apps files,tasks --as salma.nabil@orgtik.test
//   node sweep.mjs --width 390 --height 844 --label mobile
//   node sweep.mjs --freeze --no-axe --no-shots
//
// The mock data is reset before and after the run. Clocks stay real by default, the only setup
// in which the browser, the Next servers and the mock agree on "now": --freeze can move the mock
// and the browser to AUDIT_NOW, but not the Next servers, so anything a page renders from the
// time on the server (a relative date, a "today" marker) can then fail hydration. Use --freeze
// for repeatable screenshots, and check any hydration error it reports with a real-clock run. The run stops cleanly (exit code 2) when the workspace drive drops below
// --min-free-mb. Writes audits/<app>/sweep-<label>.json, screenshots under
// audits/<app>/shots/, and audits/sweep-<label>.csv (updated after each app; rows of apps
// not in this run are kept, so apps can be swept one at a time).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { APPS, AUDITS, AUDIT_NOW, AUDIT_TZ, MIN_FREE_MB, args, freeMB, mergeCsv, readRoutes, redact, slug, webUrl } from "./lib/suite.mjs";
import { mock } from "./lib/mock.mjs";
import { signIn } from "./lib/session.mjs";
import { sampleFor } from "./lib/samples.mjs";
import { axe, settle, structure, watch } from "./lib/checks.mjs";

const opt = args({ as: "mona.adel@orgtik.test", width: "1440", height: "900", label: "baseline", locale: "en", "min-free-mb": String(MIN_FREE_MB) });
const wanted = opt.apps ? String(opt.apps).split(",") : Object.keys(APPS);
const width = Number(opt.width);
const height = Number(opt.height);
const minFree = Number(opt["min-free-mb"]);
const combo = `${opt.locale}-light-${width}`;
const frozen = Boolean(opt.freeze);

// Route groups (routes.csv) whose pages are for people who aren't signed in.
const VISITOR_GROUPS = new Set(["auth", "share", "guest"]);

const routes = readRoutes().filter((r) => wanted.includes(r.app));
const patternOf = (route) => new RegExp("^" + route.replace(/:[^/]+/g, "[^/]+").replace(/\*[^/]+/g, ".+") + "/?$");
// Which route a path renders, the way the router picks: segment by segment, a static segment beats
// a parameter, which beats a catch-all. A discovered link is only a sample for the route it renders
// (so /auth never stands in for the /*rest not-found page).
const rank = (route) => route.split("/").filter(Boolean).map((s) => (s.startsWith("*") ? 1 : s.startsWith(":") ? 2 : 3));
const moreSpecific = (a, b) => {
  const [x, y] = [rank(a.route), rank(b.route)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
};
const routeFor = (appRoutes, p) => appRoutes.filter((x) => patternOf(x.route).test(p)).reduce((best, x) => (!best || moreSpecific(x, best) ? x : best), null);
// A root catch-all is the app's not-found page: with no link to follow, visit a path nothing else serves.
const isRootCatchAll = (r) => /^\/\*[^/]+$/.test(r.route);
const MISSING_PAGE = "/audit-missing-page";
const prefixOf = (r) => (r.locale_prefixed === "yes" ? `/${opt.locale}` : "");
const forVisitors = (r) => VISITOR_GROUPS.has(r.group);

const COLS = ["app", "route", "session", "url", "status", "final", "auth_redirect", "token_in_url", "error", "load_ms", "console_errors", "page_errors", "api_errors", "api_error_sample", "axe_critical", "axe_serious", "axe_rules", "h1", "unnamed_controls", "img_no_alt", "small_targets", "screenshot"];
const blankRow = (fields) => ({ ...Object.fromEntries(COLS.map((c) => [c, ""])), ...fields });

async function visit(page, url) {
  const log = watch(page);
  const started = Date.now();
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: "load", timeout: 120000 });
    status = res ? res.status() : 0;
    // Dev servers keep a socket open, so "networkidle" may never come: give it a bounded wait.
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(900);
  } catch (e) {
    return { status: 0, error: String(e.message).split("\n")[0], ms: Date.now() - started, log, links: [] };
  }
  const final = page.url();
  const links = await page
    .evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => h.startsWith(location.origin)))
    .catch(() => []);
  return { status, final, ms: Date.now() - started, log, links };
}

const rows = [];
const writeCsv = () => mergeCsv(path.join(AUDITS, `sweep-${opt.label}.csv`), COLS, rows);

const browser = await chromium.launch();
const startedAt = new Date().toISOString();
let stopped = "";
try {
  // Resetting rebuilds every app's data: take the shared lock first (lib/mock.mjs).
  await mock.lock("sweep");
  if (frozen) await mock.setClock(AUDIT_NOW, true);
  else await mock.reset();

  for (const app of wanted) {
    if (stopped) break;
    const appRoutes = routes.filter((r) => r.app === app);
    if (!appRoutes.length) continue;
    const newContext = async () => {
      const c = await browser.newContext({ viewport: { width, height }, locale: "en-US", timezoneId: AUDIT_TZ });
      if (frozen) await c.clock.setFixedTime(new Date(AUDIT_NOW));
      return c;
    };
    const context = await newContext();
    const auth = await signIn(context, app, opt.as);
    const shotsDir = path.join(AUDITS, app, "shots");
    fs.mkdirSync(shotsDir, { recursive: true });
    const results = [];
    const seen = new Set();
    const discovered = [];

    const skip = (r, session, error) => {
      const row = blankRow({ app, route: r.route, session, error });
      rows.push(row);
      results.push(row);
      console.log(`[${app}] --  ${r.route}  (${error})`);
    };

    // A page that never settles is recorded as failed instead of stalling the run.
    const run = (ctx, session, r, url) => {
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
          const row = blankRow({ app, route: r.route, session, url: redact(url.replace(webUrl(app), "")), error: "the page didn't settle within 3 minutes" });
          rows.push(row);
          results.push(row);
          console.log(`[${app}] --  ${r.route}  (didn't settle within 3 minutes)`);
          resolve();
        }, 180000);
      });
      // The timer is cleared as soon as the page finishes, or it would add a false failure later.
      return Promise.race([runPage(ctx, session, r, url), timeout]).finally(() => clearTimeout(timer));
    };
    const runPage = async (ctx, session, r, url) => {
      const free = freeMB();
      if (free < minFree) {
        stopped = `only ${free} MB free on the workspace drive (the floor is ${minFree} MB)`;
        return;
      }
      const page = await ctx.newPage();
      const v = await visit(page, url);
      if (session === "signed-in") discovered.push(...v.links);
      let checks = null;
      let a11y = null;
      const shot = `${slug(r.route)}__${combo}.png`;
      if (v.status && !v.error) {
        await settle(page);
        checks = await structure(page).catch(() => null);
        if (!opt["no-axe"]) a11y = await axe(page).catch((e) => ({ error: String(e.message).split("\n")[0] }));
        if (!opt["no-shots"]) await page.screenshot({ path: path.join(shotsDir, shot), fullPage: true }).catch(() => {});
      }
      const finalUrl = v.final ? new URL(v.final) : null;
      const finalPath = finalUrl ? finalUrl.pathname : "";
      const row = blankRow({
        app,
        route: r.route,
        session,
        url: redact(url.replace(webUrl(app), "")),
        status: v.status,
        final: finalPath,
        // Only meaningful while signed in: signed-out rows are visitor pages by definition.
        auth_redirect: session === "signed-in" && /\/auth|not-allowed|\/login/.test(finalPath) ? "yes" : "",
        // A bearer token left in the address bar leaks through history, logs and referrers.
        token_in_url: finalUrl && /(^|[?&])(access_?)?token=/i.test(finalUrl.search) ? "yes" : "",
        error: v.error || "",
        load_ms: v.ms,
        console_errors: v.log.console.length,
        page_errors: v.log.page.length,
        api_errors: v.log.api.length,
        api_error_sample: v.log.api.slice(0, 2).map((x) => `${x.status} ${x.method} ${redact(x.url)}`).join(" | "),
        axe_critical: a11y?.critical ?? "",
        axe_serious: a11y?.serious ?? "",
        axe_rules: a11y?.violations ? a11y.violations.map((x) => x.id).join(" ") : "",
        h1: checks?.h1 ?? "",
        unnamed_controls: checks?.unnamed ?? "",
        img_no_alt: checks?.imgNoAlt ?? "",
        small_targets: checks?.small ?? "",
        screenshot: !opt["no-shots"] && v.status && !v.error ? `${app}/shots/${shot}` : "",
      });
      const api = v.log.api.slice(0, 10).map((x) => ({ ...x, url: redact(x.url) }));
      results.push({ ...row, console: v.log.console.slice(0, 5), pageErrors: v.log.page.slice(0, 5), api, axe: a11y?.violations || [] });
      rows.push(row);
      const note = row.auth_redirect ? "  -> sign-in" : session === "signed-out" ? "  (signed out)" : "";
      console.log(`[${app}] ${String(row.status).padEnd(3)} ${r.route}${note}  (${row.load_ms}ms, console ${row.console_errors}, api ${row.api_errors}, axe ${row.axe_critical || 0}/${row.axe_serious || 0})`);
      await page.close();
    };

    const member = appRoutes.filter((x) => !forVisitors(x));
    for (const r of member.filter((x) => !x.dynamic)) {
      if (stopped) break;
      seen.add(r.route);
      await run(context, "signed-in", r, webUrl(app) + prefixOf(r) + (r.route === "/" ? "" : r.route));
    }
    for (const r of member.filter((x) => x.dynamic)) {
      if (stopped) break;
      const hit =
        discovered
          .map((h) => new URL(h).pathname.replace(new RegExp(`^/${opt.locale}(?=/|$)`), "") || "/")
          .find((p) => !seen.has(p) && routeFor(appRoutes, p) === r) ??
        sampleFor(app, r.route) ??
        (isRootCatchAll(r) ? MISSING_PAGE : null);
      if (!hit) {
        skip(r, "signed-in", "no sample link found");
        continue;
      }
      seen.add(hit);
      await run(context, "signed-in", r, webUrl(app) + prefixOf(r) + hit);
    }
    await context.close();

    const visitorRoutes = appRoutes.filter(forVisitors);
    if (visitorRoutes.length && !stopped) {
      const visitor = await newContext();
      for (const r of visitorRoutes) {
        if (stopped) break;
        const p = r.dynamic ? sampleFor(app, r.route) : r.route;
        if (!p) {
          skip(r, "signed-out", "no sample link found");
          continue;
        }
        await run(visitor, "signed-out", r, webUrl(app) + prefixOf(r) + p);
      }
      await visitor.close();
    }

    fs.writeFileSync(
      path.join(AUDITS, app, `sweep-${opt.label}.json`),
      JSON.stringify({ app, as: opt.as, combo, frozen, at: startedAt, signIn: { ...auth, landed: redact(auth.landed) }, ...(stopped ? { stopped } : {}), results }, null, 2),
    );
    writeCsv();
  }
} finally {
  await browser.close();
  if (frozen) await mock.realClock().catch(() => {});
  await mock.reset().catch(() => {});
}

const n = (f) => rows.filter(f).length;
console.log(`\n${rows.length} routes · loaded ${n((r) => r.status >= 200 && r.status < 400 && !r.auth_redirect)} · sign-in redirects ${n((r) => r.auth_redirect)} · failed ${n((r) => r.status >= 400 || (r.error && r.error !== "no sample link found"))} · no sample ${n((r) => r.error === "no sample link found")}`);
console.log(`with console errors ${n((r) => r.console_errors > 0)} · with failing API calls ${n((r) => r.api_errors > 0)} · with critical/serious axe issues ${n((r) => (r.axe_critical || 0) + (r.axe_serious || 0) > 0)} · token in URL ${n((r) => r.token_in_url)}`);
console.log(`Written: audits/sweep-${opt.label}.csv`);
if (stopped) {
  console.log(`\nStopped early: ${stopped}. Free some space and run it again.`);
  process.exitCode = 2;
}
