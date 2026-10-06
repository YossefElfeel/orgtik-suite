// How a dashboard figure moved, for the library's Stat: the API sends growth as a percent (12.5)
// and the period it compares with ("month"). With nothing in the previous period there's nothing
// to compare, so no change is shown (the API reports +100%, which read as a real trend).
import type { StatChange } from "@orgtik/ui";
import type { ReactNode } from "react";

export type Growth = {
  currentPeriod: number;
  previousPeriod: number;
  growthPercent: number;
  comparisonPeriod?: string;
};

export function growthChange(metric: Growth | null | undefined, against: ReactNode): StatChange | undefined {
  if (!metric || !metric.previousPeriod) return undefined;
  return { value: (metric.growthPercent ?? 0) / 100, against };
}

/** The comparison period's key in SalesHome.against (month is the API's default). */
export const periodKey = (period: string | undefined) => (period === "week" ? "week" : "month");
