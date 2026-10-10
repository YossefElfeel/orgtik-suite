"use client";
import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ConfirmDialog, Input, Sheet, DialogBody as SheetBody, SheetContent, DialogDescription as SheetDescription, DialogFooter as SheetFooter, DialogHeader as SheetHeader, DialogTitle as SheetTitle, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { serviceActionSchema } from "@/schemas/service-catalog";
import { useServiceActionMutation } from "@/redux/features/services/servicesApi";
import ServiceFilePicker from "@/components/ServiceFilePicker";
import { isolate } from "@/lib/bidi";
import type { ServiceFileReference, ServiceActionForm, ServiceRequest, ServiceRequestAction } from "@/types/service-catalog";
export default function ServiceActionSheet({ request, action, onClose }: { request: ServiceRequest; action: "quote" | "deliver" | "message"; onClose: () => void }) {
  const t = useTranslations("ServiceRequests"), validation = useTranslations("ServiceCatalog"), f = useFormatter(), [mutate, mutation] = useServiceActionMutation(), [review, setReview] = useState<ServiceActionForm>(), [files, setFiles] = useState<ServiceFileReference[]>([]);
  const form = useForm<ServiceActionForm>({ resolver: zodResolver(serviceActionSchema(validation)), defaultValues: { text: "", amount: 0, validDays: 14, assignee: "" } });
  const commit = async (values: ServiceActionForm) => { const body: ServiceRequestAction = action === "quote" ? { action, lines: [{ label: values.text, amount: values.amount }], validDays: values.validDays } : action === "deliver" ? { action, note: values.text, files } : { action, text: values.text }; await mutate({ id: request.id, body }).unwrap(); onClose(); };
  return <><Sheet open onOpenChange={open => { if (!open && !mutation.isLoading) onClose(); }}><SheetContent className="[--sheet-width:480px]"><SheetHeader><SheetTitle>{t(`actions.${action}`)}</SheetTitle><SheetDescription>{request.number} · {request.title}</SheetDescription></SheetHeader><form className="contents" onSubmit={form.handleSubmit(async values => { if (action === "quote") setReview(values); else { try { await commit(values); } catch { /* Keep this draft. */ } } })}><SheetBody className="flex flex-col gap-4">
    <RHFField control={form.control} name="text" label={t(action === "quote" ? "quoteLine" : action === "deliver" ? "deliveryNote" : "message")} required render={field => <Textarea {...field} dir="auto" maxLength={5000} />} />
    {action === "quote" ? <><RHFField control={form.control} name="amount" label={t("quoteAmount", { currency: request.currency })} required render={field => <Input name={field.name} ref={field.ref} onBlur={field.onBlur} type="number" min={0} step="0.01" value={field.value} onChange={event => field.onChange(event.target.valueAsNumber)} />} /><RHFField control={form.control} name="validDays" label={t("validDays")} required render={field => <Input name={field.name} ref={field.ref} onBlur={field.onBlur} type="number" min={1} max={90} value={field.value} onChange={event => field.onChange(event.target.valueAsNumber)} />} /></> : null}
    {action === "deliver" ? <ServiceFilePicker id={request.id} value={files} onChange={setFiles} /> : null}{mutation.isError ? <p role="alert" className="text-body-sm text-danger">{t("actionError")}</p> : null}
  </SheetBody><SheetFooter><Button variant="ghost" type="button" disabled={mutation.isLoading} onClick={onClose}>{t("cancel")}</Button><Button type="submit" loading={mutation.isLoading}>{t(action === "quote" ? "reviewQuote" : `actions.${action}`)}</Button></SheetFooter></form></SheetContent></Sheet>
    <ConfirmDialog open={Boolean(review)} onOpenChange={open => { if (!open) setReview(undefined); }} tone="primary" title={t("quoteConfirm", { reference: isolate(request.number), amount: f.number(review?.amount || 0, { style: "currency", currency: request.currency }) })} impact={t("quoteImpact", { days: review?.validDays || 14 })} confirmLabel={t("actions.quote")} cancelLabel={t("cancel")} onConfirm={async () => { if (review) await commit(review); }} />
  </>;
}
