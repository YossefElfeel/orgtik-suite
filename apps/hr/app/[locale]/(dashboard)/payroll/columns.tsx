"use client";
import { MoneyCell } from "@/components/pages/payroll/MoneyCell";
import { DownloadSimple as Download, Envelope as Mail, Eye, PencilSimple as Pencil, Trash as Trash2 } from "@phosphor-icons/react";

import { useMemo } from "react";
import { IconButton } from "@/components/shared/IconButton";
import { ColumnDef } from "@tanstack/react-table";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import StatusCell from "@/components/shared/Table/Cells/StatusCell";
import StatusBadge from "@/components/shared/StatusBadge";
import PayrollDetailsDraftSheet from "@/components/pages/payroll/PayrollDetailsDraftSheet";
import LoanDetailsSheet from "@/components/pages/loans/LoanDetailsSheet";
import AddPayrollAdjustmentSheet from "@/components/pages/payroll/AddPayrollAdjustmentSheet";
import {
  useDeletePayrollAdjustmentMutation,
  useLazyDownloadPayslipQuery,
  useSendPayslipEmailMutation,
} from "@/redux/features/payroll/payrollApi";
import { useTranslations } from "next-intl";
import { useUserRoles } from "@/hooks/useUserRoles";
import { PayslipPreviewDialog } from "@/components/dialogs/PayslipPreviewDialog";
import type { PayrollSelectColumnLabels } from "@/types/payroll";
import { toast } from "sonner";

export type PayrollTab = "all" | "Bonus" | "Loans" | "Deduction";

export type PayrollRow = {
  id: string;
  employeeId: number;
  employeeName: string;
  employeeAvatar?: string;
  employee: {
    id: number;
  };
  basicSalary: number | null;
  bonus: number | null;
  deduction: number | null;
  loans: number | null;
  totalSalary: number | null;
  /** Used on All, Bonus, Deduction tabs */
  payrollDate: string;
  bonusReason: string | null;
  deductionReason: string | null;
  /** Status for overall payroll, bonus, or deduction */
  status:
    | "paid"
    | "pending"
    | "draft"
    | "submitted"
    | "approved"
    | "change_requested"
    | "paid"
    | "queued"
    | string;
  /** Loans tab — principal / current loan amount */
  loanAmount: number | null;
  loanStartDate: string | null;
  paidLoans: number | null;
  remainsLoans: number | null;
  loanStatus: "paid" | "pending" | "draft" | "submitted" | "change_requested" | string;
  /** Loans tab: the loan this instalment belongs to (opens its details). */
  loanId?: number | null;
};

function Dash() {
  return <span className="text-muted-foreground">---</span>;
}

function TextOrDash({ value }: { value: string | null }) {
  if (!value?.trim()) return <Dash />;
  return (
    <span title={value} className="line-clamp-2 max-w-[min(100%,320px)]">
      {value}
    </span>
  );
}

function EmployeeCell({ name, avatar }: { name: string; avatar?: string }) {
  return (
    <div className="flex min-w-[160px] items-center gap-3">
      <CustomAvatar src={avatar} className="h-8 w-8 shrink-0" />
      <span className="text-body-lg font-medium text-fg">{name}</span>
    </div>
  );
}

const getSelectColumn = (labels: PayrollSelectColumnLabels): ColumnDef<PayrollRow> => ({
  id: "select",
  header: ({ table }) => {
    const isAllSelected = table.getIsAllPageRowsSelected();
    const isSomeSelected = table.getIsSomePageRowsSelected();

    return (
      <Checkbox
        checked={isAllSelected}
        indeterminate={!isAllSelected && isSomeSelected}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={labels.selectAll}
      />
    );
  },
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={labels.selectRow(row.original.employeeName)}
    />
  ),
  enableSorting: false,
  enableHiding: false,
});

// 1. All Tab Columns
function PayslipRowActions({ id }: { id: number }) {
  const t = useTranslations("payroll");
  const { hasRole } = useUserRoles();
  const [triggerDownload, { isLoading: isDownloading }] = useLazyDownloadPayslipQuery();
  const [sendEmail, { isLoading: isSending }] = useSendPayslipEmailMutation();

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

  const handleSendEmail = async () => {
    try {
      await sendEmail(id).unwrap();
    } catch {
      // handled by baseApi
    }
  };

  const canSend = hasRole("finance_manager") || hasRole("hr") || hasRole("super_admin");

  return (
    <>
      <PayslipPreviewDialog id={id}>
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

      {canSend && (
        <IconButton
          label={t("actions.sendPayslip")}
          variant="outline-view"
          type="button"
          onClick={handleSendEmail}
          disabled={isSending}
        >
          <Mail className="size-4 text-primary" />
        </IconButton>
      )}
    </>
  );
}

const getAllColumns = (t: any, runId?: number, frequency?: string): ColumnDef<PayrollRow>[] => [
  {
    accessorKey: "employeeName",
    header: t("columns.employeeName"),
    cell: ({ row }) => (
      <EmployeeCell
        name={row.original.employeeName}
        avatar={row.original.employeeAvatar}
      />
    ),
  },
  {
    accessorKey: "basicSalary",
    header: t("columns.basicSalary"),
    cell: ({ row }) => <MoneyCell value={row.original.basicSalary} />,
  },
  {
    accessorKey: "bonus",
    header: t("columns.bonus"),
    cell: ({ row }) => <MoneyCell value={row.original.bonus} />,
  },
  {
    accessorKey: "deduction",
    header: t("columns.deduction"),
    cell: ({ row }) => (
      <MoneyCell value={row.original.deduction} treatAsNegative />
    ),
  },
  {
    accessorKey: "loans",
    header: t("columns.loans"),
    cell: ({ row }) => <MoneyCell value={row.original.loans} treatAsNegative />,
  },
  {
    accessorKey: "totalSalary",
    header: t("columns.totalSalary"),
    cell: ({ row }) => <MoneyCell value={row.original.totalSalary} />,
  },
  {
    accessorKey: "payrollDate",
    header: t("columns.date"),
    cell: ({ row }) => <span>{row.original.payrollDate}</span>,
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
    cell: ({ row }) => {
      const s = row.original.status;
      if (!s) return <Dash />;
      return <StatusBadge status={s} />;
    },
  },
  {
    id: "actions",
    header: t("columns.action"),
    cell: ({ row }) => {
      const s = row.original.status;
      const isDraft = s === "draft" || s === "change";
      const isPaid = s === "paid";
      const isMonthly = frequency === "monthly";

      return (
        <div className="flex items-center gap-2">
          <PayrollDetailsDraftSheet
            status={s}
            rowData={row.original}
            runId={runId}
          >
            <IconButton
              label={isDraft ? t("tooltips.edit") : t("tooltips.viewDetails")}
              variant="outline-view"
              type="button"
            >
              {isDraft ? (
                <Pencil className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </IconButton>
          </PayrollDetailsDraftSheet>

          {isPaid && isMonthly && (
            <PayslipRowActions id={Number(row.original.id)} />
          )}
        </div>
      );
    },
  },
];

// 2. Bonus Tab Table Columns
const getBonusColumns = (t: any, runId?: number): ColumnDef<PayrollRow>[] => {
  return [
    {
      accessorKey: "employeeName",
      header: t("columns.employeeName"),
      cell: ({ row }) => (
        <EmployeeCell
          name={row.original.employeeName}
          avatar={row.original.employeeAvatar}
        />
      ),
    },
    {
      accessorKey: "bonus",
      header: t("columns.bonus"),
      cell: ({ row }) => <MoneyCell value={row.original.bonus} />,
    },
    {
      id: "bonusReason",
      header: t("columns.bonusReason"),
      cell: ({ row }) => <TextOrDash value={row.original.bonusReason} />,
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        if (!s) return <Dash />;
        return <StatusBadge status={s} />;
      },
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const s = row.original.status;
        const isDraft = s === "draft" || s === "change";

        return (
          <div className="flex items-center gap-2">
            <PayrollDetailsDraftSheet
              status={s}
              rowData={row.original}
              runId={runId}
            >
              <IconButton
                label={isDraft ? t("tooltips.edit") : t("tooltips.viewDetails")}
                variant="outline-view"
                type="button"
              >
                {isDraft ? (
                  <Pencil className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </IconButton>
            </PayrollDetailsDraftSheet>
          </div>
        );
      },
    },
  ];
};

// 3. Deduction Tab Table Columns
const getDeductionColumns = (
  t: any,
  runId?: number,
): ColumnDef<PayrollRow>[] => {
  return [
    {
      accessorKey: "employeeName",
      header: t("columns.employeeName"),
      cell: ({ row }) => (
        <EmployeeCell
          name={row.original.employeeName}
          avatar={row.original.employeeAvatar}
        />
      ),
    },
    {
      accessorKey: "deduction",
      header: t("columns.deduction"),
      cell: ({ row }) => (
        <MoneyCell value={row.original.deduction} treatAsNegative />
      ),
    },
    {
      id: "deductionReason",
      header: t("columns.deductionReason"),
      cell: ({ row }) => <TextOrDash value={row.original.deductionReason} />,
    },
    {
      accessorKey: "payrollDate",
      header: t("columns.date"),
      cell: ({ row }) => <span>{row.original.payrollDate}</span>,
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        if (!s) return <Dash />;
        return <StatusBadge status={s} />;
      },
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const s = row.original.status;
        const isDraft = s === "draft" || s === "change";

        return (
          <div className="flex items-center gap-2">
            <PayrollDetailsDraftSheet
              status={s}
              rowData={row.original}
              runId={runId}
            >
              <IconButton
                label={isDraft ? t("tooltips.edit") : t("tooltips.viewDetails")}
                variant="outline-view"
                type="button"
              >
                {isDraft ? (
                  <Pencil className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </IconButton>
            </PayrollDetailsDraftSheet>
          </div>
        );
      },
    },
  ];
};

// 4. Loans Tab Table Columns
const getLoansColumns = (t: any, runId?: number): ColumnDef<PayrollRow>[] => [
  {
    accessorKey: "employeeName",
    header: t("columns.employeeName"),
    cell: ({ row }) => (
      <EmployeeCell
        name={row.original.employeeName}
        avatar={row.original.employeeAvatar}
      />
    ),
  },
  {
    accessorKey: "loanAmount",
    header: t("columns.loans"),
    cell: ({ row }) => <MoneyCell value={row.original.loanAmount} />,
  },
  {
    accessorKey: "loanStartDate",
    header: t("columns.startDate"),
    cell: ({ row }) =>
      row.original.loanStartDate ? (
        <span>{row.original.loanStartDate}</span>
      ) : (
        <Dash />
      ),
  },
  {
    accessorKey: "paidLoans",
    header: t("columns.paidLoans"),
    cell: ({ row }) => <MoneyCell value={row.original.paidLoans} />,
  },
  {
    accessorKey: "remainsLoans",
    header: t("columns.remainsLoans"),
    cell: ({ row }) => <MoneyCell value={row.original.remainsLoans} />,
  },
  {
    id: "loanStatus",
    header: t("columns.status"),
    cell: ({ row }) => {
      const s = row.original.loanStatus;
      if (!s) return <Dash />;
      return <StatusBadge status={s} />;
    },
  },
  {
    id: "actions",
    header: t("columns.action"),
    cell: ({ row }) => {
      const s = row.original.loanStatus;
      const isDraft = s === "draft" && "change_requested";

      return (
        <div className="flex items-center gap-2">
          {/* A loan row opens that loan (HR-032); it used to open a static page for every row. */}
          {row.original.loanId ? (
            <LoanDetailsSheet loanId={row.original.loanId}>
              <IconButton label={t("tooltips.view")} variant="outline-view" type="button">
                <Eye className="size-4" />
              </IconButton>
            </LoanDetailsSheet>
          ) : null}
          <PayrollDetailsDraftSheet
            status={s as any}
            rowData={row.original}
            runId={runId}
          >
            <IconButton
              label={isDraft ? t("tooltips.edit") : t("tooltips.viewDetails")}
              variant="outline-view"
              type="button"
            >
              <Pencil className="size-4" />
            </IconButton>
          </PayrollDetailsDraftSheet>
        </div>
      );
    },
  },
];

export function useColumns({
  activeTab,
  runId,
  frequency,
}: {
  activeTab: PayrollTab;
  runId?: number;
  frequency?: string;
}) {
  const t = useTranslations("payroll");

  const withSelection = (cols: ColumnDef<PayrollRow>[]) => [
    getSelectColumn({
      selectAll: t("columns.selectAll"),
      selectRow: (name: string) => t("columns.selectEmployee", { name }),
    }),
    ...cols,
  ];

  return useMemo(() => {
    switch (activeTab) {
      case "all":
        return withSelection(getAllColumns(t, runId, frequency));
      case "Bonus":
        return withSelection(getBonusColumns(t, runId));
      case "Deduction":
        return withSelection(getDeductionColumns(t, runId));
      case "Loans":
        return withSelection(getLoansColumns(t, runId));
      default:
        return withSelection(getAllColumns(t, runId, frequency));
    }
  }, [activeTab, runId, t]);
}

/** Mock rows covering full, partial, and empty (-) value states per design */
