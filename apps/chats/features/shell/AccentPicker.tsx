"use client";

/**
 * SOMION HQ - ACCENT PICKER
 *
 * Five swatches, one of them checked. It is a radio group because that is
 * what it is: one choice among a few, and the arrow keys should move it.
 */

import { Check } from "@phosphor-icons/react";
import { ACCENTS } from "@/lib/appearance";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

export function AccentPicker() {
  const accent = useWorkspace((s) => s.accent);
  const setAccent = useWorkspace((s) => s.setAccent);
  const t = useT();

  const move = (dir: 1 | -1) => {
    const i = ACCENTS.findIndex((a) => a.id === accent);
    const next = ACCENTS[(i + dir + ACCENTS.length) % ACCENTS.length];
    if (next) setAccent(next.id);
  };

  return (
    <div role="radiogroup" aria-label={t("appearance.accent", "System colour")} className="flex flex-wrap gap-2">
      {ACCENTS.map((a) => {
        const checked = a.id === accent;
        return (
          <button
            key={a.id}
            role="radio"
            aria-checked={checked}
            aria-label={t(`accent.${a.id}`, a.label)}
            title={`${t(`accent.${a.id}`, a.label)} - ${t(`accent.${a.id}.blurb`, a.blurb)}`}
            tabIndex={checked ? 0 : -1}
            onClick={() => setAccent(a.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(-1);
              }
            }}
            className="hq-btn flex flex-col items-center gap-1.5 px-2 pb-1.5 pt-2"
            style={{
              minWidth: 60,
              borderRadius: "var(--radius-control)",
              background: checked ? "var(--color-surface-sunken)" : "transparent",
            }}
          >
            <span
              aria-hidden="true"
              className="relative inline-flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                background: a.swatch,
                boxShadow: checked
                  ? "0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-ink)"
                  : "var(--shadow-lit), 0 1px 2px rgb(var(--shadow-ink) / 0.18)",
                transition: "box-shadow var(--duration-state) var(--ease-out-soft)",
              }}
            >
              {checked && <Check size={14} weight="bold" style={{ color: "var(--ot-color-plum-50)" }} />}
            </span>
            <span className="text-[11.5px] font-medium" style={{ color: checked ? "var(--color-ink)" : "var(--color-ink-muted)" }}>
              <bdi>{t(`accent.${a.id}`, a.label)}</bdi>
            </span>
          </button>
        );
      })}
    </div>
  );
}
