"use client";

import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import CheckboxFormEle from "@/components/ui/form/checkbox-form-element";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import type { PlanFormValues } from "@/schemas/plans";
import { cn } from "@/lib/utils";
import { PlanFeatureTagBadge } from "@/components/pages/plan-management/plan/PlanFeatureTagBadge";
import { useGetGroupedFeaturesQuery } from "@/redux/features/features/featuresApi";
import { useGetDurationsQuery } from "@/redux/features/durations/durationsApi";
import type { PlanDetailFeatureTag } from "@/types/plans";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { getFeatureDisplayPrice, getFeatureDisplayAmount } from "@/lib/feature-pricing";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<PlanFormValues>;
  enabled?: boolean;
};

function mapFeatureTags(
  paymentType: string,
  visibility: string,
): PlanDetailFeatureTag[] {
  const tags: PlanDetailFeatureTag[] = [];
  if (visibility === "public") tags.push("public");
  if (visibility === "internal") tags.push("private");
  if (paymentType === "installment") tags.push("installment");
  if (paymentType === "full_payment") tags.push("full_payment");
  return tags;
}

export function FeaturesDurationsStep({ form, enabled = true }: Props) {
  const featureIds = form.watch("featureIds");
  const categories = form.watch("categories");
  const durations = form.watch("durations");
  const allowInstallments = form.watch("allowInstallments");
  const installmentPlans = form.watch("installmentPlans");
  const displayText = useCatalogDisplayText();
  const t = useTranslations("planManagement.form");
  const tCommon = useTranslations("common");

  const hasCategories = categories.length > 0;

  const { data: featuresResponse } = useGetGroupedFeaturesQuery(
    {
      page: 1,
      limit: Math.max(categories.length, 1),
      isActive: true,
      categoryIds: categories,
    },
    { skip: !enabled || !hasCategories },
  );
  const { data: durationsResponse } = useGetDurationsQuery(undefined, {
    skip: !enabled,
  });

  const featureGroups = featuresResponse?.data.items ?? [];
  const featureOptions = useMemo(
    () => featureGroups.flatMap((group) => group.features),
    [featureGroups],
  );

  const planDurations = (durationsResponse?.data.items ?? []).filter(
    (duration) => duration.type === "plan",
  );
  const installmentDurations = (durationsResponse?.data.items ?? []).filter(
    (duration) => duration.type === "installment",
  );

  const selectedFeatures = useMemo(
    () => featureOptions.filter((feature) => featureIds.includes(feature.id)),
    [featureIds, featureOptions],
  );

  const grossTotal = selectedFeatures.reduce((sum, feature) => {
    return sum + getFeatureDisplayAmount(feature);
  }, 0);

  useEffect(() => {
    if (!hasCategories || !featuresResponse) {
      return;
    }

    const allowedIds = new Set(featureOptions.map((feature) => feature.id));
    const nextFeatureIds = featureIds.filter((id) => allowedIds.has(id));

    if (nextFeatureIds.length !== featureIds.length) {
      form.setValue("featureIds", nextFeatureIds, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [featureIds, featureOptions, featuresResponse, form, hasCategories]);

  const toggleFeature = (featureId: string, checked: boolean) => {
    const next = checked
      ? [...featureIds, featureId]
      : featureIds.filter((id) => id !== featureId);
    form.setValue("featureIds", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleDuration = (durationId: string) => {
    const isSelected = durations.includes(durationId);
    const next = isSelected
      ? durations.filter((id) => id !== durationId)
      : [...durations, durationId];
    form.setValue("durations", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleInstallment = (planId: string) => {
    const isSelected = installmentPlans.includes(planId);
    const next = isSelected
      ? installmentPlans.filter((id) => id !== planId)
      : [...installmentPlans, planId];
    form.setValue("installmentPlans", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {t("includedFeatures")}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("selectedFeaturesGross", { count: selectedFeatures.length })}{" "}
              <span className="font-semibold text-foreground">
                {selectedFeatures.length > 0 ? (
                  <CurrencyAmount
                    amount={grossTotal}
                    currency={
                      getFeatureDisplayPrice(selectedFeatures[0])?.currencyCode
                    }
                  />
                ) : (
                  "—"
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {!hasCategories ? (
            <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("selectCategoriesForFeatures")}
            </p>
          ) : featureGroups.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noFeaturesFound")}
            </p>
          ) : (
            featureGroups.map((group) => (
              <div key={group.categoryId} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {displayText(group.categoryName)}
                </p>
                <ul className="space-y-2">
                  {group.features.map((feature) => {
                    const checked = featureIds.includes(feature.id);

                    return (
                      <li
                        onClick={() => toggleFeature(feature.id, !checked)}
                        key={feature.id}
                        className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 cursor-pointer hover:bg-muted/50 transition-all duration-300"
                      >
                        <Checkbox
                          checked={checked}
                          className="mt-0.5 size-4.5"
                          aria-label={`Select ${feature.name}`}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {feature.name}
                            </p>
                            {mapFeatureTags(
                              feature.paymentType,
                              feature.visibility,
                            ).map((tag) => (
                              <PlanFeatureTagBadge key={tag} tag={tag} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-secondary">
                          {(() => {
                            const displayPrice = getFeatureDisplayPrice(feature);
                            if (!displayPrice) {
                              return "—";
                            }

                            return (
                              <>
                                <CurrencyAmount
                                  amount={displayPrice.amount}
                                  currency={displayPrice.currencyCode}
                                />{" "}
                                / {tCommon("month")}
                              </>
                            );
                          })()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("availableDurations")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("availableDurationsDesc")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {planDurations.map((duration) => {
            const selected = durations.includes(duration.id);
            const discountPercent = Number.parseFloat(duration.percentage);

            return (
              <button
                key={duration.id}
                type="button"
                onClick={() => toggleDuration(duration.id)}
                className={cn(
                  "inline-flex gap-1 items-center rounded-md border px-3 py-1 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-secondary hover:bg-muted/50",
                )}
              >
                {duration.months}M
                <span className=" text-muted-foreground">
                  {discountPercent > 0 ? `- ${discountPercent}%` : ""}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.durations ? (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.durations.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <CheckboxFormEle
          form={form}
          name="allowInstallments"
          label={t("allowInstallments")}
          description={t("allowInstallmentsDesc")}
        />

        {allowInstallments ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {installmentDurations.map((option) => {
              const selected = installmentPlans.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleInstallment(option.id)}
                  className={cn(
                    "inline-flex gap-1 items-center rounded-md border px-3 py-1 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-white text-secondary hover:bg-muted/50",
                  )}
                >
                  {tCommon("payOver")} {option.months} {tCommon("months")}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
