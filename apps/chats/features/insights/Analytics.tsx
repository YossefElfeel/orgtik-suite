"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - DEEPER ANALYTICS
 *
 * Three questions the weekly totals cannot answer on their own:
 *
 *   1. Is this week normal? -> an eight-week trend, so "38 hours" has a shape
 *      behind it instead of being a number with nothing to compare against.
 *   2. What kind of meetings are these? -> the size distribution. Forty hours
 *      of meetings says nothing about whether the team is holding two-person
 *      conversations or nine-person broadcasts, and those are different
 *      problems with different fixes.
 *   3. Are the rooms the constraint? -> utilisation against hours available.
 *
 * All three obey the same rule as the rest of the screen: team totals only.
 * There is no per-person series here and no way to derive one, which is the
 * whole reason this product can ship an analytics screen in Switzerland at
 * all.
 */

import { useEffect, useRef, useState } from "react";
import { Panel, SectionHead } from "@/components/ui/Primitives";
import { useT } from "@/lib/i18n";
import { formatHours } from "@/lib/time";

/* ------------------------------------------------------------------ trend */

/**
 * A line, because the job is change over time. One series, so no legend box:
 * the title names it. Only the extremes and the current week are labelled -
 * a number on every point is chaos and goes unread.
 */
export function TrendChart({
  history,
  label,
  body,
}: {
  history: { week: string; meetingHours: number; presentHours: number }[];
  label: string;
  body: string;
}) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);

  /* Measure the card and draw at 1 unit per pixel. Scaling a fixed viewBox to
     fit the width would scale the axis type with it, which is how a chart ends
     up with 18px tick labels on a wide screen. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setW(Math.max(420, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (history.length < 2) return null;

  const H = 170;
  const PAD = { top: 12, right: 12, bottom: 22, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const values = history.map((h) => h.meetingHours);
  const max = Math.ceil(Math.max(...values) / 10) * 10;
  const min = 0;
  const step = plotW / (history.length - 1);

  const xy = (i: number, v: number) => [
    PAD.left + i * step,
    PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH,
  ] as const;

  const pts = values.map((v, i) => xy(i, v));
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${PAD.left + plotW},${PAD.top + plotH} L${PAD.left},${PAD.top + plotH} Z`;

  const peak = values.indexOf(Math.max(...values));
  const last = history.length - 1;
  /* Only these three points get a dot, so the line stays a line. */
  const marked = [...new Set([peak, last, hover].filter((i): i is number => i !== null))];

  const ticks = [0, max / 2, max];
  const shown = hover ?? last;
  const showable = history[shown];

  return (
    <Panel>
      <SectionHead
        title={label}
        meta={t("insights.weeks", "{n} weeks", { n: history.length })}
      />
      <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
        {body}
      </p>

      <div ref={wrapRef} className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t("insights.trendAlt", "Team meeting hours over {n} weeks, from {a} to {b}", {
            n: history.length,
            a: formatHours(values[0] ?? 0),
            b: formatHours(values[last] ?? 0),
          })}
          width={W}
          height={H}
          className={"ch-display-2a1b75"+' '+"ch-max-width-27aeb6"} 
          onMouseLeave={() => setHover(null)}
        >
          {/* Solid hairline gridlines. Dashing reads as "threshold". */}
          {ticks.map((v) => {
            const [, y] = xy(0, v);
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--color-hairline)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 7}
                  y={y + 3}
                  textAnchor="end"
                  
                  className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")}
                >
                  {v}
                </text>
              </g>
            );
          })}

          <path d={area} fill="var(--color-scale-wash)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-bar)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {marked.map((i) => {
            const p = pts[i];
            if (!p) return null;
            return (
              <circle
                key={i}
                cx={p[0]}
                cy={p[1]}
                r={i === shown ? 4.5 : 3.5}
                fill={i === last ? "var(--color-bar)" : "var(--color-surface)"}
                stroke="var(--color-bar)"
                strokeWidth={2}
              />
            );
          })}

          {/* Week labels, every other one so they never collide. */}
          {history.map((h, i) => {
            if (i % 2 !== 0 && i !== last) return null;
            const [x] = xy(i, 0);
            return (
              <text
                key={h.week}
                x={x}
                y={H - 6}
                textAnchor="middle"
                className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")}
                
              >
                {h.week.split("-")[1]}
              </text>
            );
          })}

          {/* Generous hit areas: the hit target is the column, not the dot. */}
          {history.map((h, i) => {
            const [x] = xy(i, 0);
            return (
              <rect
                key={`hit-${h.week}`}
                x={x - step / 2}
                y={0}
                width={step}
                height={H}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={t("insights.weekPoint", "Week {w}: {h} in meetings", {
                  w: h.week,
                  h: formatHours(h.meetingHours),
                })}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={"ch-cursor-2a9295"} 
              />
            );
          })}
        </svg>
      </div>

      {showable && (
        <p className="mt-1 text-caption" aria-hidden="true">
          <span className={"font-medium "+("ch-color-7f7330")} >
            {t("insights.week", "Week {w}", { w: showable.week })}
          </span>
          <span className={"ch-color-4a0211"} >
            {" · "}
            {t("insights.hoursInMeetings", "{h} in meetings", {
              h: formatHours(showable.meetingHours),
            })}
          </span>
        </p>
      )}
    </Panel>
  );
}

/* ----------------------------------------------------- size distribution */

/**
 * Ranked horizontal bars rather than a pie: four close values are exactly what
 * a pie is worst at, and the band names are long enough that a horizontal
 * layout reads better anyway.
 */
export function MeetingSizes({
  sizes,
}: {
  sizes: { band: string; count: number; hours: number }[];
}) {
  const t = useT();
  const totalCount = sizes.reduce((a, b) => a + b.count, 0);
  const totalHours = sizes.reduce((a, b) => a + b.hours, 0);
  const max = Math.max(...sizes.map((s) => s.hours), 1);

  /* The point of the chart, stated in words as well as drawn. */
  const biggest = [...sizes].sort((a, b) => b.hours - a.hours)[0];

  return (
    <Panel>
      <SectionHead
        title={t("insights.meetingSizes", "How big the meetings were")}
        meta={t("insights.nMeetings", "{n} meetings", { n: totalCount })}
      />
      <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
        {t(
          "insights.meetingSizesBody",
          "Hours spent, by how many people were in the room. Team totals, by size band.",
        )}
      </p>

      <ul className="flex flex-col gap-2.5">
        {sizes.map((s) => (
          <li key={s.band} className="flex items-center gap-3">
            <span
              className={"tabular w-[38px] shrink-0 text-body-sm font-medium "+("ch-color-7f7330")}
              
            >
              {s.band}
            </span>
            <span
              className={"h-[10px] min-w-0 flex-1 "+("ch-background-5d6e34"+' '+"ch-border-radius-189003")}
              
            >
              <span
                className={("block h-full "+("ch-background-82a08c"+' '+"ch-border-radius-189003"))+" "+(geometryClass({width:`${(s.hours / max) * 100}%`}))}
                
              />
            </span>
            <span
              className={"tabular w-[92px] shrink-0 text-end text-caption "+("ch-color-4a0211")}
              
            >
              {formatHours(s.hours)}
              <span className={"ch-color-094083"} > · {s.count}</span>
            </span>
          </li>
        ))}
      </ul>

      {biggest && (
        <p className={"mt-3.5 text-caption "+("ch-color-4a0211")} >
          {t(
            "insights.sizesTakeaway",
            "Most meeting time went to groups of {band}, at {pct}% of {total}.",
            {
              band: biggest.band,
              pct: Math.round((biggest.hours / (totalHours || 1)) * 100),
              total: formatHours(totalHours),
            },
          )}
        </p>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------- meters --- */

/**
 * A ratio against a limit is a meter, not a chart. The unfilled track is a
 * lighter step of the same ramp so the state reads across the whole bar.
 */
export function Utilisation({
  used,
  available,
  rooms,
}: {
  used: number;
  available: number;
  rooms: { room: string; hours: number }[];
}) {
  const t = useT();
  const pct = available > 0 ? Math.min(100, (used / available) * 100) : 0;

  return (
    <Panel>
      <SectionHead
        title={t("insights.utilisation", "Room utilisation")}
        meta={`${Math.round(pct)}%`}
      />
      <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
        {t(
          "insights.utilisationBody",
          "Hours the rooms were occupied against the hours they were available, across the working week.",
        )}
      </p>

      <div
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("insights.utilisation", "Room utilisation")}
        className={"ch-height-06c074"+' '+"ch-background-5d6e34"+' '+"ch-border-radius-189003"} 
      >
        <div
          className={("ch-height-622640"+' '+"ch-background-82a08c"+' '+"ch-border-radius-189003")+" "+(geometryClass({width:`${pct}%`}))} 
        />
      </div>

      <p className={"tabular mt-2 text-caption "+("ch-color-4a0211")} >
        {t("insights.utilisationOf", "{used} used of {available} available", {
          used: formatHours(used),
          available: formatHours(available),
        })}
      </p>

      {/* The conclusion a reader should draw, said rather than implied. */}
      <p className={"mt-3 text-body-sm leading-relaxed "+("ch-color-7f7330")} >
        {pct < 40
          ? t(
              "insights.utilisationLow",
              "There is room to spare. Adding meeting rooms would not help; the constraint is somewhere else.",
              { n: rooms.length },
            )
          : pct < 75
            ? t("insights.utilisationOk", "Comfortable. Rooms are being used without anyone queuing for one.")
            : t(
                "insights.utilisationHigh",
                "Close to full. People are probably taking calls at their desks because nothing was free.",
              )}
      </p>
    </Panel>
  );
}
