"use client";

/**
 * SOMION HQ - MONTH GRID
 *
 * One month of days as a real grid: rows, cells, a roving tab stop, arrow
 * keys that move by day and week, PageUp and PageDown that move by month.
 * The date picker uses it to choose a span; the meetings calendar uses it to
 * show a month. Neither of them draws a day itself.
 *
 * Marks under a day are counts (meetings, say), drawn as up to three dots so
 * a busy month reads at a glance without a number in every cell.
 */

import { useEffect, useRef } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { addDays, fromKey, toKey, weekdayOf, type DateKey } from "@/lib/analytics";
import { dayLabels, localeFormat } from "@/lib/time";
import { useT } from "@/lib/i18n";

export interface YearMonth {
  year: number;
  /** 0 to 11, as the Date API counts. */
  month: number;
}

export const monthOf = (k: DateKey): YearMonth => {
  const d = fromKey(k);
  return { year: d.getFullYear(), month: d.getMonth() };
};

export const shiftMonth = (m: YearMonth, by: number): YearMonth => {
  const d = new Date(m.year, m.month + by, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

export const sameMonth = (a: YearMonth, b: YearMonth): boolean => a.year === b.year && a.month === b.month;

const monthFmt = localeFormat({ month: "long", year: "numeric" });
const fullFmt = localeFormat({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

export interface MonthGridProps {
  month: YearMonth;
  today: DateKey;
  /** Inclusive span drawn as selected. A single day has from === to. */
  range?: { from: DateKey; to: DateKey } | null;
  /** A first click waiting for its second, drawn as a lone endpoint. */
  pending?: DateKey | null;
  /** The day under the pointer while a second click is pending. */
  preview?: DateKey | null;
  onPreview?: (day: DateKey | null) => void;
  onPick: (day: DateKey) => void;
  /** Days that may be picked. Outside them a day is shown but inert. */
  min?: DateKey;
  max?: DateKey;
  marks?: Record<DateKey, number>;
  /** The day holding the tab stop; defaults to the first selectable day. */
  focusDay?: DateKey | null;
  onFocusDay?: (day: DateKey) => void;
  onMonthChange?: (m: YearMonth) => void;
  showNav?: boolean;
  label?: string;
  /** Cell size in px. 36 for pickers, 44 for a calendar that shows marks. */
  cell?: number;
}

export function MonthGrid({
  month,
  today,
  range,
  pending,
  preview,
  onPreview,
  onPick,
  min,
  max,
  marks,
  focusDay,
  onFocusDay,
  onMonthChange,
  showNav = true,
  label,
  cell = 36,
}: MonthGridProps) {
  const t = useT();
  const first = toKey(new Date(month.year, month.month, 1));
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const lead = weekdayOf(first);
  const gridRef = useRef<HTMLDivElement>(null);

  const selectable = (k: DateKey): boolean => (!min || k >= min) && (!max || k <= max);

  /* The span to paint: the committed range, or the pending one being drawn. */
  const span: { from: DateKey; to: DateKey } | null =
    pending && preview ? (preview < pending ? { from: preview, to: pending } : { from: pending, to: preview }) : range ?? null;

  const defaultFocus = (() => {
    if (focusDay && monthOf(focusDay).month === month.month && monthOf(focusDay).year === month.year) return focusDay;
    if (range && sameMonth(monthOf(range.from), month)) return range.from;
    if (sameMonth(monthOf(today), month)) return today;
    return first;
  })();

  /* Move the DOM focus to the roving cell after a keyboard move. */
  useEffect(() => {
    if (!focusDay || !gridRef.current) return;
    if (!gridRef.current.contains(document.activeElement)) return;
    const el = gridRef.current.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`);
    el?.focus({ preventScroll: true });
  }, [focusDay]);

  const move = (from: DateKey, by: number) => {
    const next = addDays(from, by);
    const nm = monthOf(next);
    if (!sameMonth(nm, month)) onMonthChange?.(nm);
    onFocusDay?.(next);
  };

  const onKey = (e: React.KeyboardEvent, day: DateKey) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (e.key in map) {
      e.preventDefault();
      move(day, map[e.key] ?? 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(day, -weekdayOf(day));
    } else if (e.key === "End") {
      e.preventDefault();
      move(day, 6 - weekdayOf(day));
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      const nm = shiftMonth(month, e.key === "PageDown" ? 1 : -1);
      onMonthChange?.(nm);
      const d = fromKey(day);
      const target = toKey(new Date(nm.year, nm.month, Math.min(d.getDate(), new Date(nm.year, nm.month + 1, 0).getDate())));
      onFocusDay?.(target);
    }
  };

  const cells: (DateKey | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (DateKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const title = monthFmt.format(new Date(month.year, month.month, 1));

  return (
    <div style={{ width: cell * 7 + 4 }}>
      <div className="flex items-center justify-between pb-2">
        {showNav ? (
          <button
            type="button"
            onClick={() => onMonthChange?.(shiftMonth(month, -1))}
            aria-label={t("calendar.previousMonth", "Previous month")}
            className="hq-btn inline-flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-control)", color: "var(--color-ink-muted)" }}
          >
            <CaretLeft size={13} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <span style={{ width: 28 }} />
        )}
        <span className="text-[13px] font-semibold" style={{ color: "var(--color-ink)" }} aria-live="polite">
          {title}
        </span>
        {showNav ? (
          <button
            type="button"
            onClick={() => onMonthChange?.(shiftMonth(month, 1))}
            aria-label={t("calendar.nextMonth", "Next month")}
            className="hq-btn inline-flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-control)", color: "var(--color-ink-muted)" }}
          >
            <CaretRight size={13} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <span style={{ width: 28 }} />
        )}
      </div>

      <div ref={gridRef} role="grid" aria-label={label ?? title} onMouseLeave={() => onPreview?.(null)}>
        <div role="row" className="grid grid-cols-7">
          {dayLabels().map((d) => (
            <span
              key={d}
              role="columnheader"
              className="text-center text-[10.5px] font-semibold uppercase"
              style={{ color: "var(--color-ink-subtle)", letterSpacing: "0.04em", height: 20, lineHeight: "20px" }}
            >
              {d.slice(0, 2)}
            </span>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} role="row" className="grid grid-cols-7">
            {row.map((day, ci) => {
              if (!day) return <span key={ci} role="gridcell" aria-hidden="true" style={{ height: cell }} />;
              const inSpan = Boolean(span && day >= span.from && day <= span.to);
              const isStart = span?.from === day;
              const isEnd = span?.to === day;
              const endpoint = isStart || isEnd || pending === day;
              const enabled = selectable(day);
              const isToday = day === today;
              const count = marks?.[day] ?? 0;
              const tab = day === defaultFocus ? 0 : -1;
              return (
                <span key={day} role="gridcell" aria-selected={inSpan || undefined} className="relative" style={{ height: cell }}>
                  {/* The span band sits behind the day so endpoints can be
                      round while the middle stays a continuous bar. */}
                  {inSpan && span && span.from !== span.to && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-[4px]"
                      style={{
                        left: isStart ? "50%" : 0,
                        right: isEnd ? "50%" : 0,
                        background: "var(--color-accent-soft)",
                      }}
                    />
                  )}
                  <button
                    type="button"
                    data-day={day}
                    tabIndex={tab}
                    disabled={!enabled}
                    aria-label={`${fullFmt.format(fromKey(day))}${count ? `, ${t("calendar.meetingsCount", "{n, plural, one {# meeting} other {# meetings}}", { n: count })}` : ""}`}
                    aria-pressed={endpoint || undefined}
                    onClick={() => onPick(day)}
                    onMouseEnter={() => onPreview?.(day)}
                    onFocus={() => onFocusDay?.(day)}
                    onKeyDown={(e) => onKey(e, day)}
                    className="relative flex w-full flex-col items-center justify-center"
                    style={{
                      height: cell,
                      borderRadius: "var(--radius-chip)",
                      fontSize: cell >= 40 ? 13 : 12.5,
                      fontWeight: isToday || endpoint ? 600 : 400,
                      color: endpoint ? "var(--color-ink-inverse)" : enabled ? "var(--color-ink)" : "var(--color-ink-subtle)",
                      background: endpoint ? "var(--color-accent)" : "transparent",
                      boxShadow: isToday && !endpoint ? "inset 0 0 0 1.5px var(--color-hairline-strong)" : "none",
                      cursor: enabled ? "pointer" : "default",
                      opacity: enabled ? 1 : 0.55,
                    }}
                  >
                    <span className="tabular">{fromKey(day).getDate()}</span>
                    {count > 0 && (
                      <span aria-hidden="true" className="absolute flex gap-[3px]" style={{ bottom: 4 }}>
                        {Array.from({ length: Math.min(3, count) }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: "var(--radius-chip)",
                              background: endpoint ? "var(--color-ink-inverse)" : "var(--color-ink-brand)",
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
