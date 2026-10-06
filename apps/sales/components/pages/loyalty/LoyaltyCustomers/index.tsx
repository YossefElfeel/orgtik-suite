"use client";

// Customers in the loyalty programme, by balance (admins and managers), on the library's DataTable
// with the page and the open history in the address.
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useRole } from "@/hooks/useRole";
import CustomerPointsHistoryDialog from "@/components/dialogs/loyalty/CustomerPointsHistoryDialog";
import { useGetLoyaltyCustomersQuery } from "@/redux/features/loyalty/loyaltyApi";
import { errorStatus, useUrlState } from "@/lib/commissions";
import type { LoyaltyCustomerRow } from "@/types/loyalty";
import { useLoyaltyCustomerColumns } from "./columns";

export default function LoyaltyCustomers() {
  const t = useTranslations("Team.loyalty");
  const { isAdmin, canEdit } = useRole();
  const url = useUrlState();
  const manager = !isAdmin;
  const list = useGetLoyaltyCustomersQuery({ manager, page: url.page, limit: url.size });
  const items = list.data?.data?.items ?? [];
  const historyId = url.get("history") || null;
  const open = items.find((c) => c.customerId === historyId);
  const onHistory = useCallback((row: LoyaltyCustomerRow) => url.set({ history: row.customerId, page: url.page }), [url]);
  const columns = useLoyaltyCustomerColumns({ full: isAdmin, canAdjust: isAdmin && canEdit, onHistory });
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader title={t("customersTitle")} description={isAdmin ? t("customersHint") : t("customersHintManager")} />
      <DataTable
        label={t("customersTitle")}
        columns={columns}
        data={items}
        getRowId={(r) => r.customerId}
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
        empty={{ title: t("customersEmptyTitle"), description: t("customersEmptyBody") }}
      />
      <CustomerPointsHistoryDialog
        customerId={historyId}
        customerName={open?.customerName ?? ""}
        points={open ? open.points : null}
        manager={manager}
        onOpenChange={(next) => {
          if (!next) url.set({ history: null, page: url.page });
        }}
      />
    </Card>
  );
}
