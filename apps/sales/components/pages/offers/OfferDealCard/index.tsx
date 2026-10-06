"use client";

// What the offer contains and what it costs, in the offer's currency. The rows add up: each plan's
// price makes the subtotal, the installment markup is its own row, and VAT is a percent of the net
// (the lines didn't add up when there was a markup, SAL-083). Once a counter is accepted, the
// agreed total is the one that counts (SAL-014).
import { useTranslations } from "next-intl";
import { Badge, Card, CardHeader } from "@orgtik/ui";
import { num, useDealFormat } from "@/lib/deals/format";
import { agreedTotal } from "@/lib/deals/offer";
import { isInstallment } from "@/types/projects";
import type { OfferDetail } from "@/types/offers";

export default function OfferDealCard({ offer }: { offer: OfferDetail }) {
  const t = useTranslations("Offers");
  const td = useTranslations("Deal");
  const fmt = useDealFormat();
  const s = offer.summary;
  const cur = offer.currencyCode;
  const agreed = agreedTotal(offer);
  const quote = num(s.total);
  const counterOpen = offer.status === "countered" && offer.counterTotal != null;
  const row = (label: string, value: string, strong = false) => (
    <div className={strong ? "flex items-baseline justify-between gap-4 border-t border-line pt-2 text-body font-semibold text-fg" : "flex items-baseline justify-between gap-4 text-body-sm"}>
      <dt className={strong ? undefined : "text-fg-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("dealTitle")} description={t("plansCount", { count: s.lines.length })} />
      <ul className="flex flex-col divide-y divide-line">
        {s.lines.map((l, i) => (
          <li key={`${l.planId}-${i}`} className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <div className="flex min-w-0 flex-col gap-1">
              <span dir="auto" className="text-body font-semibold text-fg">
                {l.customLabel || l.planName}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-body-sm text-fg-muted">
                <Badge tone={l.isCustom ? "brand" : "neutral"} size="sm">
                  {l.isCustom ? td("customBadge") : td("standardBadge")}
                </Badge>
                {td("monthsCount", { months: l.durationMonths })}
                {num(l.discountPercentage) ? ` · ${td("discountOff", { discount: fmt.percent(l.discountPercentage, 0) })}` : ""}
              </span>
              <span className="text-body-sm text-fg-muted">
                {isInstallment(l.paymentMethod) && l.installmentMonths
                  ? td("monthlyTimes", { months: l.installmentMonths, amount: fmt.money(l.installmentMonthlyAmount, cur) })
                  : td("payUpfront")}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end text-body tabular-nums text-fg">
              {fmt.money(l.total, cur)}
              {num(l.installmentMarkupAmount) ? (
                <span className="text-caption text-fg-muted">{td("plusMarkup", { amount: fmt.money(l.installmentMarkupAmount, cur) })}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2">
        {row(td("subtotal"), fmt.money(s.subtotal, cur))}
        {num(s.installmentMarkupTotal) ? row(td("markupTotal"), fmt.money(s.installmentMarkupTotal, cur)) : null}
        {num(s.discountAmount) ? row(t("discount"), `−${fmt.money(s.discountAmount, cur)}`) : null}
        {row(td("net"), fmt.money(s.netAmount, cur))}
        {row(num(s.vatRate) ? t("vatRate", { rate: fmt.percent(s.vatRate, 2) }) : td("vatNone"), fmt.money(s.vatAmount, cur))}
        {row(offer.status === "accepted" && agreed !== quote ? t("quotedTotal") : td("total"), fmt.money(quote, cur), !(offer.status === "accepted" && agreed !== quote) && !counterOpen)}
        {counterOpen ? row(t("counterOnTable"), fmt.money(offer.counterTotal, cur), true) : null}
        {offer.status === "accepted" && agreed !== quote ? row(t("agreedTotal"), fmt.money(agreed, cur), true) : null}
      </dl>
      {offer.noteToCustomer ? (
        <div className="flex flex-col gap-1 rounded-field bg-sunken px-3 py-2">
          <span className="text-caption text-fg-muted">{t("noteToCustomer")}</span>
          <p dir="auto" className="text-body-sm whitespace-pre-line text-fg">
            {offer.noteToCustomer}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
