"use client";

// The customer's reward coupons on the library's DataTable, with the page in the address.
import { useTranslations } from "next-intl";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useGetMeCouponsQuery, useGetMeLoyaltyOverviewQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useUrlState } from "@/lib/commissions";
import { useCouponColumns } from "./columns";

export default function CustomerLoyaltyCoupons() {
  const t = useTranslations("Team.loyalty");
  const url = useUrlState();
  const overview = useGetMeLoyaltyOverviewQuery();
  const list = useGetMeCouponsQuery({ page: url.page, limit: url.size });
  const columns = useCouponColumns(overview.data?.data?.baseCurrency ?? "USD");
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  return (
    <DataTable
      label={t("couponsTitle")}
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
      status={list.isLoading ? "loading" : list.isError ? "error" : items.length ? "ready" : "empty"}
      onRetry={() => void list.refetch()}
      error={{ title: t("couponsErrorTitle"), description: t("errorBody") }}
      empty={{ title: t("couponsEmptyTitle"), description: t("couponsEmptyBody") }}
    />
  );
}
