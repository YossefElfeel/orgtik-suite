"use client";

// A customer's points history, for admins and managers (managers read through their own
// endpoint). Controlled: the open customer is kept in the address by the list.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@orgtik/ui";
import type { PaginationState } from "@orgtik/ui/table";
import LoyaltyHistoryTable from "@/components/pages/loyalty/LoyaltyHistoryTable";
import { useGetCustomerTransactionsQuery } from "@/redux/features/loyalty/loyaltyApi";
import { errorStatus, useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";

type Props = {
  customerId: string | null;
  customerName: string;
  points: number | null;
  manager: boolean;
  onOpenChange: (open: boolean) => void;
};

const SIZES = [10, 25, 50];

export default function CustomerPointsHistoryDialog({ customerId, customerName, points, manager, onOpenChange }: Props) {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: SIZES[0] });
  const list = useGetCustomerTransactionsQuery(
    { customerId: customerId ?? "", manager, page: pagination.pageIndex + 1, limit: pagination.pageSize },
    { skip: !customerId },
  );
  const items = list.data?.data?.items ?? [];
  return (
    <Dialog
      open={Boolean(customerId)}
      onOpenChange={(next) => {
        if (!next) setPagination({ pageIndex: 0, pageSize: SIZES[0] });
        onOpenChange(next);
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{customerName ? t("historyOf", { name: isolate(customerName) }) : t("historyTitle")}</DialogTitle>
          {points !== null ? <DialogDescription>{t("balanceNow", { points: f.number(points) })}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody>
          <LoyaltyHistoryTable
            items={items}
            total={list.data?.data?.meta?.total ?? 0}
            status={list.isLoading ? "loading" : list.isError ? (errorStatus(list.error) === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
            onRetry={() => void list.refetch()}
            pagination={pagination}
            onPaginationChange={(u) => setPagination((old) => (typeof u === "function" ? u(old) : u))}
            pageSizes={SIZES}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
