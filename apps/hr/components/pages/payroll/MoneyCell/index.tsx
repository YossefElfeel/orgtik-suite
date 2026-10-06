"use client";

// An amount in a payroll table (FS-HR-7): in the run's currency, in the reader's language. It
// replaced ChfCell, which wrote "CHF" after every number whatever the currency, and "-0".
import { useFormatter } from "next-intl";
import { usePayrollCurrency } from "@/components/pages/payroll/PayrollCurrency";
import type { MoneyCellProps } from "@/types/payroll";

export function MoneyCell({ value, treatAsNegative }: MoneyCellProps) {
  const format = useFormatter();
  const currency = usePayrollCurrency();
  if (value == null) return <span className="text-fg-subtle">—</span>;
  const abs = Math.abs(value);
  const negative = abs > 0 && (treatAsNegative ?? value < 0);
  const text = currency
    ? format.number(abs, { style: "currency", currency, maximumFractionDigits: 2 })
    : format.number(abs, { maximumFractionDigits: 2 });
  return <span className="tabular-nums">{negative ? `−${text}` : text}</span>;
}
