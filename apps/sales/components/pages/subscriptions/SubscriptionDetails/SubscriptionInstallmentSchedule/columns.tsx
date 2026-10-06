"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { SubscriptionInstallmentScheduleDto } from "@/types/subscriptions";
import { formatShortDate } from "@/lib/format-date";
import SubscriptionInstallmentStatusCell from "../SubscriptionInstallmentStatusCell";
import SubscriptionInstallmentActions from "../SubscriptionInstallmentActions";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function useInstallmentScheduleColumns(): ColumnDef<SubscriptionInstallmentScheduleDto>[] {
  const tCommon = useTranslations("common");

  return useMemo(
    () => [
      {
        accessorKey: "number",
        header: "#",
        cell: ({ row }) => (
          <span className="tabular-nums text-secondary">
            {String(row.original.number).padStart(2, "0")}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: tCommon("endDate"),
        cell: ({ row }) => formatShortDate(row.original.dueDate),
      },
      {
        accessorKey: "amount",
        header: tCommon("amount"),
        cell: ({ row }) => row.original.amount,
      },
      {
        accessorKey: "status",
        header: tCommon("payment"),
        cell: ({ row }) => (
          <SubscriptionInstallmentStatusCell status={row.original.status} />
        ),
      },
      {
        id: "actions",
        header: tCommon("actions"),
        cell: ({ row }) => {
          if (row.original.status !== "paid" || !row.original.invoiceId) {
            return null;
          }

          return (
            <SubscriptionInstallmentActions
              invoiceId={row.original.invoiceId}
            />
          );
        },
      },
    ],
    [tCommon],
  );
}
