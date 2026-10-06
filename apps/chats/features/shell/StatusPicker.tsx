"use client";

/**
 * SOMION HQ - STATUS PICKER
 *
 * Lives in the suite top bar rather than inside HQ, because status is true
 * across all seven modules: the dot next to an assignee in Task Manager is the
 * same dot as the one on the floor.
 *
 * Changing status here is the demo's signature interaction. One change
 * propagates to the top bar, the floor tile, the chat sidebar and the assignee
 * dot on the task screen in a single authored motion, because they all read the
 * same store rather than each holding a copy.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { PresenceMark } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useMe, useMyPresence } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META, STATUS_PICKER_ORDER } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import type { Status } from "@/entities";

const FOCUS_DURATIONS = [25, 50, 90] as const;

export function StatusPicker() {
  const me = useMe();
  const presence = useMyPresence();
  const setStatus = useWorkspace((s) => s.setStatus);
  const signOut = useWorkspace((s) => s.signOut);
  const focusDefault = useWorkspace((s) => s.settings.focusDefaultMinutes);
  const t = useT();

  const [open, setOpen] = useState(false);
  useBackToClose(open, () => setOpen(false));
  const [customText, setCustomText] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLInputElement>(null);

  /* Opening moves focus into the dialog; closing hands it back to the button (CHT-018). */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) note.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const status: Status = presence?.status ?? "offline";
  const meta = STATUS_META[status];

  /* Close on outside click and on Escape. Both, always - a popover that only
     closes one way is a trap for keyboard users. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Status, minutes?: number) => {
    setStatus(next, customText.trim() || undefined, minutes);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("status.button", "Your status: {status}", { status: presence?.customText ? presence.customText : t(`status.${status}`, meta.label) })}
        className="hq-btn flex items-center gap-2 ps-2.5 pe-2"
        style={{
          minHeight: 34,
          borderRadius: "var(--radius-chip)",
          border: "1px solid var(--color-hairline-strong)",
          background: "var(--color-surface)",
        }}
      >
        {/* The account menu next to it shows who you are; this button is your status alone. */}
        <PresenceMark status={status} px={14} />
        <span className="hidden text-[12.5px] font-medium sm:inline" style={{ color: "var(--color-ink)" }}>
          {presence?.customText ? presence.customText : t(`status.${status}`, meta.label)}
        </span>
        <CaretDown size={12} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("status.dialog", "Set your status")}
          className="hq-floating hq-rise hq-dropdown absolute end-0 z-50 mt-2 w-[290px] p-2"
          style={{
            borderRadius: "var(--radius-card)",
          }}
        >
          <div className="p-1.5">
            <label htmlFor="status-note" className="text-[12px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t("status.noteLabel", "What are you up to?")}
            </label>
            <input
              ref={note}
              id="status-note"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              /* Enter saves the note and keeps the status: no status has to be picked again (CHT-039). */
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && customText.trim()) {
                  e.preventDefault();
                  choose(status);
                }
              }}
              aria-describedby="status-note-hint"
              placeholder={t("status.notePlaceholder", "Optional")}
              className="mt-1.5 w-full"
              style={{
                background: "var(--color-surface-sunken)",
                border: "1px solid var(--color-hairline-strong)",
                borderRadius: "var(--radius-control)",
                padding: "7px 10px",
                fontSize: "13px",
                minHeight: 34,
              }}
            />
            <span id="status-note-hint" className="mt-1 block text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
              {t("status.noteHint", "Press Enter to save it with your current status, or pick a new status below.")}
            </span>
          </div>

          {presence?.customText && (
            <div className="px-1.5 pb-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStatus(status, undefined);
                  setCustomText("");
                  setOpen(false);
                }}
                style={{ color: "var(--color-ink-muted)" }}
              >
                {t("status.clear", "Clear “{text}”", { text: presence.customText })}
              </Button>
            </div>
          )}

          <ul className="mt-1 flex flex-col">
            {STATUS_PICKER_ORDER.map((s) => {
              const m = STATUS_META[s];
              const isCurrent = s === status;
              return (
                <li key={s}>
                  <button
                    onClick={() => (s === "focus" ? undefined : choose(s))}
                    className="hq-row flex w-full items-start gap-2.5 p-2 text-start"
                    style={{ borderRadius: "var(--radius-control)", minHeight: 44 }}
                    aria-current={isCurrent ? "true" : undefined}
                    disabled={s === "focus"}
                    aria-disabled={s === "focus"}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block shrink-0"
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "var(--radius-chip)",
                        background: m.mark === "hollow" || m.mark === "ring" ? "transparent" : m.color,
                        border: `2px solid ${m.color}`,
                      }}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                        {t(`status.${s}`, m.label)}
                      </span>
                      <span className="text-[11.5px] leading-snug" style={{ color: "var(--color-ink-muted)" }}>
                        {t(`status.${s}.desc`, m.description)}
                      </span>
                    </span>
                    {isCurrent && (
                      <Check size={14} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-brand)", marginInlineStart: "auto" }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Focus is the only status that needs a duration, so it gets its own
              row of choices rather than a nested menu. */}
          <div className="mt-1 border-t p-2" style={{ borderColor: "var(--color-hairline)" }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                {t("status.focus", "Focus")}
              </span>
              <span className="text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
                {t("status.focus.hint", "Knocks are held")}
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[focusDefault, ...FOCUS_DURATIONS.filter((m) => m !== focusDefault)].map((min) => (
                <Button key={min} size="sm" className="flex-1" variant={min === focusDefault ? "primary" : "secondary"} onClick={() => choose("focus", min)}>
                  <span className="tabular">{t("status.focus.minutes", "{n} min", { n: min })}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-1 border-t p-2" style={{ borderColor: "var(--color-hairline)" }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                signOut("manual");
              }}
            >
              {t("me.signOut", "Sign out")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
