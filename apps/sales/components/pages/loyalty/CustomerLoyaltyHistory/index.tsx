"use client";

// The customer's points history, with the page in the address.
import type { PaginationState } from "@orgtik/ui/table";
import LoyaltyHistoryTable from "@/components/pages/loyalty/LoyaltyHistoryTable";
import { useGetMeTransactionsQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useUrlState } from "@/lib/commissions";

export default function CustomerLoyaltyHistory() {
  const url = useUrlState();
  const list = useGetMeTransactionsQuery({ page: url.page, limit: url.size });
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  return (
    <LoyaltyHistoryTable
      items={items}
      total={list.data?.data?.meta?.total ?? 0}
      status={list.isLoading ? "loading" : list.isError ? "error" : items.length ? "ready" : "empty"}
      onRetry={() => void list.refetch()}
      pagination={pagination}
      onPaginationChange={(u) => {
        const next = typeof u === "function" ? u(pagination) : u;
        url.set({ page: next.pageIndex + 1, ...(next.pageSize !== url.size ? { size: next.pageSize } : {}) });
      }}
      pageSizes={url.pageSizes}
    />
  );
}
