"use client";

/**
 * SOMION HQ - AVAILABILITY HEATMAP
 *
 * Sequential encoding: ONE hue, light to dark, verified monotonic in relative
 * luminance (0.821 -> 0.077). Never a rainbow, never a hue at the midpoint.
 *
 * The two lightest steps sit below 3:1 against the surface, which is inherent
 * to a sequential ramp and not dismissable. The required relief ships with it:
 * a table view carrying the same numbers, a per-cell value on hover and focus,
 * and a 2px surface gap so cells stay separable regardless of contrast.
 *
 * Team totals only. There is no per-person row and no way to derive one.
 */

import { useMemo, useState } from "react";
import { Table } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { useT } from "@/lib/i18n";
import { dayLabel } from "@/lib/time";
import { PaginatedTable } from "@orgtik/ui/table";

/** The sequential scale. Defined in the token file; never a hex in here. */
const RAMP = [
  "var(--color-scale-1)",
  "var(--color-scale-2)",
  "var(--color-scale-3)",
  "var(--color-scale-4)",
];
const EMPTY = "var(--color-scale-empty)";

/** Working hours only. Twenty-four columns of mostly zero is not information. */
const FIRST_HOUR = 6;
const LAST_HOUR = 20;

export function Heatmap({
  grid,
  cohortSize,
  title,
  body,
}: {
  grid: number[][];
  cohortSize: number;
  /** The default copy speaks of a team; a personal view says so instead. */
  title?: string;
  body?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const [hovered, setHovered] = useState<{ d: number; h: number } | null>(null);
  const t = useT();

  const hours = useMemo(
    () => Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i),
    [],
  );

  const max = useMemo(() => Math.max(1, ...grid.flat()), [grid]);

  const stepFor = (value: number): { bg: string; index: number } => {
    if (value === 0) return { bg: EMPTY, index: 0 };
    const idx = Math.min(RAMP.length - 1, Math.max(0, Math.ceil((value / max) * RAMP.length) - 1));
    return { bg: RAMP[idx] ?? RAMP[0]!, index: idx + 1 };
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <h3 className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
            {title ?? t("insights.availabilityTitle", "When the team is around")}
          </h3>
          <p className={"mt-0.5 text-caption "+("ch-color-4a0211")} >
            {body ??
              t("insights.availabilityBody", "People present at each hour, across the whole team of {n}.", {
                n: cohortSize,
              })}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
          <Table size={13} aria-hidden="true" />
          {showTable ? t("insights.showChart", "Chart") : t("insights.showTable", "Table")}
        </Button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <PaginatedTable><table className={"w-full text-caption "+("ch-border-collapse-454826")} >
            <caption className="sr-only">
              {t("insights.availabilityTitle", "When the team is around")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={"p-1.5 text-start "+("ch-color-4a0211")} >
                  {t("insights.day", "Day")}
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={"tabular p-1.5 text-end "+("ch-color-4a0211"+' '+"ch-font-weight-02a2d3")}

                  >
                    {String(h).padStart(2, "0")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, d) => (
                <tr key={d} className={"ch-border-top-c9ce2a"} >
                  <th scope="row" className={"p-1.5 text-start font-medium "+("ch-color-7f7330")} >
                    {dayLabel(d)}
                  </th>
                  {hours.map((h) => (
                    <td key={h} className={"tabular p-1.5 text-end "+("ch-color-7f7330")} >
                      {row[h] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table></PaginatedTable>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className={"relative "+("ch-min-width-512bf9")} >
            {/* Hour axis, recessive. Every third hour is labelled; a number on
                every column is noise, not information. */}
            <div
              className="flex gap-[2px] ps-[34px]"
              aria-hidden="true"
            >
              {hours.map((h) => (
                <span
                  key={h}
                  className={"tabular flex-1 text-center text-micro "+("ch-color-094083")}

                >
                  {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                </span>
              ))}
            </div>

            {grid.map((row, d) => (
              <div key={d} className="mt-[2px] flex items-center gap-[2px]">
                <span
                  className={"w-[32px] shrink-0 text-micro font-medium "+("ch-color-4a0211")}

                >
                  {dayLabel(d)}
                </span>
                {hours.map((h) => {
                  const value = row[h] ?? 0;
                  const { bg, index } = stepFor(value);
                  return (
                    <span
                      key={h}
                      tabIndex={0}
                      role="img"
                      className={("flex-1 "+("ch-height-ca02a9"+' '+"ch-border-radius-edd97e"+' '+(hovered?.d === d && hovered?.h === h?"ch-outline-c5700c":(index > 0?"ch-outline-153950":"ch-outline-f9b4dc"))+' '+(hovered?.d === d && hovered?.h === h?"ch-outline-offset-1f2868":"ch-outline-offset-ce7a09")))+" "+('ch-heat-'+index)}
                      onMouseEnter={() => setHovered({ d, h })}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered({ d, h })}
                      onBlur={() => setHovered(null)}
                      aria-label={t("insights.cellTitle", "{day} {hour}:00 — {n} of {total} people", {
                        day: dayLabel(d),
                        hour: String(h).padStart(2, "0"),
                        n: value,
                        total: cohortSize,
                      })}

                    />
                  );
                })}
              </div>
            ))}

            {/* The hover readout. Held in the flow above the legend rather
                than floated over the grid: a tooltip that covers the cells it
                describes is worse than one that does not move. */}
            <div className="mt-2.5 h-[18px]" aria-hidden="true">
              {hovered && (
                <p className={"text-caption "+("ch-color-7f7330")} >
                  <span className="font-medium">{dayLabel(hovered.d)}</span>
                  <span className={"tabular "+("ch-color-4a0211")} >
                    {" "}
                    {String(hovered.h).padStart(2, "0")}:00
                  </span>
                  <span className={"ch-color-4a0211"} > · </span>
                  <span className="font-medium">
                    {t("insights.cellPeople", "{n} of {total} people", {
                      n: grid[hovered.d]?.[hovered.h] ?? 0,
                      total: cohortSize,
                    })}
                  </span>
                </p>
              )}
            </div>

            {/* Legend with real numbers, not just a gradient bar. */}
            <div className="mt-1 flex items-center gap-2">
              <span className={"text-micro "+("ch-color-094083")} >
                {t("insights.nobody", "nobody")}
              </span>
              <span className="flex gap-[2px]">
                <span className={"ch-width-7375d5"+' '+"ch-height-b9986b"+' '+"ch-background-1f1dc1"+' '+"ch-border-radius-edd97e"}  />
                {RAMP.map((c) => (
                  <span key={c} className={("ch-width-7375d5"+' '+"ch-height-b9986b"+' '+"ch-border-radius-edd97e")+" "+('ch-heat-'+(RAMP.indexOf(c)+1))}  />
                ))}
              </span>
              <span className={"tabular text-micro "+("ch-color-094083")} >
                {t("insights.upTo", "up to {n}", { n: max })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
