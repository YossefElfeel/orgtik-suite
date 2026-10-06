"use client";

// The salesperson's deals on the library's DataTable, paged by the server; the search, status and
// page are in the address. Status words come from the shared status table (SAL-103).
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Input, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { useGetSalesmanContractsQuery } from "@/redux/features/salesman/salesmanApi";
import { errorStatus, useSearchText, useUrlState } from "@/lib/commissions";
import { SALESMAN_CONTRACT_STATUSES, type SalesmanContractStatus } from "@/types/salesman";
import { useSalesmanDealColumns } from "./columns";

const ALL = "all";

export default function SalesmanDeals({ salesmanId }: { salesmanId: string }) {
  const t = useTranslations("Team.salespeople");
  const statusLabel = useSalesStatusLabel();
  const url = useUrlState();
  const q = url.get("q");
  const status = (SALESMAN_CONTRACT_STATUSES as readonly string[]).includes(url.get("status")) ? (url.get("status") as SalesmanContractStatus) : null;
  const [search, setSearch] = useSearchText(q, (v) => url.set({ q: v }));
  const list = useGetSalesmanContractsQuery({ id: salesmanId, page: url.page, limit: url.size, ...(q ? { search: q } : {}), ...(status ? { status } : {}) });
  const columns = useSalesmanDealColumns();
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  const filtered = Boolean(q || status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("dealsSearch")}
          aria-label={t("dealsSearch")}
          className="md:max-w-sm"
        />
        <Select
          aria-label={t("filterStatus")}
          value={status ?? ALL}
          onValueChange={(v) => url.set({ status: v && v !== ALL ? v : null })}
          options={[{ value: ALL, label: t("statusAll") }, ...SALESMAN_CONTRACT_STATUSES.map((s) => ({ value: s, label: statusLabel("project", s) }))]}
          className="md:w-60"
        />
      </div>
      <DataTable
        label={t("tab.deals")}
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
        status={list.isLoading ? "loading" : list.isError ? (errorStatus(list.error) === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
        onRetry={() => void list.refetch()}
        error={{ title: t("dealsErrorTitle"), description: t("errorBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("dealsNoMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => url.set({ q: null, status: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("dealsEmptyTitle"), description: t("dealsEmptyBody") }
        }
      />
    </div>
  );
}
