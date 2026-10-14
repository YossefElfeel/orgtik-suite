import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { test } from "node:test";
import { copyWmImageOriginals } from "./wm-media-assets.mjs";
import { assertFlowEvidence, buildRuntimeCheckPlan, changedRuntimeFiles, previewTokenRefreshAt, projectManifest, resolvePreviewUrls, runtimeDependencies, selectRuntimeConsumers } from "./runtime-dependencies.mjs";

const select = (changedFiles, deployedKeys = ["mock"]) => selectRuntimeConsumers({ changedFiles, deployedKeys });
const sandbox = "https://orgtik-suite-mock-preview.vercel.app";
const activeConsumers = runtimeDependencies.consumers.filter(key => !projectManifest.projects[key].retired);

test("isolated WM runtime can replace a seeded image and retain its exact original bytes", async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "wm-image-runtime-"));
  t.after(() => {
    assert.ok(path.basename(runtime).startsWith("wm-image-runtime-") && path.dirname(runtime) === os.tmpdir());
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const files = copyWmImageOriginals(runtime);
  const modulePath = path.join(runtime, "apps/wm/media-replacement.js");
  fs.copyFileSync(new URL("../../mock/apps/wm/media-replacement.js", import.meta.url), modulePath);
  fs.copyFileSync(new URL("../../mock/apps/wm/image-storage.js", import.meta.url), path.join(runtime, "apps/wm/image-storage.js"));
  const { replaceImage } = createRequire(import.meta.url)(modulePath);
  const uploadsDir = path.join(runtime, "uploads"), state = {mediaVersions:{}}, store = {audit:[]};
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64");
  assert.equal(files.length, 6);
  for (const [index, file] of files.entries()) {
    const key = `md_${index + 1}`, original = fs.readFileSync(new URL(`../../apps/website/landing-directions/public/assets/${file}`, import.meta.url));
    const media = {id:key, file, version:1, kind:"image", source:"website"};
    await replaceImage({lib:{media:new Map([[key, media]])}, state, store, uploadsDir, now:()=>"2026-10-14T00:00:00Z", who:{user:{key:"fixture"}}, key, file:{buffer:png, mimetype:"image/png", originalname:"new.png"}, version:1});
    assert.equal(media.version, 2);
    assert.deepEqual(fs.readFileSync(path.join(uploadsDir, state.mediaVersions[key][0].file)), original);
  }
});

test("shared mock, server and UI changes test all runtime consumers without deploying them", () => {
  for (const file of ["mock/lib/auth-store.js", "mock/server.js", "mock/api/index.js", "mock/config.js", "packages/ui/src/components/button.tsx"]) {
    assert.deepEqual(select([file]).consumers, activeConsumers, file);
  }
  assert.deepEqual(select(["mock/apps/new-tool/router.js"]).consumers, activeConsumers, "An unmapped new mock module cannot silently skip consumers");
});

test("platform routes exercise Admin, USR/SOS and website with only mock deployed", () => {
  for (const file of ["mock/apps/admin.js", "mock/apps/admin/pricing.js", "mock/apps/admin/seed-pricing.js"]) {
    const result = select([file]);
    assert.deepEqual(result.consumers, ["sos", "admin", "website"]);
    assert.match(result.reasons.sos[0], /^platform:/);
  }
});

test("platform access, seat and lifecycle changes cover customer tool consumers", () => {
  for (const file of ["mock/apps/admin/app-api.js", "mock/apps/admin/lifecycle.js", "mock/apps/admin/store.js"]) assert.deepEqual(select([file]).consumers, activeConsumers);
});

test("tool backend routes include declared integration consumers and merge deployed frontends", () => {
  assert.deepEqual(select(["mock/apps/files/lib.js"]).consumers, ["sos", "tasks", "files", "chats"]);
  assert.deepEqual(select(["mock/apps/wm/content.js"]).consumers, ["sales", "marketing", "wm", "website"]);
  assert.deepEqual(select(["mock/apps/hr/routes/people.js"], ["mock", "admin"]).consumers, ["sos", "admin", "tasks", "files", "hr", "sales", "marketing", "chats"]);
  assert.deepEqual(select(["apps/tasks/src/app/page.tsx"], ["tasks"]).consumers, ["tasks"]);
  assert.deepEqual(select(["program/plan-v2-execution.md"], []).consumers, []);
});

test("manual mock-only deployments remain covered without a source diff", () => {
  assert.deepEqual(select([]).consumers, activeConsumers);
});

test("milestone mode retains exactly the hosted auth/layout gate", () => {
  const selection = selectRuntimeConsumers({ scope: "milestone", changedFiles: ["mock/lib/auth-store.js"], deployedKeys: ["mock", "sos", "website"] });
  const plan = buildRuntimeCheckPlan(selection);
  assert.deepEqual(plan.consumers, ["sos", "website"]);
  assert.deepEqual(plan.suites, []);
  assert.deepEqual(plan.requiredProjects, ["mock", "sos", "website"]);
});

test("SOS includes all USR golden flows in English and Arabic with the actual evidence locations", () => {
  const plan = buildRuntimeCheckPlan(select(["apps/sos/src/app/page.tsx"], ["sos"]));
  const sos = plan.suites.find(row => row.key === "sos");
  assert.equal(sos.flows.length, 8);
  for (const file of ["sos.mjs", "usr-account.mjs", "usr-billing.mjs", "usr-tools.mjs"]) {
    assert.deepEqual(sos.flows.filter(row => row.file === file).map(row => row.args), [["--locale", "en"], ["--locale", "ar"]]);
  }
  assert.equal(sos.flows.find(row => row.file === "usr-billing.mjs" && row.locale === "en").evidence, "usr/flows/usr-billing.json");
  assert.equal(sos.flows.find(row => row.file === "usr-billing.mjs" && row.locale === "ar").evidence, "usr/flows/ar/usr-billing.json");
  assert.ok(plan.requiredProjects.includes("files"), "The SOS launcher flow needs an unchanged Files preview");
});

test("ADM and WM use their own locale scenarios once; all declared runners exist", () => {
  const plan = buildRuntimeCheckPlan(select(["mock/server.js"]));
  for (const key of ["admin", "wm"]) {
    const suite = plan.suites.find(row => row.key === key);
    assert.ok(suite.flows.length >= 5);
    assert.ok(suite.flows.every(row => row.args.length === 0 && row.locale === null));
  }
  for (const suite of plan.suites) for (const flow of suite.flows) {
    assert.ok(fs.existsSync(path.resolve(import.meta.dirname, "../../program/tools/audit-kit/flows", flow.file)), flow.file);
    assert.ok(!flow.evidence?.includes("{locale}"));
  }
  assert.ok(!plan.suites.some(row => row.key === "content"));
  assert.ok(!plan.requiredProjects.includes("content"));
});

test("retired Content cannot re-enter shared or directly selected preview acceptance", () => {
  for (const selection of [select(["mock/server.js"]), select(["apps/content/app/page.tsx"], ["content"]), select([])]) {
    assert.ok(!selection.consumers.includes("content"));
    assert.ok(!buildRuntimeCheckPlan(selection).requiredProjects.includes("content"));
  }
  const map = structuredClone(runtimeDependencies);
  map.suites.sos.requires.push("content");
  assert.throws(() => buildRuntimeCheckPlan(select(["apps/sos/app/page.tsx"], ["sos"]), map), /content: retired project cannot be required/);
});

test("missing golden coverage and unknown scope/projects fail instead of silently passing", () => {
  const map = structuredClone(runtimeDependencies);
  delete map.suites.hr;
  assert.throws(() => buildRuntimeCheckPlan(select(["apps/hr/src/page.tsx"], ["hr"]), map), /hr: missing runtime acceptance coverage/);
  map.suites.hr = { coverage: "golden", flows: [] };
  assert.throws(() => buildRuntimeCheckPlan(select(["apps/hr/src/page.tsx"], ["hr"]), map), /required golden flow coverage is empty/);
  assert.throws(() => selectRuntimeConsumers({ scope: "none" }), /Unknown preview check scope/);
  assert.throws(() => selectRuntimeConsumers({ deployedKeys: ["invented"] }), /Unknown deployed preview project/);
  assert.throws(() => select(["../mock/server.js"]), /repository-relative/);
});

test("undeployed consumer URLs come from configured stable aliases", () => {
  const plan = buildRuntimeCheckPlan(select(["mock/apps/admin/pricing.js"]));
  const urls = resolvePreviewUrls(plan.requiredProjects, { mockPublicUrl: sandbox, deployments: [{ key: "mock", url: sandbox }] });
  assert.equal(urls.admin, projectManifest.projects.admin.previewUrl);
  assert.equal(urls.sos, projectManifest.projects.sos.previewUrl);
  assert.equal(urls.website, projectManifest.projects.website.previewUrl);
  assert.equal(urls.mock, sandbox);
});

test("missing, production and foreign URLs fail before the shared sandbox can reset", () => {
  const projects = structuredClone(projectManifest.projects);
  delete projects.hr.previewUrl;
  assert.throws(() => resolvePreviewUrls(["hr"], { mockPublicUrl: sandbox }, projects), /hr: missing required stable preview URL/);
  assert.throws(() => resolvePreviewUrls(["hr"], { mockPublicUrl: sandbox, configured: { hr: "" } }), /hr: missing required stable preview URL/);
  for (const mockPublicUrl of [undefined, "https://orgtik-suite-mock.vercel.app", "https://outside.example"]) assert.throws(() => resolvePreviewUrls(["mock"], { mockPublicUrl }), /preview mock|approved stable alias/);
  for (const url of ["https://outside.example", "https://orgtik-suite-admin.vercel.app", projectManifest.projects.admin.previewUrl + "/path", projectManifest.projects.admin.previewUrl + "?token=secret"]) {
    assert.throws(() => resolvePreviewUrls(["admin"], { mockPublicUrl: sandbox, configured: { admin: url } }), /approved stable alias/);
  }
  assert.throws(() => resolvePreviewUrls([], { mockPublicUrl: sandbox, configured: { invented: "https://outside.example" } }), /Unknown configured preview project/);
});

test("runtime changes use a full git diff including deleted files and explicit overrides", () => {
  const calls = [];
  const files = changedRuntimeFiles({ TURBO_SCM_BASE: "base-sha", TURBO_SCM_HEAD: "head-sha" }, (command, args) => {
    calls.push({ command, args });
    return "mock/apps/admin/app-api.js\0apps/sos/old-route.tsx\0";
  });
  assert.deepEqual(files, ["mock/apps/admin/app-api.js", "apps/sos/old-route.tsx"]);
  assert.equal(calls[0].command, "git");
  assert.ok(calls[0].args.includes("base-sha...head-sha"));
  assert.ok(calls[0].args.includes("--diff-filter=ACDMRTUXB"));
  assert.deepEqual(changedRuntimeFiles({ PREVIEW_CHANGED_FILES: '["mock\\\\apps\\\\admin.js"]' }), ["mock/apps/admin.js"]);
  assert.throws(() => changedRuntimeFiles({}), /Runtime preview scope needs TURBO_SCM_BASE/);
  assert.throws(() => changedRuntimeFiles({ PREVIEW_CHANGED_FILES: "{}" }), /JSON array/);
  assert.throws(() => changedRuntimeFiles({ TURBO_SCM_BASE: "base" }, () => { throw new Error("missing history"); }), /fetch full git history/);
});

test("failed steps cannot pass merely because a legacy golden runner exits zero", () => {
  assert.doesNotThrow(() => assertFlowEvidence({ walks: [{ steps: [{ ok: true }, { ok: true }] }] }));
  assert.doesNotThrow(() => assertFlowEvidence([{ ok: true, detail: [{ ok: true }] }]));
  assert.throws(() => assertFlowEvidence({ walks: [{ steps: [{ ok: true }, { ok: false }] }] }, "USR billing"), /USR billing: golden flow acceptance failed/);
  assert.throws(() => assertFlowEvidence([{ ok: false, detail: [{ ok: true }] }]), /golden flow acceptance failed/);
  assert.throws(() => assertFlowEvidence({ walks: [] }), /missing or empty/);
  assert.throws(() => assertFlowEvidence({ walks: [{ steps: [] }] }), /golden flow acceptance failed/);
});

test("protected acceptance batches refresh before the earliest expiry and reject stale metadata", () => {
  const now = 1000000;
  const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
  assert.equal(previewTokenRefreshAt({ first: token((now + 3600000) / 1000) }, now), now + 300000);
  assert.equal(previewTokenRefreshAt({ first: token((now + 180000) / 1000), second: token((now + 3600000) / 1000) }, now), now + 120000);
  assert.throws(() => previewTokenRefreshAt({ first: token((now + 30000) / 1000) }, now), /expires too soon/);
  assert.throws(() => previewTokenRefreshAt({ first: "fixture.invalid.token" }, now), /unreadable expiry/);
});
