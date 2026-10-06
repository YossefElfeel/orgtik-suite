"use client";

import { Icon } from "@iconify/react";
import type { PlanDto, PlanDetailFeatureTag, PlanFeatureSummary } from "@/types/plans";
import { SectionCard } from "@/components/shared/SectionCard";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PlanFeatureTagBadge } from "@/components/pages/plan-management/plan/PlanFeatureTagBadge";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanDto;
};

function getFeatureTags(feature: PlanFeatureSummary): PlanDetailFeatureTag[] {
  const tags: PlanDetailFeatureTag[] = [];

  if (feature.visibility === "public") tags.push("public");
  if (feature.visibility === "internal") tags.push("private");
  if (feature.paymentType === "installment") tags.push("installment");
  if (feature.paymentType === "full_payment") tags.push("full_payment");

  return tags;
}

export function PlanFeatures({ plan }: Props) {
  const t = useTranslations("planManagement.details");

  return (
    <SectionCard
      title={t("featuresCount", { count: plan.allFeatures.length })}
      action={
        <Link href="/plan-management/features">
          <Button variant="outline">
            <Icon icon="solar:square-top-down-linear" className="size-4" />
            {t("openInFeatures")}
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plan.allFeatures.map((feature) => (
          <article
            key={feature.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {feature.name}
                </h3>

                {getFeatureTags(feature).map((tag) => (
                  <PlanFeatureTagBadge key={tag} tag={tag} />
                ))}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
