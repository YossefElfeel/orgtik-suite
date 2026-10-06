"use client";

/**
 * SOMION HQ - STAT TILE AND KPI ROW
 *
 * The headline numbers a dashboard leads with. A stat tile is the right form
 * when the data is a single current value: a one-bar bar chart is the classic
 * way to get this wrong.
 *
 * Three rules that are easy to get subtly wrong and are worth stating:
 *
 *   1. VALUES USE PROPORTIONAL FIGURES. `tabular-nums` gives every digit the
 *      width of a zero, which makes a number like 121 look loose at display
 *      size. Tabular is for columns that align vertically - table rows and axis
 *      ticks - not for a large standalone number.
 *   2. A DELTA IS ONLY SHOWN IF IT IS MEASURED, and it names the period it is
 *      measured against. An arrow with no prior period behind it is decoration
 *      that reads as information.
 *   3. DIRECTION IS NOT SENTIMENT. More hours in meetings is not "good", so the
 *      delta's colour is opt-in per tile rather than assumed from the sign.
 */

import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";

export interface StatProps {
  label: string;
  /** Pre-formatted, so each tile decides its own units. */
  value: string;
  /** Optional supporting line under the value. */
  meta?: string;
  /** Percentage change against the previous period. Omit if not measured. */
  deltaPct?: number;
  /** What the delta is measured against, e.g. "last week". Required with one. */
  deltaAgainst?: string;
  /**
   * Whether a rise is a good thing. Left undefined the delta stays neutral,
   * which is the honest default for a measure with no preferred direction.
   */
  riseIsGood?: boolean;
  /** A short series for a sparkline. Twelve points or fewer reads best. */
  trend?: number[];
  /** Secondary figures sit in a quieter, smaller tile. */
  size?: "md" | "sm";
}

export function Stat({
  label,
  value,
  meta,
  deltaPct,
  deltaAgainst,
  riseIsGood,
  trend,
  size = "md",
}: StatProps) {
  const t = useT();
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  /* Under half a percent either way is "no change", not an arrow pointing
     at a zero. */
  const flat = hasDelta && Math.abs(deltaPct) < 0.5;
  const rising = hasDelta && deltaPct > 0;

  /* Neutral unless the tile says a direction is good. Colouring every delta
     green-up / red-down asserts a preference the data does not carry. */
  const deltaColor =
    !hasDelta || riseIsGood === undefined
      ? "var(--color-ink-muted)"
      : rising === riseIsGood
        ? "var(--color-success-600)"
        : "var(--color-danger-600)";

  return (
    <div
      className={`flex min-w-0 flex-col justify-between ${size === "sm" ? "gap-2 p-3" : "gap-3 p-4"}`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raise), var(--shadow-lit)",
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium" style={{ color: "var(--color-ink-subtle)" }}>
          {label}
        </p>

        <p
          className="mt-1.5 truncate"
          style={{
            /* Proportional figures: see rule 1 above. */
            fontSize: size === "sm" ? 20 : 26,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--color-ink)",
          }}
        >
          {value}
        </p>

        {(hasDelta || meta) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
            {hasDelta && flat && (
              <span className="font-medium" style={{ color: "var(--color-ink-muted)" }}>
                {t("stat.flat", "no change")}
              </span>
            )}
            {hasDelta && !flat && (
              <span className="inline-flex items-center gap-0.5 font-medium" style={{ color: deltaColor }}>
                {rising ? (
                  <ArrowUp size={11} weight="bold" aria-hidden="true" />
                ) : (
                  <ArrowDown size={11} weight="bold" aria-hidden="true" />
                )}
                {/* The sign is carried by the arrow AND the word, never by
                    colour alone. */}
                {Math.abs(deltaPct).toFixed(0)}%
                <span className="sr-only">
                  {rising ? t("stat.up", "up") : t("stat.down", "down")}
                </span>
              </span>
            )}
            {hasDelta && deltaAgainst && (
              <span style={{ color: "var(--color-ink-subtle)" }}>
                {t("stat.against", "vs {period}", { period: deltaAgainst })}
              </span>
            )}
            {meta && <span style={{ color: "var(--color-ink-muted)" }}>{meta}</span>}
          </p>
        )}
      </div>

      {trend && trend.length > 1 && <Sparkline points={trend} />}
    </div>
  );
}

/**
 * A sparkline carries shape, not values. It has no axes and no labels on
 * purpose: the number above it is the value, and the tile's chart twin carries
 * the detail. Marked `aria-hidden` because it adds nothing a screen reader can
 * use that the value and delta have not already said.
 */
function Sparkline({ points }: { points: number[] }) {
  const w = 100;
  const h = 26;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = w / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / span) * (h - 3) - 1.5;
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: h, overflow: "visible" }}
    >
      <path d={area} fill="var(--color-scale-wash)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-scale-1)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* The current period is the one point that gets the accent. */}
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={2.5}
          fill="var(--color-bar)"
          stroke="var(--color-surface)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

/** The row a dashboard opens with. Four tiles is the comfortable ceiling. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
