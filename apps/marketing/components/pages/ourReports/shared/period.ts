"use client";

// The report period, kept in the URL (?from=2026-09-01&to=2026-09-30) so a reload or a shared link
// shows the same days. The days are calendar days in the project's time zone and go to the API as
// they are: the old filter sent `new Date(day).toISOString()` for both ends, i.e. UTC midnight,
// which drops the last day and shifts the period by the reader's offset (MKT-065).
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { dayInZone, useProjectContext } from "@/lib/project-context";
import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";

export type DayRange = { start: string; end: string };
export type PeriodPreset = "last7" | "last30" | "last90" | "thisMonth" | "lastMonth" | "custom";

const DAY = 864e5;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const isDay = (v: string | null | undefined): v is string => !!v && ISO_DAY.test(v) && !Number.isNaN(toUtc(v));
export const addDays = (d: string, n: number) => new Date(toUtc(d) + n * DAY).toISOString().slice(0, 10);
/** Days in the range, both ends included. */
export const daysIn = (r: DayRange) => Math.round((toUtc(r.end) - toUtc(r.start)) / DAY) + 1;

export function presetRange(preset: Exclude<PeriodPreset, "custom">, today: string): DayRange {
  switch (preset) {
    case "last7":
      return { start: addDays(today, -6), end: today };
    case "last90":
      return { start: addDays(today, -89), end: today };
    case "thisMonth":
      return { start: `${today.slice(0, 8)}01`, end: today };
    case "lastMonth": {
      const end = addDays(`${today.slice(0, 8)}01`, -1);
      return { start: `${end.slice(0, 8)}01`, end };
    }
    default:
      return { start: addDays(today, -29), end: today };
  }
}

export const PRESETS: Exclude<PeriodPreset, "custom">[] = ["last7", "last30", "last90", "thisMonth", "lastMonth"];

/** Updates some search params of the current page without a new history entry. */
export function useSearchState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = useCallback(
    (changes: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );
  return { params: sp, set };
}

export function useReportPeriod() {
  const { timeZone } = useProjectContext();
  const { params, set } = useSearchState();
  const today = dayInZone(Date.now(), timeZone);
  const from = params.get("from");
  const to = params.get("to");

  return useMemo(() => {
    const fromUrl = isDay(from) && isDay(to);
    const range: DayRange = fromUrl ? { start: from, end: to } : presetRange("last30", today);
    // The calendar can't pick an end before the start, but a typed or old link can.
    const invalid = range.end < range.start;
    const preset: PeriodPreset = PRESETS.find((p) => {
      const r = presetRange(p, today);
      return r.start === range.start && r.end === range.end;
    }) ?? "custom";
    return {
      range,
      today,
      preset,
      invalid,
      days: invalid ? 0 : daysIn(range),
      /** What the report reads take; null while the period is invalid (nothing is asked for). */
      query: invalid ? null : { periodStart: range.start, periodEnd: range.end },
      setRange: (r: DayRange) => set({ from: r.start, to: r.end }),
      setPreset: (p: PeriodPreset) => {
        if (p === "custom") return;
        const r = presetRange(p, today);
        set({ from: r.start, to: r.end });
      },
      reset: () => set({ from: null, to: null }),
    };
  }, [from, to, today, set]);
}

/**
 * The project the reads are for. They wait for the active project, so a read isn't sent once
 * without it and again with it (the old Overview did), and each project's answers stay apart.
 */
export function useProjectArg() {
  const { data, isLoading } = useGetActiveProjectQuery();
  const id = (data?.data as { id?: string } | undefined)?.id;
  return { ready: !isLoading, projectId: id || undefined };
}
