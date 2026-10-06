"use client";

// Commissions on the library's DataTable, paged by the server, with the search, status and
// salesperson in the address. Salespeople see their own; managers and admins see everyone's and get
// the summary too (SAL-171). Only admins pay (SAL-017), from a dialog that pays what is due.
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useRole } from "@/hooks/useRole";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import CommissionStats from "@/components/pages/commissions/CommissionStats";
import {
  useGetCommissionsQuery,
  useGetCommissionsSummaryQuery,
  useGetMyCommissionsQuery,
  useGetMyCommissionsSummaryQuery,
} from "@/redux/features/commissions/commissionsApi";
import { useGetSalesmenQuery } from "@/redux/features/salesman/salesmanApi";
import { errorStatus, useSearchText, useUrlState } from "@/lib/commissions";
import type { CommissionFilter } from "@/types/commissions";
import { useCommissionColumns } from "./columns";

const FILTERS: readonly CommissionFilter[] = ["all", "due", "unpaid", "partially_paid", "paid"];
const PAYOUT: Record<CommissionFilter, string | undefined> = {
  all: undefined,
  due: "unpaid,partially_paid",
  unpaid: "unpaid",
  partially_paid: "partially_paid",
  paid: "paid",
};
const ALL = "all";

export default function CommissionsPage() {
  const t = useTranslations("Team.commissions");
  const statusLabel = useSalesStatusLabel();
  const { isSalesman, isAdmin, isReady, canEdit } = useRole();
  const url = useUrlState();
  const q = url.get("q");
  const filter = (FILTERS as readonly string[]).includes(url.get("status")) ? (url.get("status") as CommissionFilter) : "all";
  const salesperson = isSalesman ? "" : url.get("salesman");
  const [search, setSearch] = useSearchText(q, (v) => url.set({ q: v }));

  const params = {
    page: url.page,
    limit: url.size,
    ...(q ? { search: q } : {}),
    ...(PAYOUT[filter] ? { payoutStatus: PAYOUT[filter] } : {}),
    ...(salesperson ? { salesmanId: salesperson } : {}),
  };
  const everyone = useGetCommissionsQuery(params, { skip: !isReady || isSalesman });
  const own = useGetMyCommissionsQuery(params, { skip: !isReady || !isSalesman });
  const list = isSalesman ? own : everyone;
  const allSummary = useGetCommissionsSummaryQuery(undefined, { skip: !isReady || isSalesman });
  const ownSummary = useGetMyCommissionsSummaryQuery(undefined, { skip: !isReady || !isSalesman });
  const summary = isSalesman ? ownSummary : allSummary;
  const salesmen = useGetSalesmenQuery({ page: 1, limit: 100 }, { skip: !isReady || isSalesman });

  const columns = useCommissionColumns({ showSalesperson: !isSalesman, canPay: isAdmin && canEdit });
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  const filtered = Boolean(q || filter !== "all" || salesperson);
  const status = !isReady || list.isLoading ? "loading" : list.isError ? (errorStatus(list.error) === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty";

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={isSalesman ? t("descriptionOwn") : isAdmin ? t("descriptionAdmin") : t("descriptionManager")} />

      <CommissionStats
        stats={summary.data?.data}
        loading={!isReady || summary.isLoading}
        error={summary.isError}
        onRetry={() => void summary.refetch()}
      />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <Select
          aria-label={t("filterStatus")}
          value={filter}
          onValueChange={(v) => url.set({ status: v && v !== "all" ? v : null })}
          options={FILTERS.map((s) => ({
            value: s,
            label: s === "all" ? t("statusAll") : s === "due" ? t("statusDue") : statusLabel("commission", s),
          }))}
          className="md:w-56"
        />
        {isSalesman ? null : (
          <Select
            aria-label={t("filterSalesperson")}
            value={salesperson || ALL}
            onValueChange={(v) => url.set({ salesman: v && v !== ALL ? v : null })}
            options={[
              { value: ALL, label: t("salespersonAll") },
              ...(salesmen.data?.data?.items ?? []).map((s) => ({ value: s.id, label: s.fullName })),
            ]}
            className="md:w-64"
          />
        )}
      </div>

      <DataTable
        label={t("title")}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={list.data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          url.set({ page: next.pageIndex + 1, ...(next.pageSize !== url.size ? { size: next.pageSize } : {}) });
        }}
        pageSizes={url.pageSizes}
        status={status}
        onRetry={() => void list.refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => url.set({ q: null, status: null, salesman: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: isSalesman ? t("emptyBodyOwn") : t("emptyBody") }
        }
      />
    </section>
  );
}
