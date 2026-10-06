"use client";

import type { PackageDetail } from "@/types/packages";
import { StatsCards, type StatItem } from "@/components/shared/StatCard";
import { useTranslations } from "next-intl";

type Props = {
  packageDetail: PackageDetail;
};

export default function PackageStats({ packageDetail }: Props) {
  const t = useTranslations("packages");
  const { 
    planCount = 0, 
    publicPlanCount = 0, 
    installmentPlanCount = 0,
    planDurationCount = 0,
    minimumDurationMonths = 0,
    maximumDurationMonths = 0,
    installmentsEnabled = false
  } = packageDetail;

  const items: StatItem[] = [
    {
      id: "plans",
      label: t("plansStats"),
      value: planCount,
      description: `${t("publicCount", { count: publicPlanCount })} • ${t("installmentCount", { count: installmentPlanCount })}`,
      variant: "primary",
    },
    {
      id: "duration",
      label: t("planDuration"),
      value: planDurationCount,
      description: minimumDurationMonths === maximumDurationMonths 
        ? t("monthsCount", { count: minimumDurationMonths })
        : t("monthsRange", { min: minimumDurationMonths, max: maximumDurationMonths }),
    },
    {
      id: "installments",
      label: t("installments"),
      value: installmentsEnabled ? t("on") : t("off"),
      description: installmentsEnabled ? t("available") : t("upfrontOnly"),
    },
  ];

  return (
    <StatsCards
      stats={items}
      className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3"
    />
  );
}
