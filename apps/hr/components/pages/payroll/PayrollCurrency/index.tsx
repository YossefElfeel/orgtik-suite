"use client";

// The currency of the run on screen (FS-HR-7): the table's money cells read it, so a run in EGP
// isn't shown as CHF. The page provides it around the table.
import { createContext, useContext } from "react";

const PayrollCurrencyContext = createContext<string | null>(null);

export const PayrollCurrencyProvider = PayrollCurrencyContext.Provider;

export function usePayrollCurrency(): string | null {
  return useContext(PayrollCurrencyContext);
}
