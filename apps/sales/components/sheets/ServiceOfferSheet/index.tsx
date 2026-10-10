"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ErrorState, Input, LoadingState, Select, Sheet, DialogBody as SheetBody, SheetContent, DialogDescription as SheetDescription, DialogFooter as SheetFooter, DialogHeader as SheetHeader, DialogTitle as SheetTitle, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useServiceCatalogQuery, useSaveServiceOfferMutation } from "@/redux/features/services/servicesApi";
import { serviceOfferSchema } from "@/schemas/service-catalog";
import { offerForm } from "@/lib/service-catalog";
import { SERVICE_LOCALES, type ServiceLocale, type ServiceOfferForm, type ServiceCapabilities, type ServiceOfferDraft } from "@/types/service-catalog";

export default function ServiceOfferSheet({ id, open, onOpenChange, onSaved }: { id: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = useTranslations("ServiceCatalog"), locale = useLocale(), [language, setLanguage] = useState<ServiceLocale>(locale as ServiceLocale);
  const query = useServiceCatalogQuery(), [save, mutation] = useSaveServiceOfferMutation();
  const form = useForm<ServiceOfferForm>({ resolver: zodResolver(serviceOfferSchema(t)) });
  const dirty = form.formState.dirtyFields;
  const row = query.data?.offers.find(offer => offer.id === id);
  useEffect(() => { if (row) form.reset(offerForm(row, query.data?.services.find(service => service.id === row.serviceId)?.status || "active")); }, [row, query.data, form]);
  const submit = form.handleSubmit(async value => {
    const capabilities = Object.fromEntries(SERVICE_LOCALES.map(key => [key, value.capabilities[key].split("\n").map(text => text.trim()).filter(Boolean)])) as ServiceCapabilities;
    const patch: ServiceOfferDraft = {};
    if (dirty.name) patch.name = value.name;
    if (dirty.capabilities) patch.capabilities = capabilities;
    if (dirty.department) patch.department = value.department;
    if (dirty.icon) patch.icon = value.icon;
    if (dirty.monthlyCHF) patch.monthlyCHF = value.monthlyCHF;
    if (dirty.status) patch.status = value.status;
    if (dirty.description) patch.description = value.description;
    if (dirty.departmentName) patch.departmentName = value.departmentName;
    if (!Object.keys(patch).length) { onOpenChange(false); return; }
    try {
      await save({ id, patch }).unwrap();
      onSaved(); onOpenChange(false);
    } catch { /* The interceptor and this sheet retain the failed draft. */ }
  }, errors => { const invalidLanguage = SERVICE_LOCALES.find(key => ["name", "description", "capabilities", "departmentName"].some(group => errors[group as "name" | "description" | "capabilities" | "departmentName"]?.[key])); if (invalidLanguage) setLanguage(invalidLanguage); });
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="[--sheet-width:640px]"><SheetHeader><SheetTitle>{t("editOffer")}</SheetTitle><SheetDescription>{t("draftHelp")}</SheetDescription></SheetHeader><form className="contents" onSubmit={submit}><SheetBody className="flex flex-col gap-5">
    {query.isLoading ? <LoadingState rows={5} /> : query.isError ? <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} /> : !row ? <ErrorState title={t("notFound")} /> : <>
      <Select label={t("translationLanguage")} value={language} onValueChange={value => { if (value) setLanguage(value); }} options={SERVICE_LOCALES.map(value => ({ value, label: t(`locales.${value}`) }))} />
      <RHFField control={form.control} name={`name.${language}`} label={t("name")} required render={field => <Input {...field} dir="auto" />} />
      <RHFField control={form.control} name={`description.${language}`} label={t("description")} description={t("fiveTranslations")} render={field => <Textarea {...field} dir="auto" />} />
      <RHFField control={form.control} name={`capabilities.${language}`} label={t("capabilities")} description={t("capabilitiesHelp")} render={field => <Textarea {...field} dir="auto" />} />
      <div className="grid gap-4 sm:grid-cols-2"><RHFField control={form.control} name="monthlyCHF" label={t("monthlyCHF")} required render={field => <Input name={field.name} ref={field.ref} onBlur={field.onBlur} type="number" min={0} max={1000000} step="0.01" value={field.value ?? ""} onChange={event => field.onChange(event.target.valueAsNumber)} />} /><RHFField control={form.control} name="status" label={t("status")} render={field => <Select value={field.value} onValueChange={field.onChange} options={[{ value: "active", label: t("active") }, { value: "archived", label: t("archived") }]} />} /></div>
      <RHFField control={form.control} name="department" label={t("department")} render={field => <Select value={field.value} onValueChange={field.onChange} options={["design", "development", "marketing", "it-support"].map(value => ({ value, label: t(`departments.${value}`) }))} />} />
      <RHFField control={form.control} name={`departmentName.${language}`} label={t("departmentName")} description={t("fiveTranslations")} render={field => <Input {...field} dir="auto" />} />
      <RHFField control={form.control} name="icon" label={t("icon")} render={field => <Input {...field} dir="auto" />} />
      {mutation.isError ? <p role="alert" className="text-body-sm text-danger">{t("saveError")}</p> : null}
    </>}
  </SheetBody><SheetFooter><Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={mutation.isLoading}>{t("cancel")}</Button><Button type="submit" loading={mutation.isLoading} disabled={!row || !query.data?.canPublish}>{t("saveDraft")}</Button></SheetFooter></form></SheetContent></Sheet>;
}
