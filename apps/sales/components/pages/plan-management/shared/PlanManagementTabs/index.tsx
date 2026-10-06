"use client";

import PillTabs from "@/components/shared/PillTabs";
import type { PlanTab } from "@/types/plans";
import type { PillTabItem } from "@/types/tabs";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
export function PlanManagementTabs() {
  const t = useTranslations("planManagement.tabs");
  
  const tabs: PillTabItem[] = useMemo(() => [
    {
      id: "plans" satisfies PlanTab,
      label: t("plans"),
      icon: "solar:layers-minimalistic-linear",
      href: "/plan-management",
      match: "exact",
    },
    {
      id: "features" satisfies PlanTab,
      label: t("features"),
      icon: "solar:pen-new-square-linear",
      href: "/plan-management/features",
    },
    {
      id: "categories" satisfies PlanTab,
      label: t("categories"),
      icon: "solar:widget-2-linear",
      href: "/plan-management/categories",
    },
    {
      id: "duration" satisfies PlanTab,
      label: t("duration"),
      icon: "solar:clock-circle-linear",
      href: "/plan-management/duration",
    },
    {
      id: "zones" satisfies PlanTab,
      label: t("zones"),
      icon: "solar:global-linear",
      href: "/plan-management/zones",
    },
  ], [t]);

  return (
    <PillTabs items={tabs} ariaLabel={t("planManagementSections")} />
  );
}
