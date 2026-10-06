"use client";

import type { PlanDto } from "@/types/plans";
import { SectionCard, DetailField } from "@/components/shared/SectionCard";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanDto;
};

export function PlanCommission({ plan }: Props) {
  const commission = plan.commission;
  const t = useTranslations("planManagement.details");
  const tForm = useTranslations("planManagement.form");

  if (!commission) {
    return (
      <SectionCard title={t("commission")}>
        <p className="text-sm text-muted-foreground">{t("noCommissionConfigured")}</p>
      </SectionCard>
    );
  }

  const typeLabel = commission.type === "percentage" ? tForm("percentage") : t("fixed");
  const valueLabel =
    commission.type === "percentage"
      ? `${commission.amount}%`
      : `${commission.currencyCode} ${commission.amount}`;

  return (
    <SectionCard title={t("commission")}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailField label={t("type")}>{typeLabel}</DetailField>
          <DetailField label={t("value")}>{valueLabel}</DetailField>
        </div>
        <p className="text-xs italic text-muted-foreground">
          {t("commissionNote")}
        </p>
      </div>
    </SectionCard>
  );
}
