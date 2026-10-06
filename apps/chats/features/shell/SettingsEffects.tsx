"use client";

/**
 * SOMION HQ - SETTINGS EFFECTS
 *
 * Three settings act on things outside React state - the audio graph, the
 * locale, and the person's own idleness - so they are pushed home from here,
 * once, rather than from every screen that might care.
 *
 * Rendered inside the top bar so it sits inside the i18n provider.
 */

import { useEffect } from "react";
import { useWorkspace } from "@/store";
import { setEarshot } from "@/lib/audio";
import type { Status } from "@/entities";
import { applyAccent } from "@/lib/appearance";

export function SettingsEffects() {
  const earshot = useWorkspace((s) => s.settings.earshot);
  const autoAway = useWorkspace((s) => s.settings.autoAwayMinutes);
  const accent = useWorkspace((s) => s.accent);

  useEffect(() => setEarshot(earshot), [earshot]);
  useEffect(() => applyAccent(accent), [accent]);

  /* Auto-away. Minutes without any input, then Away; the next input brings
     the previous status back. Focus and meetings are never interrupted by
     this, because being still is exactly what those are. */
  useEffect(() => {
    if (!autoAway) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wentAway = false;
    let previous: Status = "available";

    const arm = () => {
      if (timer) clearTimeout(timer);
      if (wentAway) {
        useWorkspace.getState().setStatus(previous);
        wentAway = false;
      }
      timer = setTimeout(() => {
        const st = useWorkspace.getState();
        const mine = st.presence.find((p) => p.userId === st.me);
        if (!mine || mine.status === "away" || mine.status === "focus" || mine.status === "in_meeting") return;
        previous = mine.status;
        st.setStatus("away");
        wentAway = true;
      }, autoAway * 60_000);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [autoAway]);

  return null;
}
