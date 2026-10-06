"use client";

// One person in a payroll batch the admin reviews (FS-HR-7). Approve and Request change are
// toggles (aria-pressed); money is in the run's own currency through the formatter (it always
// said "CHF"); the words are translated, and the "Bouns" typo is gone with the item types.
import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmployeeApprovalCardProps } from "@/types/payroll";

export type { IActivityLog, IBreakdownItem, IEmployeeBatch, IItemType } from "@/types/payroll";

export default function EmployeeApprovalCard({ employee, currency, onStatusChange, onNoteChange }: EmployeeApprovalCardProps) {
  const t = useTranslations("payroll.review");
  const format = useFormatter();
  const isApproved = employee.reviewStatus === "APPROVED";
  const isRejected = employee.reviewStatus === "REJECTED";
  const noteId = `hr-change-${employee.id}`;

  const money = (amount: number) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Zero is a neutral dash: green or red only for money that moves.
  const signed = (amount: number, sign: "+" | "-") =>
    amount > 0 ? `${sign === "-" ? "−" : "+"}${money(amount)}` : <span className="text-fg-subtle">—</span>;

  return (
    <article className="w-full bg-raised border border-line rounded-[10px] overflow-hidden">
      <div className="p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-line">
            <AvatarImage src={employee.avatarUrl} alt="" />
            <AvatarFallback className="bg-line text-fg-muted font-bold">
              {employee.name ? employee.name.split(" ").map((n) => n[0]).join("") : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <h3 className="text-body-lg font-medium text-gray-black">
              <bdi>{employee.name}</bdi>
            </h3>
            <p className="text-caption text-secondary flex items-center gap-1">
              <bdi>{employee.code}</bdi>
              <span aria-hidden="true" className="bg-line-strong h-[6px] w-[6px] rounded-full inline-block" />
              <bdi>{employee.department}</bdi>
            </p>
          </div>
        </div>

        <div className="sm:text-end space-y-0.5 flex flex-col">
          <span className="text-caption text-secondary">{t("totalThisRun")}</span>
          <span className="text-title-sm font-medium text-gray-black tabular-nums">{money(employee.totalThisRun)}</span>
        </div>
      </div>

      <dl className="p-5 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-raised border-b border-line/60">
        <div className="space-y-1">
          <dt className="text-body-lg text-secondary">{t("basic")}</dt>
          <dd className="text-body-lg font-semibold text-gray-black tabular-nums">{money(employee.basicSalary)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-body-lg text-secondary">{t("bonus")}</dt>
          <dd className="text-body-lg font-semibold text-success tabular-nums">{signed(employee.bonusTotal, "+")}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-body-lg text-secondary">{t("deduction")}</dt>
          <dd className="text-body-lg font-semibold text-danger tabular-nums">{signed(employee.deductionTotal, "-")}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-body-lg text-secondary">{t("loan")}</dt>
          <dd className="text-body-lg font-semibold text-danger tabular-nums">{signed(employee.loanTotal, "-")}</dd>
        </div>
      </dl>

      {employee.breakdown.length > 0 && (
        <ul className="p-5 px-6 space-y-2 border-b border-line">
          {employee.breakdown.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 px-3 bg-sunken rounded-[8px]">
              <span className="text-secondary text-body font-medium w-40">{t(`items.${item.type}`)}</span>
              <span className="flex items-center gap-1 flex-1">
                <span className={cn("font-medium text-body-lg text-end min-w-[80px] tabular-nums", item.type === "bonus" ? "text-success" : "text-danger")}>
                  {signed(item.amount, item.type === "bonus" ? "+" : "-")}
                </span>
                <span className="text-secondary text-body text-start flex-1 ps-6 max-w-xl truncate">
                  <bdi>{item.description ?? (item.type === "loan" ? t("loanInstallment") : "")}</bdi>
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="p-5 px-6 space-y-4">
        <div role="group" aria-label={t("decisionFor", { name: employee.name })} className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            aria-pressed={isApproved}
            onClick={() => onStatusChange(employee.id, isApproved ? null : "APPROVED")}
            size="lg"
            className={cn(isApproved && "bg-primary hover:bg-info-solid hover:text-white text-white border-none")}
          >
            {t("approve")}
          </Button>
          <Button
            variant="outline"
            aria-pressed={isRejected}
            onClick={() => onStatusChange(employee.id, isRejected ? null : "REJECTED")}
            size="lg"
            className={cn(isRejected && "bg-primary hover:bg-info-solid hover:text-white text-white border-none")}
          >
            {t("requestChange")}
          </Button>
        </div>

        {isRejected && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <label htmlFor={noteId} className="text-body font-medium text-gray-black">
              {t("whatToChange")}
            </label>
            <div className="relative">
              <Textarea
                id={noteId}
                placeholder={t("whatToChangePlaceholder")}
                value={employee.hrChangeNote || ""}
                onChange={(e) => onNoteChange(employee.id, e.target.value)}
                maxLength={250}
                className="min-h-[90px]"
              />
              <span aria-hidden="true" className="absolute bottom-3 end-4 text-[10px] font-medium text-fg-subtle tabular-nums">
                {(employee.hrChangeNote || "").length}/250
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
