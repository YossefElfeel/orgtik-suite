import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { restoreRuntimeEntry } from "./runtime-entry.mjs";
const load = createRequire(import.meta.url);

test("framework discovery needs no sensitive credentials and HTTP requests fail closed without them", () => {
  const source = `
    const assert=require('node:assert/strict');
    process.env.MOCK_PERSISTENCE='supabase';
    process.env.SUPABASE_URL='https://project.supabase.co';
    process.env.SUPABASE_SECRET_KEY='[SENSITIVE]';
    process.env.MOCK_SESSION_SECRET='[SENSITIVE]';
    process.env.VERCEL_ENV='production';delete process.env.VERCEL_DEV_PORT;
    assert.equal(typeof require('./mock/index.js'),'function');
    const handler=require('./mock/api/index.js');
    assert.equal(typeof handler,'function');
    assert.equal(require.cache[require.resolve('./mock/server.js')],undefined);
    let status,body;const headers={};
    const res={set statusCode(value){status=value},setHeader(k,v){headers[k]=v},end(value){body=value}};
    console.error=()=>{};
    handler({method:'GET',url:'/wm/v2/public/site',headers:{}},res).then(()=>{
      assert.equal(status,503);assert.equal(JSON.parse(body).message,'[mock] data store unavailable');
      assert.ok(!body.includes('[SENSITIVE]'));
    }).catch(()=>{process.exitCode=1});
  `;
  execFileSync(process.execPath, ["-e", source], { cwd: path.resolve(import.meta.dirname, "../.."), stdio: "pipe" });
});
test("the renamed declared entry uses restored handlers instead of stale compiled aliases", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-runtime-entry-"));
  try {
    const runtime = path.join(root, "runtime"), folder = path.join(root, "function"), mock = path.join(folder, "mock");
    fs.mkdirSync(runtime); fs.mkdirSync(path.join(mock, "api"), { recursive: true });
    fs.writeFileSync(path.join(runtime, "index.js"), "const handler=require('./api/index.js'); module.exports=request=>handler(request);\n");
    fs.writeFileSync(path.join(mock, "api/index.js"), "module.exports=request=>({status:200,path:request.path});\n");
    fs.writeFileSync(path.join(mock, "api/index.cjs"), "module.exports={};\n");
    const entry = path.join(mock, "index.cjs");
    fs.writeFileSync(entry, "const handler=require('./api/index.cjs'); module.exports=request=>handler(request);\n");
    assert.throws(() => load(entry)({ path: "/wm/v2/public/site" }), /handler is not a function/);
    delete load.cache[load.resolve(entry)];
    restoreRuntimeEntry(runtime, entry, folder);
    assert.deepEqual(load(entry)({ path: "/wm/v2/public/site" }), { status: 200, path: "/wm/v2/public/site" });
    assert.throws(() => restoreRuntimeEntry(runtime, path.join(root, "outside.cjs"), folder), /Unexpected/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
