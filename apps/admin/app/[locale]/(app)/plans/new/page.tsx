"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useLocaleHref } from "@/components/catalog/bits";
import { PlanForm } from "@/components/catalog/PlanForm";

// ADM-07, "New plan" (?tool= picks the tool, e.g. from the tool's page).
function NewPlan() {
  const t = useTranslations("Catalog.planForm");
  const tp = useTranslations("Catalog.plans");
  const href = useLocaleHref();
  const tool = useSearchParams().get("tool") ?? undefined;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newTitle")} description={t("newDescription")} breadcrumb={[{ label: tp("title"), href: href("/plans") }, { label: t("newTitle") }]} />
      <PlanForm defaultTool={tool} />
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <RequirePermission permission="plans:edit">
      <NewPlan />
    </RequirePermission>
  );
}
