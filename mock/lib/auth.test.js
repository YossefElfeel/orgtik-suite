// Each step runs in a fresh process with one account file: a Vercel cold start without Redis
// credentials. Nothing touches the demo sandbox or any deployed account.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const EMAIL = "persistent.customer@orgtik.test";
const PASSWORD = "AccountTest@2026";
const NEXT_PASSWORD = "ChangedTest@2026";

async function child(step) {
  let rejectCommit = false;
  if (step === "commit-outage") {
    const storage = require("./auth-store");
    const pick = storage.pickStore;
    storage.pickStore = (config) => {
      const store = pick(config), commit = store.commit.bind(store);
      store.commit = async (changes) => {
        if (rejectCommit) throw Object.assign(new Error("Synthetic local write failure"), { status: 503 });
        return commit(changes);
      };
      return store;
    };
  }
  const handler = require("../api/index.js");
  const server = require("node:http").createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, endpoint, body, token) => {
    const response = await fetch(base + endpoint, {
      method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, json: await response.json() };
  };
  const login = (email = EMAIL, password = PASSWORD) => call("POST", "/sos/api/auth/login", { email, password });
  let result = {};
  try {
    if (step === "register") {
      const created = await call("POST", "/sos/api/auth/register", { email: EMAIL, name: "Persistent Customer", company: "Keep My Account", password: PASSWORD });
      assert.equal(created.status, 201);
      const token = created.json.data.tokens.accessToken;
      assert.ok(!("passwordHash" in created.json.data.user));
      assert.ok(!("signup" in JSON.parse(Buffer.from(token.split(".")[1], "base64url"))));
      const me = await call("GET", "/sos/v1/app/me", null, token);
      assert.equal(me.status, 200);
      result = { id: created.json.data.user.id, workspace: me.json.data.workspace.id };
    } else if (step === "read" || step === "read-new") {
      const signedIn = await login(EMAIL, step === "read" ? PASSWORD : NEXT_PASSWORD);
      assert.equal(signedIn.status, 200);
      const token = signedIn.json.data.tokens.accessToken;
      const me = await call("GET", "/sos/v1/app/me", null, token);
      assert.equal(me.status, 200);
      const profile = await call("GET", "/sos/api/auth/me", null, token);
      assert.equal(profile.status, 200);
      const duplicate = await call("POST", "/sos/api/auth/register", { email: EMAIL.toUpperCase(), name: "Duplicate", password: PASSWORD });
      assert.equal(duplicate.status, 409);
      const admin = await login("mona.adel@orgtik.test", "Local@2026");
      assert.equal(admin.status, 200);
      const handoff = await call("POST", "/sos/api/auth/handoff", null, token);
      assert.equal(handoff.status, 200);
      result = { id: profile.json.data.user.id, workspace: me.json.data.workspace.id, handoff: handoff.json.data.code, scopes: profile.json.data.scopes };
    } else if (step === "exchange") {
      const response = await call("POST", "/sos/api/auth/handoff/exchange", { code: process.env.AUTH_TEST_CODE });
      assert.equal(response.status, 200);
      assert.ok(response.json.data.tokens.refreshToken);
      const refreshed = await call("POST", "/sos/api/auth/refresh", { refreshToken: response.json.data.tokens.refreshToken });
      assert.equal(refreshed.status, 200);
      result.id = JSON.parse(Buffer.from(response.json.data.accessToken.split(".")[1], "base64url")).sub;
    } else if (step === "used-code") {
      const response = await call("POST", "/sos/api/auth/handoff/exchange", { code: process.env.AUTH_TEST_CODE });
      assert.equal(response.status, 400);
    } else if (step === "password") {
      const signedIn = await login();
      const changed = await call("POST", "/sos/api/auth/change-password", { oldPassword: PASSWORD, newPassword: NEXT_PASSWORD }, signedIn.json.data.tokens.accessToken);
      assert.equal(changed.status, 200);
      assert.equal((await login()).status, 401);
      assert.equal((await login(EMAIL, NEXT_PASSWORD)).status, 200);
    } else if (step === "commit-outage") {
      const signedIn = await login(EMAIL, NEXT_PASSWORD);
      assert.equal(signedIn.status, 200);
      const token = signedIn.json.data.tokens.accessToken;
      rejectCommit = true;
      const changed = await call("POST", "/sos/api/auth/change-password", { oldPassword: NEXT_PASSWORD, newPassword: "FailedChange@2026" }, token);
      assert.equal(changed.status, 503);
      assert.equal((await call("GET", "/sos/api/auth/me", null, token)).status, 200);
      assert.equal((await login(EMAIL, NEXT_PASSWORD)).status, 200);
      assert.equal((await login(EMAIL, "FailedChange@2026")).status, 401);
    } else if (step === "reset-business") {
      assert.equal((await call("POST", "/sos/__mock/reset")).status, 200);
    } else if (step === "reject-fixtures") {
      const admin = await login("mona.adel@orgtik.test", "Local@2026");
      assert.equal((await call("POST", "/sos/__mock/reset", { fixtures: true }, admin.json.data.tokens.accessToken)).status, 403);
    } else if (step === "register-and-write") {
      const created = await call("POST", "/sos/api/auth/register", { email: "journal.customer@business.org", name: "Journal Customer", company: "Original Workspace", password: PASSWORD });
      assert.equal(created.status, 201);
      const token = created.json.data.tokens.accessToken;
      const changed = await call("PATCH", "/sos/v1/app/workspace", { name: "Updated on another instance" }, token);
      assert.equal(changed.status, 200);
      result = { token };
    } else if (step === "warm-catch-up") {
      assert.equal((await login("mona.adel@orgtik.test", "Local@2026")).status, 200);
      // A separate instance registers a person and writes to their own workspace, while this
      // instance keeps its original in-memory identities and business data.
      execFileSync(process.execPath, [__filename, "--child", "register-and-write"], {
        env: process.env, stdio: ["ignore", "ignore", "pipe"], timeout: 25000,
      });
      const { token } = JSON.parse(fs.readFileSync(process.env.AUTH_TEST_OUT, "utf8"));
      const me = await call("GET", "/sos/v1/app/me", null, token);
      assert.equal(me.status, 200);
      assert.equal(me.json.data.workspace.name, "Updated on another instance");
      const status = await call("GET", "/sos/__mock/status");
      assert.equal(status.json.data.journal.skipped, 0);
    } else if (step === "deactivate") {
      const admin = await login("mona.adel@orgtik.test", "Local@2026");
      const account = await login(EMAIL, NEXT_PASSWORD);
      const id = account.json.data.user.id;
      const changed = await call("PATCH", `/sos/api/users/${id}`, { isActive: false }, admin.json.data.tokens.accessToken);
      assert.equal(changed.status, 200);
    } else if (step === "inactive") {
      assert.equal((await login(EMAIL, NEXT_PASSWORD)).status, 403);
    } else if (step === "outage") {
      assert.equal((await login("mona.adel@orgtik.test", "Local@2026")).status, 503);
    }
    fs.writeFileSync(process.env.AUTH_TEST_OUT, JSON.stringify(result));
  } finally { server.closeAllConnections(); server.close(); }
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-auth-test-"));
  const file = path.join(temp, "accounts.json"), out = path.join(temp, "out.json");
  const sandbox = `auth-test-${process.pid}`;
  const journalFile = path.join(__dirname, "..", "journal", `${sandbox}.json`);
  const run = (step, extra = {}) => {
    execFileSync(process.execPath, [__filename, "--child", step], {
      env: { ...process.env, MOCK_AUTH_STORE: "file", MOCK_AUTH_FILE: file, MOCK_JOURNAL: "memory", MOCK_SANDBOX: sandbox, MOCK_PUBLIC_URL: "https://mock.test", VERCEL: "", KV_REST_API_URL: "", KV_REST_API_TOKEN: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", AUTH_TEST_OUT: out, ...extra },
      encoding: "utf8", stdio: ["ignore", "ignore", "pipe"], timeout: 25000,
    });
    return JSON.parse(fs.readFileSync(out, "utf8"));
  };
  let passed = 0;
  const check = (name, test) => { test(); passed++; console.log(`  ok  ${name}`); };
  try {
    const created = run("register"), cold = run("read");
    check("new account and workspace survive a fresh instance", () => {
      assert.equal(cold.id, created.id); assert.equal(cold.workspace, created.workspace);
    });
    const exchanged = run("exchange", { AUTH_TEST_CODE: cold.handoff });
    check("handoff works on another instance and includes refresh tokens", () => assert.equal(exchanged.id, created.id));
    run("used-code", { AUTH_TEST_CODE: cold.handoff }); passed++; console.log("  ok  a third instance refuses a consumed handoff");
    run("password"); run("read-new"); passed++; console.log("  ok  changed password survives a cold start; old password is refused");
    run("commit-outage"); run("read-new"); passed++; console.log("  ok  failed credential writes preserve the password and valid session");
    run("reset-business"); const kept = run("read-new");
    check("business reset preserves account identity and workspace ownership", () => { assert.equal(kept.id, created.id); assert.equal(kept.workspace, created.workspace); });
    run("reject-fixtures"); run("read-new"); passed++; console.log("  ok  production-style sandbox refuses account-fixture resets");
    run("warm-catch-up", { MOCK_JOURNAL: "file" }); passed++; console.log("  ok  warm instances restore new customer identities before replaying their writes");
    check("only salted hashes are stored; responses and tokens omit credentials", () => {
      const saved = fs.readFileSync(file, "utf8"); assert.ok(saved.includes("scrypt:"));
      assert.ok(!saved.includes(PASSWORD)); assert.ok(!saved.includes(NEXT_PASSWORD));
    });
    run("deactivate"); run("inactive"); passed++; console.log("  ok  deactivation survives a fresh instance");
    run("outage", { MOCK_AUTH_FILE: temp }); passed++; console.log("  ok  storage failure returns 503, never invalid-credentials 401");
    const { localStore, redisStore } = require("./auth-store");
    const accountStore = localStore();
    const originalAccount = JSON.stringify({ user: { email: "reusable@business.org" } });
    const renamedAccount = JSON.stringify({ user: { email: "deleted-1.reusable@business.org", deletedAt: "2026-10-07" } });
    await accountStore.commit([{ id: "1", expected: null, value: originalAccount }]);
    await accountStore.commit([
      { id: "1", expected: originalAccount, value: renamedAccount },
      { id: "2", expected: null, value: originalAccount },
    ]);
    assert.equal((await accountStore.accounts()).size, 2); passed++; console.log("  ok  atomic email release allows a replacement for a deleted account");
    await assert.rejects(accountStore.commit([
      { id: "3", expected: null, value: JSON.stringify({ user: { email: "duplicate@business.org" } }) },
      { id: "4", expected: null, value: JSON.stringify({ user: { email: "DUPLICATE@business.org" } }) },
    ]), { status: 409 });
    assert.equal((await accountStore.accounts()).size, 2); passed++; console.log("  ok  a duplicate-email batch fails atomically");
    await assert.rejects(accountStore.commit([{ id: "1", expected: originalAccount, value: originalAccount }]), { status: 409 });
    assert.equal((await accountStore.accounts()).get("1"), renamedAccount); passed++; console.log("  ok  stale account updates cannot overwrite newer credentials");
    const memory = localStore();
    await memory.commit([
      { id: "1", expected: null, value: JSON.stringify({ user: { email: "fixture@orgtik.test" } }) },
      { id: "2", expected: null, value: JSON.stringify({ user: { email: "customer@business.org" } }) },
    ]);
    await memory.resetTestFixtures();
    const remainingAccounts = [...(await memory.accounts()).keys()];
    check("preview fixture cleanup preserves real-domain accounts", () => assert.deepEqual(remainingAccounts, ["2"]));
    await memory.putHandoff("expired", { token: "test", expiresAt: 0 });
    assert.equal(await memory.takeHandoff("expired"), null); passed++; console.log("  ok  expired handoff is refused");
    const originalFetch = global.fetch;
    const commands = [];
    global.fetch = async (_url, options) => {
      const command = JSON.parse(options.body); commands.push(command);
      return { ok: true, json: async () => ({ result: command[0] === "HGETALL" ? ["1", "record"] : command[0] === "EVAL" ? 1 : command[0] === "GETDEL" ? JSON.stringify({ token: "test" }) : "OK" }) };
    };
    try {
      const redis = redisStore("https://redis.test", "synthetic", "test");
      assert.equal((await redis.accounts()).get("1"), "record");
      await redis.commit([{ id: "1", expected: "record", value: "updated" }]);
      await redis.putHandoff("code", { token: "test" }); await redis.takeHandoff("code");
      check("Redis uses atomic account commits and single-use expiring codes", () => {
        assert.ok(commands.some(c => c[0] === "EVAL")); assert.ok(commands.some(c => c[0] === "GETDEL"));
        assert.ok(commands.some(c => c[0] === "SET" && c.includes("EX") && c.includes("60") && c.includes("NX")));
      });
    } finally { global.fetch = originalFetch; }
    console.log(`Authentication: ${passed}/${passed} passed`);
  } finally {
    if (fs.existsSync(journalFile)) fs.unlinkSync(journalFile);
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv.includes("--child")) child(process.argv.at(-1)).catch((error) => { console.error(error); process.exitCode = 1; });
else main().catch((error) => { console.error(error.stderr?.toString() || error); process.exitCode = 1; });
