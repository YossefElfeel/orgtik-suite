"use client";

// A points history on the library's DataTable, shared by the customer's portal and the staff's
// history dialog; the caller brings the rows and the paging.
import { useTranslations } from "next-intl";
import type { ListStatus } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import type { OnChangeFn } from "@tanstack/react-table";
import type { LoyaltyTransaction } from "@/types/loyalty";
import { useHistoryColumns } from "./columns";

type Props = {
  items: LoyaltyTransaction[];
  total: number;
  status: ListStatus;
  onRetry: () => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageSizes: number[];
};

export default function LoyaltyHistoryTable({ items, total, status, onRetry, pagination, onPaginationChange, pageSizes }: Props) {
  const t = useTranslations("Team.loyalty");
  const columns = useHistoryColumns();
  return (
    <DataTable
      label={t("historyTitle")}
      columns={columns}
      data={items}
      getRowId={(r) => r.id}
      mode="server"
      rowCount={total}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageSizes={pageSizes}
      status={status}
      onRetry={onRetry}
      error={{ title: t("historyErrorTitle"), description: t("errorBody") }}
      empty={{ title: t("historyEmptyTitle"), description: t("historyEmptyBody") }}
    />
  );
}
