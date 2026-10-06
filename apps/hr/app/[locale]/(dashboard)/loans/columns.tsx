"use client";
import { Eye } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import CustomizeTooltip from "@/components/shared/CustomizeTooltip";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/utils/formateDate";
import { ILoan } from "@/types/loans";
import LoanDetailsSheet from "@/components/pages/loans/LoanDetailsSheet";
import { useFormatter, useTranslations } from "next-intl";

export const useLoanColumns = () => {
  const t = useTranslations("loans");
  const format = useFormatter();
  // In the loan's own currency, in the reader's language.
  const money = (amount: number, currency: string) =>
    currency ? format.number(amount, { style: "currency", currency }) : format.number(amount, { maximumFractionDigits: 2 });
  const columns: ColumnDef<ILoan>[] = [
    {
      accessorKey: "id",
      header: t("columns.id"),
      cell: ({ row }) => (
        <span className="font-semibold">#{row.original.id}</span>
      ),
    },

    {
      header: t("columns.employee"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium"><bdi>{row.original.employee.name}</bdi></span>
          <span className="text-xs text-fg-subtle">
            <bdi>{row.original.employee.employeeCode}</bdi>
          </span>
        </div>
      ),
    },

    {
      accessorKey: "title",
      header: t("columns.title"),
      cell: ({ row }) => <bdi>{row.original.title}</bdi>,
    },

    {
      header: t("columns.amount"),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {money(row.original.principalAmount, row.original.currency)}
        </span>
      ),
    },

    {
      header: t("columns.installment"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {money(row.original.installmentAmount, row.original.currency)}
        </span>
      ),
    },

    {
      header: t("columns.remaining"),
      cell: ({ row }) => (
        <span className="text-danger font-medium tabular-nums">
          {money(row.original.remainingAmount, row.original.currency)}
        </span>
      ),
    },

    {
      header: t("columns.startDate"),
      cell: ({ row }) => formatDate(row.original.startDate),
    },

    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },

    {
      id: "actions",
      header: t("columns.action"),

      cell: ({ row }) => {
        return <LoanDetailsSheet loanId={row.original.id} />;
      },
    },
  ];

  return columns;
};
