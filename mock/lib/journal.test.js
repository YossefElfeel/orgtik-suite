// The write journal survives a "cold start": each step runs in a fresh Node process that shares
// only the journal file, like two Vercel instances share Redis.
//   node lib/journal.test.js
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const SANDBOX = `jtest-${process.pid}`;
const FILE = path.join(__dirname, "..", "journal", `${SANDBOX}.json`);

// ---- child: one "instance" ----
async function child(step) {
  // A real HTTP server around the Vercel handler, as the platform runs it.
  const handler = require("../api/index.js");
  const server = require("http").createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body, token) => {
    const r = await fetch(base + url, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, json };
  };
  // Every {id, title|name} pair in a response, sorted: what a list screen would show.
  const items = (json) => {
    const out = [];
    (function walk(v) {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") {
        if (v.id != null && (v.title || v.name)) out.push(`${v.id}:${v.title || v.name}`);
        Object.values(v).forEach(walk);
      }
    })(json);
    return [...new Set(out)].sort();
  };

  const login = await call("POST", "/sos/api/auth/login", { email: "mona.adel@orgtik.test", password: "Local@2026" });
  assert.strictEqual(login.status, 200, "login");
  const token = login.json.data?.tokens?.accessToken || login.json.tokens?.accessToken;
  assert.ok(token, "token");

  const created = [];
  if (step === "write") {
    const p = await call("POST", "/tasks/api/projects", { title: "Journal check A" }, token);
    assert.ok(p.status < 300, `create project: ${p.status} ${JSON.stringify(p.json)}`);
    const f = await call("POST", "/files/api/v1/folders", { name: "Journal folder A" }, token);
    assert.ok(f.status < 300, `create folder: ${f.status} ${JSON.stringify(f.json)}`);
    created.push("project", "folder");
  }
  if (step === "write-more") {
    const p = await call("POST", "/tasks/api/projects", { title: "Journal check B" }, token);
    assert.ok(p.status < 300, `create project B: ${p.status}`);
    created.push("project");
  }
  if (step === "reset") {
    const r = await call("POST", "/sos/__mock/reset");
    assert.strictEqual(r.status, 200, "reset");
  }
  const projects = items((await call("GET", "/tasks/api/projects", null, token)).json);
  const folders = items((await call("GET", "/files/api/v1/folders", null, token)).json);
  const status = (await call("GET", "/sos/__mock/status")).json.data.journal;
  fs.writeFileSync(process.env.JOURNAL_TEST_OUT, JSON.stringify({ projects, folders, status, created }));
  server.closeAllConnections();
  server.close();
}

const OUT = path.join(__dirname, "..", "journal", `${SANDBOX}.out.json`);
function run(step) {
  try {
    execFileSync(process.execPath, [__filename, "--child", step], {
      env: { ...process.env, MOCK_JOURNAL: "file", MOCK_SANDBOX: SANDBOX, MOCK_PUBLIC_URL: "", VERCEL: "", JOURNAL_TEST_OUT: OUT },
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (e) {
    throw new Error(`step "${step}" failed:\n${e.stderr}`);
  }
  return JSON.parse(fs.readFileSync(OUT, "utf8"));
}

function main() {
  let passed = 0;
  const check = (name, fn) => { fn(); passed += 1; console.log(`  ok  ${name}`); };
  try {
    const seed = run("read");
    const seed2 = run("read");
    const a = run("write");
    const b = run("write-more");
    const c = run("read");
    const d = run("reset");
    const e = run("read");
    const newIn = (x) => x.projects.filter((p) => !seed.projects.includes(p));
    const newFolders = (x) => x.folders.filter((f) => !seed.folders.includes(f));

    check("a fresh journal starts from the seed only", () => assert.strictEqual(seed.status.entries, 0));
    check("instance A records its two changes", () => assert.strictEqual(a.status.entries, 2));
    check("A sees its new project and folder", () => {
      assert.strictEqual(newIn(a).length, 1);
      assert.strictEqual(newFolders(a).length, 1);
    });
    check("a cold start (B) rebuilds A's changes with the same ids", () => {
      assert.ok(newIn(a).every((p) => b.projects.includes(p)));
      assert.ok(newFolders(a).every((f) => b.folders.includes(f)));
    });
    check("B's own change is numbered after A's", () => assert.strictEqual(b.status.entries, 3));
    check("another cold start (C) sees every change, nothing skipped", () => {
      assert.deepStrictEqual(c.projects, b.projects);
      assert.deepStrictEqual(c.folders, b.folders);
      assert.strictEqual(c.status.skipped, 0);
    });
    check("the seed is identical on every instance", () => {
      // (lists are paged, so compare two cold starts before any change)
      assert.deepStrictEqual(seed2.projects, seed.projects);
      assert.deepStrictEqual(seed2.folders, seed.folders);
    });
    check("a reset empties the journal and drops the changes", () => {
      assert.strictEqual(d.status.entries, 0);
      const ours = (x) => [...x.projects, ...x.folders].filter((i) => i.includes("Journal"));
      assert.deepStrictEqual([...ours(d), ...ours(e)], []);
      assert.strictEqual(e.status.entries, 0);
    });
    console.log(`journal: ${passed}/8 passed`);
  } finally {
    fs.rmSync(FILE, { force: true });
    fs.rmSync(OUT, { force: true });
  }
}

if (process.argv[2] === "--child") child(process.argv[3]).catch((e) => { console.error(e); process.exit(1); });
else main();
