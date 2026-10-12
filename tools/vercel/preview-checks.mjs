import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { mintPreviewTokens, protectedFetch } from "./preview-protection.mjs";
import { assertFlowEvidence, buildRuntimeCheckPlan, changedRuntimeFiles, previewReadinessPath, previewTokenRefreshAt, resolvePreviewUrls, selectRuntimeConsumers } from "./runtime-dependencies.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const folder = path.join(root, "deployments");
const files = fs.existsSync(folder) ? fs.readdirSync(folder, { recursive: true }).filter(file => file.endsWith("deployment.json")) : [];
const deployments = files.map(file => JSON.parse(fs.readFileSync(path.join(folder, file), "utf8")));
const scope = process.env.PREVIEW_CHECK_SCOPE || "affected";
const plan = buildRuntimeCheckPlan(selectRuntimeConsumers({
  scope,
  deployedKeys: deployments.map(row => row.key),
  changedFiles: scope === "milestone" ? [] : changedRuntimeFiles(),
}));
const urls = resolvePreviewUrls(plan.requiredProjects, {
  configured: JSON.parse(process.env.SUITE_WEB_URLS || "{}"),
  deployments,
  mockPublicUrl: process.env.MOCK_PUBLIC_URL,
});
const mock = urls.mock;
const env = { ...process.env, MOCK_PUBLIC_URL: mock, MOCK_RESET_TEST_ACCOUNTS: "1", SUITE_WEB_URLS: JSON.stringify(urls), SITE_URL: urls.website };
const cwd = path.join(root, "program/tools/audit-kit");
const audits = path.join(root, "program/audits");
const evidence = path.join(audits, "auth-layout/preview");
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(path.join(evidence, "runtime-scope.json"), JSON.stringify(plan, null, 2) + "\n");
console.log(`Preview acceptance (${scope}): ${plan.consumers.join(", ") || "auth/layout gate"}`);

// Fail before mutating the sandbox if any declared golden flow was omitted from this checkout.
for (const suite of plan.suites) for (const flow of suite.flows) {
  if (!fs.existsSync(path.join(cwd, "flows", flow.file))) throw new Error(`${suite.key}: required golden flow ${flow.file} is missing`);
}
const preload = pathToFileURL(path.join(import.meta.dirname, "preview-protection.mjs")).href;
const requiredTokens = mintPreviewTokens(plan.requiredProjects);
const probe = protectedFetch(requiredTokens);
for (const key of plan.requiredProjects) {
  let response;
  try { response = await probe(`${urls[key]}${previewReadinessPath(key)}`, { signal: AbortSignal.timeout(60000) }); }
  catch { throw new Error(`${key}: required stable preview alias ${urls[key]} is unavailable; deploy or configure this consumer before runtime checks`); }
  if (!response.ok) throw new Error(`${key}: required stable preview alias ${urls[key]} answered ${response.status}; deploy or configure this consumer before runtime checks`);
  if (key === "mock" && (await response.json()).data?.journal?.sandbox !== "preview") throw new Error("Runtime checks require the isolated preview data sandbox");
}
const firstTokens = Object.fromEntries(["mock", "sos", "website"].map(key => [urls[key], requiredTokens[urls[key]]]));
const reset = await protectedFetch(firstTokens)(`${mock}/sos/__mock/reset`, { method: "POST" });
if (!reset.ok) throw new Error(`Preview reset answered ${reset.status}`);
const failures = [];
const run = (label, fn) => {
  try { fn(); }
  catch (error) {
    // Child processes print acceptance details; never serialize command environments/tokens.
    const note = error.status !== undefined ? `command exited ${error.status}` : error.message;
    console.error(`FAIL ${label}: ${note}`);
    failures.push({ label, note });
  }
};
run("hosted auth and desktop/mobile shell", () => execFileSync(process.execPath, ["--import", preload, path.join(import.meta.dirname, "preview-auth-layout.mjs")], { cwd: root, env: { ...env, VERCEL_PREVIEW_TOKENS: JSON.stringify(firstTokens) }, stdio: "inherit" }));

// Keep every reset/clock-based suite sequential against the shared preview sandbox.
// Backend consumers can use a stable preview alias without deploying that frontend again.
// The readiness gate must pass before broader mutating flows start.
for (const suite of failures.length ? [] : plan.suites) {
  const keys = [...new Set(["mock", "sos", suite.key, ...suite.requires])];
  let tokens;
  let refreshAt = 0;
  const access = () => {
    if (!tokens || Date.now() >= refreshAt) {
      tokens = mintPreviewTokens(keys);
      refreshAt = previewTokenRefreshAt(tokens);
    }
    return { ...env, VERCEL_PREVIEW_TOKENS: JSON.stringify(tokens) };
  };
  if (suite.note) console.log(`${suite.key}: ${suite.note}`);
  if (suite.visualRoute) run(`${suite.key} visual acceptance`, () => {
    const output = path.join(audits, suite.key, "vs1/preview.json");
    fs.rmSync(output, { force: true });
    execFileSync(process.execPath, ["--import", preload, "vs1.mjs", "--app", suite.key, "--route", suite.visualRoute, "--label", "preview"], { cwd, env: access(), stdio: "inherit" });
    const visual = JSON.parse(fs.readFileSync(output, "utf8"));
    if (!Array.isArray(visual) || visual.length !== 20 || visual.some(row => row.critical || row.serious || row.console || row.uncaught || row.overflow > 0 || row.dir !== (row.locale === "ar" ? "rtl" : "ltr") || row.lang?.split("-")[0] !== row.locale || row.brokenImages?.length)) throw new Error(`${suite.key}: VS-1 visual acceptance failed`);
  });
  for (const flow of suite.flows) run(`${suite.key} ${flow.file}${flow.locale ? ` ${flow.locale}` : ""}`, () => {
    const output = flow.evidence && path.join(audits, flow.evidence);
    if (output) fs.rmSync(output, { force: true });
    execFileSync(process.execPath, ["--import", preload, path.join(cwd, "flows", flow.file), ...flow.args], { cwd, env: access(), stdio: "inherit" });
    if (output) assertFlowEvidence(JSON.parse(fs.readFileSync(output, "utf8")), `${suite.key} ${flow.file}`);
  });
}
fs.writeFileSync(path.join(evidence, "runtime-checks.json"), JSON.stringify({ scope, consumers: plan.consumers, ok: !failures.length, failures }, null, 2) + "\n");
if (failures.length) process.exitCode = 1;
