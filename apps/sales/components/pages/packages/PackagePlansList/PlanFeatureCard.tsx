"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import { getFeatureDisplayPrice } from "@/lib/feature-pricing";
import type { PackageDetailPlanFeature } from "@/types/packages";
import { useTranslations } from "next-intl";

type Props = {
  feature: PackageDetailPlanFeature;
};

export default function PlanFeatureCard({ feature }: Props) {
  const tCommon = useTranslations("common");
  const displayPrice = getFeatureDisplayPrice(feature);

  const getPaymentTypeLabel = (type: string) => {
    const upperType = type.toUpperCase();
    switch (upperType) {
      case "INSTALLMENT":
      case "INSTALLMENTS":
        return tCommon("installment");
      case "FULL_PAYMENT":
        return tCommon("fullPayment");
      case "CASH_ONLY":
        return tCommon("cashOnly");
      default:
        return type.replace("_", " ");
    }
  };

  return (
    <div className="flex items-center justify-between rounded-[14px] border border-border p-4 bg-white">
      <div className="flex flex-col gap-1 min-w-0 pr-4">
        <div className="flex items-center gap-2  mb-0.5">
          <span className="text-[14px] font-semibold text-foreground truncate">
            {feature.name}
          </span>
          <Icon icon="solar:check-circle-linear" className="size-4 text-green" />

          {feature.visibility === "public" && (
            <Badge
              variant="outline"
              className="h-[22px] px-2.5 text-[11px] font-medium rounded-md capitalize bg-blue-50/50 text-blue-500 border-blue-100 shadow-none hover:bg-blue-50/50"
            >
              {tCommon("public")}
            </Badge>
          )}

          {feature.paymentType && (
            <Badge
              variant="outline"
              className="h-[22px] px-2.5 text-[11px] font-medium rounded-md capitalize bg-teal-50/50 text-teal-500 border-teal-100 shadow-none hover:bg-teal-50/50"
            >
              {getPaymentTypeLabel(feature.paymentType)}
            </Badge>
          )}
        </div>

        {feature.description && (
          <p className="text-[13px] text-muted-foreground truncate mb-0 font-normal">
            {feature.description}
          </p>
        )}
      </div>

      <div className="shrink-0 pl-2">
        <span className="text-[16px] font-bold text-foreground">
          {displayPrice ? (
            <CurrencyAmount
              amount={displayPrice.amount}
              currency={displayPrice.currencyCode ?? "USD"}
            />
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </span>
      </div>
    </div>
  );
}
