"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - CHART PRIMITIVES
 *
 * Three forms, each one job:
 *
 *   LinesChart  - change over time. One accent series; an optional muted
 *                 series for the period before. Never two axes: two measures
 *                 of different scale get two charts side by side.
 *   RankedBars  - magnitude across a handful of named things, with the
 *                 value at the tip instead of an axis.
 *   Meter       - one ratio against a limit or a target.
 *
 * The rules they share: thin marks, hairline solid gridlines, text in text
 * tokens (never the series colour), a hover layer that never gates a value,
 * and keyboard focus that shows the same readout as hover.
 */

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ lines */

export interface LineSeries {
  id: string;
  label: string;
  values: number[];
  tone: "accent" | "muted";
}

export function LinesChart({
  series,
  labels,
  format,
  ariaLabel,
  height = 180,
}: {
  series: LineSeries[];
  labels: string[];
  format: (v: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = labels.length;
  const PAD = { top: 14, right: 14, bottom: 24, left: 38 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const all = series.flatMap((s) => s.values);
  const rawMax = Math.max(1, ...all);
  const max = niceCeil(rawMax);
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const xy = (i: number, v: number): [number, number] => [PAD.left + i * step, PAD.top + plotH - (v / max) * plotH];

  const pathOf = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${xy(i, v)[0].toFixed(1)},${xy(i, v)[1].toFixed(1)}`).join(" ");

  const accent = series.find((s) => s.tone === "accent");
  const shown = hover ?? n - 1;
  /* Label every k-th tick so labels never collide on a narrow card. */
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 54))));
  const ticks = [0, max / 2, max];

  return (
    <div ref={wrapRef} className="relative">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width={W}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className={"ch-display-2a1b75"+' '+"ch-max-width-27aeb6"}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => {
          const [, y] = xy(0, v);
          return (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--color-hairline)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")} >
                {compact(v)}
              </text>
            </g>
          );
        })}

        {accent && n > 1 && (
          <path d={`${pathOf(accent.values)} L${xy(n - 1, 0)[0]},${PAD.top + plotH} L${PAD.left},${PAD.top + plotH} Z`} fill="var(--color-scale-wash)" />
        )}
        {series
          .filter((s) => s.tone === "muted")
          .map((s) => (
            <path key={s.id} d={pathOf(s.values)} fill="none" stroke="var(--color-paper-500)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        {accent && <path d={pathOf(accent.values)} fill="none" stroke="var(--color-bar)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {/* The crosshair finds the X; the reader aims at a day, not a line. */}
        {hover !== null && (
          <line x1={xy(hover, 0)[0]} x2={xy(hover, 0)[0]} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--color-hairline-strong)" strokeWidth={1} />
        )}
        {series.map((s) => {
          const v = s.values[shown];
          if (v === undefined) return null;
          const [x, y] = xy(shown, v);
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={4}
              fill={s.tone === "accent" ? "var(--color-bar)" : "var(--color-paper-500)"}
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
          );
        })}

        {labels.map((l, i) => {
          if (i % every !== 0 && i !== n - 1) return null;
          const [x] = xy(i, 0);
          return (
            <text
              key={`${l}-${i}`}
              x={x}
              y={height - 7}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")}

            >
              {l}
            </text>
          );
        })}

        {labels.map((l, i) => {
          const [x] = xy(i, 0);
          return (
            <rect
              key={`hit-${i}`}
              x={x - step / 2}
              y={0}
              width={Math.max(step, 8)}
              height={height}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${l}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={"ch-cursor-2a9295"}
            />
          );
        })}
      </svg>

      {/* One tooltip, every series. Values lead, labels follow. */}
      {hover !== null && (
        <div
          aria-hidden="true"
          className={("pointer-events-none absolute z-10 px-2.5 py-2 "+("ch-top-0d4406"+' '+"ch-min-width-b62dc2"+' '+"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-box-shadow-85f924"+' '+"ch-font-size-b9bb0f"))+" "+(geometryClass({left:Math.min(Math.max(xy(hover, 0)[0] - 60, 0), W - 140)}))}

        >
          <p className={"font-medium "+("ch-color-7f7330")} >
            {labels[hover]}
          </p>
          {series.map((s) => (
            <p key={s.id} className="mt-0.5 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={"ch-width-5e26c9"+' '+"ch-height-32ec1b"+' '+(s.tone === "accent"?"ch-background-82a08c":"ch-background-e9b63d")+' '+"ch-display-60e32d"}
              />
              <span className={"tabular font-semibold "+("ch-color-7f7330")} >
                {format(s.values[hover] ?? 0)}
              </span>
              <span className={"ch-color-4a0211"} >{s.label}</span>
            </p>
          ))}
        </div>
      )}

      {series.length > 1 && (
        <ul className={"mt-1 flex flex-wrap gap-x-4 gap-y-1 text-caption "+("ch-color-4a0211")} >
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={"ch-width-fbf353"+' '+"ch-height-32ec1b"+' '+(s.tone === "accent"?"ch-background-82a08c":"ch-background-e9b63d")+' '+"ch-display-60e32d"}  />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function niceCeil(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v));
  const norm = v / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

function compact(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/* ------------------------------------------------------------- ranked bars */

export function RankedBars({
  rows,
  format,
  emphasis,
}: {
  rows: { id: string; label: string; value: number; meta?: string }[];
  format: (v: number) => string;
  /** One row in the accent, the rest quiet: for when one is the point. */
  emphasis?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => {
        const quiet = emphasis !== undefined && emphasis !== r.id;
        return (
          <li key={r.id} className="flex items-center gap-3">
            <span className={"w-[112px] shrink-0 truncate text-body-sm "+("ch-color-7f7330")}  title={r.label}>
              <bdi>{r.label}</bdi>
            </span>
            <span className={"h-[10px] min-w-0 flex-1 "+("ch-background-5d6e34"+' '+"ch-border-radius-189003")} >
              <span
                className={("block h-full w-full origin-left rtl:origin-right "+((quiet?"ch-background-e9b63d":"ch-background-82a08c")+' '+"ch-border-radius-189003"+' '+"ch-transition-a79bda"))+" "+(geometryClass({transform:`scaleX(${r.value / max})`}))}

              />
            </span>
            <span className={"tabular w-[96px] shrink-0 text-end text-caption "+("ch-color-4a0211")} >
              {format(r.value)}
              {r.meta && <span className={"ch-color-094083"} > · {r.meta}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ meter */

export function Meter({
  label,
  value,
  target,
  caption,
}: {
  label: string;
  /** 0 to 1. */
  value: number;
  /** 0 to 1: a target drawn as a tick, named in the caption. */
  target?: number;
  caption: string;
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={"text-body-sm font-medium "+("ch-color-7f7330")} >
          {label}
        </span>
        <span className={"tabular text-body-sm font-semibold "+("ch-color-7f7330")} >
          {Math.round(pct)}%
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={"relative mt-1.5 "+("ch-height-6a8e05"+' '+"ch-background-5d6e34"+' '+"ch-border-radius-189003")}

      >
        <div className={("ch-height-622640"+' '+"ch-background-82a08c"+' '+"ch-border-radius-189003")+" "+(geometryClass({width:`${pct}%`}))}  />
        {target !== undefined && (
          <span
            aria-hidden="true"
            className={("absolute top-[-3px] "+("ch-width-208c98"+' '+"ch-height-30de4a"+' '+"ch-background-c5a814"+' '+"ch-border-radius-edd97e"))+" "+(geometryClass({left:`${target * 100}%`}))}

          />
        )}
      </div>
      <p className={"mt-1.5 text-caption "+("ch-color-4a0211")} >
        {caption}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- columns */

/**
 * Magnitude across a few ordered categories - the days of a week. Columns
 * no wider than 24px, a 4px rounded cap, square at the baseline; hairline
 * gridlines; the value in a tooltip on hover and on focus. Drawn here so the
 * page does not carry a charting library for one chart.
 */
export function Columns({
  data,
  format,
  ariaLabel,
  height = 190,
}: {
  data: { label: string; value: number }[];
  format: (v: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(480);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setW(Math.max(240, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PAD = { top: 12, right: 8, bottom: 22, left: 38 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const max = niceCeil(Math.max(1, ...data.map((d) => d.value)));
  const slot = data.length ? plotW / data.length : plotW;
  const barW = Math.min(24, slot * 0.6);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  return (
    <div ref={wrapRef} className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} width={W} height={height} role="img" aria-label={ariaLabel} className={"ch-display-2a1b75"+' '+"ch-max-width-27aeb6"}  onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--color-hairline)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(v) + 3} textAnchor="end" className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")} >
              {compact(v)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const top = y(d.value);
          const h = Math.max(0, PAD.top + plotH - top);
          const r = Math.min(4, h);
          const quiet = d.value === 0;
          return (
            <g key={d.label}>
              {/* Rounded at the data end only, square at the baseline. */}
              <path
                d={quiet ? `M${x},${PAD.top + plotH - 2} h${barW} v2 h-${barW} z` : `M${x},${top + r} a${r},${r} 0 0 1 ${r},-${r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} h-${barW} z`}
                fill={quiet ? "var(--color-bar-zero)" : hover === i ? "var(--color-scale-3)" : "var(--color-bar)"}
              />
              <text x={x + barW / 2} y={height - 7} textAnchor="middle" className={"tabular "+("ch-font-size-dc3e3c"+' '+"ch-fill-897b87")} >
                {d.label}
              </text>
              <rect
                x={PAD.left + i * slot}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${format(d.value)}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={"ch-cursor-2a9295"}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          aria-hidden="true"
          className={("pointer-events-none absolute z-10 px-2.5 py-1.5 "+("ch-top-0d4406"+' '+"ch-min-width-e79a03"+' '+"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-box-shadow-85f924"+' '+"ch-font-size-b9bb0f"))+" "+(geometryClass({left:Math.min(Math.max(PAD.left + hover * slot + slot / 2 - 50, 0), W - 110)}))}

        >
          <span className={"tabular font-semibold "+("ch-color-7f7330")} >
            {format(data[hover].value)}
          </span>
          <span className={"ch-color-4a0211"} > {data[hover].label}</span>
        </div>
      )}
    </div>
  );
}
