"use client";

// The five newest customers and leads the reader can see (a salesperson: their own), with their
// pipeline stage. The old block was the legacy table with a bare spinner and no error state.
import { useTranslations } from "next-intl";
import { DataTable } from "@orgtik/ui/table";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import HomeSection from "@/components/pages/home/HomeSection";
import { useGetDashboardCustomersQuery } from "@/redux/features/dashboard/dashboardApi";
import { useLatestCustomerColumns } from "./columns";

export default function LatestCustomers({ className }: { className?: string }) {
  const t = useTranslations("SalesHome");
  const { role, isSalesman, canEdit } = useRole();
  const q = useGetDashboardCustomersQuery({ limit: 5 });
  const columns = useLatestCustomerColumns({ showOwner: !isSalesman });
  const rows = q.data?.data?.items ?? [];
  const canOpen = canAccessRoute(role, "/customers");

  return (
    <HomeSection className={className} title={t("latestCustomers")} more={canOpen ? { href: "/customers", label: t("viewAllCustomers") } : null}>
      <DataTable
        label={t("latestCustomers")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        paginate={false}
        status={q.isLoading || (q.isFetching && !q.data) ? "loading" : q.isError && !q.data ? "error" : "ready"}
        onRetry={() => void q.refetch()}
        error={{ title: t("listError") }}
        empty={{
          title: t("noCustomersTitle"),
          description: t("noCustomersBody"),
          action: canOpen && canEdit ? <ButtonLink href="/customers?new=1">{t("newCustomer")}</ButtonLink> : undefined,
        }}
      />
    </HomeSection>
  );
}
