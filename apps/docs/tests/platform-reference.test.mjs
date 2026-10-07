import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { test } from "node:test";
import { PNG } from "pngjs";
import { createReferenceResolver, WINDOWS_PROFILE, semanticHashes, reviewedSemanticErrors } from "./platform-reference.mjs";
import { compareVisualBaseline } from "./visual-baseline.mjs";

const sha = value => crypto.createHash("sha256").update(value).digest("hex");
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-platform-pair-"));
  const defaults = path.join(root, "defaults"); const directory = path.join(root, "profile"); fs.mkdirSync(defaults); fs.mkdirSync(directory);
  const name = "reviewed--en-light.png";
  const png = new PNG({ width: 3, height: 3 }); png.data.fill(255);
  const original = PNG.sync.write(png); const candidate = PNG.sync.write(png);
  fs.writeFileSync(path.join(defaults, name), original); fs.writeFileSync(path.join(directory, name), candidate);
  const rendering = { platform: "win32", release: "10.0.26100", browser: "153.0.8010.12", timezoneId: "Africa/Cairo", locale: "en-US", fixedTime: "2026-10-07T09:00:00.000Z" };
  fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify({ id: WINDOWS_PROFILE, renderer: rendering, entries: { [name]: { originalSha256: sha(original), overrideSha256: sha(candidate) } } }));
  const options = { defaultDirectory: defaults, directory, ci: true, requestedProfile: WINDOWS_PROFILE, rendering };
  try { run({ root, defaults, directory, name, png, options }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test("only matching explicit CI profiles select enumerated pairs; local and unlisted cases keep defaults", () => fixture(({ defaults, directory, name, options }) => {
  const resolve = createReferenceResolver(options);
  assert.equal(resolve(name).path, path.join(directory, name));
  assert.equal(resolve("unlisted--en-light.png").path, path.join(defaults, "unlisted--en-light.png"));
  assert.equal(createReferenceResolver({ ...options, ci: false })(name).path, path.join(defaults, name));
  assert.equal(createReferenceResolver({ ...options, requestedProfile: "" })(name).path, path.join(defaults, name));
  assert.throws(() => createReferenceResolver({ ...options, requestedProfile: "unknown" }), /No reviewed/);
  assert.throws(() => createReferenceResolver({ ...options, rendering: { ...options.rendering, browser: "154.0" } }), /Unreviewed renderer browser/);
  assert.throws(() => createReferenceResolver({ ...options, rendering: { ...options.rendering, timezoneId: "UTC" } }), /Unreviewed renderer timezoneId/);
}));

test("stale defaults and corrupted overrides fail; a changed rendered pixel is never accepted", () => fixture(({ defaults, directory, name, png, options }) => {
  const resolve = createReferenceResolver(options); const paired = resolve(name);
  assert.equal(compareVisualBaseline(png, paired.path).visual, "same");
  png.data[16] = png.data[17] = png.data[18] = 0;
  assert.equal(compareVisualBaseline(png, paired.path).changed, 1);
  fs.writeFileSync(path.join(defaults, name), PNG.sync.write(png));
  assert.throws(() => resolve(name), /Stale paired reference/);
  fs.copyFileSync(path.join(directory, name), path.join(defaults, name));
  fs.writeFileSync(path.join(directory, name), PNG.sync.write(png));
  assert.throws(() => resolve(name), /Corrupt or missing/);
}));

test("text, control state, layout and selected fonts have independent regression assertions", () => {
  const semantics = { text: "14", root: { x: 0, y: 0, width: 100, height: 40 }, elements: [{ tag: "INPUT", role: null, label: "Day", text: "", value: "14", disabled: false, checked: false, box: { x: 0, y: 0, width: 100, height: 40 } }] };
  const fonts = { input: [{ familyName: "Arial" }] }; const review = { semantics: semanticHashes(semantics), platformFonts: fonts };
  assert.deepEqual(reviewedSemanticErrors(review, semantics, fonts), []);
  assert.ok(reviewedSemanticErrors(review, { ...semantics, text: "15" }, fonts).some(error => error.includes("text")));
  assert.ok(reviewedSemanticErrors(review, { ...semantics, root: { ...semantics.root, width: 101 } }, fonts).some(error => error.includes("layout")));
  assert.ok(reviewedSemanticErrors(review, semantics, { input: [{ familyName: "Other" }] }).some(error => error.includes("font")));
});
