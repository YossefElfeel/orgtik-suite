"use client";
import { Check, PencilSimple as Edit2 } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import CustomizeTooltip from "@/components/shared/CustomizeTooltip";
import { useFormatter, useTranslations } from "next-intl";
import { useMarkPayrollItemAsPaidMutation } from "@/redux/features/payroll/payrollApi";

export const useColumns = () => {
  const t = useTranslations("financeQueue.table");
  const format = useFormatter();
  // In the item's own currency, in the reader's language.
  const money = (amount: number, currency?: string | null) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "fullName",
      header: t("columns.employee"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <CustomAvatar
            src={row.original.employee.name}
            className="h-8 w-8"
            alt={row.original.employee.name}
          />
          <div className="flex flex-col">
            <span className="font-medium text-body-lg text-gray-black">
              <bdi>{row.original.employee.name}</bdi>
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "iban",
      header: t("columns.iban"),
      cell: ({ row }) => (
        <span className="text-body text-gray-black"><bdi>{row.original.iban}</bdi></span>
      ),
    },
    {
      accessorKey: "amount",
      header: t("columns.amount"),
      cell: ({ row }) => <span className="tabular-nums">{money(Number(row.original.amount), row.original.currency)}</span>,
    },
    // {
    //   accessorKey: "departmentName",
    //   header: "Department",
    //   cell: ({ row }) => (
    //     <span>{row.original.departmentName || "N/A"}</span>
    //   ),
    // },
    {
      accessorKey: "jobTitle",
      header: t("columns.jobTitle"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm"><bdi>{row.original.employee.jobTitle}</bdi></span>
          <span className="text-[10px] text-muted-foreground uppercase">
            <bdi>{row.original.employee.employeeCode}</bdi>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status.toLowerCase() as any}
          size="sm"
        />
      ),
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const [markAsPaid, { isLoading: markingAsPaid }] =
          useMarkPayrollItemAsPaidMutation();

        return (
          <div className="flex items-center gap-2">
            {row.original.status === "queued" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-secondary"
                onClick={() => markAsPaid(row.original.id)}
                disabled={markingAsPaid}
              >
                <Check />
                {t("actions.markPaid")}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return columns;
};

export interface IEmployee {
  id: number;
  runId: number;

  employee: {
    id: number;
    employeeCode: string;
    name: string;
    departmentName: string;
    jobTitle: string;
  };

  paymentMethod: "instapay" | "bank" | "wallet";
  paymentCycle: "monthly" | "weekly" | "biweekly";

  currency: string | null;

  iban: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;

  instapayRegisteredNumber: string | null;
  walletPhoneNumber: string | null;

  baseSalary: number;
  periodBaseSalary: number;

  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;

  amount: number;

  status: "draft" | "submitted" | "approved" | "queued" | "paid";

  approvedAt: string | null;
  queuedAt: string | null;
  paidAt: string | null;
}
