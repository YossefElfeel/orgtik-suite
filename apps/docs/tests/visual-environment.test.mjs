import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import { createVisualPage, VISUAL_ENVIRONMENT, visualPageMetadata } from "./visual-environment.mjs";
import { compareVisualBaseline } from "./visual-baseline.mjs";

test("visual browser keeps the instant but renders Cairo wall time instead of a UTC runner default", async () => {
  const browser = await chromium.launch();
  try {
    const utc = await browser.newContext({ timezoneId: "UTC" });
    const utcPage = await utc.newPage();
    const wallTime = page => page.evaluate(() => new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date("2026-10-08T07:30:00.000Z")));
    assert.equal(await wallTime(utcPage), "07:30");
    await utc.close();
    const { context, page } = await createVisualPage(browser);
    await page.setContent("<main id='storybook-root'><code>Visual fixture</code></main>");
    assert.equal(await wallTime(page), "10:30");
    const metadata = await visualPageMetadata(context, page);
    assert.equal(metadata.timeZone, "Africa/Cairo");
    assert.equal(metadata.now, VISUAL_ENVIRONMENT.fixedTime);
    assert.equal(metadata.locale, "en-US");
    assert.equal(metadata.scale, 1);
    assert.deepEqual(metadata.viewport, { width: 1280, height: 800 });
    assert.ok(metadata.platformFonts["#storybook-root code"].some(font => font.glyphCount > 0));
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(() => new Date().toISOString()), VISUAL_ENVIRONMENT.fixedTime, "Timers run but wall-clock time stays fixed");
    await context.close();
  } finally { await browser.close(); }
});

test("missing references fail without writing, and a changed opaque pixel still fails", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-visual-baseline-"));
  try {
    const filename = path.join(folder, "fixture.png");
    const shot = new PNG({ width: 3, height: 3 });
    shot.data.fill(255);
    assert.equal(compareVisualBaseline(shot, filename).visual, "missing baseline");
    assert.equal(fs.existsSync(filename), false);
    assert.equal(compareVisualBaseline(shot, filename, { update: true }).visual, "updated");
    assert.equal(compareVisualBaseline(shot, filename).visual, "same");
    const original = fs.readFileSync(filename);
    shot.data[16] = shot.data[17] = shot.data[18] = 0;
    const changed = compareVisualBaseline(shot, filename);
    assert.equal(changed.changed, 1);
    assert.equal(changed.visual, "1 px");
    assert.deepEqual(fs.readFileSync(filename), original, "An ordinary comparison never accepts the changed render");
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
