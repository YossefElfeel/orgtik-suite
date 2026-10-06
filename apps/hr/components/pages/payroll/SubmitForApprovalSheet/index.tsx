"use client";

// Send the selected people to the admin for approval (FS-HR-7). Money is in the run's currency
// through the formatter (it always said "CHF"), the words are translated, the note's limit and its
// counter agree (250), and with nobody selected the sheet says how to pick people.
import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReusableSheet from "@/components/shared/ResuableSheet";
import { useSubmitPayrollEmployeesMutation } from "@/redux/features/payroll/payrollApi";
import type { SubmitForApprovalSheetProps } from "@/types/payroll";

const NOTE_MAX = 250;

export default function SubmitForApprovalSheet({ trigger, runId, employees, currency }: SubmitForApprovalSheetProps) {
  const t = useTranslations("payroll.submit");
  const format = useFormatter();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitPayroll, { isLoading }] = useSubmitPayrollEmployeesMutation();

  const money = (amount: number) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalAmount = employees.reduce((sum, emp) => sum + Number(emp.amount || 0), 0);

  const handleSubmit = async () => {
    try {
      await submitPayroll({ id: runId, body: { employeeIds: employees.map((emp) => emp.id), note: note || undefined } }).unwrap();
      setOpen(false);
      setNote("");
    } catch {
      // The base query says why, in the reader's language (lib/api-feedback); the sheet stays open.
    }
  };

  return (
    <ReusableSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t("title", { count: employees.length })}
      size="lg"
      variant="floating"
      footer={
        <>
          <Button variant="outline" size="lg" onClick={() => setOpen(false)} className="rounded-[10px]" disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button size="lg" className="rounded-[10px]" onClick={handleSubmit} disabled={isLoading || employees.length === 0} aria-busy={isLoading}>
            {t("confirm")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-fg">
        {employees.length === 0 ? (
          <p className="rounded-[12px] border border-line bg-raised p-4 text-center text-sm text-fg-subtle">{t("noneSelected")}</p>
        ) : (
          <>
            <ul className="border border-line rounded-[12px] p-3 flex flex-col gap-2.5 bg-raised max-h-[300px] overflow-y-auto">
              {employees.map((emp) => (
                <li key={emp.id} className="flex items-center justify-between pb-2 border-b border-line last:border-0 last:pb-0">
                  <span className="font-medium text-[14px] leading-[18px] text-fg-muted">
                    <bdi>{emp.name}</bdi>
                  </span>
                  <span className="font-medium text-[14px] leading-[18px] text-end text-fg tabular-nums">{money(Number(emp.amount || 0))}</span>
                </li>
              ))}
            </ul>
            <div className="bg-sunken rounded-[12px] p-3 flex items-center justify-between font-semibold text-[14px]">
              <span className="text-secondary">{t("total")}</span>
              <span className="text-gray-black tabular-nums">{money(totalAmount)}</span>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5 mt-2">
          <label htmlFor={noteId} className="text-[13px] font-medium text-fg-subtle">
            {t("note")} <span className="text-fg-subtle font-normal">{t("optional")}</span>
          </label>
          <div className="relative">
            <Textarea id={noteId} placeholder={t("notePlaceholder")} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
            <span aria-hidden="true" className="absolute bottom-2.5 end-3 text-[11px] text-fg-subtle tabular-nums">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
        </div>
      </div>
    </ReusableSheet>
  );
}
