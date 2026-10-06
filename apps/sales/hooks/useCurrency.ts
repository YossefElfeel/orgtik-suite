"use client";

import { useCallback, useMemo } from "react";
import { formatAmount } from "@/lib/format-amount";

/**
 * Formats an amount in an explicit ISO currency code from the API payload.
 */
export function useFormatAmount() {
  return useCallback(
    (amount: number | string, currency: string) =>
      formatAmount(amount, currency || "USD"),
    [],
  );
}

/** Builds an Intl currency formatter for an explicit currency code. */
export function useCurrencyFormatter(options: {
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}) {
  const {
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  } = options;
  const code = currency || "USD";

  return useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        maximumFractionDigits,
        minimumFractionDigits,
      }),
    [code, maximumFractionDigits, minimumFractionDigits],
  );
}
