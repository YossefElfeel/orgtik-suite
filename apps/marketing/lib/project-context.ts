"use client";

// The active project's time zone and currency. Schedules were built as strings with no zone
// (MKT-014, MKT-059) and money was shown in whatever currency a screen guessed (MKT-011): every
// date and amount now reads these. The API sends them per project (wave 5 contract); until it does,
// the organisation's zone and EGP stand in.
import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";

export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";
export const DEFAULT_CURRENCY = "EGP";

export type ProjectContext = { id: string | null; name: string | null; timeZone: string; currency: string };

export function useProjectContext(): ProjectContext {
  const { data } = useGetActiveProjectQuery();
  const p = data?.data as ({ id: string; name: string; timeZone?: string | null; currency?: string | null } | undefined);
  return {
    id: p?.id ?? null,
    name: p?.name ?? null,
    timeZone: p?.timeZone || ORG_TIME_ZONE,
    currency: p?.currency || DEFAULT_CURRENCY,
  };
}

/** The calendar day (YYYY-MM-DD) an instant falls on in a time zone. */
export function dayInZone(instant: string | number | Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
