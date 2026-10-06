"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { CheckIcon } from "lucide-react";
import type { PlanListItem } from "@/types/plans";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import { PlanStatusCell } from "@/components/pages/plan-management/plan/PlanStatusCell";
import { PlanManagement } from "@/components/pages/plan-management/plan/PlanManagement";
import { Switch } from "@/components/ui/switch";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import {
  useDeletePlanMutation,
  useTogglePlanPrivateMutation,
} from "@/redux/features/plans/plansApi";
import { useTranslations } from "next-intl";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import ZoneMoneyStack from "@/components/shared/ZoneMoneyStack";
import type { ZoneMoneyGroup } from "@/types/money";
import {
  getPrimaryDurationZonePricing,
  getPrimaryPlanPricing,
} from "@/lib/plan-pricing";

function parseAmount(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

type Props = {
  plan: PlanListItem;
  onViewDetails?: (plan: PlanListItem) => void;
};

export default function PlanManagementCard({
  plan,
  onViewDetails,
}: Props) {
  const [isPrivate, setIsPrivate] = useState(plan.isPrivate);
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();
  const [togglePrivate, { isLoading: isTogglingPrivate }] =
    useTogglePlanPrivateMutation();
  const t = useTranslations("planManagement");
  const tCommon = useTranslations("common");
  const displayText = useCatalogDisplayText();
  const planName = displayText(plan.name);

  const pricing = getPrimaryPlanPricing(plan);
  const zonePricing = getPrimaryDurationZonePricing(plan);
  const hasMultipleZones = zonePricing.length > 1;
  const zoneMoneyGroups: ZoneMoneyGroup[] = zonePricing.map((entry) => ({
    zoneId: entry.zoneId,
    zoneName: entry.zoneName,
    currencyCode: entry.currencyCode,
    amount: entry.discountedTotal,
  }));
  const previewFeatures = plan.features.slice(0, 5);
  const hasInstallment = plan.paymentMode === "installment";
  const durationMonths =
    pricing?.duration.months ??
    plan.minimumDurationMonths ??
    plan.maximumDurationMonths ??
    12;

  const handlePrivateChange = async (checked: boolean) => {
    if (checked === plan.isPrivate) return;

    setIsPrivate(checked);
    try {
      await togglePrivate(plan.id).unwrap();
    } catch {
      setIsPrivate(plan.isPrivate);
    }
  };

  const handleDelete = async () => {
    await deletePlan(plan.id).unwrap();
  };

  const { isSalesman } = useRole();
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white ">
      <div className="flex flex-1 flex-col gap-5 p-4">
        <div className="space-y-1">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-18 font-semibold ">{planName}</h3>
            <PlanStatusCell plan={plan} />
          </div>
          <p className="text-sm text-muted-foreground">
            {(plan.categories?.length
              ? plan.categories.map((category) => displayText(category.name)).join(", ")
              : displayText(plan.category.name))}{" "}
            • {displayText(plan.department.name)}
          </p>
        </div>

        <div className="space-y-1">
          {hasMultipleZones ? (
            <ZoneMoneyStack
              groups={zoneMoneyGroups}
              amountClassName="text-lg font-semibold tracking-tight text-foreground"
              showCode={false}
            />
          ) : (
            <>
              <div>
                <span className="text-32 font-semibold tracking-tight ">
                  <CurrencyAmount
                    amount={pricing?.discountedTotal ?? 0}
                    currency={pricing?.currencyCode}
                  />
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {parseAmount(pricing?.undiscountedTotal) >
                parseAmount(pricing?.discountedTotal) ? (
                  <span className="text-18 text-muted-foreground line-through">
                    <CurrencyAmount
                      amount={pricing?.undiscountedTotal ?? 0}
                      currency={pricing?.currencyCode}
                    />
                  </span>
                ) : null}
                {parseAmount(pricing?.discountPercentage) > 0 ? (
                  <span className="rounded-full bg-red/7 text-red px-2 py-1 text-xs font-semibold ">
                    {t("details.off", {
                      discount: parseAmount(pricing?.discountPercentage),
                    })}
                  </span>
                ) : null}
              </div>
            </>
          )}

          <p className="text-sm text-muted-foreground">
            {hasMultipleZones
              ? t("details.monthPlan", { months: durationMonths })
              : `${t("details.monthPlan", { months: durationMonths })} • ${displayText(plan.zones[0]?.name)}`}
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

        {!isSalesman && (
          <PlanManagement
            planId={plan.id}
            trigger={<Button className="w-full">{t("actions.editPlan")}</Button>}
          />
        )}

{!isSalesman && (
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <span className="text-sm font-semibold tracking-wide text-foreground uppercase">
            {tCommon("private")}
          </span>
          <Switch
            checked={isPrivate}
            onCheckedChange={handlePrivateChange}
            disabled={isTogglingPrivate}
            aria-label="Toggle private plan"
          />
        </div>
)}
        <div className="space-y-3">
          <p className="text-16 font-semibold ">
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
            >
              {t("actions.viewAllFeatures", { count: plan.featureCount })}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
        <button
          type="button"
          onClick={() => onViewDetails?.(plan)}
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-foreground"
        >
          <Icon icon="solar:eye-linear" className="size-4" />
          {t("actions.viewFullDetails")}
        </button>

{!isSalesman && (
        <DeleteDialog
          title={`${tCommon("delete")} ${planName}`}
          onConfirm={handleDelete}
          trigger={
            <button
              type="button"
              aria-label="Delete plan"
              disabled={isDeleting}
              className="text-red transition-colors hover:text-red/80 disabled:opacity-50"
            >
              <Icon icon="solar:trash-bin-trash-linear" className="size-5" />
            </button>
          }
        />
)}
      </div>
    </article>
  );
}
