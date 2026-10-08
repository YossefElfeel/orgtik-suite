"use client";

// Money, dates and payout sums for the team screens (salespeople, commissions, loyalty, profile,
// user management). The old helpers formatted in "en-US" with the browser's zone; these go
// through the library's useFormatter in the reader's language, with the record's own currency and
// the organisation's time zone. Candidate for a shared app formatter once the other areas have one.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormatter } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Commission } from "@/types/commissions";

const PAGE_SIZES = [10];

/**
 * A list's filters, tab and page in the address, so a reload or a shared link keeps them. Changing
 * anything but the page goes back to page 1. `prefix` keeps two lists on one page apart.
 */
export function useUrlState(prefix = "") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = useCallback((k: string) => `${prefix}${k}`, [prefix]);
  const get = useCallback((k: string) => params.get(key(k)) ?? "", [params, key]);
  const page = Math.max(1, Number(params.get(key("page"))) || 1);
  const sizeParam = Number(params.get(key("size")));
  const size = PAGE_SIZES.includes(sizeParam) ? sizeParam : PAGE_SIZES[0];
  const set = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const sp = new URLSearchParams(params.toString());
      let resetPage = false;
      for (const [k, v] of Object.entries(next)) {
        if (k !== "page") resetPage = true;
        const value = v === null || v === undefined || v === "" || (k === "size" && Number(v) === PAGE_SIZES[0]) || (k === "page" && Number(v) <= 1) ? null : String(v);
        if (value === null) sp.delete(key(k));
        else sp.set(key(k), value);
      }
      if (resetPage && !("page" in next)) sp.delete(key("page"));
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, router, pathname, key],
  );
  return { get, set, page, size, pageSizes: PAGE_SIZES };
}

/** A search box that writes to the address after a short pause, and follows the address back. */
export function useSearchText(committed: string, commit: (value: string) => void) {
  const [text, setText] = useState(committed);
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(() => setText(committed), [committed]);
  useEffect(() => {
    if (text.trim() === committed) return;
    const id = setTimeout(() => commitRef.current(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text, committed]);
  return [text, setText] as const;
}

/** The HTTP status of a failed query, for the no-access and not-found states. */
export const errorStatus = (error: unknown): number | undefined => {
  const s = (error as { status?: unknown } | undefined)?.status;
  return typeof s === "number" ? s : undefined;
};

/** Dates are shown in the organisation's time zone, not the browser's. */
export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";

/** The API sends money as numbers or as strings ("1250.00"). */
export function toAmount(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Some salesman endpoints send money already written out in English ("EGP 12,345.00"). Read the
 * number back, so it can be written in the reader's language with the record's currency.
 */
export function amountFromText(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  return toAmount(cleaned);
}

/** Still to pay on a commission: amount − paid (never below zero). */
export function commissionDue(c: Pick<Commission, "amount" | "paidAmount" | "dueAmount">): number {
  const due = c.dueAmount !== undefined && c.dueAmount !== null && c.dueAmount !== "" ? toAmount(c.dueAmount) : toAmount(c.amount) - toAmount(c.paidAmount);
  return Math.max(0, Math.round(due * 1000) / 1000);
}

export const isPercentCommission = (c: Pick<Commission, "commissionMode">) => c.commissionMode === "percentage";

/** Looks like a card number (12–19 digits): never stored as a payment reference (SAL-020). */
export const looksLikeCardNumber = (value: string) => /^\d{12,19}$/.test(value.replace(/[\s-]/g, ""));

/** Formatters in the reader's language; dates in the organisation's time zone. */
export function useTeamFormat() {
  const f = useFormatter();
  return useMemo(() => {
    const money = (amount: string | number | null | undefined, currency: string | null | undefined) => {
      const n = toAmount(amount);
      try {
        return currency ? f.money(n, currency) : f.number(n, { maximumFractionDigits: 2 });
      } catch {
        return f.number(n, { maximumFractionDigits: 2 });
      }
    };
    const valid = (d: string | number | Date | null | undefined) => d !== null && d !== undefined && d !== "" && !Number.isNaN(new Date(d).getTime());
    return {
      money,
      number: (n: number, options?: Intl.NumberFormatOptions) => f.number(n, options),
      /** A rate in points (8 means 8%). */
      percent: (points: string | number) => f.percent(toAmount(points) / 100, 2),
      /** A reward's or coupon's discount: a percentage, or money in the programme's currency. */
      discount: (type: string, value: string | number, currency: string | null | undefined) =>
        type === "percentage" ? f.percent(toAmount(value) / 100, 2) : money(value, currency),
      date: (d: string | number | Date | null | undefined) => (valid(d) ? f.date(d as string, { dateStyle: "medium", timeZone: ORG_TIME_ZONE }) : null),
      dateTime: (d: string | number | Date | null | undefined) =>
        valid(d) ? f.date(d as string, { dateStyle: "medium", timeStyle: "short", timeZone: ORG_TIME_ZONE }) : null,
      /** "Jan 26" style month labels from the API, written in the reader's language. */
      month: (label: string) => {
        const m = /^([A-Za-z]{3})\w*\s+(\d{2,4})$/.exec(label.trim());
        if (!m) return label;
        const idx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[1].toLowerCase());
        if (idx < 0) return label;
        const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
        return f.date(Date.UTC(year, idx, 15), { month: "short", year: "2-digit", timeZone: "UTC" });
      },
    };
  }, [f]);
}
