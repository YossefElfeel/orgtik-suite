// The mock's write journal (D-053): the hosted mock keeps its data across cold starts and between
// Vercel instances by recording every successful change and replaying it after the seed.
//
// Store (first match wins):
//   KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//                         Upstash Redis over REST (the Vercel Marketplace integration sets these)
//   MOCK_JOURNAL=file     a JSON file in the data directory (local tests of a "cold start")
//   MOCK_JOURNAL=memory   in this process only (tests)
//   none of these         off: the mock behaves as before (data in memory, reset on restart)
// MOCK_SANDBOX names the data set (default "demo"). Each mock deployment uses one sandbox.
//
// Redis keys: orgtik:mock:<sandbox>:meta  {epoch, seedAt, clock}
//             orgtik:mock:<sandbox>:log   list of entries {epoch, app, method, url, headers, body, at, seed}
// An entry's position in the list (1-based) is its sequence number. A reset starts a new epoch and
// empties the list; entries from an older epoch are skipped.
const fs = require("fs");
const path = require("path");

const MAX_ENTRIES = Number(process.env.MOCK_JOURNAL_MAX || 5000);
const MAX_BODY = 512 * 1024; // Upstash's free tier refuses requests over 1 MB

// Changes that are never recorded: the mock's own controls, and anything carrying a password or
// creating a session (sign-up accounts already travel sealed inside their tokens).
const NOT_RECORDED = /^\/__|\/api\/(users|rbac)(\/|$|\?)|\/(auth|login|logout|register|sign-?up|sign-?in|password|refresh|handoff|token|otp|verify-email)(\/|$|\?)/i;
const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const KEEP_HEADERS = /^(authorization|cookie|content-type|accept|accept-language|origin|referer|user-agent|x-[a-z0-9-]+)$/i;
const DROP_HEADERS = /^x-(vercel|forwarded|real-ip|middleware|matched)/i;

function memoryStore() {
  let meta = null;
  let log = [];
  return {
    kind: "memory",
    async getMeta() { return meta; },
    async setMeta(m) { meta = m; },
    async read(from) { return log.slice(from); },
    async push(entry) { log.push(JSON.stringify(entry)); return log.length; },
    async clear() { log = []; },
  };
}

function fileStore(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const load = () => {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { meta: null, log: [] }; }
  };
  const save = (d) => fs.writeFileSync(file, JSON.stringify(d));
  return {
    kind: "file",
    async getMeta() { return load().meta; },
    async setMeta(m) { const d = load(); d.meta = m; save(d); },
    async read(from) { return load().log.slice(from); },
    async push(entry) { const d = load(); d.log.push(JSON.stringify(entry)); save(d); return d.log.length; },
    async clear() { const d = load(); d.log = []; save(d); },
  };
}

function redisStore(url, token, prefix) {
  const metaKey = `${prefix}:meta`;
  const logKey = `${prefix}:log`;
  async function pipeline(commands) {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
    });
    if (!res.ok) throw new Error(`journal store answered ${res.status}`);
    const out = await res.json();
    for (const r of out) if (r.error) throw new Error(`journal store: ${r.error}`);
    return out.map((r) => r.result);
  }
  return {
    kind: "redis",
    async getMeta() { const [m] = await pipeline([["GET", metaKey]]); return m ? JSON.parse(m) : null; },
    async setMeta(m) { await pipeline([["SET", metaKey, JSON.stringify(m)]]); },
    async read(from) { const [list] = await pipeline([["LRANGE", logKey, String(from), "-1"]]); return list || []; },
    async push(entry) { const [len] = await pipeline([["RPUSH", logKey, JSON.stringify(entry)]]); return Number(len); },
    async clear() { await pipeline([["DEL", logKey]]); },
    // One round trip for the check made before every request.
    async poll(from) {
      const [m, list] = await pipeline([["GET", metaKey], ["LRANGE", logKey, String(from), "-1"]]);
      return { meta: m ? JSON.parse(m) : null, entries: list || [] };
    },
  };
}

function pickStore(config) {
  const env = process.env;
  const sandbox = (env.MOCK_SANDBOX || "demo").replace(/[^\w-]/g, "");
  const prefix = `orgtik:mock:${sandbox}`;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { sandbox, store: redisStore(url, token, prefix) };
  if (env.MOCK_JOURNAL === "file") return { sandbox, store: fileStore(path.join(config.dataDir, "journal", `${sandbox}.json`)) };
  if (env.MOCK_JOURNAL === "memory") return { sandbox, store: memoryStore() };
  return { sandbox, store: null };
}

const recordable = (method, url) => CHANGES.has(method) && !NOT_RECORDED.test(url);

function redactBody(body) {
  if (!body.length) return body;
  try {
    const data = JSON.parse(body.toString("utf8"));
    const clean = (value) => {
      if (Array.isArray(value)) return value.map(clean);
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(password|passwordHash|newPassword|oldPassword|currentPassword|confirmPassword)$/i.test(key)).map(([key, item]) => [key, clean(item)]));
    };
    return Buffer.from(JSON.stringify(clean(data)));
  } catch { return body; }
}

function recordHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) if (KEEP_HEADERS.test(k) && !DROP_HEADERS.test(k)) out[k] = v;
  return out;
}

// Serialises the work that changes the in-memory data, so the order applied here is the order
// recorded in the journal.
function makeLock() {
  let tail = Promise.resolve();
  return (fn) => {
    const run = tail.then(fn, fn);
    tail = run.catch(() => {});
    return run;
  };
}

module.exports = { pickStore, recordable, recordHeaders, redactBody, makeLock, MAX_ENTRIES, MAX_BODY, memoryStore, fileStore, redisStore };
