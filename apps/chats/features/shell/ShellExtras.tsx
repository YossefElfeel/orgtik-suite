"use client";

/**
 * SOMION HQ - SHELL EXTRAS
 *
 * Three small things that belong to the whole app:
 *
 *   PrototypeBadge - a permanent, honest marker that this runs on mock data.
 *                    The demo is shown to a founder who has to make a go/no-go
 *                    decision; letting it be mistaken for a shipping product is
 *                    the single most expensive misunderstanding available.
 *   ToastHost      - one toast per thread per five minutes, never one per
 *                    message. Quiet by default is enforced here.
 *   LiveRegion     - batched presence announcements for screen readers,
 *                    flushed at most every 30 seconds rather than on every move.
 */

import { useEffect, useRef, useState } from "react";
import { HandWaving, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import type { Msg } from "@/lib/messages";

/* --------------------------------------------------------------- prototype */

export function PrototypeBadge() {
  const t = useT();
  return (
    <span
      className={"hidden select-none whitespace-nowrap px-2 py-0.5 text-micro font-medium xl:inline "+("ch-background-db4104"+' '+"ch-color-64fbe7"+' '+"ch-border-radius-189003")}
      
    >
      {t("shell.prototype", "Prototype - mock data")}
    </span>
  );
}

/* ------------------------------------------------------------------ toasts */

export function ToastHost() {
  const toasts = useWorkspace((s) => s.toasts);
  const dismiss = useWorkspace((s) => s.dismissToast);
  const answerKnock = useWorkspace((s) => s.answerKnock);
  const t = useT();
  const say = (m: string | Msg) => (typeof m === "string" ? m : t(m.key, m.text, m.vars));

  /* Auto-dismiss after eight seconds. A knock that is never answered becomes a
     missed knock in the list, not a permanent banner. */
  /* Hovering or focusing an alert holds them all, so nobody loses one while reading it (CHT-013). */
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!toasts.length || paused) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => dismiss(toast.id), toast.kind === "knock" ? 12_000 : 6_000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss, paused]);

  /* The region is always there, so what arrives in it is announced (a live region added together
     with its content is not). */

  return (
    <div
      className="fixed end-4 top-[64px] z-[65] flex w-[320px] flex-col gap-2"
      role="region"
      aria-label={t("shell.alerts", "Alerts")}
      aria-live="polite"
      aria-relevant="additions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={(`hq-floating hq-rise ${toast.kind === "knock" ? "hq-knock-pulse" : ""}`)+" "+("ch-border-radius-8d459a"+' '+"ch-padding-40037d")}
          
        >
          <div className="flex items-start gap-2.5">
            {toast.kind === "knock" && (
              <span
                aria-hidden="true"
                className={"flex shrink-0 items-center justify-center "+("ch-width-322e3f"+' '+"ch-height-5a5909"+' '+"ch-border-radius-332348"+' '+"ch-background-1416a8"+' '+"ch-color-55f463")}
                
              >
                <HandWaving size={16} weight="fill" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
                {say(toast.title)}
              </p>
              <p className={"mt-0.5 text-body-sm "+("ch-color-4a0211")} >
                {say(toast.body)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("shell.dismiss", "Dismiss")}
              onClick={() => dismiss(toast.id)}
              className={"ch-color-094083"} 
            >
              <X size={13} weight="bold" aria-hidden="true" />
            </Button>
          </div>

          {toast.kind === "knock" && (
            <div className="mt-2.5 flex gap-1.5">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  answerKnock("accepted");
                  dismiss(toast.id);
                }}
              >
                {t("knock.accept", "Talk now")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  answerKnock("deferred");
                  dismiss(toast.id);
                }}
              >
                {t("knock.later", "In 10 min")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  answerKnock("declined");
                  dismiss(toast.id);
                }}
              >
                {t("knock.decline", "Not now")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- live region */

const FLUSH_MS = 30_000;

export function LiveRegion() {
  const announcements = useWorkspace((s) => s.announcements);
  const [spoken, setSpoken] = useState("");
  const pending = useRef<string[]>([]);

  useEffect(() => {
    pending.current = announcements;
  }, [announcements]);

  /* One utterance every 30 seconds, summarising what happened, instead of
     narrating every single movement on the floor. */
  useEffect(() => {
    const id = setInterval(() => {
      const queue = pending.current;
      if (!queue.length) return;
      const text =
        queue.length === 1
          ? queue[0]
          : `${queue.length} presence changes. Most recent: ${queue[queue.length - 1]}`;
      setSpoken(text ?? "");
    }, FLUSH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {spoken}
    </div>
  );
}
