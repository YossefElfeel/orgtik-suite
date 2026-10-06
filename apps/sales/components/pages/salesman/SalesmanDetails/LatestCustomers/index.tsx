"use client";

// The salesperson's customers on the library's DataTable, paged by the server, with the search,
// stage and page in the address.
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Input, Select, useStatusLabel } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { leadStates, type LeadState } from "@/components/shared/SalesStatus";
import { useGetSalesmanCustomersQuery } from "@/redux/features/salesman/salesmanApi";
import { errorStatus, useSearchText, useUrlState } from "@/lib/commissions";
import type { CustomerStatus } from "@/types/customers";
import { useSalesmanCustomerColumns } from "./columns";

const ALL = "all";

export default function LatestCustomers({ salesmanId }: { salesmanId: string }) {
  const t = useTranslations("Team.salespeople");
  const label = useStatusLabel();
  const url = useUrlState();
  const q = url.get("q");
  const status = (leadStates as readonly string[]).includes(url.get("status")) ? (url.get("status") as LeadState) : null;
  const [search, setSearch] = useSearchText(q, (v) => url.set({ q: v }));
  const list = useGetSalesmanCustomersQuery({
    id: salesmanId,
    page: url.page,
    limit: url.size,
    ...(q ? { search: q } : {}),
    ...(status ? { status: status as CustomerStatus } : {}),
  });
  const columns = useSalesmanCustomerColumns();
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
          placeholder={t("customersSearch")}
          aria-label={t("customersSearch")}
          className="md:max-w-sm"
        />
        <Select
          aria-label={t("filterStage")}
          value={status ?? ALL}
          onValueChange={(v) => url.set({ status: v && v !== ALL ? v : null })}
          options={[{ value: ALL, label: t("stageAll") }, ...leadStates.map((s) => ({ value: s, label: label("lead", s) }))]}
          className="md:w-56"
        />
      </div>
      <DataTable
        label={t("tab.customers")}
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
        error={{ title: t("customersErrorTitle"), description: t("errorBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("customersNoMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => url.set({ q: null, status: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("customersEmptyTitle"), description: t("customersEmptyBody") }
        }
      />
    </div>
  );
}
