"use client";

// Shared pieces of the customers area: the pipeline's stages (D-028), sources, age buckets, the
// inbox's filters as they sit in the address, and dates in the organisation's time zone.
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_MATRIX, formatLocale, useFormatter, useOrgtik, type Tone } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Customer, LeadStatus } from "@/types/customers";

/** The organisation's time zone: meetings are set and read in it. */
export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";

/** Open stages first, in the order a lead moves, then the ways out. */
export const LEAD_STAGES: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "won", "lost", "unqualified", "spam", "duplicate"];

export const isLeadStatus = (v: unknown): v is LeadStatus => (LEAD_STAGES as string[]).includes(String(v));

/** An old "scheduled" record reads as contacted: the meeting is an activity now. */
export const leadStatusOf = (v: unknown): LeadStatus => (String(v) === "scheduled" ? "contacted" : isLeadStatus(v) ? v : "new");

export const stageTone = (s: LeadStatus): Tone => ((STATUS_MATRIX.lead as Record<string, { tone: Tone }>)[s]?.tone ?? "neutral");

/** The sources Sales knows by name; anything else the API sends shows as written. */
export const KNOWN_SOURCES = ["website", "manual", "referral", "partner", "event", "import"] as const;
export const sourceOf = (c: Pick<Customer, "source">) => (c.source ? String(c.source) : "manual");

export const AGE_BUCKETS = ["week", "month", "quarter", "older"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];
const DAY = 86_400_000;
export function ageBucketOf(createdAt: string, now = Date.now()): AgeBucket {
  const days = (now - new Date(createdAt).getTime()) / DAY;
  return days <= 7 ? "week" : days <= 30 ? "month" : days <= 90 ? "quarter" : "older";
}

/** The inbox's filters, read from and written to the address, so a reload or a shared link keeps them. */
export type LeadFilters = {
  q: string;
  stages: LeadStatus[];
  source: string | null;
  /** A salesperson's id, or "none" for leads nobody owns yet. */
  owner: string | null;
  age: AgeBucket | null;
  page: number;
  size: number;
};

export const PAGE_SIZES = [10, 25, 50];

export function useLeadFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: LeadFilters = useMemo(() => {
    const age = params.get("age");
    const size = Number(params.get("size"));
    return {
      q: params.get("q") ?? "",
      stages: (params.get("stage") ?? "").split(",").filter(isLeadStatus),
      source: params.get("source") || null,
      owner: params.get("owner") || null,
      age: (AGE_BUCKETS as readonly string[]).includes(age ?? "") ? (age as AgeBucket) : null,
      page: Math.max(1, Number(params.get("page")) || 1),
      size: PAGE_SIZES.includes(size) ? size : PAGE_SIZES[0],
    };
  }, [params]);

  const set = useCallback(
    (next: Partial<LeadFilters>, path?: string) => {
      const sp = new URLSearchParams(params.toString());
      const put = (k: string, v: string | null | undefined) => (v ? sp.set(k, v) : sp.delete(k));
      if (next.q !== undefined) put("q", next.q.trim() || null);
      if (next.stages !== undefined) put("stage", next.stages.join(",") || null);
      if (next.source !== undefined) put("source", next.source);
      if (next.owner !== undefined) put("owner", next.owner);
      if (next.age !== undefined) put("age", next.age);
      if (next.size !== undefined) put("size", next.size === PAGE_SIZES[0] ? null : String(next.size));
      // Any filter change goes back to the first page.
      put("page", next.page && next.page > 1 ? String(next.page) : null);
      const target = path ?? pathname;
      router.replace(`${target}${sp.size ? `?${sp}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const clear = useCallback(() => set({ q: "", stages: [], source: null, owner: null, age: null }), [set]);
  const filtered = Boolean(filters.q || filters.stages.length || filters.source || filters.owner || filters.age);

  /** The same filters on another view (list or pipeline). */
  const hrefFor = useCallback(
    (path: string) => {
      const sp = new URLSearchParams(params.toString());
      sp.delete("page");
      return `${path}${sp.size ? `?${sp}` : ""}`;
    },
    [params],
  );

  return { filters, set, clear, filtered, hrefFor };
}

/** Applies the filters the API doesn't apply yet (source, owner, age, several stages, search). */
export function applyLeadFilters(list: Customer[], f: LeadFilters): Customer[] {
  const q = f.q.trim().toLowerCase();
  const now = Date.now();
  return list.filter((c) => {
    if (f.stages.length && !f.stages.includes(leadStatusOf(c.status))) return false;
    if (f.source && sourceOf(c) !== f.source) return false;
    if (f.owner === "none" ? Boolean(c.assignedSalesmanId) : f.owner && String(c.assignedSalesmanId ?? "") !== f.owner) return false;
    if (f.age && ageBucketOf(c.createdAt, now) !== f.age) return false;
    if (q && ![c.fullName, c.email, c.companyName, c.phoneNumber].some((v) => String(v ?? "").toLowerCase().includes(q))) return false;
    return true;
  });
}

/** Dates and times in the reader's language and the organisation's zone, and "3 days ago". */
export function useCustomerDates() {
  const f = useFormatter();
  const { locale, digits } = useOrgtik();
  return useMemo(() => {
    const valid = (d: string | number | Date | null | undefined) => d != null && d !== "" && !Number.isNaN(new Date(d).getTime());
    const rtf = new Intl.RelativeTimeFormat(formatLocale(locale, digits), { numeric: "auto" });
    return {
      date: (d: string | null | undefined) => (valid(d) ? f.date(d as string, { dateStyle: "medium", timeZone: ORG_TIME_ZONE }) : "—"),
      dateTime: (d: string | null | undefined) =>
        valid(d) ? f.date(d as string, { dateStyle: "full", timeStyle: "short", timeZone: ORG_TIME_ZONE }) : "—",
      shortDateTime: (d: string | null | undefined) =>
        valid(d) ? f.date(d as string, { dateStyle: "medium", timeStyle: "short", timeZone: ORG_TIME_ZONE }) : "—",
      relative: (d: string | null | undefined, now = Date.now()) => {
        if (!valid(d)) return "—";
        const diff = new Date(d as string).getTime() - now;
        const abs = Math.abs(diff);
        if (abs < 60_000) return rtf.format(0, "second");
        if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
        if (abs < DAY) return rtf.format(Math.round(diff / 3_600_000), "hour");
        if (abs < 30 * DAY) return rtf.format(Math.round(diff / DAY), "day");
        if (abs < 365 * DAY) return rtf.format(Math.round(diff / (30 * DAY)), "month");
        return rtf.format(Math.round(diff / (365 * DAY)), "year");
      },
    };
  }, [f, locale, digits]);
}

/** A country's or a language's name in the reader's language (Intl.DisplayNames). */
export function useDisplayNames() {
  const { locale } = useOrgtik();
  return useMemo(() => {
    const make = (type: "region" | "language") => {
      try {
        return new Intl.DisplayNames([locale], { type });
      } catch {
        return null;
      }
    };
    const region = make("region");
    const language = make("language");
    return {
      country: (code: string | null | undefined) => (code ? region?.of(code.toUpperCase()) ?? code.toUpperCase() : "—"),
      language: (code: string | null | undefined) => (code ? language?.of(code) ?? code : "—"),
    };
  }, [locale]);
}
