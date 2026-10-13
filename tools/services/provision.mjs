// Runs in GitHub Actions using the existing deployment secret. Never prints or
// exports store credentials; only the new, confirmed project is modified.
import fs from "node:fs";
import path from "node:path";
const team = "team_Ypx8oiLDZi3PBNi8ht8fYPsm", name = "orgtik-suite-services";
const sourceProject = "prj_74P0VeIbDAIyUy8u5r6h91mwai1o";
const token = process.env.VERCEL_TOKEN;
if (process.env.GITHUB_ACTIONS !== "true" || !token || !process.env.RUNNER_TEMP) throw new Error("Use the reviewed Services deployment workflow with its existing CI credentials.");

async function api(endpoint, method = "GET", body, allow404 = false) {
  const url = new URL(endpoint, "https://api.vercel.com");
  url.searchParams.set("teamId", team);
  const response = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  if (allow404 && response.status === 404) return null;
  if (!response.ok) throw new Error(`Vercel ${method} ${url.pathname} failed (${response.status}); provider replies are omitted.`);
  return response.json();
}

let project = await api(`/v9/projects/${name}`, "GET", undefined, true);
if (!project) project = await api("/v11/projects", "POST", { name, framework: null, rootDirectory: null, nodeVersion: "22.x" });
if (project.name !== name || project.accountId !== team || !project.id?.startsWith("prj_")) throw new Error("New Services project ownership does not match the confirmed target.");
if (project.rootDirectory && project.rootDirectory !== ".") throw new Error("Services project must use the repository root.");

const source = await api(`/v10/projects/${sourceProject}/env?decrypt=true`);
const rows = Array.isArray(source) ? source : source.envs || [];
const keys = ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
const copy = [];
// Reuse only a complete, existing Production store configuration. Branch-only
// Preview overrides and all earlier client URLs are intentionally excluded.
for (const key of keys) {
  const row = rows.find(row => row.key === key && !row.gitBranch && row.target?.includes("production"));
  if (row && typeof row.value === "string" && row.value) copy.push({ key, value: row.value, type: "encrypted", target: ["production", "preview"] });
}
if (!(copy.some(row => row.key === "KV_REST_API_URL") && copy.some(row => row.key === "KV_REST_API_TOKEN")) && !(copy.some(row => row.key === "UPSTASH_REDIS_REST_URL") && copy.some(row => row.key === "UPSTASH_REDIS_REST_TOKEN"))) throw new Error("The existing Production Redis configuration is unavailable; no replacement store was created.");
copy.push(
  { key: "MOCK_SANDBOX", value: "services-production", type: "plain", target: ["production"] },
  { key: "MOCK_SANDBOX", value: "services-preview", type: "plain", target: ["preview"] },
  { key: "SUITE_SERVICES_PUBLIC_URL", value: `https://${name}.vercel.app`, type: "plain", target: ["production"] },
);
await api(`/v10/projects/${project.id}/env?upsert=true`, "POST", copy);
fs.mkdirSync(".vercel", { recursive: true });
fs.writeFileSync(".vercel/project.json", JSON.stringify({ orgId: team, projectId: project.id, projectName: name }));

// Vercel's CLI consumes auth.json; put it in a private temporary directory,
// rather than passing --token through OS arguments or build manifests.
const authDirectory = path.join(process.env.RUNNER_TEMP, "orgtik-services-cli");
fs.mkdirSync(authDirectory, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(authDirectory, "auth.json"), JSON.stringify({ token }), { mode: 0o600 });
fs.appendFileSync(process.env.GITHUB_ENV, `ORGTIK_VERCEL_CONFIG=${authDirectory}\n`);
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Services project: ${name} (${project.id})\n\nProduction dataset: services-production; Preview dataset: services-preview.\n`);
console.log(`Configured ${name} in the confirmed team; existing Redis credentials remain private.`);
