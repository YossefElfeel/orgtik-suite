// Where the website runs, what gets captured, and how a page is brought to the same state every time.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROGRAM = path.resolve(here, "..", "..", "..");
export const WORKSPACE = path.resolve(PROGRAM, "..");
export const OUT = path.join(PROGRAM, "audits", "website");
export const ROUTES_FILE = path.join(OUT, "routes.json");

const require = createRequire(import.meta.url);
const config = require(path.join(WORKSPACE, "mock", "config.js"));
// SITE_URL points the harness at another copy of the site (the built one on tools/site/host.mjs).
export const SITE = process.env.SITE_URL ?? config.webUrl("website");
// SITE_DIR points at another checkout of the website (a worktree of main, for a new baseline).
export const SITE_DIR = process.env.SITE_DIR ?? path.join(WORKSPACE, config.apps.website.dir);

// The widths the design is checked at: phone, tablet, desktop.
export const VIEWPORTS = { 390: 844, 768: 1024, 1440: 900 };

// The page's clock is fake and paused: timers, requestAnimationFrame and Date only move when the
// harness advances them. Every capture ends exactly SETTLE_MS of page time after the page loaded,
// however many scroll steps it took, so rotating words and entry animations always end in the
// same state.
export const CLOCK_START = new Date("2026-09-29T09:00:00+03:00");
export const SETTLE_MS = 15000;
const STEP_MS = 50;

export function args(defaults = {}) {
  const out = { ...defaults };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export const slug = (route) =>
  (route === "/" ? "home" : route.replace(/^\//, "")).replace(/#\//g, "__").replace(/[/#?=&]+/g, "_").replace(/[^\w.-]+/g, "-").replace(/_+$/, "");

export function siteCommit() {
  try {
    const head = execFileSync("git", ["-C", SITE_DIR, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["-C", SITE_DIR, "status", "--porcelain"], { encoding: "utf8" }).trim() !== "";
    return { head, dirty };
  } catch {
    return { head: "unknown", dirty: false };
  }
}

// Reduced motion: the site's auto-advancing parts (the module explorer runs on a Web Animation,
// i.e. on real time, which the fake clock can't stop) all hold still under it. It's a designed
// state of the site, and it makes a capture repeatable to the pixel. Before and after are always
// captured the same way, so changes to content, layout and style still show.
export async function newContext(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: VIEWPORTS[width] },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "Africa/Cairo",
    reducedMotion: "reduce",
  });
  await context.clock.install({ time: CLOCK_START });
  return context;
}

const realWait = (ms) => new Promise((r) => setTimeout(r, ms));

// Polls from Node, in real time: in-page waits (waitForFunction) run on the page's timers or
// requestAnimationFrame, which the paused fake clock would freeze.
async function until(page, predicate, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await page.evaluate(predicate).catch(() => false)) return true;
    await realWait(150);
  }
  return false;
}

// Loads a route and brings it to its steady state. Each capture needs a fresh context (see
// newContext): the fake clock only moves forward, and every capture starts at the same instant.
// Returns false if the page never rendered.
export async function load(page, route) {
  await page.clock.pauseAt(CLOCK_START.getTime() + 1000);
  await page.goto(SITE + route, { waitUntil: "load", timeout: 60000 });
  // The page components are lazy. Their code downloads in real time while the page clock stands
  // still, so wait for the network first: then nothing left depends on real time.
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  let elapsed = 0;
  const run = async (ms) => {
    await page.clock.runFor(ms);
    elapsed += ms;
  };
  // React reveals a loaded lazy page on a timer. Advance page time in fixed steps, with enough real
  // time between them for React to commit, so the page mounts at the same page time every run.
  const isIn = () => !document.querySelector(".page-loading") && document.body.innerText.trim().length > 0;
  let rendered = false;
  for (let i = 0; i < 40 && !rendered; i++) {
    await run(100);
    await realWait(200);
    rendered = await page.evaluate(isIn).catch(() => false);
  }
  await run(500);
  // Scroll through the page so every scroll-triggered reveal fires and lazy images start. Reveal
  // callbacks need real rendering frames, so each step also waits a little real time.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(200, Math.floor((page.viewportSize()?.height || 800) * 0.8));
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await realWait(80);
    await run(STEP_MS);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await realWait(80);
  await run(STEP_MS);
  // Network work (images, fonts) runs on real time, which the fake clock doesn't govern.
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await until(page, () => [...document.images].every((i) => i.complete), 10000);
  await page.evaluate(() => {
    for (const v of document.querySelectorAll("video")) {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {}
    }
  });
  // The seek finishes in real time. Without this wait a capture shows the poster in one run and
  // frame 0 in the next: invisible to the eye, ~300K changed pixels on a video hero (found by the
  // D-031 drift review of d76ee3b, where /software and /services flickered between runs).
  await until(page, () => [...document.querySelectorAll("video")].every((v) => !v.seeking && (v.readyState >= 2 || v.networkState === 3 || !v.currentSrc)), 8000);
  // Finish in the same page-time state every run.
  if (elapsed < SETTLE_MS) await run(SETTLE_MS - elapsed);
  await realWait(150); // let the last frame paint
  return rendered;
}

// What a capture records besides pixels. Link URLs are dropped from the accessibility tree:
// href values may change (D-013), what people see and hear may not.
export async function snapshot(page) {
  const text = await page.evaluate(() => document.body.innerText.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim());
  const headings = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName.toLowerCase()} ${h.innerText.replace(/\s+/g, " ").trim()}`));
  const aria = (await page.locator("body").ariaSnapshot({ timeout: 20000 }).catch(() => ""))
    .split("\n")
    .filter((l) => !/^\s*- \/url: /.test(l))
    .join("\n");
  return { text, headings, aria, title: await page.title(), url: new URL(page.url()).pathname + new URL(page.url()).hash };
}

export function readRoutes() {
  if (!fs.existsSync(ROUTES_FILE)) throw new Error(`No ${path.relative(PROGRAM, ROUTES_FILE)}: run discover.mjs first.`);
  return JSON.parse(fs.readFileSync(ROUTES_FILE, "utf8")).routes;
}
