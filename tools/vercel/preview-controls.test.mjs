import assert from "node:assert/strict";
import { createRequire } from "node:module";
import http from "node:http";
import { test } from "node:test";
import { mockControlRequest } from "../../program/tools/audit-kit/lib/mock-control.mjs";
import { createAppHandoff } from "../../program/tools/audit-kit/lib/handoff.mjs";

test("fixture cleanup cannot change canonical accounts when the journal reset loses its revision race", async () => {
  const load = createRequire(import.meta.url);
  const store = load("../../mock/lib/journal.js").memoryStore();
  const accounts = new Map([
    ["fixture", JSON.stringify({ user: { email: "fixture@orgtik.test" } })],
    ["retained", JSON.stringify({ user: { email: "retained@business.org" } })],
  ]);
  await store.initialize({ epoch: "before" });
  await store.initializeIdentity(accounts);
  await assert.rejects(store.reset({ epoch: "after" }, { expectedEpoch: "before", expectedRevision: 1, resetTestFixtures: true }), { status: 409 });
  assert.deepEqual(await store.identityAccounts(), accounts);
  await store.reset({ epoch: "after" }, { expectedEpoch: "before", expectedRevision: 0, resetTestFixtures: true });
  assert.deepEqual([...await store.identityAccounts()], [["retained", accounts.get("retained")]]);
});

test("denied administrator sign-in or staff selection cannot call a test control or expose session values", async () => {
  for (const deniedStep of ["login", "workspace"]) {
    const calls = [];
    const request = async (url) => {
      calls.push(url);
      const denied = url.endsWith(deniedStep);
      return Response.json({ data: { tokens: { accessToken: "private-session" } }, message: "private-session" }, { status: denied ? 403 : 200 });
    };
    await assert.rejects(mockControlRequest({ sosApi: "https://mock.test/sos", url: "https://mock.test/sos/__mock/reset" }, request), error => {
      assert.match(error.message, /answered 403/);
      assert.ok(!error.message.includes("private-session"));
      return true;
    });
    assert.ok(calls.every(url => !url.includes("__mock")));
  }
});

test("preview controls use current staff sessions while unauthorized requests remain rejected", { timeout: 60000 }, async () => {
  Object.assign(process.env, {
    MOCK_AUTH_STORE: "", MOCK_JOURNAL: "memory", MOCK_SANDBOX: "preview", MOCK_PUBLIC_URL: "", VERCEL: "",
    MOCK_SESSION_SECRET: "synthetic-preview-controls-signing-key-32-bytes",
    KV_REST_API_URL: "", KV_REST_API_TOKEN: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "",
  });
  process.argv.push("--only=sos,admin,wm,tasks");
  const load = createRequire(import.meta.url);
  const server = http.createServer(load("../../mock/api/index.js"));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sosApi = `${base}/sos`;
  const send = (endpoint, body, token) => fetch(sosApi + endpoint, {
    method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  const control = (app, endpoint, body) => mockControlRequest({ sosApi, url: `${base}/${app}${endpoint}`, body, target: app === "wm" ? "wm" : "admin" });
  try {
    assert.equal((await send("/__mock/reset", {})).status, 401);
    const login = await send("/api/auth/login", { email: "mona.adel@orgtik.test", password: "Local@2026" });
    assert.equal(login.status, 200);
    const suiteToken = (await login.json()).data.tokens.accessToken;
    assert.equal((await send("/__mock/reset", {}, suiteToken)).status, 403);
    assert.equal((await send("/__mock/reset", { fixtures: true }, suiteToken)).status, 403);
    for (const target of ["sos", "tasks", "admin", "wm"]) {
      const code = await createAppHandoff(`${sosApi}/api`, target, suiteToken);
      const audience = target === "sos" ? "suite" : ["admin", "wm"].includes(target) ? `staff:${target}` : `tool:${target}`;
      const exchanged = await send("/api/auth/handoff/exchange", { code, audience });
      assert.equal(exchanged.status, 200, target);
      const session = (await exchanged.json()).data;
      assert.equal(JSON.parse(Buffer.from(session.tokens.accessToken.split(".")[1], "base64url")).aud, audience);
      assert.equal((await send("/api/auth/handoff/exchange", { code, audience })).status, 400);
    }

    const created = await send("/api/auth/register", { email: "preview-reset@orgtik.test", name: "Preview fixture", password: "PreviewFixture@2026" });
    assert.equal(created.status, 201);
    const registered = (await created.json()).data;
    const retained = await send("/api/auth/register", { email: "retained@business.org", name: "Retained account", password: "RetainedFixture@2026" });
    assert.equal(retained.status, 201);

    assert.equal((await control("sos", "/__mock/reset", {})).status, 200);
    const preserved = await send("/api/auth/login", { email: "preview-reset@orgtik.test", password: "PreviewFixture@2026" });
    assert.equal(preserved.status, 200);
    assert.equal((await preserved.json()).data.user.id, registered.user.id);
    assert.equal((await control("sos", "/__mock/clock", { now: "real", reset: false })).status, 200);
    assert.equal((await control("sos", "/__mock/faults", { app: "wm", match: "/synthetic-control-regression", status: 503, times: 1 })).status, 201);
    assert.equal((await control("admin", "/v1/__mock/fail-next-payment", { count: 1 })).status, 200);
    assert.equal((await control("wm", "/v2/__mock/forms-live")).status, 200);
    const wmReset = await mockControlRequest({ sosApi, url: `${base}/sos/__mock/reset`, body: { fixtures: true }, target: "wm" });
    assert.equal(wmReset.status, 403);
    assert.equal((await control("sos", "/__mock/reset", { fixtures: true })).status, 200);
    assert.equal((await send("/api/auth/login", { email: "preview-reset@orgtik.test", password: "PreviewFixture@2026" })).status, 401);
    assert.equal((await send("/api/auth/login", { email: "retained@business.org", password: "RetainedFixture@2026" })).status, 200);
    assert.equal((await send("/__mock/reset", {})).status, 401);
  } finally {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
});
