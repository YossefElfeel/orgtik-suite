// The deal builder's price preview, from the API's own numbers.
// - A standard plan's price for a duration and its installment terms come priced from the API
//   (`resolvedPrice` on /plans?countryCode=…), in the zone and currency of the customer's country.
// - A custom plan is its features' monthly prices in that zone (`resolvedPrice` on /features),
//   times the months, less the API's duration discount, plus the API's installment markup: the
//   same rule the API prices it with.
// - VAT is a percent of the net (14 means 14%), never the raw rate times the amount (SAL-012).
// - A line that keeps its agreed price (an edit) shows that price, not today's catalog (SAL-010).
// Nothing here comes from local fixtures (SAL-013, SAL-022). The API prices the deal again when it
// is saved; the saved offer or contract is the record.
import { num, roundMoney } from "@/lib/deals/format";
import type { CatalogDurationPrice, DealCatalogFeature, DealCatalogPlan, DealDuration, DealPayment } from "@/types/projects";

export type PricedLine = {
  key: string;
  name: string;
  isCustom: boolean;
  months: number;
  discountPercent: number;
  payment: DealPayment;
  installmentMonths: number | null;
  markupPercent: number;
  /** After the duration discount, before the markup. */
  total: number;
  markup: number;
  payable: number;
  monthlyInstallment: number | null;
  /** True when the line keeps the price it was agreed at. */
  kept: boolean;
};

export type DealTotals = {
  currency: string;
  subtotal: number;
  markup: number;
  net: number;
  vatRate: number;
  vat: number;
  total: number;
  cash: number;
  installments: number;
  monthly: number;
};

/** The priced durations of a plan, by duration id. Empty when the plan isn't sold in the zone. */
export const planDurations = (plan: DealCatalogPlan | undefined): CatalogDurationPrice[] => plan?.resolvedPrice ?? [];

export function line({
  key,
  name,
  isCustom,
  months,
  discountPercent,
  listTotal,
  keptTotal,
  payment,
  installmentMonths,
  markupPercent,
  currency,
}: {
  key: string;
  name: string;
  isCustom: boolean;
  months: number;
  discountPercent: number;
  listTotal: number;
  keptTotal?: number | null;
  payment: DealPayment;
  installmentMonths: number | null;
  markupPercent: number;
  currency: string;
}): PricedLine {
  const kept = keptTotal != null && keptTotal > 0;
  const total = roundMoney(kept ? keptTotal : listTotal, currency);
  const onTerms = payment === "installment" && installmentMonths != null;
  const markup = onTerms ? roundMoney((total * markupPercent) / 100, currency) : 0;
  const payable = roundMoney(total + markup, currency);
  return {
    key,
    name,
    isCustom,
    months,
    discountPercent,
    payment: onTerms ? "installment" : "cash",
    installmentMonths: onTerms ? installmentMonths : null,
    markupPercent: onTerms ? markupPercent : 0,
    total,
    markup,
    payable,
    monthlyInstallment: onTerms && installmentMonths ? roundMoney(payable / installmentMonths, currency) : null,
    kept,
  };
}

/** A custom plan's list total for a duration: the features' monthly prices × months, less the discount. */
export function customListTotal(features: DealCatalogFeature[], duration: DealDuration, currency: string) {
  const monthly = features.reduce((sum, f) => sum + num(f.resolvedPrice?.price), 0);
  const undiscounted = monthly * duration.months;
  return roundMoney(undiscounted - (undiscounted * num(duration.percentage)) / 100, currency);
}

export function totals(lines: PricedLine[], currency: string, vatRate: number): DealTotals {
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.total, 0), currency);
  const markup = roundMoney(lines.reduce((s, l) => s + l.markup, 0), currency);
  const net = roundMoney(subtotal + markup, currency);
  const vat = roundMoney((net * vatRate) / 100, currency);
  return {
    currency,
    subtotal,
    markup,
    net,
    vatRate,
    vat,
    total: roundMoney(net + vat, currency),
    cash: roundMoney(lines.filter((l) => l.payment === "cash").reduce((s, l) => s + l.total, 0), currency),
    installments: roundMoney(lines.filter((l) => l.payment === "installment").reduce((s, l) => s + l.payable, 0), currency),
    monthly: roundMoney(lines.reduce((s, l) => s + (l.monthlyInstallment ?? 0), 0), currency),
  };
}

/** Catalog text in the reader's language (admins and managers get the stored map). */
export function catalogText(value: string | Record<string, string> | null | undefined, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || Object.values(value).find(Boolean) || "";
}
