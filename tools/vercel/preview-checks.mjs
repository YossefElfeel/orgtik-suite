import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { mintPreviewTokens, protectedFetch } from "./preview-protection.mjs";
const root = path.resolve(import.meta.dirname, "../..");
const folder = path.join(root, "deployments");
const files = fs.readdirSync(folder, { recursive: true }).filter(file => file.endsWith("deployment.json"));
const deployments = files.map(file => JSON.parse(fs.readFileSync(path.join(folder, file), "utf8")));
const urls = { ...JSON.parse(process.env.SUITE_WEB_URLS || "{}") };
for (const deployment of deployments) urls[deployment.key] = deployment.url;
const mock = deployments.find(deployment => deployment.key === "mock")?.url || process.env.MOCK_PUBLIC_URL;
if (!mock || !process.env.MOCK_PUBLIC_URL || new URL(mock).hostname !== "orgtik-suite-mock-preview.vercel.app") throw new Error("Preview checks require the existing isolated preview mock");
const env = { ...process.env, MOCK_PUBLIC_URL: mock, MOCK_RESET_TEST_ACCOUNTS: "1", SUITE_WEB_URLS: JSON.stringify(urls) };
const firstTokens = mintPreviewTokens(["mock", "sos", "website"]);
const reset = await protectedFetch(firstTokens)(`${mock}/sos/__mock/reset`, { method: "POST" });
if (!reset.ok) throw new Error(`Preview reset answered ${reset.status}`);
let failed = false;
const preload = pathToFileURL(path.join(import.meta.dirname, "preview-protection.mjs")).href;
try { execFileSync(process.execPath, ["--import", preload, path.join(import.meta.dirname, "preview-auth-layout.mjs")], { cwd: root, env: { ...env, VERCEL_PREVIEW_TOKENS: JSON.stringify(firstTokens) }, stdio: "inherit" }); }
catch { failed = true; }
for (const { key } of process.env.PREVIEW_CHECK_SCOPE === "milestone" ? [] : deployments) {
  if (key === "mock" || key === "website") continue;
  const cwd = path.join(root, "program/tools/audit-kit");
  const flows = fs.readdirSync(path.join(cwd, "flows")).filter(file => file === `${key}.mjs` || (key === "admin" && /^adm-.*\.mjs$/.test(file)) || (key === "wm" && /^wm-(overview|s\d[a-z]?)\.mjs$/.test(file)));
  try {
    const access = () => ({ ...env, VERCEL_PREVIEW_TOKENS: JSON.stringify(mintPreviewTokens(["mock", "sos", key, ...(key === "sos" ? ["files"] : [])])) });
    execFileSync(process.execPath, ["--import", preload, "vs1.mjs", "--app", key, "--route", "/", "--label", "preview"], { cwd, env: access(), stdio: "inherit" });
    const visual = JSON.parse(fs.readFileSync(path.join(root, "program/audits", key, "vs1/preview.json"), "utf8"));
    if (visual.some(row => row.critical || row.serious || row.console || row.uncaught || row.overflow > 0 || row.dir !== (row.locale === "ar" ? "rtl" : "ltr") || row.lang?.split("-")[0] !== row.locale || row.brokenImages?.length)) throw new Error(`${key}: VS-1 visual acceptance failed`);
    for (const file of flows) {
      const flow = path.join(cwd, "flows", file);
      // ADM/WM suites cover their locales internally; ordinary app flows take --locale.
      for (const args of key === "admin" || key === "wm" ? [[]] : [["--locale", "en"], ["--locale", "ar"]]) execFileSync(process.execPath, ["--import", preload, flow, ...args], { cwd, env: access(), stdio: "inherit" });
    }
  } catch { failed = true; }
}
if (failed) process.exitCode = 1;
