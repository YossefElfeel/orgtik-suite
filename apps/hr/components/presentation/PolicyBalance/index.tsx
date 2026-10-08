"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Badge, Button, EmptyState } from "@orgtik/ui";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { policySchema } from "@/schemas/presentation/presentation.schemas";
import { accruedLeave } from "@/mock/presentation";
import type { PolicyFormValues, PolicyProps } from "@/types/presentation";
export function PolicyBalance({ employees, employeeId, policy, canManage, onSave }: PolicyProps) {
  const t = useTranslations("HrPresentation"), form = useForm<PolicyFormValues>({ resolver: zodResolver(policySchema(t("policyError"))), defaultValues: { annual: String(policy.annual), carry: String(policy.carry), accrual: policy.accrual } });
  useEffect(() => form.reset({ annual: String(policy.annual), carry: String(policy.carry), accrual: policy.accrual }), [policy, form]);
  const people = canManage ? employees : employees.filter(person => person.id === employeeId), earned = accruedLeave(policy);
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"><section className="rounded-panel border border-line bg-raised"><header className="border-b border-line p-4"><h2 className="text-heading-sm">{t("balances")}</h2><p className="mt-2 text-body-sm text-fg-muted">{t("balanceNote")}</p></header>{people.length ? <ul className="divide-y divide-line">{people.map(person => <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-body font-semibold" dir="auto">{person.name}</p><p className="mt-1 text-caption text-fg-muted">{t("balanceBreakdown", { earned, carry: policy.carry, used: person.taken })}</p></div><Badge tone="brand">{t("daysAvailable", { count: Math.max(0, Math.round((earned + policy.carry - person.taken) * 100) / 100) })}</Badge></li>)}</ul> : <EmptyState title={t("noPeople")} description={t("noPersonBody")} />}</section><section className="rounded-panel border border-line bg-raised p-4"><h2 className="mb-4 text-heading-sm">{t("policy")}</h2><Form {...form}><form onSubmit={form.handleSubmit(values => onSave({ annual: Number(values.annual), carry: Number(values.carry), accrual: values.accrual }))} className="space-y-4"><TextFormEle form={form} name="annual" label={t("annualDays")} disabled={!canManage} inputProps={{ inputMode: "decimal" }} /><TextFormEle form={form} name="carry" label={t("carryDays")} disabled={!canManage} inputProps={{ inputMode: "decimal" }} /><SelectFormEle form={form} name="accrual" label={t("accrual")} disabled={!canManage} options={[{ value: "annual", label: t("annual") }, { value: "monthly", label: t("monthly") }]} /><Button type="submit" disabled={!canManage}>{t("savePolicy")}</Button><p className="text-caption text-fg-muted">{t("accrualNote")}</p></form></Form></section></div>;
}
