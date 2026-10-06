"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import FeatureManagement from "@/components/dialogs/plan-management/FeatureManagement";
import { PlanFeatureTagBadge } from "@/components/pages/plan-management/plan/PlanFeatureTagBadge";
import { useDeleteFeatureMutation } from "@/redux/features/features/featuresApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import type { FeatureListItem } from "@/types/features";
import { useTranslations } from "next-intl";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import { getFeatureDisplayPrice } from "@/lib/feature-pricing";

type Props = {
  feature: FeatureListItem;
};

export default function FeatureCard({ feature }: Props) {
  const { isSalesman } = useRole();
  const displayText = useCatalogDisplayText();
  const tCommon = useTranslations("common");
  const [expanded, setExpanded] = useState(false);
  const [deleteFeature] = useDeleteFeatureMutation();
  const featureName = displayText(feature.name);
  const featureDescription = displayText(feature.description);
  const categoryName = displayText(feature.categoryName);
  const displayPrice = getFeatureDisplayPrice(feature);
  const previewLimit = 110;
  const isLongDescription = featureDescription.length > previewLimit;
  const visibleDescription =
    !expanded && isLongDescription
      ? `${featureDescription.slice(0, previewLimit).trimEnd()}`
      : featureDescription;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <PlanFeatureTagBadge tag={feature.paymentType} className="min-w-0" />
          <PlanFeatureTagBadge tag={feature.visibility === "internal" ? "internal" : "public"} className="min-w-0" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isSalesman && (
            <>
              <FeatureManagement
                id={feature.id}
                trigger={
                  <Button
                    type="button"
                    variant="ghost-edit"
                    size="icon-sm"
                    aria-label={`Edit ${featureName}`}
                    icon="solar:pen-linear"
                  />
                }
              />
              <DeleteDialog
                title={`feature ${featureName}`}
                onConfirm={async () => {
                  await deleteFeature(feature.id).unwrap();
                }}
                trigger={
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Delete ${featureName}`}
                    icon="solar:trash-bin-trash-linear"
                  />
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-1">
        <h3 className="text-18 font-semibold text-foreground">
          {featureName}
        </h3>
        <p className="text-14 text-secondary">{categoryName}</p>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <p className="text-14 leading-6 text-secondary">
          {visibleDescription}
          {isLongDescription ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="ms-1 inline font-medium text-primary hover:underline"
            >
              {expanded ? tCommon("showLess") : `... ${tCommon("readMore")}`}
            </button>
          ) : null}
        </p>
      </div>

      {displayPrice ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-14 font-medium text-primary">
            {tCommon("price")}{" "}
            <span className="text-secondary">
              (
              <CurrencyAmount
                amount={displayPrice.amount}
                currency={displayPrice.currencyCode}
              />
              )
            </span>
          </p>
        </div>
      ) : null}
    </article>
  );
}
