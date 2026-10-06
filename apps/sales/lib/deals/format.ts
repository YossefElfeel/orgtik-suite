"use client";

// Money, percents and dates for offers and projects, in the reader's language (FS-SAL-11).
// - Money is always in the record's own currency, with that currency's decimals (no "JPY .00").
// - The API sends money as decimal strings; `num` reads them.
// - Dates are shown in the organisation's time zone.
// It replaces lib/offers, lib/project-details and the en-US formatters they used (SAL-104, SAL-105).
import { useMemo } from "react";
import { useFormatter } from "@orgtik/ui";

export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";

/** A decimal string or number from the API, as a number (0 when missing). */
export const num = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** The minor units of a currency: CHF 2, KWD 3, JPY 0. */
export const minorUnits = (currency: string) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

/** Rounds to the currency's minor units, as the API does. */
export const roundMoney = (amount: number, currency: string) => {
  const f = 10 ** minorUnits(currency);
  return Math.round((amount + Number.EPSILON) * f) / f;
};

export function useDealFormat() {
  const f = useFormatter();
  return useMemo(
    () => ({
      money: (amount: string | number | null | undefined, currency: string | null | undefined) =>
        currency ? f.money(num(amount), currency) : f.number(num(amount), { maximumFractionDigits: 2 }),
      /** Percent points (14 means 14%). */
      percent: (points: string | number | null | undefined, digits = 2) => f.percent(num(points) / 100, digits),
      number: (n: number) => f.number(n),
      date: (iso: string | null | undefined) => (iso ? f.date(iso, { dateStyle: "medium", timeZone: ORG_TIME_ZONE }) : ""),
      dateTime: (iso: string | null | undefined) => (iso ? f.date(iso, { dateStyle: "medium", timeStyle: "short", timeZone: ORG_TIME_ZONE }) : ""),
      bytes: (n: number) => f.bytes(n),
    }),
    [f],
  );
}
