/**
 * SOMION HQ - WARM THE DEV SERVER
 *
 * The dev server compiles a route the first time a browser asks for it, and
 * for twenty seconds or so it can answer 404 for the route's JavaScript while
 * it rebuilds. A suite that lands in that window waits thirty seconds for a
 * control that never arrives and reports a failure that is not one.
 *
 * This loads every route in a real browser and waits until each is
 * interactive, so the suites that follow measure the product and not the
 * compiler. Run it once before the suites: node warm.mjs
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
/* Every page renders exactly one h1 (audit.mjs holds that line), and it is
   the last thing the client paints, so it is the readiness signal. */
const ROUTES = [
  "/hq/office",
  "/hq/chat/c-general",
  "/hq/chat/c-design",
  "/hq/chat/catch-up",
  "/hq/chat/search?q=invoice",
  "/hq/meetings",
  "/hq/insights",
  "/hq/insights/transparency",
  "/hq/settings",
  "/hq/setup",
  "/hq/me",
  "/guest/mt-1",
  "/tasks/t-4471",
  "/hq/meetings/mt-1",
  "/hq/activate",
  "/hq/whiteboard",
  "/hq/settings/emails",
  /* The call stage has no h1; its readiness is the media dock. A cold compile
     of this route is what made "Join reaches the call" flake. */
  ["/hq/meetings/mt-1/call", "button"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1000 } });
const rows = [];
for (const entry of ROUTES) {
  const [route, ready] = Array.isArray(entry) ? entry : [entry, "h1"];
  const t0 = Date.now();
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      await page.goto(BASE + route, { waitUntil: "load", timeout: 60000 });
      await page.locator(ready).first().waitFor({ state: "attached", timeout: 45000 });
      ok = true;
    } catch {
      /* The route was still compiling: give it another go. */
    }
  }
  rows.push({ route, result: ok ? "ready" : "NOT READY", ms: Date.now() - t0 });
}
await browser.close();
console.table(rows);
const cold = rows.filter((r) => r.result !== "ready");
console.log(cold.length ? `${cold.length} route(s) never became interactive` : "Every route is warm.");
