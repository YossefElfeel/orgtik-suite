"use client";
import { useCallback } from "react";
import { useFormatter } from "next-intl";
import { rangeText } from "@/lib/date-range";

const day = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * A payroll run's period in the reader's language ("Sep 1 – 15, 2026", "1–15 sept. 2026"). The API's
 * own run title is English, so it is only the fallback when the dates are missing.
 */
export function useRunPeriod() {
  const format = useFormatter();
  return useCallback(
    (run: { periodStart?: string | null; periodEnd?: string | null; title?: string | null }, fallback = "") => {
      const start = day(run.periodStart);
      const end = day(run.periodEnd);
      if (!start || !end) return run.title || fallback;
      return rangeText(format.dateTimeRange(start, end, { day: "numeric", month: "short", year: "numeric" }));
    },
    [format],
  );
}
