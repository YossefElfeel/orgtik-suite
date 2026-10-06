/**
 * SOMION HQ - DEAD END DETECTOR
 *
 * The weak version of this test asks whether a control exists. This one clicks
 * it and asks whether anything happened - a URL change, a dialog, a DOM
 * change, a focus move. A button with a handler that changes nothing the user
 * can see is still a dead end, and only pressing it finds those.
 *
 * Destructive labels are skipped by name, so the run is repeatable.
 *
 * Run against the dev server: node deadends.mjs
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const PAGES = [
  "/hq/office",
  "/hq/chat/c-design",
  "/hq/chat/catch-up",
  "/hq/chat/search?q=invoice",
  "/hq/meetings",
  "/hq/meetings/mt-1",
  "/hq/insights",
  "/hq/settings",
  "/hq/me",
  "/tasks/t-4471",
  "/guest/mt-1",
];

/* Skipped because pressing them changes state the next assertion depends on,
   or because they are destructive. Their flows are covered in flows.mjs. */
const SKIP = /delete|leave|remove|end call|hang up|stop|decline|reset|sign out|admit|record/i;

const browser = await chromium.launch();
const findings = [];

for (const path of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1560, height: 1000 } });
  try {
    await page.goto(BASE + path, { waitUntil: "load", timeout: 45000 });
  } catch {
    findings.push({ page: path, control: "(the page itself)", note: "did not load" });
    await page.close();
    continue;
  }
  await page.waitForTimeout(900);

  const names = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, [role=button]").forEach((b) => {
      if (b.disabled || b.getAttribute("aria-disabled") === "true") return;
      const r = b.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      /* Pressing an option that is already the active one is a no-op by
         design, like a checked radio: not a dead end. */
      if (b.getAttribute("aria-pressed") === "true" || b.hasAttribute("aria-current") || b.getAttribute("aria-selected") === "true" || b.getAttribute("aria-checked") === "true") return;
      const name = (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\s+/g, " ");
      if (name) out.push(name.slice(0, 44));
    });
    return [...new Set(out)];
  });

  for (const name of names) {
    if (SKIP.test(name)) continue;

    const fresh = await browser.newPage({ viewport: { width: 1560, height: 1000 } });
    try {
      await fresh.goto(BASE + path, { waitUntil: "load" });
      await fresh.waitForTimeout(500);

      const target = fresh.getByRole("button", { name, exact: true }).first();
      if ((await target.count()) === 0) {
        await fresh.close();
        continue;
      }

      /* Message row actions are deliberately pointer-events:none until their
         row is hovered, so an invisible toolbar never swallows a click meant
         for the message below it. Driving that from here is unreliable, and
         flows.mjs already exercises them through a real hover, so they are
         out of scope for this pass rather than reported as broken. */
      const hoverGated = await target.evaluate(
        (el) => getComputedStyle(el).pointerEvents === "none",
      );
      if (hoverGated) {
        await fresh.close();
        continue;
      }

      /* Focus moving to the pressed control is not a response, so it is not
         evidence. The control's own state and text are: a toggle that flips
         its label has answered. */
      const state = (el) =>
        el ? `${el.isConnected}|${el.textContent}|${el.getAttribute("aria-pressed")}|${el.getAttribute("aria-expanded")}|${el.getAttribute("aria-checked")}|${el.getAttribute("aria-selected")}|${el.disabled}` : "gone";
      /* The element itself, not its name: a label that changes on press
         ("Copy" to "Copied") must not send the check looking for the old one. */
      const handle = await target.elementHandle({ timeout: 3000 });
      const before = await fresh.evaluate(() => ({
        url: location.pathname + location.search,
        html: document.body.innerHTML.length,
        text: document.body.innerText,
        dialogs: document.querySelectorAll("[role=dialog],[role=alertdialog],[role=listbox],[role=menu]").length,
      }));
      const selfBefore = await handle.evaluate(state);

      await handle.click({ timeout: 3000 });
      await fresh.waitForTimeout(650);

      const after = await fresh.evaluate(() => ({
        url: location.pathname + location.search,
        html: document.body.innerHTML.length,
        text: document.body.innerText,
        dialogs: document.querySelectorAll("[role=dialog],[role=alertdialog],[role=listbox],[role=menu]").length,
      }));
      const selfAfter = await handle.evaluate(state).catch(() => "gone");

      const judge = (a, b, sa, sb) =>
        a.url !== b.url ||
        a.dialogs !== b.dialogs ||
        Math.abs(a.html - b.html) > 40 ||
        /* Any visible words changed: a caption that swaps is an answer. */
        a.text !== b.text ||
        sa !== sb;
      let changed = judge(before, after, selfBefore, selfAfter);
      if (!changed) {
        /* A route change on the dev server can land after a second. Look
           once more before calling it nothing. */
        await fresh.waitForTimeout(1500);
        const later = await fresh.evaluate(() => ({
          url: location.pathname + location.search,
          html: document.body.innerHTML.length,
          text: document.body.innerText,
          dialogs: document.querySelectorAll("[role=dialog],[role=alertdialog],[role=listbox],[role=menu]").length,
        }));
        changed = judge(before, later, selfBefore, await handle.evaluate(state).catch(() => "gone"));
      }

      if (!changed) findings.push({ page: path, control: name });
    } catch {
      /* A control that cannot even be clicked is reported as one that did
         nothing, which is what it is from the outside. */
      findings.push({ page: path, control: name, note: "not clickable" });
    }
    await fresh.close();
  }

  await page.close();
}

await browser.close();

if (findings.length === 0) {
  console.log("Every control does something.");
} else {
  console.log(`CONTROLS THAT DID NOTHING (${findings.length}):`);
  console.table(findings);
}
