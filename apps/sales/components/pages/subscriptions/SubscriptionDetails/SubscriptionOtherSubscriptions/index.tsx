"use client";
import { useTranslations } from "next-intl";

import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

type CompanionPortion = {
  id: string;
  title: string;
  badgeLabel: string;
  total: number;
  paidAmount: number;
  currency: string;
  paymentLabel: string;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

type Props = {
  items: CompanionPortion[];
};

export default function SubscriptionOtherSubscriptions({ items }: Props) {
  const tCommon = useTranslations("common");
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-foreground">
        {tCommon("otherSubscriptions")}
      </h3>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-white px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Icon
                  icon="solar:stars-bold"
                  className="size-4 shrink-0 text-primary"
                />
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.title}
                </p>
              </div>
              <Badge variant="ghost-blue" className="min-w-0">
                {item.badgeLabel}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-secondary">{tCommon("total")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatMoney(item.total, item.currency)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-secondary">{tCommon("paid")}</span>
                <span className="text-sm font-semibold text-green">
                  {formatMoney(item.paidAmount, item.currency)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-secondary">{tCommon("payment")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {item.paymentLabel}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-secondary">
                Combined: {formatMoney(item.total, item.currency)} · Paid:{" "}
                {formatMoney(item.paidAmount, item.currency)}
              </p>
              <Link
                href={`/subscriptions/${item.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {tCommon("openThisPortion")}
                <Icon icon="solar:arrow-right-linear" className="size-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
