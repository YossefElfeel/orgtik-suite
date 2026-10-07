"use client";

import { useCallback } from "react";
import { useFormatter } from "next-intl";

/** Employee amounts use the record's currency; an unknown currency never becomes CHF. */
export function useEmployeeMoney() {
  const format = useFormatter();
  return useCallback((amount: number | null | undefined, currency?: string | null) => {
    if (amount == null || !Number.isFinite(amount)) return "—";
    return format.number(amount, currency
      ? { style: "currency", currency }
      : { maximumFractionDigits: 2 });
  }, [format]);
}
