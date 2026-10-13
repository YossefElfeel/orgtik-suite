// Read-only, main-only diagnostics for an existing confirmed Services project.
// No project, deployment, protection policy or environment setting is modified.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { projectName } from "../services/projects.mjs";
const team = "team_Ypx8oiLDZi3PBNi8ht8fYPsm";
const name = projectName(process.env.SERVICE);
const deployment = new URL(process.env.DEPLOYMENT);
if (process.env.GITHUB_ACTIONS !== "true" || process.env.GITHUB_REF !== "refs/heads/main" || !process.env.VERCEL_TOKEN || !process.env.RUNNER_TEMP) throw new Error("Use the reviewed main-only diagnostic workflow.");
if (deployment.protocol !== "https:" || deployment.username || deployment.password || deployment.pathname !== "/" || deployment.search || deployment.hash || !deployment.hostname.endsWith(".vercel.app") || !(deployment.hostname === `${name}.vercel.app` || deployment.hostname.startsWith(`${name}-`))) throw new Error("Deployment URL does not match the confirmed project.");
const api = async endpoint => {
  const url = new URL(endpoint, "https://api.vercel.com");
  url.searchParams.set("teamId", team);
  const response = await fetch(url, { headers: { authorization: `Bearer ${process.env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Read-only Vercel metadata request failed (${response.status}); provider values omitted.`);
  return response.json();
};
const target = await api(`/v13/deployments/${deployment.hostname}`);
const project = await api(`/v9/projects/${name}`);
if (project.accountId !== team || target.projectId !== project.id) throw new Error("Deployment ownership does not match the confirmed project and team.");
const directory = path.join(process.env.RUNNER_TEMP, "orgtik-services-diagnostics");
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(directory, "auth.json"), JSON.stringify({ token: process.env.VERCEL_TOKEN }), { mode: 0o600 });
let raw;
try {
  raw = execFileSync("vercel", ["--global-config", directory, "--scope", team, "logs", "--project", name, "--deployment", deployment.origin, "--no-follow", "--no-branch", "--json", "--since", "1h", "--limit", "20", "--level", "error"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
} catch { throw new Error("Could not read the confirmed deployment's runtime logs; CLI output omitted."); }
// Emit only exception/stack lines, never complete records, bodies or headers.
const redact = value => value.replaceAll(process.env.VERCEL_TOKEN, "[credential]").replace(/https?:\/\/\S+/g, "[url]").replace(/\beyJ[\w.-]+/g, "[token]").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]").replace(/((?:token|secret|password|authorization)\s*[=:]\s*)\S+/gi, "$1[redacted]");
let emitted = 0;
for (const line of raw.split(/\r?\n/).filter(Boolean)) {
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  const walk = value => {
    if (typeof value === "string") {
      for (const text of value.split(/\r?\n/)) {
        if (/^(?:\w*Error:|Error \[|Cannot find module|Require stack:|\s+at |\s*- \/(?:var|opt|vc)|\s*code:\s*['"]?\w+)/.test(text) && emitted < 80) {
          console.log(redact(text).slice(0, 1000)); emitted++;
        }
      }
    } else if (value && typeof value === "object") for (const nested of Object.values(value)) walk(nested);
  };
  walk(entry);
}
console.log(`Read ${name} runtime errors; emitted ${emitted} sanitized exception lines.`);
