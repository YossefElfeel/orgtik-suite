"use client";
import { Coins, DownloadSimple as Download, Eye, FileMinus as FileMinus2, Gift, Wallet } from "@phosphor-icons/react";

import { useMemo, useState } from "react";
import { TabMenu } from "@/components/shared/TabMenu";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionCard } from "./SectionCard";
import { StatusPill } from "./StatusPill";
import type {
  FinanceTabKey,
  ParoleRow,
  BonusRow,
  DeductionRow,
  LoanRow,
  LoanTotals,
} from "./types";

import { InfoCardSkeleton } from "@/components/ui/info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLazyDownloadPayslipQuery } from "@/redux/features/payroll/payrollApi";
import { useTranslations } from "next-intl";
import { PayslipPreviewDialog } from "@/components/dialogs/PayslipPreviewDialog";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("en-US")} CHF`;
}

function ParoleActionCell({ id, status }: { id: number; status: string }) {
  const t = useTranslations("payroll");
  const [triggerDownload, { isLoading: isDownloading }] = useLazyDownloadPayslipQuery();

  const handleDownload = async () => {
    try {
      const blob = await triggerDownload(id).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("payslip.downloadError"));
    }
  };

  const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "paid";

  if (!isApproved) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <PayslipPreviewDialog id={id}>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-foreground h-8 w-8"
            aria-label="Preview payslip"
          >
            <Eye className="size-4" />
          </Button>
        </div>
      </PayslipPreviewDialog>

      <Button
        variant="ghost"
        size="icon"
        className="text-secondary hover:text-foreground h-8 w-8"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label="Download payslip"
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}

type FinanceSectionProps = {
  paroleRows: ParoleRow[];
  bonusRows: BonusRow[];
  deductionRows: DeductionRow[];
  loanRows: LoanRow[];
  loanTotals: LoanTotals;
  isLoading?: boolean;
};

export function FinanceSection({
  paroleRows,
  bonusRows,
  deductionRows,
  loanRows,
  loanTotals,
  isLoading,
}: FinanceSectionProps) {
  const [activeFinanceTab, setActiveFinanceTab] =
    useState<FinanceTabKey>("paroles");

  if (isLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="space-y-6">
          <div className="flex gap-4 border-b pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </InfoCardSkeleton>
    );
  }

  const paroleColumns = useMemo<ColumnDef<ParoleRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.date}</span>,
      },
      {
        accessorKey: "baseSalary",
        header: "Base Salary",
        cell: ({ row }) => formatCurrency(row.original.baseSalary),
      },
      {
        accessorKey: "bonus",
        header: "Bonus",
        cell: ({ row }) => formatCurrency(row.original.bonus),
      },
      {
        accessorKey: "deductions",
        header: "Deductions",
        cell: ({ row }) =>
          row.original.deductions === 0 ? "-" : `-${formatCurrency(row.original.deductions)}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.status} />,
      },
      {
        accessorKey: "totalSalary",
        header: "Total salary",
        cell: ({ row }) => formatCurrency(row.original.totalSalary),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <ParoleActionCell id={Number(row.original.id)} status={row.original.status} />
        ),
      },
    ],
    []
  );

  const bonusColumns = useMemo<ColumnDef<BonusRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.date}</span>,
      },
      {
        accessorKey: "bonus",
        header: "Bonus",
        cell: ({ row }) => formatCurrency(row.original.bonus),
      },
      {
        accessorKey: "reason",
        header: "Bonus Reason",
        cell: ({ row }) => <span className="text-secondary">{row.original.reason}</span>,
      },
      {
        id: "action",
        header: "Action",
        cell: () => (
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-foreground"
            aria-label="View bonus entry"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    []
  );

  const deductionColumns = useMemo<ColumnDef<DeductionRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.date}</span>,
      },
      {
        accessorKey: "deduction",
        header: "Deduction",
        cell: ({ row }) => formatCurrency(row.original.deduction),
      },
      {
        accessorKey: "reason",
        header: "Deduction Reason",
        cell: ({ row }) => <span className="text-secondary line-clamp-2">{row.original.reason}</span>,
      },
      {
        id: "action",
        header: "Action",
        cell: () => (
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-foreground"
            aria-label="View deduction entry"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    []
  );

  const loanColumns = useMemo<ColumnDef<LoanRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.date}</span>,
      },
      {
        accessorKey: "paid",
        header: "Paid loan",
        cell: ({ row }) => formatCurrency(row.original.paid),
      },
      {
        accessorKey: "remaining",
        header: "Remains loan",
        cell: ({ row }) => formatCurrency(row.original.remaining),
      },
      {
        id: "action",
        header: "Action",
        cell: () => (
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-foreground"
            aria-label="View loan entry"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <SectionCard title="Finance" icon={Coins}>
      <TabMenu
        className="pb-4"
        defaultActive={activeFinanceTab}
        onChange={(key) => setActiveFinanceTab(key as FinanceTabKey)}
        items={[
          { key: "paroles", label: "Paroles", icon: <Coins className="size-5" /> },
          { key: "bonus", label: "Bonus", icon: <Gift className="size-5" /> },
          { key: "deductions", label: "Deductions", icon: <FileMinus2 className="size-5" /> },
          { key: "loans", label: "Loans", icon: <Wallet /> },
        ]}
      />

      {activeFinanceTab === "paroles" && (
        <DataTable
          columns={paroleColumns}
          data={paroleRows}
          pagination={{
            currentPage: 1,
            totalPages: 10,
            limit: 8,
            totalItems: 50,
            baseUrl: "#",
          }}
          emptyMessage="No payroll data yet."
        />
      )}

      {activeFinanceTab === "bonus" && (
        <DataTable
          columns={bonusColumns}
          data={bonusRows}
          pagination={{
            currentPage: 1,
            totalPages: 10,
            limit: 8,
            totalItems: 50,
            baseUrl: "#",
          }}
          emptyMessage="No bonus records yet."
        />
      )}

      {activeFinanceTab === "deductions" && (
        <DataTable
          columns={deductionColumns}
          data={deductionRows}
          pagination={{
            currentPage: 1,
            totalPages: 10,
            limit: 8,
            totalItems: 50,
            baseUrl: "#",
          }}
          emptyMessage="No deductions yet."
        />
      )}

      {activeFinanceTab === "loans" && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total loans", value: loanTotals.totalLoan },
              { label: "Paid loans", value: loanTotals.paidLoan },
              { label: "Remains loans", value: loanTotals.remainsLoan },
              { label: "Paid Monthly", value: loanTotals.paidMonthly },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-gray px-4 py-3"
              >
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(card.value)}
                </p>
                <p className="text-xs text-secondary">{card.label}</p>
              </div>
            ))}
          </div>

          <DataTable
            columns={loanColumns}
            data={loanRows}
            pagination={{
              currentPage: 1,
              totalPages: 10,
              limit: 8,
              totalItems: 50,
              baseUrl: "#",
            }}
            emptyMessage="No loans yet."
          />
        </div>
      )}
    </SectionCard>
  );
}
