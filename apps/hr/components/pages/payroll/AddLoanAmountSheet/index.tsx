"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, Field, Select, Input, ErrorState, LoadingState, EmptyState, useFormatter } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import ReusableSheet from "@/components/shared/ResuableSheet";
import { useGetLoansQuery } from "@/redux/features/loan/loanApi";
import { useAddPayrollLoanToRunMutation } from "@/redux/features/payroll/payrollApi";
import { loanAmountSchema } from "@/schemas/payroll/loan-amount.schemas";
import type { LoanAmountProps, LoanAmountValues } from "@/types/loan-amount";
const FORM_ID = "payroll-selected-loan";
export default function AddLoanAmountSheet({ runId, employeeId, trigger }: LoanAmountProps) {
  const t = useTranslations("payroll.loanDetail.addAmountSheet"), r = useTranslations("Roadmap"), f = useFormatter();
  const [open, setOpen] = useState(false), [add, state] = useAddPayrollLoanToRunMutation();
  const loans = useGetLoansQuery({ employeeId, status: "active", limit: 100 }, { skip: !open || !employeeId });
  const form = useForm<LoanAmountValues>({ resolver: zodResolver(loanAmountSchema(r("loanAmount"))), defaultValues: { loanId: "", amount: 0 } });
  const available = (loans.data?.data.items || []).filter(loan => loan.remainingAmount > 0);
  const selected = available.find(loan => String(loan.id) === form.watch("loanId"));
  const amount = form.watch("amount");
  const close = (value: boolean) => { if (state.isLoading) return; setOpen(value); if (!value) form.reset(); };
  return <ReusableSheet open={open} onOpenChange={close} title={t("title")} trigger={trigger || <Button>{t("trigger")}</Button>} footer={<><Button variant="secondary" disabled={state.isLoading} onClick={() => close(false)}>{t("actions.cancel")}</Button><Button form={FORM_ID} type="submit" loading={state.isLoading} disabled={!selected || !runId || !employeeId}>{t("actions.submit")}</Button></>}>
    {loans.isLoading ? <LoadingState rows={3} /> : loans.isError ? <ErrorState onRetry={() => void loans.refetch()} /> : !available.length ? <EmptyState title={r("noLoans")} /> : <form id={FORM_ID} className="flex flex-col gap-5" onSubmit={form.handleSubmit(async values => {
      if (!selected || !runId || !employeeId || values.amount > selected.remainingAmount) { form.setError("amount", { message: r("loanAmount") }); return; }
      try { await add({ runId, body: { employeeId, loanId: selected.id, amount: values.amount } }).unwrap(); setOpen(false); form.reset(); }
      catch { form.setError("root", { message: r("saveError") }); }
    })}>
      <Field label={r("chooseLoan")} error={form.formState.errors.loanId?.message}><Select value={form.watch("loanId")} options={available.map(loan => ({ value: String(loan.id), label: `${loan.title} · ${f.money(loan.remainingAmount, loan.currency)}` }))} onValueChange={value => { const loan = available.find(row => String(row.id) === value); form.setValue("loanId", value || "", { shouldValidate: true }); form.setValue("amount", loan ? Math.min(loan.installmentAmount, loan.remainingAmount) : 0, { shouldValidate: true }); }} /></Field>
      {selected ? <dl className="grid grid-cols-2 gap-3 text-body-sm"><dt>{t("fields.totalLoans")}</dt><dd><bdi>{f.money(selected.principalAmount, selected.currency)}</bdi></dd><dt>{t("fields.remainingAmount")}</dt><dd><bdi>{f.money(Math.max(0, selected.remainingAmount - (Number.isFinite(amount) ? amount : 0)), selected.currency)}</bdi></dd></dl> : null}
      <RHFField control={form.control} name="amount" label={t("fields.addedAmount")} required render={({ value, onChange, ...field }) => <Input {...field} type="number" min={0.01} step="0.01" max={selected?.remainingAmount} value={Number.isFinite(value) ? value : ""} onChange={event => onChange(event.target.valueAsNumber)} />} />
      {form.formState.errors.root ? <p role="alert" className="text-danger">{form.formState.errors.root.message}</p> : null}
    </form>}
  </ReusableSheet>;
}
