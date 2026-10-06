"use client";

import { Icon } from "@iconify/react";
import { CheckIcon } from "lucide-react";
import type { PlanListItem } from "@/types/plans";
import { Button } from "@/components/ui/button";
import { PlanStatusCell } from "@/components/pages/plan-management/plan/PlanStatusCell";
import SubscribePlanDialog from "@/components/dialogs/plan-management/SubscribePlanDialog";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { getPrimaryPlanPricing } from "@/lib/plan-pricing";
import { useTranslations } from "next-intl";

function parseAmount(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

type Props = {
  plan: PlanListItem;
  onViewDetails?: (plan: PlanListItem) => void;
  onViewAllFeatures?: (plan: PlanListItem) => void;
};

export default function CustomerPlanCard({
  plan,
  onViewDetails,
  onViewAllFeatures,
}: Props) {
  const pricing = getPrimaryPlanPricing(plan);
  const previewFeatures = plan.features.slice(0, 5);
  const hasInstallment = plan.paymentMode === "installment";
  const durationMonths =
    pricing?.duration.months ??
    plan.minimumDurationMonths ??
    plan.maximumDurationMonths ??
    12;
  
  const t = useTranslations("planManagement");
  const displayText = useCatalogDisplayText();

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-foreground">{displayText(plan.name)}</h3>
            <PlanStatusCell plan={plan} />
          </div>
          <p className="text-sm text-muted-foreground">
            {displayText(plan.category.name)} • {displayText(plan.department.name)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="text-32 font-semibold tracking-tight text-foreground">
              <CurrencyAmount
                amount={pricing?.discountedTotal ?? 0}
                currency={pricing?.currencyCode}
              />
            </span>
            <span className="text-sm text-muted-foreground">
              <CurrencyAmount
                amount={pricing?.effectiveMonthlyPrice ?? 0}
                currency={pricing?.currencyCode}
              />{" "}
              {t("details.perMonth")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {parseAmount(pricing?.undiscountedTotal) >
            parseAmount(pricing?.discountedTotal) ? (
              <span className="text-lg text-muted-foreground line-through">
                <CurrencyAmount
                  amount={pricing?.undiscountedTotal ?? 0}
                  currency={pricing?.currencyCode}
                />
              </span>
            ) : null}
            {parseAmount(pricing?.discountPercentage) > 0 ? (
              <span className="rounded-full bg-red/7 px-2 py-1 text-xs font-semibold text-red">
                {t("details.off", { discount: parseAmount(pricing?.discountPercentage) })}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {t("details.monthPlan", { months: durationMonths })} • {displayText(plan.zones[0]?.name)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {hasInstallment ? (
            <span className="inline-flex h-7 items-center rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-medium text-primary">
              {t("details.installment")}
            </span>
          ) : null}
          <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 text-xs font-medium text-foreground">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary/15 text-[11px] font-semibold">
              {plan.zoneCount}
            </span>
            {t("details.zones")}
          </span>
        </div>

        <SubscribePlanDialog
          plan={plan}
          trigger={<Button className="w-full">{t("actions.subscribe")}</Button>}
        />

        <div className="space-y-3">
          <p className="text-base font-semibold text-foreground">
            {t("details.includes", { count: plan.featureCount })}
          </p>
          <ul className="space-y-2.5">
            {previewFeatures.map((feature) => (
              <li
                key={feature.id}
                className="flex items-start gap-2.5 text-sm text-secondary"
              >
                <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-secondary text-secondary">
                  <CheckIcon className="size-2.5" strokeWidth={3} />
                </span>
                <span>{displayText(feature.name)}</span>
              </li>
            ))}
          </ul>

          {plan.featureCount > previewFeatures.length ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-primary hover:bg-primary/5 hover:text-primary"
              icon="solar:arrow-right-linear"
              iconPosition="end"
              onClick={() => onViewAllFeatures?.(plan)}
            >
              {t("actions.viewAllFeatures", { count: plan.featureCount })}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-center border-t border-border px-5 py-3.5">
        <button
          type="button"
          onClick={() => onViewDetails?.(plan)}
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-foreground"
        >
          <Icon icon="solar:eye-linear" className="size-4" />
          {t("actions.viewFullDetails")}
        </button>
      </div>
    </article>
  );
}
