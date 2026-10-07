import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyPreviewRevisions } from "./verify-preview-revisions.mjs";

const manifest = { profile: "readiness", projects: Object.fromEntries(["mock", "sos", "website"].map(key => [key, { sha: "a".repeat(40), paths: [key === "mock" ? "mock/" : `apps/${key}/`, "pnpm-lock.yaml"] }])) };
test("existing preview verification accepts test/docs-only changes without deployment", () => {
  const calls = [];
  verifyPreviewRevisions(manifest, (command, args) => { calls.push(args); return "tools/vercel/preview-auth-layout.mjs\0program/plan-v2-execution.md\0"; });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(args => args.includes("HEAD")));
});
test("changed application or dependency sources require a new deployment", () => {
  assert.throws(() => verifyPreviewRevisions(manifest, () => "mock/server.js\0"), /mock: current application sources differ/);
  assert.throws(() => verifyPreviewRevisions(manifest, () => "pnpm-lock.yaml\0"), /application sources differ/);
  assert.throws(() => verifyPreviewRevisions({ profile: "readiness", projects: {} }), /three known/);
});
