import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { checkMockBundle } from "./check-mock-bundle.mjs";

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
