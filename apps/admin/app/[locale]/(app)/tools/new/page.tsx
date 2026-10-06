"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { ToolForm } from "@/components/catalog/ToolForm";
import { useLocaleHref } from "@/components/catalog/bits";

// ADM-04, "Add tool": a new tool starts as coming soon, with no plans (POST /tools).
function NewTool() {
  const t = useTranslations("Catalog.toolForm");
  const tt = useTranslations("Catalog.tools");
  const href = useLocaleHref();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newTitle")} description={t("newDescription")} breadcrumb={[{ label: tt("title"), href: href("/tools") }, { label: t("newTitle") }]} />
      <ToolForm />
    </div>
  );
}

export default function NewToolPage() {
  return (
    <RequirePermission permission="tools:edit">
      <NewTool />
    </RequirePermission>
  );
}
