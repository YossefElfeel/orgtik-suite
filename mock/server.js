// Starts one mock API per app (plus the shared SOS/identity API and a local icon server).
// Usage: node server.js [--only tasks,files]   (the SOS/identity API always runs)
//        MOCK_PORT_OFFSET=100 node server.js   (shift API ports, e.g. to test in isolation)
//        MOCK_NOW=2026-09-29T09:00:00+03:00 MOCK_CLOCK=frozen node server.js
//                                              (a fixed instant, for audits and screenshots)
//
// Control routes, on every API port (README "Controls"):
//   POST /__mock/reset           rebuild every app's seed data; servers keep running and tokens stay valid
//   GET  /__mock/clock           the mock time
//   POST /__mock/clock           {now, frozen}: set it (now: an ISO date or "real"), then reset the data
//   POST /__mock/clock/advance   {days, hours, minutes}: move the clock on, keeping the data
//   GET  /__mock/requests        recent requests: ?since=<seq>&app=&user=&status=4xx&limit=
//   GET  /__mock/status          clock, data generation, test switches, and every app's ports
//   POST /__mock/faults          {app, method, match, status, delayMs, times}: make matching requests slow or fail
//   GET/DELETE /__mock/faults    list or clear the rules (DELETE /__mock/faults/:id for one)
//   POST /__mock/strict          {on}: refuse users whose launcher scopes don't include the app (also MOCK_STRICT_SCOPES=1)
const clock = require("./lib/clock");
clock.install(); // before anything else reads the time: the seed data is built from it

const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Server } = require("socket.io");

const config = require("./config");
const icons = require("./lib/icons");
const requests = require("./lib/requests");
const journal = require("./lib/journal");

// "chats" has no API: its module only registers a launcher tile.
const ORDER = ["sos", "tasks", "files", "sales", "hr", "marketing", "content", "wm", "admin", "chats"];
const onlyArg = process.argv.find((a) => a.startsWith("--only"));
const only = onlyArg ? (onlyArg.split("=")[1] || process.argv[process.argv.indexOf(onlyArg) + 1] || "").split(",").filter(Boolean) : null;
const LOG_DIR = path.join(config.dataDir, "logs");
fs.mkdirSync(LOG_DIR, { recursive: true });
const unhandledLog = path.join(LOG_DIR, "unhandled.log");

// A reset re-requires the app modules and the shared libraries so every in-memory store is
// rebuilt from its seed. These modules hold state that must survive a reset.
const KEEP = new Set(["./lib/clock", "./lib/requests", "./lib/icons", "./lib/journal", "./config"].map((p) => require.resolve(p)));
const RELOAD_DIRS = ["apps", "lib"].map((d) => path.join(__dirname, d) + path.sep);
function purgeLocalModules() {
  for (const id of Object.keys(require.cache)) {
    if (!KEEP.has(id) && RELOAD_DIRS.some((d) => id.startsWith(d))) delete require.cache[id];
  }
}

// Load app modules (apps/<key>.js). A broken module is reported and skipped, never fatal.
function loadModules() {
  const modules = [];
  for (const key of ORDER) {
    if (only && key !== "sos" && !only.includes(key)) continue;
    const file = path.join(__dirname, "apps", `${key}.js`);
    if (!fs.existsSync(file)) continue;
    try {
      const m = require(file);
      m.key = key;
      modules.push(m);
    } catch (e) {
      console.error(`[api:${key}] failed to load apps/${key}.js:\n`, e);
    }
  }
  return modules;
}

function uploadsDir(key) {
  const dir = path.join(config.dataDir, "uploads", key);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeCtx(key, identity, util) {
  const dir = uploadsDir(key);
  const storage = multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${file.originalname.replace(/[^\w.\-]+/g, "_")}`),
  });
  return {
    key,
    config,
    identity,
    util,
    // utf8 so Arabic (and other non-Latin) upload names survive intact.
    upload: multer({ storage, limits: { fileSize: 200 * 1024 * 1024 }, defParamCharset: "utf8" }),
    uploadsDir: dir,
    fileUrl: (filename) => `${config.apiUrl(key)}/uploads/${encodeURIComponent(filename)}`,
    apiUrl: config.apiUrl,
    webUrl: config.webUrl,
    io: null,
    log: (...args) => console.log(`[api:${key}]`, ...args),
  };
}

// ---- state shared by every build ----
const slots = new Map(); // app key -> { server, io, app }
const state = { generation: 0, lastReset: null, resetting: false, strict: process.env.MOCK_STRICT_SCOPES === "1" };

// Test-only fault rules. They let an audit show a screen's loading, error and no-permission
// states without touching the app: e.g. { app: "hr", match: "/api/attendance", status: 403 }.
// `match` is a substring of the URL, or a regular expression prefixed "re:"
// (e.g. "re:/api/(users|staff)$"). Rules survive a reset.
const faults = [];
let nextFaultId = 1;
function faultMatcher(match) {
  if (!match) return () => true;
  if (match.startsWith("re:")) {
    const re = new RegExp(match.slice(3)); // throws on a bad pattern; checked when the rule is added
    return (url) => re.test(url);
  }
  return (url) => url.includes(match);
}
function matchesFault(rule, key, req) {
  if (rule.app && rule.app !== key) return false;
  if (rule.method && rule.method.toUpperCase() !== req.method) return false;
  return rule.test(req.originalUrl);
}

function status() {
  return {
    clock: clock.status(),
    generation: state.generation,
    lastReset: state.lastReset,
    lastRequestSeq: requests.lastSeq(),
    strictScopes: state.strict,
    journal: store ? { sandbox, store: store.kind, epoch: persist.epoch, entries: persist.applied, skipped: persist.skipped, seedAt: persist.seedAt && new clock.RealDate(persist.seedAt).toISOString() } : null,
    faults,
    apps: Object.fromEntries(
      Object.entries(config.apps).map(([k, a]) => [k, { web: config.webUrl(k), api: a.api == null ? null : config.apiUrl(k), running: slots.has(k), reserved: Boolean(a.reserved) }]),
    ),
  };
}

// Rebuilds everything after the current response has gone out, so the handler that asked
// for it isn't swapped out from under itself.
function scheduleReset(reason) {
  if (state.resetting) return;
  state.resetting = true;
  setImmediate(() => {
    try {
      build();
      console.log(`[mock] data reset (${reason}); generation ${state.generation}, clock ${clock.status().mode} at ${clock.status().now}`);
    } catch (e) {
      console.error("[mock] reset failed:", e);
    } finally {
      state.resetting = false;
    }
  });
}

function controlRoutes(app) {
  const c = express.Router();
  c.get("/status", (req, res) => res.json({ success: true, data: status() }));
  c.post("/reset", (req, res) => {
    res.json({ success: true, message: "Resetting every app's data", data: { generation: state.generation + 1 } });
    resetData("POST /__mock/reset");
  });
  c.get("/clock", (req, res) => res.json({ success: true, data: clock.status() }));
  c.post("/clock", (req, res) => {
    const { now, frozen, reset = true } = req.body || {};
    try {
      const data = clock.set({ now, frozen });
      res.json({ success: true, message: reset ? "Clock set; data is being rebuilt for the new time" : "Clock set", data });
      if (reset) resetData("clock set");
      else saveClock();
    } catch (e) {
      res.status(400).json({ success: false, statusCode: 400, message: e.message });
    }
  });
  c.post("/clock/advance", (req, res) => {
    const { days = 0, hours = 0, minutes = 0, seconds = 0 } = req.body || {};
    const ms = ((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60000 + Number(seconds) * 1000;
    try {
      res.json({ success: true, message: "Clock moved on", data: clock.advance(ms) });
      saveClock();
    } catch (e) {
      res.status(400).json({ success: false, statusCode: 400, message: e.message });
    }
  });
  c.get("/requests", (req, res) => res.json({ success: true, data: requests.list(req.query) }));
  c.get("/faults", (req, res) => res.json({ success: true, data: faults }));
  c.post("/faults", (req, res) => {
    const { app: appKey, method, match, status: code, delayMs, times } = req.body || {};
    if (!code && !delayMs) return res.status(400).json({ success: false, statusCode: 400, message: "A fault needs a status, a delayMs, or both" });
    let test;
    try {
      test = faultMatcher(match);
    } catch (e) {
      return res.status(400).json({ success: false, statusCode: 400, message: `Invalid "re:" pattern: ${e.message}` });
    }
    const rule = { id: nextFaultId++, app: appKey || null, method: method || null, match: match || null, status: code ? Number(code) : null, delayMs: delayMs ? Number(delayMs) : 0, remaining: times ? Number(times) : null };
    Object.defineProperty(rule, "test", { value: test, enumerable: false }); // kept out of the JSON listing
    faults.push(rule);
    res.status(201).json({ success: true, message: "Fault rule added", data: rule });
  });
  c.delete("/faults", (req, res) => {
    faults.length = 0;
    res.json({ success: true, message: "All fault rules cleared", data: [] });
  });
  c.delete("/faults/:id", (req, res) => {
    const i = faults.findIndex((f) => String(f.id) === req.params.id);
    if (i !== -1) faults.splice(i, 1);
    res.json({ success: true, message: i === -1 ? "No such rule" : "Fault rule removed", data: faults });
  });
  c.post("/strict", (req, res) => {
    state.strict = Boolean(req.body?.on);
    res.json({ success: true, message: `Strict scopes ${state.strict ? "on" : "off"}`, data: { strictScopes: state.strict } });
  });
  app.use("/__mock", c);
}

// Applies the fault rules (and, with MOCK_FAULTS=1, the ?__fail= and ?__delay= query params).
function faultMiddleware(key) {
  return (req, res, next) => {
    if (req.path.startsWith("/__mock") || req.path === "/__health") return next();
    let code = null;
    let delay = 0;
    const rule = faults.find((r) => matchesFault(r, key, req));
    if (rule) {
      code = rule.status;
      delay = rule.delayMs;
      if (rule.remaining != null && --rule.remaining <= 0) faults.splice(faults.indexOf(rule), 1);
    } else if (process.env.MOCK_FAULTS === "1" && (req.query.__fail || req.query.__delay)) {
      code = req.query.__fail ? Number(req.query.__fail) : null;
      delay = req.query.__delay ? Number(req.query.__delay) : 0;
    }
    if (code == null && !delay) return next();
    const act = () => (code ? res.status(code).json({ success: false, statusCode: code, message: `[local mock] injected ${code} for ${req.method} ${req.path}` }) : next());
    return delay ? setTimeout(act, delay) : act();
  };
}

// With strict scopes on, an app's API refuses people whose launcher doesn't include that app,
// the way a real backend would. Unauthenticated calls go through to the app's own logic.
// "View as" (D-017): a session started from SOS People is read-only. Every app refuses a change
// made with such a token (403, code "read_only"), except leaving it again and the hand-off itself.
const READ_ONLY_ALLOWED = ["/api/auth/exit-impersonation", "/api/auth/logout", "/api/auth/refresh", "/api/auth/handoff", "/api/auth/handoff/exchange"];
function readOnlyMiddleware(identity) {
  return (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path.startsWith("/__") || READ_ONLY_ALLOWED.includes(req.path)) return next();
    const claims = identity.decode(identity.tokenFrom(req));
    if (!claims?.readOnly) return next();
    const message = "You're viewing as someone else: changes are turned off.";
    res.status(403).json({ success: false, statusCode: 403, code: "read_only", message, error: { code: "read_only", message } });
  };
}

function strictScopesMiddleware(key, identity) {
  const names = () => identity.scopes.filter((s) => s.domain === config.webUrl(key)).map((s) => s.name);
  return (req, res, next) => {
    if (!state.strict || key === "sos" || req.path.startsWith("/__") || req.path.startsWith("/uploads")) return next();
    const user = identity.userFromReq(req);
    const appScopes = names();
    if (!user || appScopes.length === 0) return next();
    if (identity.userScopes(user).some((s) => appScopes.includes(s.scope))) return next();
    return res.status(403).json({ success: false, statusCode: 403, message: `[local mock] ${user.email} has no access to ${key}` });
  };
}

function build() {
  purgeLocalModules();
  const identity = require("./lib/identity");
  const util = require("./lib/util");
  const modules = loadModules();
  identity.registerModules(modules);
  state.generation += 1;

  for (const key of ORDER) {
    const own = modules.find((m) => m.key === key);
    if (!own && key !== "sos") continue;
    if (config.apps[key].api == null) continue; // frontend-only app: scopes/grants only, no server
    const ctx = makeCtx(key, identity, util);
    const app = express();
    app.disable("x-powered-by");
    app.set("etag", false);
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use((req, res, next) => {
      const started = clock.RealDate.now();
      res.on("finish", () => {
        if (req.method === "OPTIONS") return;
        const ms = clock.RealDate.now() - started;
        console.log(`[api:${key}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
        if (!req.originalUrl.startsWith("/__mock")) {
          requests.record({ t: new Date().toISOString(), app: key, method: req.method, url: req.originalUrl, status: res.statusCode, ms, user: requests.actor(req), gen: state.generation });
        }
      });
      next();
    });
    app.use("/uploads", express.static(ctx.uploadsDir));
    app.get("/__health", (req, res) => res.json({ ok: true, app: key, generation: state.generation }));
    controlRoutes(app);
    app.use(faultMiddleware(key));
    app.use(strictScopesMiddleware(key, identity));
    app.use(readOnlyMiddleware(identity));

    if (key === "sos") identity.routes(app, ctx);
    if (own?.routes) own.routes(app, ctx);
    // Fallback routes other modules add to this API (e.g. HR needing a task-manager endpoint).
    for (const m of modules) if (m !== own && m.mounts?.[key]) m.mounts[key](app, ctx);

    app.use((req, res) => {
      const line = `${new Date().toISOString()} [api:${key}] ${req.method} ${req.originalUrl}\n`;
      fs.appendFile(unhandledLog, line, () => {});
      console.warn(`[api:${key}] NO MOCK HANDLER: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ success: false, statusCode: 404, message: `[local mock] No handler for ${req.method} ${req.path}` });
    });
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      console.error(`[api:${key}] ERROR on ${req.method} ${req.originalUrl}:`, err);
      res.status(500).json({ success: false, statusCode: 500, message: `[local mock] ${err.message}` });
    });

    let slot = slots.get(key);
    if (!slot && process.env.ORGTIK_MOCK_NO_LISTEN) {
      // Serverless: no sockets. A stand-in io lets modules register handlers and emit harmlessly.
      const io = { on() {}, use() {}, emit() {}, of() { return io; }, to() { return io; }, in() { return io; }, _nsps: new Map() };
      slot = { server: null, io };
      slots.set(key, slot);
    } else if (!slot) {
      // Every app sets cookies on "localhost", and browsers send all of them to every port;
      // a bigger header limit avoids HTTP 431 once you're signed in to all apps.
      const server = http.createServer({ maxHeaderSize: 64 * 1024 }, (req, res) => handle(key, req, res));
      const io = new Server(server, { cors: { origin: true, credentials: true } });
      slot = { server, io };
      slots.set(key, slot);
      server.listen(config.apps[key].api, () => console.log(`[api:${key}] mock API on ${config.apiUrl(key)}  (web app: ${config.webUrl(key)})`));
    } else {
      // Socket handlers close over the previous data. Drop them, with their middleware, then
      // close each client's connection. Closing the transport (rather than sending a
      // "disconnect") is what makes socket.io clients reconnect on their own, and they
      // reconnect to the new handlers.
      for (const nsp of slot.io._nsps.values()) {
        nsp.removeAllListeners("connection");
        nsp._fns.length = 0;
        for (const socket of nsp.sockets.values()) socket.conn.close();
      }
    }
    slot.app = app;
    ctx.io = slot.io;
    if (own?.sockets) own.sockets(slot.io, ctx);
    else slot.io.on("connection", () => {}); // accept connections so clients don't retry forever
  }
  state.lastReset = new Date().toISOString();
}

// ---- persistence: the write journal (D-053, lib/journal.js) ----
// With a store configured, the seed is built at a fixed instant (meta.seedAt) with seeded random
// numbers, and every recorded change is replayed with its own instant and seed, so every instance
// of the mock rebuilds the same data. Without a store nothing here runs.
const { sandbox, store } = journal.pickStore(config);
const persist = { epoch: null, seedAt: null, clockJson: null, applied: 0, skipped: 0, rebuild: false, ready: null, lock: journal.makeLock() };
const realRandom = (() => { const r = Math.random; return () => r(); })(); // outside a pinned run this is the real one

function newMeta() {
  return { epoch: `${clock.RealDate.now().toString(36)}-${Math.floor(realRandom() * 1e9).toString(36)}`, seedAt: clock.now(), clock: clock.exportState() };
}

// Changes (live and replayed) reach the apps through a loopback HTTP server, so Express gets real
// request and response objects; the pin is set around the whole round trip.
let loopback = null;
function loopbackBase() {
  if (!loopback) {
    loopback = new Promise((resolve, reject) => {
      const srv = http.createServer({ maxHeaderSize: 64 * 1024 }, (req, res) => {
        const app = slots.get(req.headers["x-mock-app"])?.app;
        if (!app) return sendJson(res, 404, { success: false, statusCode: 404, message: "[mock] no such app" });
        app(req, res);
      });
      srv.on("error", reject);
      srv.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${srv.address().port}`));
      srv.unref();
    });
    loopback.catch(() => { loopback = null; });
  }
  return loopback;
}

const HOP = new Set(["host", "connection", "content-length", "transfer-encoding", "keep-alive", "expect", "upgrade"]);
async function dispatch(key, { method, url, headers, body }) {
  const base = await loopbackBase();
  const h = { "x-mock-app": key };
  for (const [k, v] of Object.entries(headers || {})) if (!HOP.has(k.toLowerCase()) && v != null) h[k] = Array.isArray(v) ? v.join(", ") : String(v);
  const r = await fetch(base + url, { method, headers: h, body: body && body.length ? body : undefined, redirect: "manual" });
  const headersOut = {};
  r.headers.forEach((v, k) => { if (k !== "set-cookie") headersOut[k] = v; });
  const cookies = r.headers.getSetCookie?.() ?? [];
  if (cookies.length) headersOut["set-cookie"] = cookies;
  return { statusCode: r.status, headers: headersOut, rawPayload: Buffer.from(await r.arrayBuffer()) };
}

async function replay(lines, offset) {
  let n = 0;
  for (const line of lines) {
    n += 1;
    const e = typeof line === "string" ? JSON.parse(line) : line;
    if (e.epoch !== persist.epoch) continue;
    if (!slots.get(e.app)?.app) { persist.skipped += 1; continue; }
    const r = await clock.runPinned({ at: e.at, seed: e.seed }, () =>
      dispatch(e.app, { method: e.method, url: e.url, headers: { ...e.headers, "x-mock-replay": "1" }, body: e.body ? Buffer.from(e.body, "base64") : null }),
    );
    if (r.statusCode >= 400) {
      persist.skipped += 1;
      console.warn(`[journal] replay of #${offset + n} ${e.method} /${e.app}${e.url} answered ${r.statusCode}`);
    }
  }
  persist.applied = offset + n;
}

async function restore(meta) {
  persist.epoch = meta.epoch;
  persist.seedAt = meta.seedAt;
  persist.clockJson = JSON.stringify(meta.clock ?? null);
  clock.importState(meta.clock);
  clock.runPinned({ at: meta.seedAt, seed: `seed:${meta.seedAt}` }, build);
  persist.applied = 0;
  persist.skipped = 0;
  persist.rebuild = false;
  await replay(await store.read(0), 0);
  console.log(`[journal] ${sandbox}: seed of ${new clock.RealDate(meta.seedAt).toISOString()} + ${persist.applied} changes (${persist.skipped} skipped)`);
}

function ready() {
  if (!store) return Promise.resolve();
  if (!persist.ready) {
    persist.ready = persist.lock(async () => {
      let meta = await store.getMeta();
      if (!meta) {
        meta = newMeta();
        await store.setMeta(meta);
      }
      await restore(meta);
    });
    persist.ready.catch(() => { persist.ready = null; });
  }
  return persist.ready;
}

// Catch up with changes other instances recorded (call inside the lock).
async function sync() {
  const { meta, entries } = store.poll
    ? await store.poll(persist.applied)
    : { meta: await store.getMeta(), entries: await store.read(persist.applied) };
  if (!meta) {
    const fresh = newMeta();
    await store.setMeta(fresh);
    return restore(fresh);
  }
  if (meta.epoch !== persist.epoch || persist.rebuild) return restore(meta);
  if (JSON.stringify(meta.clock ?? null) !== persist.clockJson) {
    persist.clockJson = JSON.stringify(meta.clock ?? null);
    clock.importState(meta.clock);
  }
  if (entries.length) await replay(entries, persist.applied);
}

function saveClock() {
  if (!store) return;
  persist.lock(async () => {
    const meta = (await store.getMeta()) || newMeta();
    meta.clock = clock.exportState();
    persist.clockJson = JSON.stringify(meta.clock);
    await store.setMeta(meta);
  }).catch((e) => console.error("[journal] saving the clock failed:", e.message));
}

// A reset starts a new epoch: the journal is emptied and the seed is built at the current instant.
function resetData(reason) {
  if (!store) return scheduleReset(reason);
  persist.lock(async () => {
    const meta = newMeta();
    await store.clear();
    await store.setMeta(meta);
    await restore(meta);
    console.log(`[mock] data reset (${reason}); journal epoch ${meta.epoch}`);
  }).catch((e) => console.error("[journal] reset failed:", e));
}

function readBody(req) {
  if (req.readableEnded) {
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === "string") return Promise.resolve(Buffer.from(req.body));
    return Promise.resolve(req.body == null ? Buffer.alloc(0) : Buffer.from(JSON.stringify(req.body)));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, r) {
  const headers = { ...r.headers };
  delete headers["transfer-encoding"];
  delete headers.connection;
  delete headers["keep-alive"];
  delete headers.date;
  headers["content-length"] = r.rawPayload.length;
  res.writeHead(r.statusCode, headers);
  res.end(r.rawPayload);
}

const sendJson = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body));
};

// Every request to an app's API goes through here (the local servers and api/index.js).
async function handle(key, req, res) {
  if (!store) return slots.get(key).app(req, res);
  try {
    await ready();
  } catch (e) {
    console.error("[journal] start failed:", e);
    return sendJson(res, 503, { success: false, statusCode: 503, message: "[mock] data store unavailable" });
  }
  const url = req.url || "/";
  // With the journal on, the mock answers one request at a time (it's a prototype): a change is
  // applied with its pin while nothing else runs, in the order the journal records.
  if (!journal.recordable(req.method, url)) {
    return persist.lock(async () => {
      if (!url.startsWith("/__mock")) {
        try {
          await sync();
        } catch (e) {
          console.warn("[journal] sync failed:", e.message);
        }
      }
      const app = slots.get(key)?.app;
      if (!app) return sendJson(res, 404, { success: false, statusCode: 404, message: `[mock] no API for ${key}` });
      await new Promise((resolve) => {
        const done = () => { clearTimeout(t); resolve(); };
        const t = setTimeout(done, 15000); // a stream that never ends must not hold everyone up
        res.on("finish", done);
        res.on("close", done);
        app(req, res);
      });
    });
  }
  const body = await readBody(req);
  return persist.lock(async () => {
    try {
      await sync();
    } catch (e) {
      console.warn("[journal] sync failed:", e.message);
    }
    if (!slots.get(key)?.app) return sendJson(res, 404, { success: false, statusCode: 404, message: `[mock] no API for ${key}` });
    const at = clock.now();
    const seed = `${at}:${Math.floor(realRandom() * 1e12)}`;
    const r = await clock.runPinned({ at, seed }, () => dispatch(key, { method: req.method, url, headers: req.headers, body }));
    if (r.statusCode < 400) {
      if (body.length > journal.MAX_BODY) res.setHeader("x-mock-journal", "too-large");
      else if (persist.applied >= journal.MAX_ENTRIES) res.setHeader("x-mock-journal", "full");
      else {
        try {
          const seq = await store.push({ epoch: persist.epoch, app: key, method: req.method, url, headers: journal.recordHeaders(req.headers), body: body.length ? body.toString("base64") : null, at, seed });
          if (seq === persist.applied + 1) persist.applied = seq;
          else persist.rebuild = true; // another instance wrote in between: rebuild in journal order
        } catch (e) {
          console.warn("[journal] recording failed:", e.message);
          res.setHeader("x-mock-journal", "failed");
        }
      }
    }
    send(res, r);
  });
}

// On Vercel the APIs are served by api/index.js (no ports, no icon server).
if (process.env.ORGTIK_MOCK_NO_LISTEN) {
  if (!store) build();
  module.exports = { slots, state, handle, ready };
  return;
}

if (store) {
  ready().catch((e) => {
    console.error("[journal] start failed:", e);
    process.exit(1);
  });
} else {
  build();
}

const excalidrawDist = path.join(__dirname, "..", config.apps.chats.dir, "node_modules", "@excalidraw", "excalidraw", "dist", "prod");
icons.start(config.icons.port, fs.existsSync(excalidrawDist) ? [{ path: "/excalidraw", dir: excalidrawDist }] : []);
const c = clock.status();
if (c.mode !== "real") console.log(`\n[mock] clock is ${c.mode} at ${c.now}`);
console.log(`\nLocal test accounts: see local-dev/README.md (password for all: ${require("./lib/identity").LOCAL_PASSWORD})\n`);
