"use client";

import type { PlanDto } from "@/types/plans";
import { StatsCards } from "@/components/shared/StatCard";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanDto;
};

export function PlanStats({ plan }: Props) {
  const commission = plan.commission;
  const t = useTranslations("planManagement.details");
  const tTabs = useTranslations("planManagement.tabs");
  const tForm = useTranslations("planManagement.form");

  return (
    <StatsCards
      stats={[
        {
          id: "durations",
          label: t("available"),
          value: plan.planDurations.length,
          description: tTabs("duration"),
          variant: "primary",
        },
        {
          id: "duration",
          label: t("planDuration"),
          value: plan.planDurations[0]?.months ?? 0,
          description: "months",
        },
        {
          id: "installment",
          label: t("installments"),
          value: plan.installmentsEnabled ? t("installmentsOn") : t("installmentsOff"),
          description: "payment",
        },
        {
          id: "zones",
          label: tTabs("zones"),
          value: plan.zoneCount,
          description: t("served"),
        },
        {
          id: "commission",
          label: t("commission"),
          value: commission
            ? commission.type === "percentage"
              ? `${commission.amount}%`
              : `${commission.currencyCode} ${commission.amount}`
            : "—",
          description: commission?.type ? (commission.type === "percentage" ? tForm("percentage") : t("fixed")) : "none",
        },
      ]}
    />
  );
}
