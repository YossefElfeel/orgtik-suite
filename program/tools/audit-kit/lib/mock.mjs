// The local-dev test controls (see local-dev/README.md, "Test controls").
import fs from "node:fs";
import path from "node:path";
import { apiUrl, WORKSPACE } from "./suite.mjs";
import { mockControlRequest } from "./mock-control.mjs";

// Resetting or moving the clock rebuilds EVERY app's data, so two sessions running flows at once
// would wipe each other's state mid-walk. A flow run holds local-dev/logs/flow.lock while it runs;
// a lock older than 15 minutes is treated as left behind (long runs re-take it per step). vs1 doesn't
// reset and doesn't need it.
const LOCK = path.join(WORKSPACE, "local-dev", "logs", "flow.lock");
const STALE_MS = 15 * 60 * 1000;

const BASE = `${apiUrl("sos")}/__mock`;

async function call(method, p, body) {
  const res = method === "GET" ? await fetch(BASE + p) : await mockControlRequest({ sosApi: apiUrl("sos"), url: BASE + p, method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${json.message || ""}`);
  return json.data;
}

export const mock = {
  /** Waits until no other flow run holds the lock, then takes it. Call once at the start of a run. */
  async lock(by) {
    for (;;) {
      try {
        const held = JSON.parse(fs.readFileSync(LOCK, "utf8"));
        if (held.by !== by && Date.now() - new Date(held.since).getTime() < STALE_MS) {
          console.log(`waiting for the mock: ${held.by} is running flows since ${held.since}`);
          await new Promise((r) => setTimeout(r, 10000));
          continue;
        }
      } catch {
        // No lock (or an unreadable one): free.
      }
      fs.mkdirSync(path.dirname(LOCK), { recursive: true });
      fs.writeFileSync(LOCK, JSON.stringify({ by, since: new Date().toISOString() }));
      const release = () => {
        try {
          if (JSON.parse(fs.readFileSync(LOCK, "utf8")).by === by) fs.rmSync(LOCK);
        } catch {
          // Already gone.
        }
      };
      process.once("exit", release);
      return release;
    }
  },
  // The Website Manager's seed without Claude's suggestions (D-038), for flows that count the gaps.
  async withoutSuggestions() {
    const res = await mock.control("wm", "/v2/__mock/without-suggestions");
    if (!res.ok) throw new Error(`without-suggestions -> ${res.status}`);
  },
  status: () => call("GET", "/status"),
  control: (app, endpoint, options = {}) => mockControlRequest({
    sosApi: apiUrl("sos"), url: apiUrl(app) + endpoint, target: app === "wm" ? "wm" : "admin", ...options,
  }),
  async reset() {
    const before = (await call("GET", "/status")).generation;
    const fixtures = process.env.MOCK_RESET_TEST_ACCOUNTS === "1";
    await call("POST", "/reset", fixtures ? { fixtures: true } : undefined);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 150));
      if ((await call("GET", "/status").catch(() => ({ generation: before }))).generation > before) return;
    }
    throw new Error("the mock didn't finish resetting");
  },
  // Sets the clock and rebuilds the data for it (the rebuild is what waitForReset watches).
  async setClock(now, frozen = true) {
    const before = (await call("GET", "/status")).generation;
    await call("POST", "/clock", { now, frozen });
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 150));
      if ((await call("GET", "/status")).generation > before) return;
    }
  },
  realClock: () => call("POST", "/clock", { now: "real", reset: false }),
  addFault: (rule) => call("POST", "/faults", rule),
  clearFaults: () => call("DELETE", "/faults"),
  strict: (on) => call("POST", "/strict", { on }),
  requests: (q = {}) => call("GET", "/requests?" + new URLSearchParams(q)),
};
