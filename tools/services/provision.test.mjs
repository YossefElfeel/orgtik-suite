import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { frontendProjects } from "./projects.mjs";

// Exercise the actual provisioning entry point with a private, synthetic Vercel
// API. The child cannot access the network, and only writes under its temp root.
const preload = `
import fs from "node:fs";
const calls = [], team = "team_Ypx8oiLDZi3PBNi8ht8fYPsm";
const env = { MOCK_PERSISTENCE: "supabase", SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co", SUPABASE_SECRET_KEY: ["sb", "secret", "fixture_provision_private_only"].join("_"), MOCK_SESSION_SECRET: "fixture-provision-signing-authority-only" };
if (process.env.FIXTURE_MODE === "invalid") delete env.MOCK_SESSION_SECRET;
if (process.env.FIXTURE_MODE === "redis") env.MOCK_PERSISTENCE = "redis";
if (process.env.FIXTURE_MODE === "legacy") for (const key of Object.keys(env)) delete env[key];
for (const key of ["MOCK_PERSISTENCE", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "MOCK_SESSION_SECRET"]) delete process.env[key];
Object.assign(process.env, env);
globalThis.fetch = async (url, init) => {
  const route = url.pathname, body = init.body ? JSON.parse(init.body) : null;
  calls.push({ route, method: init.method, body });
  fs.writeFileSync(process.env.FIXTURE_TRACE, JSON.stringify(calls));
  const json = value => Response.json(value);
  if (route.startsWith("/v9/projects/orgtik-suite-services")) return json({ id: "prj_fixture", name: route.split("/").at(-1), accountId: team, nodeVersion: "22.x" });
  if (route === "/v9/projects/prj_74P0VeIbDAIyUy8u5r6h91mwai1o") return new Response(null, { status: 404 });
  if (route === "/v1/storage/stores/store_9fSF6RF2vRVS2OxK") return json({ store: { id: "store_9fSF6RF2vRVS2OxK", projectsMetadata: [{ projectId: "prj_fixture", environments: ["production", "preview"] }] } });
  if (route === "/v10/projects/prj_fixture/env" && init.method === "GET") return json({ envs: ["KV_REST_API_URL", "KV_REST_API_TOKEN"].map(key => ({ key, target: ["production", "preview"] })) });
  if (route === "/v10/projects/prj_fixture/env" && init.method === "POST") return json({});
  throw new Error("Unapproved fixture API call");
};
`;

function run(key, mode = "supabase") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-provision-test-"));
  try {
    const file = path.join(directory, "fetch.mjs"), trace = path.join(directory, "trace.json");
    fs.writeFileSync(file, preload);
    let output = "", error;
    try {
      output = execFileSync(process.execPath, ["--import", pathToFileURL(file).href, fileURLToPath(new URL("./provision.mjs", import.meta.url)), key], {
        cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
        env: { ...process.env, VERCEL_TOKEN: "fixture-only", GITHUB_ACTIONS: "true", RUNNER_TEMP: directory, GITHUB_ENV: path.join(directory, "github-env"), GITHUB_STEP_SUMMARY: path.join(directory, "summary"), FIXTURE_TRACE: trace, FIXTURE_MODE: mode },
      });
    } catch (caught) { error = caught; }
    if (!fs.existsSync(trace)) throw error || new Error("The provisioning fixture did not reach its API stub.");
    return { output, error, calls: JSON.parse(fs.readFileSync(trace, "utf8")) };
  } finally {
    const relative = path.relative(os.tmpdir(), directory);
    assert.ok(relative.startsWith("orgtik-provision-test-") && !relative.includes(path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("all nine backend projects select Supabase without touching Redis or publishing secrets", () => {
  for (const key of frontendProjects) {
    const { error, output, calls } = run(key);
    assert.equal(error, undefined, key);
    assert.ok(calls.every(call => !call.route.includes("/storage/") && !call.route.includes("prj_74P0")));
    assert.ok(calls.every(call => !call.route.includes("/env/pull/")), "Supabase credentials must never be exported from Vercel");
    const rows = calls.find(call => call.method === "POST").body;
    for (const name of ["MOCK_PERSISTENCE", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "MOCK_SESSION_SECRET"]) {
      const row = rows.find(row => row.key === name);
      assert.equal(row?.type, ["SUPABASE_SECRET_KEY", "MOCK_SESSION_SECRET"].includes(name) ? "sensitive" : "plain", `${key}: ${name}`);
      assert.deepEqual(row.target, ["production", "preview"]);
    }
    assert.equal(rows.find(row => row.key === "MOCK_SANDBOX" && row.target.includes("production")).value, "services-production");
    assert.equal(rows.find(row => row.key === "MOCK_SANDBOX" && row.target.includes("preview")).value, "services-preview");
    assert.ok(!output.includes("fixture_provision_private") && !output.includes("fixture-provision-signing"));
  }
});

test("the website/router never fetches or copies persistence credentials", () => {
  const { error, calls } = run("website");
  assert.equal(error, undefined);
  assert.ok(calls.every(call => !call.route.includes("/env/pull/") && !call.route.includes("/storage/")));
  const keys = calls.find(call => call.method === "POST").body.map(row => row.key);
  assert.deepEqual(keys, ["MOCK_SANDBOX", "MOCK_SANDBOX", "SUITE_SERVICES_PUBLIC_URL"]);
});

test("legacy selection and explicit rollback reuse the confirmed Redis connection without deleting Supabase data", () => {
  for (const mode of ["legacy", "redis"]) {
    const { error, calls } = run("wm", mode);
    assert.equal(error, undefined);
    const changes = calls.filter(call => call.method !== "GET");
    assert.equal(changes.length, 1);
    assert.equal(changes[0].route, "/v10/projects/prj_fixture/env");
    assert.equal(changes[0].body.find(row => row.key === "MOCK_PERSISTENCE").value, "redis");
    assert.ok(changes[0].body.every(row => !row.key.startsWith("SUPABASE_")));
  }
});

test("incomplete Supabase source stops before any destination configuration or Redis fallback", () => {
  const { error, calls } = run("wm", "invalid");
  assert.ok(error);
  assert.match(error.stderr.toString(), /incomplete or invalid/);
  assert.ok(!error.stderr.toString().includes("fixture-provision-signing"));
  assert.ok(calls.every(call => call.method === "GET" && !call.route.includes("/storage/")));
});
