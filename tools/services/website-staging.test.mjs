import test from "node:test";
import assert from "node:assert/strict";
import { verifyWebsiteStaging } from "./website-staging.mjs";
test("protected requests stay on the website; all nine upstreams receive ordinary public requests", async () => {
  const protectedPaths = [], publicUrls = [];
  const result = await verifyWebsiteStaging({
    protectedRequest: async path => { protectedPaths.push(path); return { status: path === "/" ? 200 : 404 }; },
    publicRequest: async (...args) => { assert.equal(args.length, 1); publicUrls.push(args[0]); return { status: 200 }; },
  });
  assert.deepEqual(protectedPaths, ["/", "/mock/sos/api/auth/login"]);
  assert.equal(result.frontends, 9);
  assert.equal(new Set(publicUrls.slice(0, 9).map(url => url.host)).size, 9);
  assert.equal(publicUrls.at(-1).pathname, "/sos/api/backend/wm/v2/public/site");
});
test("upstream protection redirects and accidental public mock routes fail before promotion", async () => {
  await assert.rejects(verifyWebsiteStaging({ protectedRequest: async path => ({ status: path === "/" ? 200 : 404 }), publicRequest: async () => ({ status: 302 }) }), /public entry returned 302/);
  await assert.rejects(verifyWebsiteStaging({ protectedRequest: async () => ({ status: 200 }), publicRequest: async () => ({ status: 200 }) }), /Internal mock/);
});
