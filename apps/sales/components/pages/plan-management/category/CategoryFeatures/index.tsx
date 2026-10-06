"use client";

import type { CategoryFeature } from "@/types/categories";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import { PlanFeatureTagBadge } from "@/components/pages/plan-management/plan/PlanFeatureTagBadge";
import { Link } from "@/i18n/routing";
import {
  getCategoryFeaturePaymentTag,
  isFeatureVisibility,
} from "@/lib/categories";
import { getFeatureDisplayPrice } from "@/lib/feature-pricing";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

type Props = {
  features: CategoryFeature[];
};

export default function CategoryFeatures({ features }: Props) {
  const tCat = useTranslations("planManagement.categories");
  const tDetails = useTranslations("planManagement.details");
  const displayText = useCatalogDisplayText();

  return (
    <SectionCard
      title={tDetails("featuresCount", { count: features.length })}
      action={
        <Link href="/plan-management/features">
          <Button variant="outline" icon="solar:square-top-down-linear">
            {tDetails("openInFeatures")}
          </Button>
        </Link>
      }
    >
      {features.length === 0 ? (
        <p className="py-6 text-center text-14 text-muted-foreground">
          {tCat("noFeaturesInCategory")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border">
          {features.map((feature) => {
            const paymentTag = getCategoryFeaturePaymentTag(feature.paymentType);
            const displayPrice = getFeatureDisplayPrice(feature);

            return (
              <li
                key={feature.id}
                className="flex items-start justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-16 font-semibold text-foreground">
                      {displayText(feature.name)}
                    </p>
                    {isFeatureVisibility(feature.visibility) ? (
                      <PlanFeatureTagBadge
                        tag={
                          feature.visibility === "internal"
                            ? "internal"
                            : "public"
                        }
                      />
                    ) : null}
                    {paymentTag ? (
                      <PlanFeatureTagBadge tag={paymentTag} />
                    ) : null}
                  </div>
                  <p className="text-14 leading-5 text-secondary">
                    {displayText(feature.description)}
                  </p>
                </div>
                <span className="shrink-0 text-16 font-semibold text-foreground">
                  {displayPrice ? (
                    <CurrencyAmount
                      amount={displayPrice.amount}
                      currency={displayPrice.currencyCode ?? "USD"}
                    />
                  ) : (
                    "—"
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
