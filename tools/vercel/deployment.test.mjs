import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { checkMockBundle } from "./check-mock-bundle.mjs";
import { copyMockRuntime } from "./copy-mock-runtime.mjs";
import { selectDeploymentProjects } from './deployment-policy.mjs';

test('automatic rollouts select affected existing projects and exclude retired Content', () => {
  const projects = JSON.parse(fs.readFileSync(new URL('./projects.json', import.meta.url))).projects;
  const selection = selectDeploymentProjects(projects, { affectedPackages: Object.values(projects).map(project => project.package), environment: 'production' });
  assert.equal(selection.length, 11);
  assert.deepEqual(selection.slice(0, 3).map(project => project.key), ['mock', 'sos', 'website']);
  assert.equal(selection.some(project => project.key === 'content'), false);
  assert.deepEqual(selectDeploymentProjects(projects, { affectedPackages: [projects.tasks.package] }).map(project => project.key), ['tasks']);
});

test('manual main rollout preserves the explicit existing-project scope and rejects retired projects', () => {
  const projects = JSON.parse(fs.readFileSync(new URL('./projects.json', import.meta.url))).projects;
  assert.deepEqual(selectDeploymentProjects(projects, { requested: ['tasks', 'mock'], environment: 'production', manualMain: true }).map(project => project.key), ['mock', 'tasks']);
  assert.throws(() => selectDeploymentProjects(projects, { requested: ['content'] }), /retired project/);
  assert.throws(() => selectDeploymentProjects(projects, { requested: ['unknown'] }), /Unknown requested/);
  assert.throws(() => selectDeploymentProjects(projects, { requested: ['tasks'], environment: 'production' }), /limited project selection/);
});

test("binary HLS transport segments are excluded from the TypeScript tracer", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../../mock/vercel.json", import.meta.url), "utf8"));
  const pattern = config.functions["api/index.js"].excludeFiles;
  const assets = new URL("../../mock/apps/files/assets/hls/", import.meta.url);
  const segments = fs.readdirSync(assets, { recursive: true }).filter(file => file.endsWith(".ts"));
  assert.ok(segments.length > 0);
  for (const file of segments) {
    const relative = `apps/files/assets/hls/${file.replaceAll("\\", "/")}`;
    assert.ok(path.matchesGlob(relative, pattern), file);
    assert.ok(path.matchesGlob(`mock/${relative}`, pattern), `repository-base trace: ${file}`);
  }
  assert.equal(path.matchesGlob("apps/files.js", pattern), false, "The Files API remains traced");
});
import { protectedFetch, mintPreviewTokens, HEADER, previewShellPath } from "./preview-protection.mjs";

test("availability probes use each project's public local shell rather than its protected dashboard", async () => {
  const projects = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url))).projects;
  for (const [key, project] of Object.entries(projects)) {
    const origin = new URL(project.previewUrl).origin;
    const request = protectedFetch({ [origin]: "fixture.token.value" }, async (url, options) => {
      assert.equal(options.headers.get(HEADER), "fixture.token.value");
      if (!["mock", "website", "sos"].includes(key) && new URL(url).pathname === "/") {
        return new Response(null, { status: 307, headers: { location: projects.sos.previewUrl + "/auth" } });
      }
      return new Response("local shell");
    });
    assert.equal((await request(origin + previewShellPath(key))).status, 200);
    if (!["mock", "website", "sos"].includes(key)) await assert.rejects(request(origin), /redirected away/);
  }
  assert.throws(() => previewShellPath("unknown"), /Unknown protected preview project/);
});

const parseUrl = input => execFileSync(process.execPath, [path.join(import.meta.dirname, "deploy-url.mjs")], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();

test("deployment URL accepts CLI text and agent JSON without trusting progress output", () => {
  assert.equal(parseUrl("Build logs\nhttps://suite-123.vercel.app\n"), "https://suite-123.vercel.app");
  assert.equal(parseUrl(JSON.stringify({ deployment: { url: "suite-123.vercel.app" } })), "https://suite-123.vercel.app");
  assert.throws(() => parseUrl(JSON.stringify({ url: "https://example.com" })));
});

test("mock artifact rejects missing startup imports and accepts a self-contained dependency tree", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-bundle-test-"));
  const output = path.join(folder, "output");
  const fn = path.join(output, "functions/api/index.func");
  try {
    fs.mkdirSync(path.join(fn, "mock/api"), { recursive: true });
    fs.writeFileSync(path.join(fn, ".vc-config.json"), JSON.stringify({ handler: "mock/api/index.js" }));
    fs.writeFileSync(path.join(fn, "mock/api/index.js"), "module.exports = () => {};\n");
    assert.throws(() => checkMockBundle(output), /Cannot find module 'express'|Mock dependency express resolves outside the uploaded artifact/);
    const runtime = path.join(folder, "runtime");
    for (const name of ["express", "cors", "multer", "socket.io", "@iconify/utils"]) {
      const pkg = path.join(runtime, "node_modules", name);
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, "index.js"), "module.exports = {};\n");
    }
    const deps = JSON.parse(fs.readFileSync(new URL("../../mock/package.json", import.meta.url))).dependencies;
    for (const name of Object.keys(deps).filter(name => name.startsWith("@iconify-json/"))) {
      const pkg = path.join(runtime, "node_modules", name);
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, "icons.json"), '{"icons":{}}\n');
    }
    const media = path.join(fn, "mock/apps/files/assets/hls");
    fs.mkdirSync(path.join(media, "mp4_product_demo"), { recursive: true });
    fs.writeFileSync(path.join(media, "mp4_product_demo/segment-0.ts"), "Bundler-transformed TypeScript");
    copyMockRuntime(runtime, output);
    assert.doesNotThrow(() => checkMockBundle(output));
    assert.ok(fs.existsSync(path.join(fn, "mock/api/index.js")), "Copy preserves the existing handler and assets");
    const historicalSource = new URL("../../mock/apps/admin/legacy-v1/identity.js", import.meta.url);
    if (fs.existsSync(historicalSource)) {
      const historical = path.join(fn, "mock/apps/admin/legacy-v1/identity.js");
      fs.writeFileSync(historical, "A tracer rewrote historical financial authority\n");
      assert.throws(() => checkMockBundle(output), /Historical financial reducer was altered or omitted/);
      fs.copyFileSync(historicalSource, historical);
      assert.doesNotThrow(() => checkMockBundle(output));
    }
    const segment = path.join(media, "mp4_product_demo/segment-0.ts");
    fs.writeFileSync(segment, "Incorrect TypeScript treatment of a transport-stream asset");
    assert.throws(() => checkMockBundle(output), /HLS asset was altered or omitted/);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test("ephemeral preview access stays on its origin through redirects", async () => {
  const origin = "https://orgtik-suite-sos-preview.vercel.app";
  const requests = [];
  const native = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return String(url) === origin ? new Response(null, { status: 307, headers: { location: "/en" } }) : new Response("ok");
  };
  const request = protectedFetch({ [origin]: "fixture.token.value" }, native);
  assert.equal((await request(origin)).status, 200);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].options.headers.get(HEADER), "fixture.token.value");
  await request("https://outside.example/asset");
  assert.equal(requests[2].options.headers?.get(HEADER), undefined);
});

test("a protected redirect cannot send its credential to Vercel sign-in or another host", async () => {
  let calls = 0;
  const origin = "https://orgtik-suite-sos-preview.vercel.app";
  const request = protectedFetch({ [origin]: "fixture.token.value" }, async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "https://vercel.com/login" } });
  });
  await assert.rejects(request(origin), /redirected away/);
  assert.equal(calls, 1);
});

test("preview OIDC uses the project token subcommand and the existing preview mock project", () => {
  const previous = process.env.VERCEL_TOKEN;
  process.env.VERCEL_TOKEN = "fixture-token";
  const calls = [];
  try {
    const tokens = mintPreviewTokens(["mock", "sos"], (command, args) => {
      calls.push({ command, args });
      return JSON.stringify({ token: "fixture.token.value" });
    });
    assert.deepEqual(calls.map(call => call.args.slice(0, 3)), [
      ["project", "token", "orgtik-suite-mock-preview"],
      ["project", "token", "orgtik-suite-sos"],
    ]);
    assert.equal(tokens["https://orgtik-suite-mock-preview.vercel.app"], "fixture.token.value");
  } finally {
    if (previous === undefined) delete process.env.VERCEL_TOKEN;
    else process.env.VERCEL_TOKEN = previous;
  }
});
