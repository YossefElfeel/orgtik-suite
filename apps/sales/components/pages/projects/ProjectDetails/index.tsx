"use client";

// A project (a deal) and its contract. The page always ends in a state: loading, the project, not
// found, no access, or an error with Retry; it span forever on any of them (SAL-093).
import CrmProvisioning from "@/components/CrmProvisioning";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, NoPermissionState, PageHeader, Skeleton } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { SalesStatus } from "@/components/shared/SalesStatus";
import ProjectContractCard from "@/components/pages/projects/ProjectContractCard";
import ProjectHeaderActions from "@/components/pages/projects/ProjectHeaderActions";
import ProjectInfoCard from "@/components/pages/projects/ProjectInfoCard";
import ProjectNotes from "@/components/pages/projects/ProjectNotes";
import ProjectOverview from "@/components/pages/projects/ProjectOverview";
import ProjectPlansCard from "@/components/pages/projects/ProjectPlansCard";
import ProjectPriority from "@/components/pages/projects/ProjectPriority";
import ProjectTimeline from "@/components/pages/projects/ProjectTimeline";
import { useRole } from "@/hooks/useRole";
import { useGetProjectQuery } from "@/redux/features/projects/projectsApi";
import { useDealFormat } from "@/lib/deals/format";
import { detailState } from "@/lib/deals/query-state";

export default function ProjectDetails({ id }: { id: string }) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const { isCustomer, isSalesman } = useRole();
  const { data, isLoading, isError, error, refetch } = useGetProjectQuery(id);
  const project = data?.data;
  const state = detailState({ isLoading, isError, error, hasData: Boolean(project) });
  const listTitle = isSalesman ? t("titleSalesman") : isCustomer ? t("titleCustomer") : t("title");
  const back = (
    <ButtonLink href="/projects" variant="secondary">
      {t("backToList", { list: listTitle })}
    </ButtonLink>
  );

  if (state === "loading")
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label={t("loading")}>
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (state === "not-found") return <EmptyState titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  if (state === "forbidden") return <NoPermissionState titleAs="h1" title={t("forbiddenTitle")} description={t("forbiddenBody")} action={back} />;
  if (state === "error" || !project) return <ErrorState titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => void refetch()} />;

  const contract = project.latestContract ?? null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: listTitle, href: "/projects" }, { label: project.projectName }]}
        title={<span dir="auto">{project.projectName}</span>}
        status={
          <span className="flex flex-wrap items-center gap-2">
            <SalesStatus kind="project" value={project.status} />
            {isCustomer ? null : <ProjectPriority value={project.priority} />}
          </span>
        }
        description={t("createdOn", { id: project.displayId ?? `#${project.referenceNumber ?? ""}`, date: fmt.date(project.createdAt) })}
        actions={isCustomer ? null : <ProjectHeaderActions project={project} />}
      />
      <ProjectOverview project={project} />
      <CrmProvisioning id={id} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          <ProjectContractCard project={project} />
          {contract ? <ProjectPlansCard project={project} /> : null}
          {isCustomer ? null : <ProjectNotes projectId={project.id} />}
        </div>
        <div className="flex flex-col gap-5">
          <ProjectInfoCard project={project} />
          <ProjectTimeline project={project} />
        </div>
      </div>
    </section>
  );
}
