import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "../..");
const folder = path.join(root, "deployments");
const files = fs.readdirSync(folder, { recursive: true }).filter(file => file.endsWith("deployment.json"));
const deployments = files.map(file => JSON.parse(fs.readFileSync(path.join(folder, file), "utf8")));
const urls = { ...JSON.parse(process.env.SUITE_WEB_URLS || "{}") };
for (const deployment of deployments) urls[deployment.key] = deployment.url;
const mock = deployments.find(deployment => deployment.key === "mock")?.url || process.env.MOCK_PUBLIC_URL;
if (!mock || !process.env.MOCK_PUBLIC_URL || new URL(mock).hostname === "orgtik-suite-mock.vercel.app") throw new Error("Preview checks require the isolated preview mock");
const reset = await fetch(`${mock}/sos/__mock/reset`, { method: "POST" });
if (!reset.ok) throw new Error(`Preview reset answered ${reset.status}`);
let failed = false;
for (const { key } of deployments) {
  if (key === "mock" || key === "website") continue;
  const cwd = path.join(root, "program/tools/audit-kit");
  const env = { ...process.env, MOCK_PUBLIC_URL: mock, MOCK_RESET_TEST_ACCOUNTS: "1", SUITE_WEB_URLS: JSON.stringify(urls) };
  const flow = path.join(cwd, "flows", `${key}.mjs`);
  try {
    execFileSync(process.execPath, ["vs1.mjs", "--app", key, "--route", "/", "--label", "preview"], { cwd, env, stdio: "inherit" });
    if (fs.existsSync(flow)) for (const locale of ["en", "ar"]) execFileSync(process.execPath, [flow, "--locale", locale], { cwd, env, stdio: "inherit" });
  } catch { failed = true; }
}
if (failed) process.exitCode = 1;
