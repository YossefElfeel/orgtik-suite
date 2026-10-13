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
            className={"hq-btn flex flex-col items-center gap-1.5 px-2 pb-1.5 pt-2 "+("ch-min-width-60px"+' '+"ch-border-radius-var---radius-control"+' '+(checked?"ch-background-var---color-surface-sunken":"ch-background-transparent"))}

          >
            <span
              aria-hidden="true"
              className={("relative inline-flex items-center justify-center rounded-full "+("ch-width-28px"+' '+"ch-height-28px"+' '+(checked?"ch-box-shadow-0-0-0-2px-var---color-surface-0-0-0-4px-var---color-ink":"ch-box-shadow-var---shadow-lit-0-1px-2px-rgb-var---shadow-ink-0-18")+' '+"ch-transition-box-shadow-var---duration-state-var---ease-out-soft"))+" "+('ch-swatch-'+a.id)}

            >
              {checked && <Check size={14} weight="bold" className={"ch-color-var---ot-color-plum-50"}  />}
            </span>
            <span className={"text-caption font-medium "+((checked?"ch-color-var---color-ink":"ch-color-var---color-ink-muted"))} >
              <bdi>{t(`accent.${a.id}`, a.label)}</bdi>
            </span>
          </button>
        );
      })}
    </div>
  );
}
