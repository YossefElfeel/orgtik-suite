"use client";

// The payroll run's actions (FS-HR-7, HR-006). Each one that changes money or people is a
// ConfirmDialog that says how many people and how much, waits for the request, and stays open
// saying so when it fails. "Pay" here never paid anyone: it sends the approved rows to the finance
// queue, and Finance pays from there, so it's named that way.
import { useTranslations, useFormatter } from "next-intl";
import { useRunPeriod } from "@/hooks/useRunPeriod";
import { ArrowCounterClockwise, EnvelopeSimple, PaperPlaneRight, Snowflake } from "@phosphor-icons/react";
import { ConfirmDialog } from "@orgtik/ui";
import { Button } from "@orgtik/ui";
import BankSampleExport from "@/components/pages/payroll/BankSampleExport";
import {
  useFreezePayrollRunMutation,
  usePayAllrollMutation,
  useReopenPayrollRunMutation,
  useSendAllPayslipsEmailMutation,
} from "@/redux/features/payroll/payrollApi";
import type { RunActionsProps } from "@/types/payroll";

const BUTTON = "flex-1 sm:flex-initial h-10 text-xs md:text-sm px-3";

export function RunActions({ run, status, canEmailPayslips }: RunActionsProps) {
  const t = useTranslations("payroll");
  const format = useFormatter();
  const [freeze] = useFreezePayrollRunMutation();
  const [reopen] = useReopenPayrollRunMutation();
  const [queueAll] = usePayAllrollMutation();
  const [emailAll] = useSendAllPayslipsEmailMutation();

  const runPeriod = useRunPeriod();
  const period = runPeriod(run);
  const money = (amount: number) =>
    run.displayCurrency
      ? format.number(amount, { style: "currency", currency: run.displayCurrency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const open = status === "open";
  const approved = status === "approved" || (run.approvedCount ?? 0) > 0;

  if (open) {
    return (
      <ConfirmDialog
        tone="primary"
        title={t("run.freeze.title", { period })}
        impact={t("run.freeze.impact", { count: run.itemCount, amount: money(run.netPayableTotal) })}
        confirmLabel={t("run.freeze.confirm")}
        cancelLabel={t("run.cancel")}
        onConfirm={() => freeze(run.id).unwrap()}
        trigger={
          <Button className={BUTTON}>
            <Snowflake className="me-1.5 h-4 w-4" aria-hidden="true" />
            {t("status.freezeRun")}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <BankSampleExport runId={run.id} disabled={!approved} />
      {run.queuedCount === 0 && run.paidCount === 0 ? (
        <ConfirmDialog
          tone="primary"
          title={t("run.reopen.title", { period })}
          impact={t("run.reopen.impact", { count: run.submittedCount })}
          confirmLabel={t("run.reopen.confirm")}
          cancelLabel={t("run.cancel")}
          onConfirm={() => reopen(run.id).unwrap()}
          trigger={
            <Button variant="secondary" size="lg" className={BUTTON}>
              <ArrowCounterClockwise className="me-1.5 h-4 w-4" aria-hidden="true" />
              {t("status.reOpen")}
            </Button>
          }
        />
      ) : null}

      {approved ? (
        <ConfirmDialog
          tone="primary"
          irreversible
          title={t("run.queue.title", { period })}
          impact={t("run.queue.impact", { count: run.approvedCount, amount: money(run.pendingAmount ?? 0) })}
          confirmLabel={t("run.queue.confirm")}
          cancelLabel={t("run.cancel")}
          onConfirm={() => queueAll(run.id).unwrap()}
          trigger={
            <Button size="lg" className={BUTTON}>
              <PaperPlaneRight className="me-1.5 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              {t("status.pay")}
            </Button>
          }
        />
      ) : (
        // Said, not just greyed out: why it can't be pressed yet.
        <Button size="lg" variant="secondary" disabled className={BUTTON} title={t("run.queue.noneApproved")}>
          <PaperPlaneRight className="me-1.5 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t("status.pay")}
          <span className="sr-only">: {t("run.queue.noneApproved")}</span>
        </Button>
      )}

      {canEmailPayslips && run.paidCount > 0 ? (
        <ConfirmDialog
          tone="primary"
          title={t("run.payslips.title", { period })}
          impact={t("run.payslips.impact", { count: run.paidCount })}
          confirmLabel={t("run.payslips.confirm")}
          cancelLabel={t("run.cancel")}
          onConfirm={() => emailAll(run.id).unwrap()}
          trigger={
            <Button size="lg" variant="secondary" className={BUTTON}>
              <EnvelopeSimple className="me-1.5 h-4 w-4" aria-hidden="true" />
              {t("actions.bulkSend")}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
