"use client";
import { useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useSaveServicePolicyMutation } from "@/redux/features/services/servicesApi";
import { servicePolicySchema } from "@/schemas/service-catalog";
import type { ServiceDiscountPolicy } from "@/types/service-catalog";
export default function ServicePolicyEditor({ policy, canEdit }: { policy: ServiceDiscountPolicy; canEdit: boolean }) {
  const t = useTranslations("ServiceCatalog"), f = useFormatter(), form = useForm<ServiceDiscountPolicy>({ resolver: zodResolver(servicePolicySchema(t)), defaultValues: policy }), [save, mutation] = useSaveServicePolicyMutation(), [saved, setSaved] = useState(false);
  useEffect(() => form.reset(policy), [policy, form]);
  return <section className="flex flex-col gap-3 border-t border-line pt-5"><h2 className="font-display text-title-sm">{t("editPolicy")}</h2><p className="max-w-prose text-body-sm text-fg-muted">{t("servicePolicyHelp")}</p><form onSubmit={form.handleSubmit(async values => { try { await save(values).unwrap(); setSaved(true); } catch { /* Keep the fields. */ } })} className="flex flex-col gap-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 3, 6, 12].map(month => <RHFField key={month} control={form.control} name={`durationSavings.${month}`} label={t("durationDiscount", { months: f.number(month) })} render={field => <Input type="number" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onChange={event => field.onChange(event.target.valueAsNumber)} min={0} max={60} step="0.1" disabled={!canEdit || month === 1} />} />)}{policy.countBands.map((band, index) => <RHFField key={band.min} control={form.control} name={`countBands.${index}.saving`} label={t("countDiscount", { count: f.number(band.min) })} render={field => <Input type="number" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onChange={event => field.onChange(event.target.valueAsNumber)} min={0} max={60} step="0.1" disabled={!canEdit || band.min === 1} />} />)}</div>{canEdit ? <Button type="submit" className="self-end" loading={mutation.isLoading}>{t("savePolicyDraft")}</Button> : null}{saved ? <p role="status" className="text-body-sm text-fg-muted">{t("draftSaved")}</p> : null}{mutation.isError ? <p role="alert" className="text-body-sm text-danger">{t("saveError")}</p> : null}</form></section>;
}
