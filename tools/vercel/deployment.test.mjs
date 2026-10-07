import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { checkMockBundle } from "./check-mock-bundle.mjs";
import { protectedFetch, mintPreviewTokens, HEADER } from "./preview-protection.mjs";

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
    assert.throws(() => checkMockBundle(output), /Cannot find module 'express'/);
    for (const name of ["express", "cors", "multer", "socket.io", "@iconify/utils"]) {
      const pkg = path.join(fn, "node_modules", name);
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, "index.js"), "module.exports = {};\n");
    }
    assert.doesNotThrow(() => checkMockBundle(output));
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
