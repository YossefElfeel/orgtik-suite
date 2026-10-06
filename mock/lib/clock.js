// The mock backend's clock.
//
// Every date in the mocks comes from `new Date()` or `Date.now()`: seed data, createdAt,
// "2 hours ago" labels, token expiry. Replacing the global Date therefore controls all of
// them at once, with no change to the app modules.
//
//   MOCK_NOW=2026-09-29T09:00:00+03:00   start the clock at this instant (it keeps running)
//   MOCK_CLOCK=frozen                     stop it: every request sees the same instant
//   neither                               real time, as before
//
// At runtime: GET/POST /__mock/clock and POST /__mock/clock/advance (see server.js).
// This module is never reloaded by a reset, so the clock survives it.

const RealDate = Date;

let anchorMock = null; // ms: the mock instant at the moment it was set
let anchorReal = null; // ms: real time at that moment
let frozen = false;

function now() {
  if (anchorMock == null) return RealDate.now();
  return frozen ? anchorMock : anchorMock + (RealDate.now() - anchorReal);
}

function parseInstant(value) {
  const ms = typeof value === "number" ? value : RealDate.parse(value);
  if (!Number.isFinite(ms)) throw new Error(`Not a date: ${value}`);
  return ms;
}

function status() {
  const mode = anchorMock == null ? "real" : frozen ? "frozen" : "shifted";
  return {
    mode,
    now: new RealDate(now()).toISOString(),
    realNow: new RealDate(RealDate.now()).toISOString(),
    offsetMinutes: mode === "real" ? 0 : Math.round((now() - RealDate.now()) / 60000),
  };
}

// set({ now: "2026-09-29T09:00:00Z" | ms | "real", frozen: true|false })
function set({ now: when, frozen: freeze } = {}) {
  if (when === "real" || when === null) {
    anchorMock = null;
    anchorReal = null;
    frozen = false;
    return status();
  }
  anchorMock = when === undefined ? now() : parseInstant(when);
  anchorReal = RealDate.now();
  if (freeze !== undefined) frozen = Boolean(freeze);
  return status();
}

// Moves the clock on by ms, keeping it frozen or running as it was.
function advance(ms) {
  if (!Number.isFinite(ms)) throw new Error("advance needs a number of milliseconds");
  anchorMock = now() + ms;
  anchorReal = RealDate.now();
  return status();
}

function install() {
  if (globalThis.Date.__mockClock) return;
  // A plain function rather than a class, so the rare `Date()` call without `new` still works.
  function MockDate(...args) {
    if (!new.target) return new RealDate(now()).toString();
    return args.length === 0 ? new RealDate(now()) : new RealDate(...args);
  }
  MockDate.prototype = RealDate.prototype;
  Object.setPrototypeOf(MockDate, RealDate);
  MockDate.now = now;
  MockDate.parse = RealDate.parse;
  MockDate.UTC = RealDate.UTC;
  MockDate.__mockClock = true;
  globalThis.Date = MockDate;

  const env = process.env;
  if (env.MOCK_NOW) set({ now: env.MOCK_NOW, frozen: env.MOCK_CLOCK === "frozen" });
  else if (env.MOCK_CLOCK === "frozen") set({ now: RealDate.now(), frozen: true });
}

module.exports = { install, now, status, set, advance, RealDate };
