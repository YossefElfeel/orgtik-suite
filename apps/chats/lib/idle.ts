/**
 * SOMION HQ - IDLE (the computer, not the tab)
 *
 * A tab can only see its own input. Someone writing an email in another
 * window looks idle to it and would be signed out for working. So the
 * question is asked of the computer instead, through whichever of these is
 * available, in this order:
 *
 *   1. The desktop app. When HQ runs inside the Business OS desktop shell,
 *      the shell exposes `window.somionDesktop.idleSeconds()` from the
 *      operating system (Electron's powerMonitor). No permission, no gap.
 *   2. The Idle Detection API (Chromium): has the machine seen input, is the
 *      screen locked, and nothing else. It needs a permission the person
 *      grants once, from a click; HQ asks on the first click it sees.
 *   3. The tab's own input, everywhere else. The product says so instead of
 *      pretending.
 *
 * None of them says what the person was doing, and nothing leaves the device.
 */

import type { IdleScope } from "@/entities";

export type { IdleScope };
export type IdleSupport = "unknown" | "unsupported" | "prompt" | "granted" | "denied";

interface IdleDetectorLike extends EventTarget {
  userState: "active" | "idle" | null;
  screenState: "locked" | "unlocked" | null;
  start(options: { threshold?: number; signal?: AbortSignal }): Promise<void>;
}

interface IdleDetectorCtor {
  new (): IdleDetectorLike;
  requestPermission(): Promise<"granted" | "denied">;
}

/** What the desktop shell injects. Seconds since the OS last saw input. */
interface DesktopBridge {
  idleSeconds(): number;
}

const ctor = (): IdleDetectorCtor | undefined =>
  typeof window === "undefined" ? undefined : (window as unknown as { IdleDetector?: IdleDetectorCtor }).IdleDetector;

const bridge = (): DesktopBridge | undefined =>
  typeof window === "undefined" ? undefined : (window as unknown as { somionDesktop?: DesktopBridge }).somionDesktop;

export const supportsIdleDetection = (): boolean => Boolean(ctor() || bridge());

/** What the browser will let us do, without asking. */
export async function queryIdleSupport(): Promise<IdleSupport> {
  if (bridge()) return "granted";
  if (!ctor()) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "idle-detection" as PermissionName });
    return status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "prompt";
  } catch {
    return "prompt";
  }
}

/** Must be called from a user gesture, or the browser refuses silently. */
export async function requestIdlePermission(): Promise<IdleSupport> {
  if (bridge()) return "granted";
  const c = ctor();
  if (!c) return "unsupported";
  try {
    const r = await c.requestPermission();
    return r === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/**
 * Watch the computer. `onChange(idle)` fires when the computer crosses the
 * threshold without input, or the screen locks, and again when input
 * returns. Returns a stop function. `started` resolves to false if no watch
 * could start, so the caller can fall back to the tab.
 */
export function watchComputerIdle(
  thresholdMs: number,
  onChange: (idle: boolean) => void,
): { stop: () => void; started: Promise<boolean> } {
  const b = bridge();
  if (b) {
    /* The OS keeps the count; we only read it. Polled once a second, which
       is the same cadence the monitor already runs at. */
    let last: boolean | null = null;
    const timer = setInterval(() => {
      let idle = false;
      try {
        idle = b.idleSeconds() * 1000 >= thresholdMs;
      } catch {
        idle = false;
      }
      if (idle !== last) {
        last = idle;
        onChange(idle);
      }
    }, 1000);
    return { stop: () => clearInterval(timer), started: Promise.resolve(true) };
  }

  const c = ctor();
  const controller = new AbortController();
  if (!c) return { stop: () => undefined, started: Promise.resolve(false) };
  const detector = new c();
  const report = () => onChange(detector.userState === "idle" || detector.screenState === "locked");
  detector.addEventListener("change", report);
  const started = detector
    .start({ threshold: Math.max(60_000, thresholdMs), signal: controller.signal })
    .then(() => {
      report();
      return true;
    })
    .catch(() => false);
  return {
    stop: () => {
      controller.abort();
      detector.removeEventListener("change", report);
    },
    started,
  };
}

const ASKED_KEY = "hq.idle.asked";

/** Whether HQ already asked this session, so a dismissed prompt is not nagged. */
export function idleAskedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIdleAsked(): void {
  try {
    window.sessionStorage.setItem(ASKED_KEY, "1");
  } catch {
    /* No storage: asking again next load is the worst case. */
  }
}
