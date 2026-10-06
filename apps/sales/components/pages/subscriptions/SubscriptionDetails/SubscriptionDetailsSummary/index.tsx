"use client";

import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { useTranslations } from "next-intl";

type Props = {
  subscription: SubscriptionDetailDto;
};

export default function SubscriptionDetailsSummary({ subscription }: Props) {
  const total = Number(subscription.totalAmount);
  const paid = Number(subscription.paidAmount);
  const progress =
    total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const currencyCode = getInvoiceCurrencyCode(
    subscription.invoices.find(
      (invoice) => invoice.currencyCode || invoice.currency,
    ),
  );

  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-primary/10 border border-primary/60 px-5 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-secondary">{tCommon("total")}</span>
          <span className="text-base font-semibold text-foreground">
            {formatAmount(subscription.totalAmount, currencyCode)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-secondary">{tCommon("paid")}</span>
          <span className="text-base font-semibold text-foreground">
            {formatAmount(subscription.paidAmount, currencyCode)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-secondary">{tCommon("remaining")}</span>
          <span className="text-base font-semibold text-foreground">
            {formatAmount(subscription.remainingAmount, currencyCode)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-background px-3 py-2.5">
        <p className="text-xs text-secondary">
          {formatAmount(subscription.paidAmount, currencyCode)} /{" "}
          {formatAmount(subscription.totalAmount, currencyCode)}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
