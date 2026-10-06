// Page-level checks shared by the sweep and the per-app audits.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");

// Framework dev tools that render into the page (the Next.js issues badge and overlay, Vite's
// error overlay). They're not the app, so they're hidden before screenshots and excluded from
// the checks; the errors they announce are already counted from the console.
const DEV_OVERLAYS = ["nextjs-portal", "vite-error-overlay"];

// Brings a loaded page to a steady state before it's checked or captured: dev overlays hidden,
// animations finished (a half-faded element fails contrast at random), the caret hidden, and web
// fonts loaded. CSS animations and transitions are zeroed by a stylesheet. framer-motion (in all
// seven dashboards) runs through the Web Animations API where it can, so finite animations are
// finished directly; the rest animate inline styles frame by frame, so the page is then sampled
// until its inline styles stop changing (at most 3s).
export async function settle(page) {
  await page
    .addStyleTag({
      content: `${DEV_OVERLAYS.join(", ")} { display: none !important; }
*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; caret-color: transparent !important; }`,
    })
    .catch(() => {});
  await page
    .evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const a of document.getAnimations()) {
        try {
          if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
        } catch {}
      }
      const sample = () => [...document.querySelectorAll("[style]")].map((e) => e.getAttribute("style")).join("|");
      let prev = sample();
      for (let i = 0; i < 15; i++) {
        await wait(200);
        const next = sample();
        if (next === prev) break;
        prev = next;
      }
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    })
    .catch(() => {});
}

// Structure and target checks, adapted from somion-hq/audit.mjs.
export async function structure(page) {
  return page.evaluate(() => {
    const out = { h1: 0, unnamed: [], imgNoAlt: 0, small: [] };
    out.h1 = document.querySelectorAll("h1").length;
    document.querySelectorAll("button, a[href], [role=button], input, select, textarea").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return; // not on screen
      const labelled =
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        el.getAttribute("title") ||
        (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
        el.closest("label") ||
        (el.tagName === "INPUT" && el.getAttribute("placeholder")) ||
        (el.textContent || "").trim();
      if (!labelled && el.type !== "hidden") out.unnamed.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""}`);
      if ((el.tagName === "BUTTON" || el.tagName === "A" || el.getAttribute("role") === "button") && (r.width < 24 || r.height < 24)) {
        out.small.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
    document.querySelectorAll("img").forEach((i) => {
      if (!i.hasAttribute("alt")) out.imgNoAlt++;
    });
    return { h1: out.h1, unnamed: out.unnamed.length, unnamedSample: out.unnamed.slice(0, 3), imgNoAlt: out.imgNoAlt, small: out.small.length };
  });
}

// axe-core against WCAG 2.2 A/AA. Returns the violations, grouped by rule.
export async function axe(page) {
  await page.addScriptTag({ path: AXE });
  const result = await page.evaluate(async (overlays) => {
    const r = await window.axe.run(
      { exclude: overlays.map((s) => [s]) }, // include defaults to the whole document
      { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] },
    );
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
  }, DEV_OVERLAYS);
  const by = (impact) => result.filter((v) => v.impact === impact).reduce((n, v) => n + v.nodes, 0);
  return { violations: result, critical: by("critical"), serious: by("serious"), moderate: by("moderate"), minor: by("minor") };
}

// Collects what went wrong while a page was open: console errors, uncaught errors, and API
// calls to the local mocks that failed.
export function watch(page) {
  const log = { console: [], page: [], api: [] };
  page.on("console", (m) => {
    if (m.type() === "error") log.console.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => log.page.push(String(e.message || e).slice(0, 300)));
  page.on("response", (r) => {
    const u = r.url();
    if (/^http:\/\/localhost:40\d\d\//.test(u) && r.status() >= 400) log.api.push({ status: r.status(), method: r.request().method(), url: u.replace(/^http:\/\/localhost:/, ":") });
  });
  return log;
}
