// Runtime consumers differ from build dependents: API changes must test unchanged web apps.
// The first matching path rule wins; the shared-mock fallback safely covers new modules.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

export const runtimeDependencies = JSON.parse(fs.readFileSync(new URL("./runtime-dependencies.json", import.meta.url), "utf8"));
export const projectManifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));

/** Probe a session-free app entry without following a tool's sign-in redirect to SOS. */
export function previewReadinessPath(key, projects = projectManifest.projects) {
  if (!projects[key] || projects[key].retired) throw new Error(`Unknown active preview project: ${key}`);
  if (key === "mock") return "/sos/__mock/status";
  if (key === "hr") return "/en/auth";
  return "/";
}

function relativePath(value) {
  if (typeof value !== "string") throw new Error("Changed paths must be strings");
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) || normalized.split("/").includes("..")) throw new Error(`Changed path is not repository-relative: ${value}`);
  return normalized;
}

export function selectRuntimeConsumers({ changedFiles = [], deployedKeys = [], scope = "affected" } = {}, map = runtimeDependencies, projects = projectManifest.projects) {
  if (!["affected", "milestone"].includes(scope)) throw new Error(`Unknown preview check scope: ${scope}`);
  if (!Array.isArray(changedFiles) || !Array.isArray(deployedKeys)) throw new Error("Changed files and deployed keys must be arrays");
  const selected = new Set();
  const reasons = {};
  const add = (key, reason) => {
    if (!map.consumers.includes(key) || !projects[key]) throw new Error(`Runtime dependency references unknown consumer: ${key}`);
    if (projects[key].retired) return;
    selected.add(key);
    (reasons[key] ??= []).push(reason);
  };
  for (const key of deployedKeys) if (!projects[key]) throw new Error(`Unknown deployed preview project: ${key}`);
  const paths = changedFiles.map(relativePath);
  if (scope === "milestone") {
    for (const key of map.milestone) add(key, "milestone auth/layout gate");
  } else {
    for (const key of deployedKeys) if (key !== "mock") add(key, `deployed ${key}`);
    for (const file of paths) {
      const rule = map.pathRules.find(row => row.paths.some(prefix => prefix.endsWith("/") ? file.startsWith(prefix) : file === prefix));
      if (rule) for (const key of rule.consumers === "all" ? map.consumers : rule.consumers) add(key, `${rule.id}: ${file}`);
    }
    // A manual mock-only deployment without a source diff still requires its consumers.
    if (deployedKeys.includes("mock") && !paths.length) for (const key of map.consumers) add(key, "mock deployment without changed-file scope");
  }
  return { scope, consumers: map.consumers.filter(key => selected.has(key)), reasons };
}

export function buildRuntimeCheckPlan(selection, map = runtimeDependencies, projects = projectManifest.projects) {
  const required = new Set(["mock", ...map.milestone]);
  const suites = [];
  if (selection.scope !== "milestone") for (const key of selection.consumers) {
    const suite = map.suites[key];
    if (!suite || !Array.isArray(suite.flows)) throw new Error(`${key}: missing runtime acceptance coverage in runtime-dependencies.json`);
    if (suite.coverage === "golden" && !suite.flows.length) throw new Error(`${key}: required golden flow coverage is empty`);
    if (!["golden", "frozen-visual-smoke"].includes(suite.coverage)) throw new Error(`${key}: unknown runtime acceptance coverage`);
    if (suite.coverage === "frozen-visual-smoke" && (!suite.visualRoute || !suite.note)) throw new Error(`${key}: frozen visual smoke needs its route and documented limitation`);
    required.add(key);
    for (const partner of suite.requires || []) required.add(partner);
    const flows = suite.flows.flatMap(flow => {
      if (!/^[\w-]+\.mjs$/.test(flow.file) || !["argument", "internal"].includes(flow.locales)) throw new Error(`${key}: invalid golden flow declaration`);
      return (flow.locales === "argument" ? ["en", "ar"] : [null]).map(locale => ({
        file: flow.file,
        args: locale ? ["--locale", locale] : [],
        locale,
        evidence: flow.evidence?.replace("{locale}/", locale === "en" ? "" : `${locale}/`),
      }));
    });
    suites.push({ key, coverage: suite.coverage, note: suite.note, requires: suite.requires || [], visualRoute: suite.visualRoute, flows });
  }
  for (const key of required) {
    if (!projects[key]) throw new Error(`Missing required preview project: ${key}`);
    if (projects[key].retired) throw new Error(`${key}: retired project cannot be required for preview acceptance`);
  }
  return { ...selection, suites, requiredProjects: [...required] };
}

export function resolvePreviewUrls(requiredProjects, { configured = {}, deployments = [], mockPublicUrl } = {}, projects = projectManifest.projects) {
  if (!configured || Array.isArray(configured) || typeof configured !== "object") throw new Error("SUITE_WEB_URLS must be a JSON object");
  const urls = Object.fromEntries(Object.entries(projects).map(([key, project]) => [key, project.previewUrl]));
  const configuredEntries = [...Object.entries(configured), ...deployments.map(({ key, url }) => [key, url])];
  for (const [key, url] of configuredEntries) {
    if (!projects[key]) throw new Error(`Unknown configured preview project: ${key}`);
    urls[key] = url;
  }
  // Never reset or move the clock on a production mock, even if a variable was misconfigured.
  if (!mockPublicUrl) throw new Error("MOCK_PUBLIC_URL must name the existing isolated preview mock");
  urls.mock = deployments.find(row => row.key === "mock")?.url || mockPublicUrl;
  for (const key of new Set([...requiredProjects, "mock", ...configuredEntries.map(([key]) => key)])) {
    const expected = projects[key]?.previewUrl;
    if (!urls[key] || !expected) throw new Error(`${key}: missing required stable preview URL; configure projects.json or SUITE_WEB_URLS before checks`);
    let actual;
    try { actual = new URL(urls[key]); } catch { throw new Error(`${key}: invalid preview URL`); }
    if (actual.protocol !== "https:" || actual.username || actual.password || actual.search || actual.hash || actual.pathname !== "/" || actual.origin !== new URL(expected).origin) throw new Error(`${key}: preview checks require its approved stable alias ${expected}`);
    urls[key] = actual.origin;
  }
  if (new URL(mockPublicUrl).origin !== urls.mock || urls.mock !== "https://orgtik-suite-mock-preview.vercel.app") throw new Error("Preview checks require the existing isolated preview mock");
  return urls;
}

export function changedRuntimeFiles(env = process.env, run = execFileSync) {
  if (env.PREVIEW_CHANGED_FILES !== undefined) {
    const files = JSON.parse(env.PREVIEW_CHANGED_FILES);
    if (!Array.isArray(files)) throw new Error("PREVIEW_CHANGED_FILES must be a JSON array of repository-relative paths");
    return files.map(relativePath);
  }
  const base = env.TURBO_SCM_BASE;
  const head = env.TURBO_SCM_HEAD || "HEAD";
  if (!base || /^0+$/.test(base)) throw new Error("Runtime preview scope needs TURBO_SCM_BASE (fetch full git history) or PREVIEW_CHANGED_FILES");
  try {
    return run("git", ["diff", "--name-only", "-z", "--no-relative", "--diff-filter=ACDMRTUXB", `${base}...${head}`, "--"], { cwd: new URL("../../", import.meta.url), encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).split("\0").filter(Boolean).map(relativePath);
  } catch { throw new Error("Could not read changed runtime paths; fetch full git history and set TURBO_SCM_BASE/TURBO_SCM_HEAD"); }
}

export function assertFlowEvidence(value, label = "Flow") {
  const rows = Array.isArray(value) ? value : value?.walks || value?.results;
  if (!Array.isArray(rows) || !rows.length) throw new Error(`${label}: golden flow evidence is missing or empty`);
  const checks = rows.flatMap(row => Array.isArray(row.steps) ? row.steps : Array.isArray(row.detail) ? row.detail : [row]);
  if (!checks.length || checks.some(row => row.ok !== true) || rows.some(row => row.ok === false)) throw new Error(`${label}: golden flow acceptance failed; inspect the flow evidence`);
}

// Keep access scoped to the current suite and refresh before JWT expiry or five minutes.
export function previewTokenRefreshAt(tokens, now = Date.now()) {
  let refreshAt = now + 5 * 60 * 1000;
  for (const token of Object.values(tokens)) {
    let claims;
    try { claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")); }
    catch { throw new Error("Preview access has unreadable expiry metadata"); }
    if (!Number.isFinite(claims.exp)) throw new Error("Preview access has no expiry metadata");
    const beforeExpiry = claims.exp * 1000 - 60 * 1000;
    if (beforeExpiry <= now) throw new Error("Preview access expires too soon to run acceptance checks");
    refreshAt = Math.min(refreshAt, beforeExpiry);
  }
  return refreshAt;
}
