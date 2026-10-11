import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { withPreviewPin } from "./preview-pin.mjs";

const projectId = "prj_O5Xp99VEPyKOb6ImpcQEEoRN0Np2";
const alias = "orgtik-suite-mock-preview.vercel.app";
const previous = "orgtik-suite-mock-preview-before-yossef-elfeels-projects.vercel.app";
const pinned = "orgtik-suite-mock-preview-tested-yossef-elfeels-projects.vercel.app";
const manifest = { projects: { mock: { deploymentUrl: `https://${pinned}` } } };
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-preview-pin-"));
  const statePath = path.join(directory, "state.json");
  let active = previous;
  const calls = [];
  const options = { token: "private-fixture-credential", statePath, manifest, verify: () => {}, request: async (input, init) => {
    const url = new URL(input); assert.equal(url.origin, "https://api.vercel.com"); assert.equal(init.redirect, "error");
    calls.push({ pathname: url.pathname, method: init.method });
    if (url.pathname.startsWith("/v4/aliases/")) return Response.json({ alias, projectId, deployment: { url: active } });
    if (url.pathname.startsWith("/v13/deployments/")) return Response.json({ projectId, readyState: "READY", target: null });
    assert.equal(init.method, "POST"); assert.equal(JSON.parse(init.body).alias, alias);
    assert.ok(fs.existsSync(statePath), "The prior target is saved before an alias mutation");
    active = decodeURIComponent(url.pathname.split("/")[3]);
    return Response.json({ alias });
  } };
  return { options, calls, active: () => active, setActive: value => { active = value; }, cleanup() {
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("orgtik-preview-pin-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  } };
}

test("verification selects an existing preview and restores the saved alias without a deployment", async () => {
  const f = fixture();
  try {
    await withPreviewPin("pin", f.options); assert.equal(f.active(), pinned);
    await withPreviewPin("restore", f.options); assert.equal(f.active(), previous);
    assert.equal(fs.existsSync(f.options.statePath), false);
    assert.ok(f.calls.filter(call => call.method === "POST").every(call => call.pathname.endsWith("/aliases")));
  } finally { f.cleanup(); }
});

test("restoration cannot overwrite an intervening alias owner", async () => {
  const f = fixture();
  try {
    await withPreviewPin("pin", f.options); f.setActive("orgtik-suite-mock-preview-newowner-yossef-elfeels-projects.vercel.app");
    await assert.rejects(withPreviewPin("restore", f.options), /changed externally/);
    assert.equal(f.calls.filter(call => call.method === "POST").length, 1);
  } finally { f.cleanup(); }
});

test("source mismatch and foreign or production deployments fail before an alias mutation", async () => {
  for (const rejected of ["source", "project", "production"]) {
    const f = fixture();
    try {
      if (rejected === "source") f.options.verify = () => { throw new Error("Application sources differ"); };
      else {
        const base = f.options.request;
        f.options.request = (url, init) => url.includes("/v13/") ? Promise.resolve(Response.json({ projectId: rejected === "project" ? "foreign" : projectId, readyState: "READY", target: rejected === "production" ? "production" : null })) : base(url, init);
      }
      await assert.rejects(withPreviewPin("pin", f.options));
      assert.equal(f.calls.filter(call => call.method === "POST").length, 0);
    } finally { f.cleanup(); }
  }
});
