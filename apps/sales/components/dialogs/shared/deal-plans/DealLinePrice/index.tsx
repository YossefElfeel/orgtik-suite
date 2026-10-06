"use client";

// A deal line's price as it stands: the total after the duration discount, and for installments
// the markup and the monthly payment, all in the deal's currency.
import { useTranslations } from "next-intl";
import { useDealFormat } from "@/lib/deals/format";
import type { PricedLine } from "@/lib/deals/pricing";

export default function DealLinePrice({ priced, currency }: { priced: PricedLine | undefined; currency: string }) {
  const t = useTranslations("Deal");
  const fmt = useDealFormat();
  if (!priced) return <p className="text-body-sm text-fg-muted">{t("linePending")}</p>;
  return (
    <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-line pt-3 text-body-sm">
      <div className="flex items-baseline gap-2">
        <dt className="text-fg-muted">{t("lineTotal")}</dt>
        <dd className="font-semibold text-fg tabular-nums">{fmt.money(priced.total, currency)}</dd>
      </div>
      {priced.payment === "installment" && priced.installmentMonths ? (
        <>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("lineMarkup", { percent: fmt.percent(priced.markupPercent, 2) })}</dt>
            <dd className="text-fg tabular-nums">{fmt.money(priced.markup, currency)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("lineMonthly")}</dt>
            <dd className="text-fg tabular-nums">
              {t("monthlyTimes", { months: priced.installmentMonths, amount: fmt.money(priced.monthlyInstallment ?? 0, currency) })}
            </dd>
          </div>
        </>
      ) : null}
    </dl>
  );
}
