"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Field, Input, LoadingState, ErrorState, Select, Sheet, DialogBody as SheetBody, SheetContent, DialogDescription as SheetDescription, DialogFooter as SheetFooter, DialogHeader as SheetHeader, DialogTitle as SheetTitle, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useServiceCatalogQuery, useSaveServiceBundleMutation } from "@/redux/features/services/servicesApi";
import { serviceBundleSchema } from "@/schemas/service-catalog";
import { bundleForm, serviceLabel } from "@/lib/service-catalog";
import { SERVICE_LOCALES, type ServiceLocale, type ServiceBundleForm } from "@/types/service-catalog";
export default function ServiceBundleSheet({ id, open, onOpenChange, onSaved }: { id: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = useTranslations("ServiceCatalog"), locale = useLocale(), [language, setLanguage] = useState<ServiceLocale>(locale as ServiceLocale);
  const query = useServiceCatalogQuery(), [save, mutation] = useSaveServiceBundleMutation(), form = useForm<ServiceBundleForm>({ resolver: zodResolver(serviceBundleSchema(t)) });
  const row = query.data?.bundles.find(bundle => bundle.id === id);
  useEffect(() => { if (row) form.reset(bundleForm(row)); }, [row, form]);
  const ids = form.watch("ids") || [];
  const submit = form.handleSubmit(async value => { try { await save({ id, patch: { name: value.name, ids: value.ids, recommended: value.recommended, ...(SERVICE_LOCALES.some(key => value.why[key].trim()) ? { why: value.why } : {}) } }).unwrap(); onSaved(); onOpenChange(false); } catch { /* Retain the failed values. */ } }, errors => { const invalidLanguage = SERVICE_LOCALES.find(key => errors.name?.[key] || errors.why?.[key]); if (invalidLanguage) setLanguage(invalidLanguage); });
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="[--sheet-width:640px]"><SheetHeader><SheetTitle>{t("editBundle")}</SheetTitle><SheetDescription>{t("bundleHelp")}</SheetDescription></SheetHeader><form className="contents" onSubmit={submit}><SheetBody className="flex flex-col gap-5">{query.isLoading ? <LoadingState rows={4} /> : query.isError ? <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} /> : !row ? <ErrorState title={t("notFound")} /> : <>
    <Select label={t("translationLanguage")} value={language} onValueChange={value => { if (value) setLanguage(value); }} options={SERVICE_LOCALES.map(value => ({ value, label: t(`locales.${value}`) }))} />
    <RHFField control={form.control} name={`name.${language}`} label={t("name")} required render={field => <Input {...field} dir="auto" />} />
    <RHFField control={form.control} name={`why.${language}`} label={t("bundleWhy")} description={t("fiveTranslations")} render={field => <Textarea {...field} dir="auto" />} />
    <Field group label={t("bundleMembers")} required error={form.formState.errors.ids?.message}><div className="flex flex-col gap-3">{query.data?.offers.map(offer => <Checkbox key={offer.id} label={serviceLabel(offer.name, locale)} checked={ids.includes(offer.id)} onCheckedChange={checked => form.setValue("ids", checked ? [...ids, offer.id] : ids.filter(value => value !== offer.id), { shouldDirty: true, shouldValidate: true })} />)}</div></Field>
    <RHFField control={form.control} name="recommended" render={field => <Checkbox label={t("recommended")} checked={field.value} onCheckedChange={field.onChange} />} />
    {mutation.isError ? <p role="alert" className="text-body-sm text-danger">{t("saveError")}</p> : null}
  </>}</SheetBody><SheetFooter><Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={mutation.isLoading}>{t("cancel")}</Button><Button type="submit" loading={mutation.isLoading} disabled={!row || !query.data?.canPublish}>{t("saveDraft")}</Button></SheetFooter></form></SheetContent></Sheet>;
}
