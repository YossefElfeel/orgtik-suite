"use client";

// For a customer: the offers waiting for their answer (accept, counter or decline happen on the
// offer's page).
import { useTranslations } from "next-intl";
import { DataTable } from "@orgtik/ui/table";
import HomeSection from "@/components/pages/home/HomeSection";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import { useGetDashboardOffersAwaitingQuery } from "@/redux/features/dashboard/dashboardApi";
import { useOffersAwaitingColumns } from "./columns";

export default function OffersAwaiting({ className }: { className?: string }) {
  const t = useTranslations("SalesHome");
  const { role } = useRole();
  const q = useGetDashboardOffersAwaitingQuery({ limit: 5 });
  const columns = useOffersAwaitingColumns();
  const rows = q.data?.data?.items ?? [];

  return (
    <HomeSection
      className={className}
      title={t("offersAwaitingTitle")}
      description={rows.length ? t("offersAwaitingBody") : undefined}
      more={canAccessRoute(role, "/offers") ? { href: "/offers", label: t("viewAllOffers") } : null}
    >
      <DataTable
        label={t("offersAwaitingTitle")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        paginate={false}
        status={q.isLoading || (q.isFetching && !q.data) ? "loading" : q.isError && !q.data ? "error" : "ready"}
        onRetry={() => void q.refetch()}
        error={{ title: t("listError") }}
        empty={{ title: t("noOffersAwaitingTitle"), description: t("noOffersAwaitingBody") }}
      />
    </HomeSection>
  );
}
