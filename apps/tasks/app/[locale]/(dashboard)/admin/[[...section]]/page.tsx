"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, NoPermissionState, ToolAdminScreen, useSuite, type ToolAdminSection } from "@orgtik/ui";
import { ProjectConfiguration } from "@/components/pages/projects/ProjectConfiguration";
import { TaskCsvImport } from "@/components/task/TaskCsvImport";
const sections: ToolAdminSection[] = ["overview", "members", "roles", "settings", "connections", "import-export", "audit", "billing"];
export default function TasksAdminPage() {
  const { section } = useParams<{ section?: string[] }>(), locale = useLocale(), t = useTranslations("TasksV3"), suite = useSuite(), [open, setOpen] = useState(false);
  const active = (section?.[0] || "overview") as ToolAdminSection;
  if (!sections.includes(active) || (section?.length || 0) > 1) return <NoPermissionState title={t("forbidden")} />;
  return <><ToolAdminScreen tool="tasks" active={active} basePath={`/${locale}/admin`}>{active === "settings" ? <ProjectConfiguration /> : active === "import-export" ? <Button variant="secondary" disabled={!suite.toolState("tasks")?.canWrite} onClick={() => setOpen(true)}>{t("import")}</Button> : null}</ToolAdminScreen><TaskCsvImport open={open} onOpenChange={setOpen} /></>;
}
