"use client";
import { CaretDown as CaretDownIcon, CheckCircle as CircleCheck, CircleNotch as CircleNotchIcon, DownloadSimple as DownloadSimpleIcon, FolderOpen, Ticket } from "@phosphor-icons/react";

import { DashboardMetricCard } from "@/components/shared/DashboardMetricCard";
import MainHeader from "@/components/layout/ResourceHeader";
import { Button } from "@orgtik/ui";
import { useColumns } from "./columns";
import { useListParams } from "@/hooks/useListParams";
import DataTable from "@/components/bindings/ResourceTable";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import {
  useGetTimeOffOverviewQuery,
  useGetTimeOffRequestsQuery,
} from "@/redux/features/timeOff/timeOffApi";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";

export default function TimeOffPage({
  showeHeader = true,
  columns: customColumns,
}: {
  showeHeader?: boolean;
  columns?: any;
}) {
  const t = useTranslations("timeOffPage");
  // Search, status, page and size live in the address (FS-HR-6): a reload keeps them.
  const list = useListParams({ q: "", status: "all" });
  const search = list.get("q");
  const activeFilter = list.get("status");
  const { page, limit } = list;

  const { data, isLoading, isFetching, isError, refetch } = useGetTimeOffRequestsQuery({
    search: search || undefined,
    status: activeFilter === "all" ? undefined : (activeFilter as any),
    page,
    limit,
  });

  const { data: overviewData } = useGetTimeOffOverviewQuery();

  const defaultColumns = useColumns();
  const columns = customColumns || defaultColumns;

  const ticketsData = data?.data?.items || [];
  const meta = data?.data?.meta;

  return (
    <>
      {showeHeader && (
        <MainHeader title={t("title")}>
          {/* <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg">
              <DownloadSimpleIcon aria-hidden="true" />
              Export
            </Button>
            <Button variant="secondary" size="lg">
              Today
              <CaretDownIcon aria-hidden="true" />
            </Button>
          </div> */}
        </MainHeader>
      )}

      <RoleGuard allowedRoles={["hr", "super_admin", "manager", "employee"]}>
        <section className="main-padding">
          <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              title={t("metrics.totalRequests.title")}
              value={overviewData?.data?.totalRequests?.toString() || "0"}
              subtitle={t("metrics.totalRequests.subtitle")}
            />
            <DashboardMetricCard
              title={t("metrics.approved.title")}
              value={overviewData?.data?.approvedRequests?.toString() || "0"}
              subtitle={t("metrics.approved.subtitle")}
              icon={<CircleCheck className="size-5 text-white" />}
              iconBgClassName="bg-success-solid"
            />
            <DashboardMetricCard
              title={t("metrics.pending.title")}
              value={overviewData?.data?.pendingRequests?.toString() || "0"}
              subtitle={t("metrics.pending.subtitle")}
              icon={<FolderOpen className="size-5 text-white" />}
              iconBgClassName="bg-warning-solid"
            />

            <DashboardMetricCard
              title={t("metrics.declined.title")}
              value={overviewData?.data?.rejectedRequests?.toString() || "0"}
              subtitle={t("metrics.declined.subtitle")}
              icon={<Ticket className="size-5 text-white" />}
              iconBgClassName="bg-info-solid"
            />
          </div>

          <ToolbarSearchAndFilter
            className="mt-10"
            searchFunctions={{
              search: search,
              setSearch: (q: string) => list.set({ q }),
            }}
            filterFunctions={{
              activeFilter: activeFilter,
              setActiveFilter: (filter: string | number) => list.set({ status: String(filter) }),
              filterData: [
                { id: "all", name: t("filters.all") },
                { id: "pending", name: t("filters.pending") },
                { id: "approved", name: t("filters.approved") },
                { id: "rejected", name: t("filters.rejected") },
                { id: "cancelled", name: t("filters.cancelled") },
              ],
            }}
          />
        </section>

        <div className="relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-raised/50">
              <CircleNotchIcon
                
                className="animate-spin size-10 text-primary" aria-hidden="true" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={ticketsData}
            isLoading={isLoading || isFetching}
            isError={isError}
            onRetry={refetch}
            pagination={{
              currentPage: page,
              limit: limit,
              totalPages: meta?.totalPages || 0,
              onLimitChange: (next) => list.set({ limit: next }),
              onPageChange: (next) => list.set({ page: next }),
            }}
          />
        </div>
      </RoleGuard>

      {/* <RoleGuard allowedRoles={["employee"]}>

      </RoleGuard> */}
    </>
  );
}
