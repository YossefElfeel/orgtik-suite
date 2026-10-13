"use client";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { IconButton } from "@/components/shared/IconButton";
import { Check, DownloadSimple as Download, Envelope as Mail, Eye, PencilSimple as Pencil, Plus, Trash as Trash2, WarningCircle as AlertCircle, X } from "@phosphor-icons/react";

import React, { useState } from "react";
import ReusableSheet from "@/components/shared/ResuableSheet";
import StatusBadge from "@/components/bindings/EmploymentStatus";
import { useForm } from "react-hook-form";
import type { SalaryItemFormValues } from "@/schemas/payroll/salary-item.schemas";
import TextFormEle from "@/components/ui/form/text-form-element";
import { Form } from "@/components/ui/form";
import { Button } from "@orgtik/ui";

import {
  useUpdatePayrollAdjustmentMutation,
  useDeletePayrollAdjustmentMutation,
  useGetPayrollItemByIdQuery,
  useUpdateLoanApplicationMutation,
  useLazyDownloadPayslipQuery,
  useSendPayslipEmailMutation,
} from "@/redux/features/payroll/payrollApi";
import { PayrollRow } from "@/app/[locale]/(dashboard)/payroll/columns";

import AddPayrollAdjustmentSheet from "@/components/pages/payroll/AddPayrollAdjustmentSheet";
import AddLoanAmountSheet from "@/components/pages/payroll/AddLoanAmountSheet";
import { useFormatter, useTranslations } from "next-intl";
import { useUserRoles } from "@/hooks/useUserRoles";
import { PayslipPreviewDialog } from "@/components/dialogs/PayslipPreviewDialog";
import { usePayrollCurrency } from "@/components/pages/payroll/PayrollCurrency";
import { toast } from "sonner";

// ================= Types =================
// The inline edit form's values come from schemas/payroll/salary-item.schemas. Its resolver stays
// off as before: the amount input sends a number, which that string schema would refuse.

export interface SalaryItem {
  id: string;
  title: string;
  amount: number;
  mode: "fixed" | "days" | "percent" | "months";
}

interface PayrollDetailsSheetProps {
  children: React.ReactNode;
  status:
    | "paid"
    | "pending"
    | "draft"
    | "submitted"
    | "change_requested"
    | "queued"
    | string;
  rowData?: PayrollRow;
  runId?: number;
  frequency?: string;
}

export default function PayrollDetailsDraftSheet({
  children,
  status,
  rowData,
  runId,
  frequency,
}: PayrollDetailsSheetProps) {
  const [open, setOpen] = useState<boolean>(false);
  const { data: itemResponse, isLoading: isLoadingData } =
    useGetPayrollItemByIdQuery(Number(rowData?.id), {
      skip: !open || !rowData?.id,
    });
  const [updateAdjustment, { isLoading: isUpdating }] =
    useUpdatePayrollAdjustmentMutation();
  const [deleteAdjustment, { isLoading: isDeleting }] =
    useDeletePayrollAdjustmentMutation();
  const [updateLoanApplication, { isLoading: isUpdatingLoanApp }] =
    useUpdateLoanApplicationMutation();

  const t = useTranslations("payroll");
  const format = useFormatter();
  const runCurrency = usePayrollCurrency();
  const { hasRole } = useUserRoles();
  const [triggerDownload, { isLoading: isDownloading }] = useLazyDownloadPayslipQuery();
  const [sendEmail, { isLoading: isSending }] = useSendPayslipEmailMutation();

  const handleDownload = async () => {
    try {
      const blob = await triggerDownload(Number(rowData?.id)).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${rowData?.id}.pdf`;
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
      await sendEmail(Number(rowData?.id)).unwrap();
    } catch {
      // handled by baseApi
    }
  };

  const itemData = itemResponse?.data;

  // Mapping real data from API response
  const basicSalary = itemData?.baseSalary || rowData?.basicSalary || 0;
  // The item's currency, else the run's (it said "CHF" when the item had none).
  const currency: string | null = itemData?.currency || runCurrency || null;
  const employeeId = itemData?.employee?.id || rowData?.employeeId;

  const bonuses: SalaryItem[] = (itemData?.adjustments || [])
    .filter((adj: any) => adj.type === "bonus")
    .map((adj: any) => ({
      id: adj.id.toString(),
      title: adj.reason || t("review.items.bonus"),
      amount: adj.amount,
      mode: adj.mode || "fixed",
    }));

  const deductions: SalaryItem[] = (itemData?.adjustments || [])
    .filter((adj: any) => adj.type === "deduction")
    .map((adj: any) => ({
      id: adj.id.toString(),
      title: adj.reason || t("review.items.deduction"),
      amount: adj.amount,
      mode: adj.mode || "fixed",
    }));

  const loanDeductions: SalaryItem[] = (itemData?.loanApplications || []).filter((loan: { appliedAmount: number }) => loan.appliedAmount > 0).map(
    (loan: any) => ({
      id: loan.id.toString(),
      title: loan.notes || t("draftSheet.loanInstallmentAuto"),
      amount: -Math.abs(loan.appliedAmount),
      mode: "fixed",
    }),
  );

  const totalBonuses = bonuses.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalThisRun = basicSalary + totalBonuses + totalDeductions;
  const totalLoanDeductions = loanDeductions.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const netSalary = totalThisRun + totalLoanDeductions;
  const currentStatus = (itemData?.status || status)?.toLowerCase();

  // In the reader's language and the currency's own decimals (it was Swiss German, three decimals).
  const formatCurrency = (value: number) => {
    const abs = Math.abs(value);
    const formatted = currency
      ? format.number(abs, { style: "currency", currency })
      : format.number(abs, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value < 0 ? "-" : ""}${formatted}`;
  };

  const handleSaveItem = async (
    id: string,
    updatedFields: { title: string; amount: number },
    isBonus: boolean,
  ) => {
    try {
      await updateAdjustment({
        id: Number(id),
        body: {
          employeeId: employeeId,
          mode: "fixed",
          value: Math.abs(updatedFields.amount),
          reason: updatedFields.title,
        },
      }).unwrap();
    } catch (error) {
      throw error;
    }
  };

  // The confirm waits for this and stays open if it fails (the base query says why).
  const handleDeleteItem = (id: string) => deleteAdjustment(Number(id)).unwrap();

  const handleUpdateLoanDeduction = async (
    id: string,
    updatedFields: { title: string; amount: number },
  ) => {
    try {
      await updateLoanApplication({
        id: Number(id),
        body: {
          appliedAmount: Math.abs(updatedFields.amount),
          notes: updatedFields.title,
        },
      }).unwrap();
    } catch (err) {
      throw err;
    }
  };

  return (
    <ReusableSheet
      open={open}
      onOpenChange={setOpen}
      title={
        itemData?.employee?.name || rowData?.employeeName || t("draftSheet.title")
      }
      size="xl"
      trigger={children}
    >
      {isLoadingData ? (
        <div role="status" className="p-10 text-center text-secondary">
          {t("draftSheet.loading")}
        </div>
      ) : (
        <div className="space-y-6 pb-8 text-sm text-fg">
          {/* Header Employee Card */}
          <div className="flex items-center justify-between rounded-xl bg-gray p-4 ">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-subtle font-medium text-success ">
                {(itemData?.employee?.name || rowData?.employeeName || "E")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-black text-body-lg ">
                    {itemData?.employee?.name || rowData?.employeeName}
                  </h4>
                  <StatusBadge status={itemData?.status || status} />
                </div>
                <p className="text-body text-secondary mt-0.5">
                  {itemData?.employee?.employeeCode || rowData?.id}{" "}
                  <span className="mx-1">•</span>{" "}
                  {itemData?.employee?.departmentName || t("draftSheet.generalDepartment")}
                </p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-caption text-secondary">{t("review.totalThisRun")}</p>
              <p className="text-title-sm font-medium text-gray-black tabular-nums">
                {/* {formatCurrency(totalThisRun)} */}
                {itemData?.netPayable != null ? formatCurrency(Number(itemData.netPayable)) : "-"}
              </p>
            </div>
          </div>

          {currentStatus === "change_requested" && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-subtle border border-danger/30 p-4 text-danger text-body font-medium">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{t("draftSheet.adminNote", { note: itemData?.changeRequestNote ?? "" })}</span>
            </div>
          )}

          {currentStatus !== "draft" && (
            <div className="rounded-xl bg-brand-subtle p-4 text-fg-brand text-body">
              {t("draftSheet.locked")}
            </div>
          )}

          {currentStatus === "paid" && frequency === "monthly" && (
            <div className="rounded-xl border border-line p-4 bg-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="font-semibold text-body text-secondary">
                {t("draftSheet.payslipPdf")}
              </span>
              <div className="flex items-center gap-2">
                <PayslipPreviewDialog id={Number(rowData?.id)}>
                  <div>
                    <Button variant="secondary" size="sm" className="h-9">
                      <Eye className="size-4 me-1.5" />
                      {t("actions.previewPayslip")}
                    </Button>
                  </div>
                </PayslipPreviewDialog>

                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="size-4 me-1.5" />
                  {t("actions.downloadPayslip")}
                </Button>

                {(hasRole("finance_manager") ||
                  hasRole("hr") ||
                  hasRole("super_admin")) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9"
                    onClick={handleSendEmail}
                    disabled={isSending}
                  >
                    <Mail className="size-4 me-1.5" />
                    {t("actions.sendPayslip")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Salary Breakdown Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-body text-secondary">
              {t("draftSheet.salaryBreakdown")}
            </h3>
            <div className="space-y-2.5 rounded-xl">
              <div className="flex justify-between ">
                <span className="text-body text-secondary">{t("columns.basicSalary")}</span>
                <span className="text-body-lg font-medium text-gray-black ">
                  {formatCurrency(basicSalary)}
                </span>
              </div>

              {/* Bonuses subtotal */}
              <div className="space-y-1.5 pt-1 ">
                <div className="flex justify-between text-body text-secondary">
                  <span>{t("draftSheet.bonusesSubtotal", { count: bonuses.length })}</span>
                  <span className="text-success">
                    +{formatCurrency(totalBonuses)}
                  </span>
                </div>
                {bonuses.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="flex justify-between text-caption text-secondary ps-3"
                  >
                    <span>{bonus.title}</span>
                    <span className="text-success">
                      +{formatCurrency(bonus.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Deductions subtotal */}
              <div className="space-y-1.5 pt-1 border-b pb-2">
                <div className="flex justify-between text-body text-secondary">
                  <span>{t("draftSheet.deductionsSubtotal", { count: deductions.length })}</span>
                  <span className="text-danger">
                    {formatCurrency(totalDeductions)}
                  </span>
                </div>
                {deductions.map((deductions) => (
                  <div
                    key={deductions.id}
                    className="flex justify-between text-xs text-fg-muted ps-3"
                  >
                    <span>{deductions.title}</span>
                    <span className="text-danger">
                      {formatCurrency(deductions.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Net Row */}
              <div className="flex justify-between items-center bg-gray p-2.5 rounded-lg font-bold text-fg mt-2 ">
                <span className="text-body font-medium text-secondary">{t("draftSheet.net")}</span>
                <span className="text-body font-medium text-gray-black">
                  {formatCurrency(netSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Section Template Helper */}
          <EditableSection
            title={t("draftSheet.bonuses")}
            items={bonuses}
            isBonus={true}
            formatCurrency={formatCurrency}
            onUpdateItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            currencySymbol={currency ?? ""}
            status={status}
            runId={runId}
            employeeId={employeeId}
          />

          <EditableSection
            title={t("draftSheet.deductions")}
            items={deductions}
            isBonus={false}
            formatCurrency={formatCurrency}
            onUpdateItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            currencySymbol={currency ?? ""}
            status={status}
            runId={runId}
            employeeId={employeeId}
          />

          {/* Loan Deductions (Auto) Section (editable) */}
          <EditableSection
            title={t("draftSheet.loanDeductions")}
            items={loanDeductions}
            isBonus={false}
            formatCurrency={formatCurrency}
            onUpdateItem={handleUpdateLoanDeduction}
            onDeleteItem={(id) => updateLoanApplication({ id: Number(id), body: { appliedAmount: 0 } }).unwrap()}
            currencySymbol={currency ?? ""}
            status={status}
            runId={runId}
            employeeId={employeeId}
          />

        </div>
      )}
    </ReusableSheet>
  );
}

// ================= EditableSection Component =================
interface EditableSectionProps {
  title: string;
  items: SalaryItem[];
  isBonus: boolean;
  formatCurrency: (value: number) => string;
  currencySymbol: string;
  status: string;
  onUpdateItem: (
    id: string,
    updatedFields: { title: string; amount: number },
    isBonus: boolean,
  ) => void;
  onDeleteItem: (id: string) => Promise<unknown> | void;
  runId?: number;
  employeeId?: number;
}

function EditableSection({
  title,
  items,
  isBonus,
  formatCurrency,
  currencySymbol,
  status,
  onUpdateItem,
  onDeleteItem,
  runId,
  employeeId,
}: EditableSectionProps) {
  const t = useTranslations("payroll.actions");

const isDraft = status === "draft" || status === "change_requested";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-secondary">{title}</h3>

        {isDraft  && (
          <AddPayrollAdjustmentSheet
            type={isBonus ? "bonus" : "deduction"}
            runId={runId}
            employeeId={employeeId}
            trigger={
              <button className="flex items-center gap-1 text-xs font-semibold border border-line hover:bg-sunken px-2.5 py-1.5 rounded-lg text-fg transition-colors">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {isBonus ? t("addBonus") : t("addDeduction")}
              </button>
            }
          />
        )}
      </div>
      <div className="rounded-xl border border-line bg-raised divide-y divide-line ">
        {items.map((item) => (
          <EditableRow
            key={item.id}
            item={item}
            isBonus={isBonus}
            formatCurrency={formatCurrency}
            currencySymbol={currencySymbol}
            status={status}
            onSave={(updatedData) =>
              onUpdateItem(item.id, updatedData, isBonus)
            }
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ================= EditableRow Component =================
interface EditableRowProps {
  item: SalaryItem;
  isBonus: boolean;
  formatCurrency: (value: number) => string;
  currencySymbol: string;
  status: string;
  onSave: (data: { title: string; amount: number }) => Promise<unknown> | void;
  /** Runs the delete; the confirm waits for it. */
  onDelete: () => Promise<unknown> | void;
}

function EditableRow({
  item,
  isBonus,
  formatCurrency,
  currencySymbol,
  status,
  onSave,
  onDelete,
}: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const tDelete = useTranslations("payroll.adjustmentRow");
  const t = useTranslations("payroll"), r = useTranslations("Roadmap");
const isDraft = status === "draft" || status === "change_requested";

  const form = useForm<SalaryItemFormValues>({
    // resolver: zodResolver(salaryItemSchema),
    defaultValues: {
      title: item.title,
      amount: String(Math.abs(item.amount)) as any,
    },
  });

  const onSubmit = async (values: SalaryItemFormValues) => {
    const finalAmount = isBonus
      ? Number(values.amount)
      : -Math.abs(Number(values.amount));
    try {
      await onSave({ title: values.title, amount: finalAmount || 0 });
      setIsEditing(false);
    } catch { form.setError("root", { message: r("saveError") }); }
  };

  if (isEditing && isDraft) {
    return (
      <form
        aria-busy={form.formState.isSubmitting}
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-3 flex items-center justify-between gap-4 bg-sunken first:rounded-t-xl last:rounded-b-xl"
      >
        {form.formState.errors.root ? <p role="alert" className="text-caption text-danger">{form.formState.errors.root.message}</p> : null}
        <Form {...form}>
          <div className="flex flex-1 items-center gap-2">
            <div className="w-[100px] shrink-0">
              <TextFormEle
                form={form}
                name="amount"
                type="number"
                placeholder={t("adjustmentSheet.fields.amount")}
                inlineSuffix={
                  <span className="text-caption text-fg-subtle">
                    {currencySymbol}
                  </span>
                }
                inputClassName="h-9 text-sm font-bold"
              />
            </div>
            <div className="flex-1">
              <TextFormEle
                form={form}
                name="title"
                placeholder={t("draftSheet.reasonPlaceholder")}
                inputClassName="h-9 text-xs"
              />
            </div>
          </div>
        </Form>

        <div className="flex gap-1.5 shrink-0">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            aria-label={t("draftSheet.saveItem")}
            title={t("draftSheet.saveItem")}
            className="p-1.5 text-success hover:bg-success-subtle border border-line rounded-lg transition-colors"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={form.formState.isSubmitting}
            aria-label={t("adjustmentSheet.actions.cancel")}
            title={t("adjustmentSheet.actions.cancel")}
            onClick={() => {
              form.reset();
              setIsEditing(false);
            }}
            className="p-1.5 text-fg-muted hover:bg-sunken border border-line rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 flex justify-between items-center hover:bg-sunken transition-colors first:rounded-t-xl last:rounded-b-xl">
      <div className="space-y-0.5">
        <span
          className={`text-base font-bold ${isBonus ? "text-success" : "text-danger"}`}
        >
          {isBonus ? "+" : ""}
          {formatCurrency(item.amount)}
        </span>
        <p className="text-xs text-fg-muted">{item.title}</p>
      </div>

      {isDraft && (
        <div className="flex gap-1.5">
          <IconButton
            label={tDelete("edit")}
            variant="ghost"
            size="xs"
            onClick={() => setIsEditing(true)}
            className="text-fg-muted hover:text-fg hover:bg-sunken border border-line rounded-lg"
          >
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <DeleteDialog
            title={tDelete(isBonus ? "bonusTitle" : "deductionTitle", { title: item.title, amount: formatCurrency(Math.abs(item.amount)) })}
            description={tDelete("adjustmentImpact")}
            confirmText={tDelete(isBonus ? "bonusConfirm" : "deductionConfirm")}
            onConfirm={onDelete}
            trigger={
              <IconButton
                label={tDelete(isBonus ? "bonusConfirm" : "deductionConfirm")}
                variant="ghost"
                size="xs"
                className="text-fg-muted hover:text-danger hover:bg-danger-subtle border border-line rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            }
          />
        </div>
      )}
    </div>
  );
}
