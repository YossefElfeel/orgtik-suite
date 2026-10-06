"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import type {
  PlanDto,
  PlanDetailFeatureTag,
  PlanFeatureSummary,
} from "@/types/plans";
import MainHeader from "@/components/shared/MainHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatsCards } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { PlanStatusCell } from "@/components/pages/plan-management/plan/PlanStatusCell";
import { PlanFeatureTagBadge } from "@/components/pages/plan-management/plan/PlanFeatureTagBadge";
import SubscribePlanDialog from "@/components/dialogs/plan-management/SubscribePlanDialog";
import {
  getPlanDurationOptions,
  getPlanPricingEntry,
} from "@/lib/project-plans";
import { getPlanPricingEntries } from "@/lib/plan-pricing";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { formatAmount } from "@/lib/format-amount";

type Props = {
  plan: PlanDto;
};

function parseAmount(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFeatureTags(feature: PlanFeatureSummary): PlanDetailFeatureTag[] {
  const tags: PlanDetailFeatureTag[] = [];

  if (feature.visibility === "public") tags.push("public");
  if (feature.visibility === "internal") tags.push("private");
  if (feature.paymentType === "installment") tags.push("installment");
  if (feature.paymentType === "full_payment") tags.push("full_payment");

  return tags;
}

export default function CustomerPlanDetails({ plan }: Props) {
  const router = useRouter();
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const durationOptions = getPlanDurationOptions(plan);
  const defaultDurationId = durationOptions[0]?.durationId ?? "";
  const pricing = defaultDurationId
    ? getPlanPricingEntry(plan, defaultDurationId)
    : getPlanPricingEntries(plan)[0];
  const total = parseAmount(pricing?.discountedTotal);
  const currencyCode = pricing?.currencyCode || "USD";
  const totalLabel = formatAmount(total, currencyCode);

  const minMonths = plan.minimumDurationMonths ?? durationOptions[0]?.months;
  const maxMonths =
    plan.maximumDurationMonths ??
    durationOptions[durationOptions.length - 1]?.months;
  const durationRangeLabel =
    minMonths && maxMonths
      ? minMonths === maxMonths
        ? `${minMonths} months`
        : `${minMonths}-${maxMonths}months`
      : "—";

  const t = useTranslations("planManagement.details");
  const tCommon = useTranslations("common");
  const tTabs = useTranslations("planManagement.tabs");
  const tSubscribe = useTranslations("planManagement.subscribe");
  const displayText = useCatalogDisplayText();
  const planName = displayText(plan.name);

  return (
    <section className="relative flex flex-col gap-6 pb-28">
      <MainHeader
        title={planName}
        backLink={{
          href: "/plan-management",
          label: t("backToPlans"),
        }}
        subChildren={
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
            <PlanStatusCell plan={plan} />
            <span>{displayText(plan.category.name)}</span>
            <span aria-hidden>•</span>
            <span>{planName}</span>
          </div>
        }
      />

      <StatsCards
        className="grid-cols-3 lg:grid-cols-3"
        stats={[
          {
            id: "features",
            label: tTabs("features"),
            value: plan.featureCount,
            description: `${t("publicCount", { count: plan.publicFeatureCount })} • ${t("installmentCount", { count: plan.installmentFeatureCount })}`,
            variant: "primary",
          },
          {
            id: "duration",
            label: t("planDuration"),
            value: plan.durationCount || durationOptions.length,
            description: durationRangeLabel,
          },
          {
            id: "installments",
            label: t("installments"),
            value: plan.installmentsEnabled ? t("installmentsOn") : t("installmentsOff"),
            description: plan.installmentsEnabled
              ? t("optionsCount", { count: plan.installmentDurations.length })
              : t("upfrontOnly"),
          },
        ]}
      />

      <SectionCard title={tCommon("description")}>
        <p className="text-sm leading-6 text-secondary">{displayText(plan.description)}</p>
      </SectionCard>

      <SectionCard title={t("featuresCount", { count: plan.allFeatures.length })}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {plan.allFeatures.map((feature) => (
            <article
              key={feature.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {feature.name}
                    </h3>
                    {feature.isActive !== false ? (
                      <Icon
                        icon="solar:check-circle-bold"
                        className="size-4 text-green"
                      />
                    ) : null}
                    {getFeatureTags(feature).map((tag) => (
                      <PlanFeatureTagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                  {feature.description ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {feature.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SubscribePlanDialog
        plan={plan}
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/plan-management")}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSubscribeOpen(true)}
        >
          {tSubscribe("payLater")}
        </Button>
        <Button type="button" onClick={() => setSubscribeOpen(true)}>
          {tSubscribe("subscribeAndPay", { total: totalLabel })}
        </Button>
      </div>
    </section>
  );
}
