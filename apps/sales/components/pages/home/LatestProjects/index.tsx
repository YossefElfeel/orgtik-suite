"use client";

// The five most recent projects the reader can see: all of them for admins and managers, a
// salesperson's own deals, a customer's own projects. The old block reused the projects page's
// full column set (with its actions) inside the legacy table, with a bare spinner and no error state.
import { useTranslations } from "next-intl";
import { DataTable } from "@orgtik/ui/table";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import HomeSection from "@/components/pages/home/HomeSection";
import { useGetDashboardProjectsQuery } from "@/redux/features/dashboard/dashboardApi";
import { useLatestProjectColumns } from "./columns";

export default function LatestProjects({ className }: { className?: string }) {
  const t = useTranslations("SalesHome");
  const { role, isAdmin, isManager, isCustomer, canEdit } = useRole();
  const q = useGetDashboardProjectsQuery({ limit: 5 });
  const columns = useLatestProjectColumns({ showCustomer: !isCustomer, showOwner: isAdmin || isManager });
  const rows = q.data?.data?.items ?? [];
  const canOpen = canAccessRoute(role, "/projects");
  const title = isCustomer ? t("myProjects") : t("latestProjects");

  return (
    <HomeSection className={className} title={title} more={canOpen ? { href: "/projects", label: t("viewAllProjects") } : null}>
      <DataTable
        label={title}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        paginate
        status={q.isLoading || (q.isFetching && !q.data) ? "loading" : q.isError && !q.data ? "error" : "ready"}
        onRetry={() => void q.refetch()}
        error={{ title: t("listError") }}
        empty={{
          title: isCustomer ? t("noMyProjectsTitle") : t("noProjectsTitle"),
          description: isCustomer ? t("noMyProjectsBody") : t("noProjectsBody"),
          action: !isCustomer && canOpen && canEdit ? <ButtonLink href="/projects?new=1">{t("newProject")}</ButtonLink> : undefined,
        }}
      />
    </HomeSection>
  );
}
