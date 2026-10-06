"use client";

// Settings › Project: the active project's name, description and logo, and (super admins only)
// deleting it. The page rendered nothing while loading and nothing at all without a project
// (MKT-037); it has loading, no-project and error states now.
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState } from "@orgtik/ui";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";
import ProjectDetailsForm from "@/components/pages/project/updateProject";
import { DeleteProject } from "@/components/pages/project/updateProject/DeleteProject";
import ProjectLogo from "@/components/pages/project/avatar";

export function ProjectSettings() {
  const t = useTranslations("ProjectSettings");
  const can = useMarketingRoles();
  const { data, isLoading, isError, error, refetch } = useGetActiveProjectQuery();
  const project = data?.data;

  if (isLoading) return <LoadingState label={t("loading")} rows={5} />;
  if (isError || !project) {
    const status = (error as { status?: number | string } | undefined)?.status;
    if (status === 404 || (!isError && !project)) return <EmptyState title={t("noProjectTitle")} description={t("noProjectBody")} />;
    return <ErrorState title={t("loadError")} description={t("loadErrorBody")} onRetry={refetch} />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <ProjectDetailsForm project={project} canEdit={can.manageProjects} />
      <ProjectLogo project={project} canEdit={can.manageProjects} />
      {can.deleteProjects ? <DeleteProject project={project} /> : null}
    </div>
  );
}
