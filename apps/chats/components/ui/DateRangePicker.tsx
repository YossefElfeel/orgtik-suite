"use client";

/**
 * SOMION HQ - DATE RANGE PICKER
 *
 * Presets as rows, because nobody fights a calendar grid for "last 30 days";
 * a custom span behind them, on two months side by side, for when they do.
 * Typed dates are accepted too: the two inputs at the foot are the same
 * span, for people who know the dates and for screen readers.
 *
 * A custom span is drawn as you go and committed with Apply; a preset
 * applies at once and closes. Escape and Back close without applying.
 */

import { useEffect, useRef, useState } from "react";
import { CalendarBlank, CaretDown, Check } from "@phosphor-icons/react";
import { Button } from "./Primitives";
import { MonthGrid, monthOf, sameMonth, shiftMonth, type YearMonth } from "./Calendar";
import { useBackToClose, useEscape } from "@/lib/useDismiss";
import { useT } from "@/lib/i18n";
import { daysIn, formatRangeLabel, presetRange, type DateKey, type DateRange, type RangePreset } from "@/lib/analytics";
import { msgText } from "@/lib/messages";

export interface RangeValue {
  preset: RangePreset;
  range: DateRange;
}

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "thisWeek", label: msgText("range.thisWeek", "This week") },
  { id: "7d", label: msgText("range.7d", "Last 7 days") },
  { id: "30d", label: msgText("range.30d", "Last 30 days") },
  { id: "90d", label: msgText("range.90d", "Last 90 days") },
  { id: "thisMonth", label: msgText("range.thisMonth", "This month") },
  { id: "lastMonth", label: msgText("range.lastMonth", "Last month") },
];

export function presetLabel(preset: RangePreset): string {
  return PRESETS.find((p) => p.id === preset)?.label ?? "Custom";
}

export function DateRangePicker({
  value,
  onChange,
  today,
  min,
  max,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
  today: DateKey;
  min?: DateKey;
  max?: DateKey;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value.range);
  const [pending, setPending] = useState<DateKey | null>(null);
  const [preview, setPreview] = useState<DateKey | null>(null);
  const [focusDay, setFocusDay] = useState<DateKey | null>(null);
  const [month, setMonth] = useState<YearMonth>(shiftMonth(monthOf(value.range.to), -1));
  const ref = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);
  useBackToClose(open, close);
  useEscape(open, close);

  useEffect(() => {
    if (!open) return;
    setDraft(value.range);
    setPending(null);
    setPreview(null);
    /* Show the span's last month on the right, so "last 30 days" is visible
       without paging. */
    setMonth(shiftMonth(monthOf(value.range.to), -1));
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value.range]);

  const pick = (day: DateKey) => {
    if (!pending) {
      setPending(day);
      setDraft({ from: day, to: day });
      return;
    }
    const range = day < pending ? { from: day, to: pending } : { from: pending, to: day };
    setDraft(range);
    setPending(null);
    setPreview(null);
  };

  const apply = () => {
    onChange({ preset: "custom", range: draft });
    setOpen(false);
  };

  const choosePreset = (id: RangePreset) => {
    onChange({ preset: id, range: presetRange(id, today) });
    setOpen(false);
  };

  const right = shiftMonth(month, 1);
  const bounds = { ...(min ? { min } : {}), ...(max ? { max } : {}) };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="hq-btn flex items-center gap-2 ps-2.5 pe-2"
        style={{
          minHeight: 34,
          borderRadius: "var(--radius-control)",
          border: "1px solid var(--color-hairline-strong)",
          background: "var(--color-surface)",
          fontSize: 12.5,
          color: "var(--color-ink)",
        }}
      >
        <CalendarBlank size={14} aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
        <span className="font-medium">{value.preset === "custom" ? t("range.custom", "Custom") : t(`range.${value.preset}`, presetLabel(value.preset))}</span>
        <span className="tabular" style={{ color: "var(--color-ink-muted)" }}>
          {formatRangeLabel(value.range)}
        </span>
        <CaretDown size={11} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("range.title", "Choose a period")}
          className="hq-floating hq-rise hq-dropdown absolute start-0 z-50 mt-2 flex"
          style={{ borderRadius: "var(--radius-card)", background: "var(--color-surface)" }}
        >
          <ul className="flex w-[168px] shrink-0 flex-col gap-0.5 border-e p-2" style={{ borderColor: "var(--color-hairline)" }}>
            {PRESETS.map((p) => {
              const on = value.preset === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choosePreset(p.id)}
                    aria-pressed={on}
                    className="hq-row flex w-full items-center justify-between px-2.5 text-start text-[12.5px]"
                    style={{ minHeight: 32, borderRadius: "var(--radius-control)", color: "var(--color-ink)", fontWeight: on ? 600 : 400 }}
                  >
                    {t(`range.${p.id}`, p.label)}
                    {on && <Check size={16} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-brand)" }} />}
                  </button>
                </li>
              );
            })}
            <li className="mt-1 border-t px-2.5 pt-2 text-[11.5px]" style={{ borderColor: "var(--color-hairline)", color: "var(--color-ink-subtle)" }}>
              {t("range.customHint", "Or pick two days on the right.")}
            </li>
          </ul>

          <div className="p-3">
            <div className="flex gap-5">
              <MonthGrid
                month={month}
                today={today}
                range={draft}
                pending={pending}
                preview={preview}
                onPreview={setPreview}
                onPick={pick}
                focusDay={focusDay}
                onFocusDay={setFocusDay}
                onMonthChange={(m) => setMonth(sameMonth(m, right) ? month : m)}
                {...bounds}
                label={t("range.firstMonth", "Earlier month")}
              />
              <MonthGrid
                month={right}
                today={today}
                range={draft}
                pending={pending}
                preview={preview}
                onPreview={setPreview}
                onPick={pick}
                focusDay={focusDay}
                onFocusDay={setFocusDay}
                onMonthChange={(m) => setMonth(sameMonth(m, month) ? shiftMonth(month, -1) : shiftMonth(m, -1))}
                {...bounds}
                label={t("range.secondMonth", "Later month")}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3" style={{ borderColor: "var(--color-hairline)" }}>
              <DateField
                label={t("range.from", "From")}
                value={draft.from}
                onChange={(v) => v && setDraft((d) => ({ from: v, to: v > d.to ? v : d.to }))}
                {...bounds}
              />
              <DateField
                label={t("range.to", "To")}
                value={draft.to}
                onChange={(v) => v && setDraft((d) => ({ from: v < d.from ? v : d.from, to: v }))}
                {...bounds}
              />
              <span className="tabular ms-auto self-center text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                {t("range.days", "{n} days", { n: daysIn(draft) })}
              </span>
              <Button size="sm" onClick={close}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button size="sm" variant="primary" onClick={apply} disabled={Boolean(pending)}>
                {t("range.apply", "Apply")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: DateKey;
  onChange: (v: DateKey) => void;
  min?: DateKey;
  max?: DateKey;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11.5px] font-medium" style={{ color: "var(--color-ink-muted)" }}>
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="tabular"
        style={{
          minHeight: 32,
          padding: "4px 8px",
          fontSize: 12.5,
          color: "var(--color-ink)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-hairline-strong)",
          borderRadius: "var(--radius-control)",
        }}
      />
    </label>
  );
}
