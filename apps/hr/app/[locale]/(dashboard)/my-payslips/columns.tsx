"use client";
import { DownloadSimple as Download, Eye } from "@phosphor-icons/react";

import { useMemo } from "react";
import { IconButton } from "@/components/shared/IconButton";
import { ColumnDef } from "@tanstack/react-table";
import { PayslipPreviewDialog } from "@/components/dialogs/PayslipPreviewDialog";
import { useLazyDownloadMyPayslipQuery } from "@/redux/features/payroll/payrollApi";
import { MyPayslipItem } from "@/types/payroll";
import { PayslipMoneyCell } from "@/components/pages/payroll/PayslipMoneyCell";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

function MyPayslipRowActions({
  id,
  hasPayslip,
  periodTitle,
}: {
  id: number;
  hasPayslip: boolean;
  periodTitle: string;
}) {
  const t = useTranslations("payroll");
  const [triggerDownload, { isLoading: isDownloading }] =
    useLazyDownloadMyPayslipQuery();

  const handleDownload = async () => {
    try {
      const blob = await triggerDownload(id).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${periodTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("payslip.downloadError"));
    }
  };

  if (!hasPayslip) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <PayslipPreviewDialog id={id} variant="employee">
        <IconButton label={t("actions.previewPayslip")} variant="outline-view" type="button">
          <Eye className="size-4 text-primary" />
        </IconButton>
      </PayslipPreviewDialog>

      <IconButton
        label={t("actions.downloadPayslip")}
        variant="outline-view"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className="size-4 text-primary" />
      </IconButton>
    </div>
  );
}

export function useMyPayslipColumns() {
  const t = useTranslations("myPayslips.columns");

  return useMemo<ColumnDef<MyPayslipItem>[]>(
    () => [
      {
        accessorKey: "periodTitle",
        header: t("period"),
        cell: ({ row }) => (
          <span className="font-medium text-fg">{row.original.periodTitle}</span>
        ),
      },
      {
        id: "periodRange",
        header: t("periodRange"),
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
        header: t("netPay"),
        cell: ({ row }) => (
          <PayslipMoneyCell
            value={row.original.netPayable}
            currency={row.original.currency}
          />
        ),
      },
      {
        accessorKey: "paidAt",
        header: t("paidAt"),
        cell: ({ row }) => formatDate(row.original.paidAt),
      },
      {
        accessorKey: "payslipGeneratedAt",
        header: t("generatedAt"),
        cell: ({ row }) => formatDate(row.original.payslipGeneratedAt),
      },
      {
        id: "actions",
        header: t("action"),
        cell: ({ row }) => (
          <MyPayslipRowActions
            id={row.original.id}
            hasPayslip={row.original.hasPayslip}
            periodTitle={row.original.periodTitle}
          />
        ),
      },
    ],
    [t],
  );
}
