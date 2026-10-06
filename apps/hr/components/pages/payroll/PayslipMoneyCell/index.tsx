"use client";

// A payslip's net pay (My payslips, an employee's Payslips section): in the payslip's own currency,
// in the reader's language. It replaced two copies that formatted in US English and wrote "CHF"
// when the payslip had no currency.
import { useFormatter } from "next-intl";
import type { PayslipMoneyCellProps } from "@/types/payroll";

export function PayslipMoneyCell({ value, currency }: PayslipMoneyCellProps) {
  const format = useFormatter();
  const abs = Math.abs(value);
  const code = (typeof currency === "string" ? currency : currency?.code)?.toUpperCase();
  if (code && /^[A-Z]{3}$/.test(code)) {
    return <span className="tabular-nums">{format.number(abs, { style: "currency", currency: code })}</span>;
  }
  const symbol = typeof currency === "string" ? currency : currency?.symbol;
  const text = format.number(abs, { maximumFractionDigits: 2 });
  return <span className="tabular-nums">{symbol ? `${text} ${symbol}` : text}</span>;
}
