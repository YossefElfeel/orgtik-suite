"use client";

// A deal's totals, each row adding up to the next: subtotal + installment markup = net,
// net + VAT (a percent of the net) = total. Then what is due upfront and what is paid monthly.
import { useTranslations } from "next-intl";
import { useDealFormat } from "@/lib/deals/format";
import type { DealTotals as Totals } from "@/lib/deals/pricing";

export default function DealTotals({ totals, vatCountry }: { totals: Totals; vatCountry: string | null }) {
  const t = useTranslations("Deal");
  const fmt = useDealFormat();
  const cur = totals.currency;
  const row = (label: string, value: string, strong = false) => (
    <div className={strong ? "flex items-baseline justify-between gap-4 border-t border-line pt-2 text-body font-semibold text-fg" : "flex items-baseline justify-between gap-4 text-body-sm"}>
      <dt className={strong ? undefined : "text-fg-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
  return (
    <dl className="flex flex-col gap-2">
      {row(t("subtotal"), fmt.money(totals.subtotal, cur))}
      {totals.markup ? row(t("markupTotal"), fmt.money(totals.markup, cur)) : null}
      {row(t("net"), fmt.money(totals.net, cur))}
      {row(vatCountry ? t("vatRow", { rate: fmt.percent(totals.vatRate, 2), country: vatCountry }) : t("vatNone"), fmt.money(totals.vat, cur))}
      {row(t("total"), fmt.money(totals.total, cur), true)}
      {totals.cash ? row(t("dueUpfront"), fmt.money(totals.cash, cur)) : null}
      {totals.monthly ? row(t("monthlyTotal"), fmt.money(totals.monthly, cur)) : null}
    </dl>
  );
}
