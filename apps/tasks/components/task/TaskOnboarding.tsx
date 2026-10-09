"use client";
import { useTranslations } from "next-intl";
import { Button, OnboardingChecklist, useSuite } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { useGetAllProjectsQuery } from "@/redux/features/projects/projectsApi";
import { useGetMyTasksSectionsQuery } from "@/redux/features/task/taskApi";
import { useSampleProjectMutation } from "@/redux/features/task/v3Api";
import { useTaskRoles } from "@/lib/permissions";
export function TaskOnboarding() {
  const t = useTranslations("TasksV3"), router = useRouter(), suite = useSuite(), { isManager, isViewerOnly } = useTaskRoles();
  const projects = useGetAllProjectsQuery({ page: 1, limit: 1, status: "" }), tasks = useGetMyTasksSectionsQuery(undefined, { skip: isViewerOnly }), [sample, creating] = useSampleProjectMutation();
  if (projects.isLoading || projects.isError || isViewerOnly) return null;
  const count = projects.data?.data.meta.total || 0, done = (tasks.data?.data.sections || []).some(row => row.section.flag === "done" && row.tasks.length > 0);
  if (count > 0 && done) return null;
  return <div className="flex flex-col gap-3"><OnboardingChecklist title={t("onboarding")} steps={[{ id: "project", title: t("firstProject"), complete: count > 0, href: "/projects" }, { id: "task", title: t("firstTask"), complete: done, href: "/my-tasks/lists" }, { id: "connections", title: t("reviewConnections"), complete: suite.snapshot?.connectors?.some(row => row.enabled) || false, href: suite.canAdmin("tasks") ? "/admin/connections" : undefined }]} />{count === 0 && isManager ? <div className="flex flex-wrap items-center gap-3"><Button loading={creating.isLoading} onClick={() => void sample().unwrap().then(value => router.push(`/projects/${value.data.id}/lists`)).catch(() => {})}>{t("sample")}</Button><p className="max-w-prose text-body-sm text-fg-muted">{t("sampleNote")}</p></div> : null}</div>;
}
