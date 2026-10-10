"use client";
import { CircleNotch as Loader2, WarningCircle as AlertCircle } from "@phosphor-icons/react";

import React, { useState, useEffect } from "react";
import { Button } from "@orgtik/ui";
import { Textarea } from "@orgtik/ui";
import EmployeeApprovalCard, {
  IActivityLog,
  IEmployeeBatch,
  IBreakdownItem,
} from "../EmployeeApprovalCard";
import { cn } from "@/lib/utils";
import ActivitySidebar from "./ActivitySidebar";
import { useFormatter, useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";
import { useRunPeriod } from "@/hooks/useRunPeriod";
import { matchPayrollActivity } from "@/utils/payrollActivity";
import { IPayrollRunByIdAdminResponse, TReviewAction } from "@/types/payroll";
import {
  useApproveAllPayrollMutation,
  useSubmitPayrollReviewMutation,
} from "@/redux/features/payroll/payrollApi";

interface PendingApprovalsPageProps {
  runData: IPayrollRunByIdAdminResponse["data"];
}

export default function PendingApprovalsPage({
  runData,
}: PendingApprovalsPageProps) {
  const t = useTranslations("payroll.adminDetail");
  const tActions = useTranslations("payroll.adminDetail.activityActions");
  const format = useFormatter();
  const runPeriod = useRunPeriod();
  const periodTitle = runData ? runPeriod(runData.run, t("title")) : t("title");
  const [employees, setEmployees] = useState<IEmployeeBatch[]>([]);
  const [generalNote, setGeneralNote] = useState("");

  const [approveAllPayroll, { isLoading: isApproveAllLoading }] =
    useApproveAllPayrollMutation();
  const [submitPayrollReview, { isLoading: isSubmitReviewLoading }] =
    useSubmitPayrollReviewMutation();

  useEffect(() => {
    if (runData) {
      // The admin decides on what HR sent: rows still in draft aren't theirs to approve.
      const mappedEmployees: IEmployeeBatch[] = runData.items.filter((item) => item.status !== "draft").map((item) => {
        const breakdown: IBreakdownItem[] = item.adjustments.map((adj) => ({
          id: String(adj.id),
          type: adj.type === "bonus" ? "bonus" : "deduction",
          amount: adj.amount,
          description: adj.reason,
        }));

        if (item.loanTotal > 0) {
          breakdown.push({ id: `loan-${item.id}`, type: "loan", amount: item.loanTotal });
        }

        let reviewStatus: "APPROVED" | "REJECTED" | null = null;
        if (item.status === "approved") reviewStatus = "APPROVED";
        if (item.status === "rejected") reviewStatus = "REJECTED";

        return {
          id: String(item.id),
          name: item.employee.name,
          code: item.employee.employeeCode,
          department: item.employee.departmentName,
          basicSalary: item.baseSalary,
          bonusTotal: item.bonusTotal,
          deductionTotal: item.deductionTotal,
          loanTotal: item.loanTotal,
          totalThisRun: item.netPayable,
          breakdown: breakdown,
          reviewStatus: reviewStatus,
          hrChangeNote: item.changeRequestNote || "",
        };
      });

      setEmployees(mappedEmployees);
      setGeneralNote(runData.run.note || "");
    }
  }, [runData]);

  const mappedLogs: IActivityLog[] = (runData.activityLogs || []).map(
    (log) => {
      const match = matchPayrollActivity(log.action);
      const userName = `${log.performedByUser?.firstName || ""} ${log.performedByUser?.lastName || ""}`.trim();
      return {
      id: String(log.id),
      // Known actions in the reader's language (names and file names isolated); others as sent.
      title: match
        ? tActions.rich(match.key, {
            count: match.values.count ?? 0,
            name: match.values.name ?? "",
            who: (chunks) => <bdi>{chunks}</bdi>,
          })
        : log.action,
      user: userName ? <bdi>{userName}</bdi> : t("system"),
      timestamp: format.dateTime(new Date(log.createdAt), { dateStyle: "medium", timeStyle: "short" }),
      details: log.metadata?.note || log.metadata?.reason || undefined,
      };
    },
  );

  const handleStatusChange = (
    id: string,
    status: "APPROVED" | "REJECTED" | null,
  ) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              reviewStatus: status,
              hrChangeNote: status === "REJECTED" ? emp.hrChangeNote : "",
            }
          : emp,
      ),
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, hrChangeNote: note } : emp)),
    );
  };

  const handleApproveAll = () => approveAllPayroll({ id: runData.run.id, body: { note: generalNote } }).unwrap();
  const currency = runData.run.displayCurrency;
  // Approve all approves the rows still waiting (the API approves submitted rows only).
  const waiting = runData.items.filter((item) => item.status === "submitted");
  const netTotal = waiting.reduce((sum, item) => sum + (item.netPayable || 0), 0);
  const money = (amount: number) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmitReview = async () => {
    if (!runData?.run?.id) return;

    const itemsToSubmit = employees
      .filter((emp) => emp.reviewStatus !== null)
      .map((emp) => ({
        runItemId: Number(emp.id),
        action: (emp.reviewStatus === "APPROVED"
          ? "approved"
          : "change_requested") as TReviewAction,
        note: emp.hrChangeNote || undefined,
      }));

    if (itemsToSubmit.length === 0) return;

    try {
      await submitPayrollReview({
        runId: runData.run.id,
        body: { items: itemsToSubmit },
      }).unwrap();
    } catch {
      // The base query says what failed, in the reader's language (FS-HR-3).
    }
  };

  const decidedCount = employees.filter(
    (emp) => emp.reviewStatus !== null,
  ).length;
  const isSubmitReviewActive = decidedCount > 0;

  const frozenNote = runData.run.frozenAt
    ? t("hrNoteDescription", { date: format.dateTime(new Date(runData.run.frozenAt), { dateStyle: "medium" }) })
    : t("hrNoteNoDate");

  return (
    <div className="">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="w-full bg-brand-subtle text-primary rounded-[8px] py-2 px-3 flex items-center gap-2 ">
            <AlertCircle className="size-5 shrink-0" />
            <div className="flex items-center ">
              <span className="text-body-lg font-semibold">{t("hrNote")}</span>
              <span className="text-caption">
                {" "}
                {frozenNote}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-title-lg font-semibold text-gray-black">
                {periodTitle}
              </h1>
              <p className="text-body text-secondary max-w-[450px]">
                {t("description")}
              </p>
            </div>

            <div className="flex items-center gap-3 text-secondary">
              <ConfirmDialog
                tone="primary"
                title={t("approveAllConfirm.title", { period: periodTitle })}
                impact={t("approveAllConfirm.impact", { count: waiting.length, amount: money(netTotal) })}
                confirmLabel={t("approveAllConfirm.confirm")}
                cancelLabel={t("approveAllConfirm.cancel")}
                onConfirm={handleApproveAll}
                trigger={
                  <Button variant="secondary" size="lg" disabled={isApproveAllLoading || isSubmitReviewLoading || waiting.length === 0}>
                    {t("approveAll", { count: waiting.length })}
                  </Button>
                }
              />
              <Button
                disabled={
                  !isSubmitReviewActive ||
                  isApproveAllLoading ||
                  isSubmitReviewLoading
                }
                onClick={handleSubmitReview}
                size={"lg"}
                className={cn(
                  "",
                  isSubmitReviewActive
                    ? "bg-primary hover:bg-info-solid text-white"
                    : "border-border bg-background hover:bg-muted hover:text-foreground cursor-not-allowed",
                )}
              >
                {isSubmitReviewLoading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("submitReview")}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {employees.map((employee) => (
              <EmployeeApprovalCard
                key={employee.id}
                employee={employee}
                currency={currency}
                onStatusChange={handleStatusChange}
                onNoteChange={handleNoteChange}
              />
            ))}
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-body font-medium text-gray-black block">
              {t("noteToHr")}{" "}
              <span className="text-secondary font-normal">
                {t("optional")}
              </span>
            </label>
            <div className="relative">
              <Textarea
                dir="auto"
                placeholder={t("messagePlaceholder")}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                maxLength={250}
                className="min-h-[100px]"
              />
              <span className="absolute bottom-3 end-4 text-[11px] font-medium text-secondary">
                {generalNote.length}/250
              </span>
            </div>
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <ActivitySidebar logs={mappedLogs} />
        </div>
      </div>
    </div>
  );
}
