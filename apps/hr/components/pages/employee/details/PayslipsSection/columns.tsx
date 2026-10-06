import { DownloadSimple as Download, Eye } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { IconButton } from "@/components/shared/IconButton";
import { PayslipPreviewDialog } from "@/components/dialogs/PayslipPreviewDialog";
import { MyPayslipItem } from "@/types/payroll";
import { PayslipMoneyCell } from "@/components/pages/payroll/PayslipMoneyCell";
import { formatDate } from "@/utils/formateDate";

type PayslipTranslations = {
  (key: string): string;
};

type EmployeePayslipRowActionsProps = {
  employeeId: string | number;
  payslipId: number;
  hasPayslip: boolean;
  periodTitle: string;
  tPayroll: PayslipTranslations;
  onDownload: (args: {
    employeeId: string | number;
    payslipId: number;
    periodTitle: string;
  }) => Promise<void>;
  isDownloading: boolean;
};

function EmployeePayslipRowActions({
  employeeId,
  payslipId,
  hasPayslip,
  periodTitle,
  tPayroll,
  onDownload,
  isDownloading,
}: EmployeePayslipRowActionsProps) {
  if (!hasPayslip) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <PayslipPreviewDialog
        id={payslipId}
        variant="employee-detail"
        employeeId={employeeId}
      >
        <IconButton
          label={tPayroll("actions.previewPayslip")}
          variant="ghost"
          className="text-secondary hover:text-foreground h-8 w-8"
          type="button"
        >
          <Eye className="size-4" />
        </IconButton>
      </PayslipPreviewDialog>

      <IconButton
        label={tPayroll("actions.downloadPayslip")}
        variant="ghost"
        className="text-secondary hover:text-foreground h-8 w-8"
        onClick={() => onDownload({ employeeId, payslipId, periodTitle })}
        disabled={isDownloading}
        type="button"
      >
        <Download className="size-4" />
      </IconButton>
    </div>
  );
}

export function getEmployeePayslipColumns(
  employeeId: string | number,
  t: PayslipTranslations,
  tPayroll: PayslipTranslations,
  onDownload: EmployeePayslipRowActionsProps["onDownload"],
  isDownloading: boolean,
): ColumnDef<MyPayslipItem>[] {
  return [
    {
      accessorKey: "periodTitle",
      header: t("columns.period"),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          <bdi>{row.original.periodTitle}</bdi>
        </span>
      ),
    },
    {
      id: "periodRange",
      header: t("columns.periodRange"),
      cell: ({ row }) => {
        const { periodStart, periodEnd } = row.original;
        return (
          <span>
            {formatDate(periodStart)} – {formatDate(periodEnd)}
          </span>
        );
      },
    },
    {
      accessorKey: "netPayable",
      header: t("columns.netPay"),
      cell: ({ row }) => (
        <PayslipMoneyCell
          value={row.original.netPayable}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: "paidAt",
      header: t("columns.paidAt"),
      cell: ({ row }) => formatDate(row.original.paidAt),
    },
    {
      accessorKey: "payslipGeneratedAt",
      header: t("columns.generatedAt"),
      cell: ({ row }) => formatDate(row.original.payslipGeneratedAt),
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => (
        <EmployeePayslipRowActions
          employeeId={employeeId}
          payslipId={row.original.id}
          hasPayslip={row.original.hasPayslip}
          periodTitle={row.original.periodTitle}
          tPayroll={tPayroll}
          onDownload={onDownload}
          isDownloading={isDownloading}
        />
      ),
    },
  ];
}
