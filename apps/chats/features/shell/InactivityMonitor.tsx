"use client";

/**
 * SOMION HQ - INACTIVITY MONITOR
 *
 * A workspace policy: no input for N minutes and the session ends. The last
 * minute is announced, with a countdown and a button, and any input at all
 * cancels it - moving the mouse to reach the button is enough.
 *
 * What counts as input, and why there are two answers:
 *
 *   - The computer, when the browser allows it (Chromium, one permission):
 *     the Idle Detection API says whether the machine has seen input and
 *     whether the screen is locked, and nothing else. Someone writing an
 *     email in another window is not idle, and is not signed out for it.
 *   - This tab, everywhere else: mouse, keyboard and touch inside HQ. The
 *     product says which one it is using rather than pretending.
 *
 * Nothing is sent, stored or shown to anyone either way. The clock is read
 * once a second rather than armed once, because a laptop that slept through
 * the limit should sign out on waking, not an hour later. A live meeting
 * counts as being here.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { idleAskedThisSession, markIdleAsked, watchComputerIdle, type IdleScope } from "@/lib/idle";
import { isQuiet } from "@/lib/quiet";

const WARN_MS = 60_000;
const INPUT_EVENTS = ["mousemove", "mousedown", "pointerdown", "keydown", "touchstart", "wheel"] as const;

export function InactivityMonitor() {
  const minutes = useWorkspace((s) => s.settings.inactivitySignOutMinutes);
  const support = useWorkspace((s) => s.idleWatch.support);
  const signOut = useWorkspace((s) => s.signOut);
  const refreshIdleWatch = useWorkspace((s) => s.refreshIdleWatch);
  const allowIdleWatch = useWorkspace((s) => s.allowIdleWatch);
  const t = useT();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [scope, setScope] = useState<IdleScope>("page");
  const last = useRef(Date.now());
  const idleSince = useRef<number | null>(null);

  useEffect(() => {
    void refreshIdleWatch();
  }, [refreshIdleWatch]);

  /* The browser only grants the computer-wide watch from a gesture, so HQ
     asks on the first click or key it sees rather than waiting for someone
     to find the setting. Once per session: a dismissed prompt is not nagged. */
  useEffect(() => {
    if (support !== "prompt" || !minutes || idleAskedThisSession()) return;
    let asked = false;
    const ask = () => {
      if (asked) return;
      asked = true;
      markIdleAsked();
      void allowIdleWatch();
    };
    window.addEventListener("pointerdown", ask, { once: true });
    window.addEventListener("keydown", ask, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
    };
  }, [support, minutes, allowIdleWatch]);

  useEffect(() => {
    /* Quiet mode (tests) never signs anyone out. */
    if (!minutes || isQuiet()) {
      setSecondsLeft(null);
      return;
    }
    const limit = minutes * 60_000;
    last.current = Date.now();
    idleSince.current = null;
    let computer = false;

    const touch = () => {
      last.current = Date.now();
    };
    INPUT_EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    /* The computer reports idle after the threshold; the last minute is ours,
       so the threshold is the policy minus that minute. */
    let watch: { stop: () => void } | null = null;
    if (support === "granted") {
      const w = watchComputerIdle(limit - WARN_MS, (idle) => {
        idleSince.current = idle ? Date.now() : null;
        if (!idle) last.current = Date.now();
      });
      watch = w;
      void w.started.then((ok) => {
        computer = ok;
        setScope(ok ? "computer" : "page");
      });
    } else {
      setScope("page");
    }

    const tick = setInterval(() => {
      const st = useWorkspace.getState();
      const mine = st.presence.find((p) => p.userId === st.me);
      if (mine?.status === "in_meeting") {
        last.current = Date.now();
        idleSince.current = null;
        setSecondsLeft(null);
        return;
      }
      let remaining: number;
      if (computer) {
        if (idleSince.current === null) {
          setSecondsLeft(null);
          return;
        }
        remaining = WARN_MS - (Date.now() - idleSince.current);
      } else {
        remaining = limit - (Date.now() - last.current);
      }
      if (remaining <= 0) {
        setSecondsLeft(null);
        signOut("inactive", minutes, computer ? "computer" : "page");
        return;
      }
      setSecondsLeft(remaining <= WARN_MS ? Math.ceil(remaining / 1000) : null);
    }, 1000);

    return () => {
      clearInterval(tick);
      watch?.stop();
      INPUT_EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [minutes, support, signOut]);

  if (secondsLeft === null) return null;

  const stay = () => {
    last.current = Date.now();
    idleSince.current = null;
    setSecondsLeft(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgb(var(--shadow-ink) / 0.18)" }}>
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-label={t("inactivity.title", "Still there?")}
        className="hq-floating hq-rise w-full max-w-[380px] p-5"
        style={{ borderRadius: "var(--radius-card)", background: "var(--color-surface)" }}
      >
        <h2 className="hq-title" style={{ color: "var(--color-ink)" }}>
          {t("inactivity.title", "Still there?")}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {scope === "computer"
            ? t(
                "inactivity.bodyComputer",
                "Your computer has seen no input for {n} minutes. To protect the workspace you will be signed out in {s} s. Any movement or key keeps you here.",
                { n: minutes ?? 0, s: secondsLeft },
              )
            : t(
                "inactivity.body",
                "No input for {n} minutes. To protect the workspace you will be signed out in {s} s. Any movement or key keeps you here.",
                { n: minutes ?? 0, s: secondsLeft },
              )}
        </p>
        <div aria-hidden="true" className="mt-3 h-1 w-full overflow-hidden" style={{ background: "var(--color-surface-sunken)", borderRadius: "var(--radius-chip)" }}>
          <div
            style={{
              height: "100%",
              width: `${(secondsLeft / (WARN_MS / 1000)) * 100}%`,
              background: "var(--color-accent)",
              transition: "width 1s linear",
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {scope === "page" && support === "prompt" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                stay();
                void allowIdleWatch();
              }}
            >
              {t("inactivity.watchComputer", "Watch the whole computer instead")}
            </Button>
          ) : (
            <span />
          )}
          <Button variant="primary" onClick={stay} autoFocus>
            {t("inactivity.stay", "I am here")}
          </Button>
        </div>
      </div>
    </div>
  );
}
