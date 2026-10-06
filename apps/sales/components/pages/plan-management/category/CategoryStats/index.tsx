"use client";

import type { CategoryDetail } from "@/types/categories";
import { StatsCards } from "@/components/shared/StatCard";
import { useTranslations } from "next-intl";

type Props = {
  category: CategoryDetail;
};

export default function CategoryStats({ category }: Props) {
  const tNav = useTranslations("nav");
  const tStats = useTranslations("planManagement.categories.stats");

  return (
    <StatsCards
      className="lg:grid-cols-3"
      stats={[
        {
          id: "plans",
          label: tNav("plans"),
          value: tStats("activePlansCount", { count: category.activePlanCount }),
          variant: "primary",
        },
        {
          id: "features",
          label: tStats("featuresLabel"),
          value: tStats("featuresCount", { count: category.featureCount }),
        },
        {
          id: "zones",
          label: tStats("zonesServedLabel"),
          value: tStats("zonesCount", { count: category.zoneCount }),
        },
      ]}
    />
  );
}
