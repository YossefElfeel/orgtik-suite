"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, Checkbox, EmptyState, ErrorState, Field, Input, LoadingState, Select, SimulatedTag, Textarea, useFormatter } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateAudienceSegmentMutation, useListCompanyAudiencesQuery, usePreviewSegmentMutation } from "@/redux/features/audiences/audiencesApi";
import { segmentSchema } from "@/schemas/segment";
import type { SegmentForm, SegmentPreview, IAudienceSegmentRules } from "@/types/audiences";
const defaults: SegmentForm = { name: "", description: "", audienceId: "__all__", source: "", type: "", interest: "", qualifiedOnly: false, tags: "", stageId: "", engagement: "any" };
export function CreateSegmentDialog() {
  const t = useTranslations("Audience"), r = useTranslations("Roadmap"), f = useFormatter(), [open, setOpen] = useState(false);
  const form = useForm<SegmentForm>({ resolver: zodResolver(segmentSchema(t("needSegmentName"))), defaultValues: defaults });
  const audiences = useListCompanyAudiencesQuery({ page: 1, limit: 100 }, { skip: !open }), [create] = useCreateAudienceSegmentMutation(), [preview] = usePreviewSegmentMutation();
  const [result, setResult] = useState<SegmentPreview>(), [previewError, setPreviewError] = useState(false), [loading, setLoading] = useState(false), [revision, setRevision] = useState(0);
  const values = form.watch();
  const rules: IAudienceSegmentRules = { ...(values.source.trim() ? { source: values.source.trim() } : {}), ...(values.type.trim() ? { type: values.type.trim() } : {}), ...(values.interest.trim() ? { interest: values.interest.trim() } : {}), ...(values.qualifiedOnly ? { qualifiedOnly: true } : {}), ...(values.tags.trim() ? { tags: values.tags.split(/[,،]/).map(value => value.trim()).filter(Boolean) } : {}), ...(values.stageId.trim() ? { stageId: values.stageId.trim() } : {}), engagement: values.engagement };
  const selection = JSON.stringify({ rules, audienceId: values.audienceId === "__all__" ? null : values.audienceId });
  useEffect(() => {
    if (!open) return;
    let current = true; setLoading(true); setPreviewError(false);
    const timer = setTimeout(() => { void preview(JSON.parse(selection)).unwrap().then(data => { if (current) setResult(data.data); }, () => { if (current) { setPreviewError(true); setResult(undefined); } }).finally(() => { if (current) setLoading(false); }); }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [open, selection, revision, preview]);
  return <FormDialog open={open} onOpenChange={setOpen} onClosed={() => { form.reset(defaults); setResult(undefined); }} trigger={<Button variant="secondary" startIcon={<Plus />}>{t("createSegment")}</Button>} title={t("createSegmentTitle")} description={t("createSegmentDescription")} submitLabel={t("createSegment")} cancelLabel={t("cancel")} size="lg" onSubmit={async () => {
    let valid = false; await form.handleSubmit(async value => { valid = true; await create({ name: value.name, description: value.description || undefined, audienceId: value.audienceId === "__all__" ? null : value.audienceId, rules }).unwrap(); })(); if (!valid) throw Error("invalid");
  }}>
    <RHFField control={form.control} name="name" label={t("segmentName")} required render={field => <Input {...field} dir="auto" autoFocus />} />
    <RHFField control={form.control} name="description" label={t("segmentDescription")} optional render={field => <Textarea {...field} dir="auto" />} />
    <RHFField control={form.control} name="audienceId" label={t("segmentAudience")} render={({ value, onChange }) => <Select value={value} onValueChange={onChange} options={[{ value: "__all__", label: t("allAudiences") }, ...(audiences.data?.data?.items || []).map(item => ({ value: item.id, label: item.name }))]} />} />
    <div className="grid gap-4 sm:grid-cols-2">{([['source','ruleSource'],['type','ruleType'],['interest','ruleInterest']] as const).map(([name,label]) => <RHFField key={name} control={form.control} name={name} label={t(label)} optional render={field => <Input {...field} dir="auto" />} />)}<RHFField control={form.control} name="tags" label={r("tags")} optional render={field => <Input {...field} dir="auto" />} /><RHFField control={form.control} name="stageId" label={r("stage")} optional render={field => <Input {...field} />} /><RHFField control={form.control} name="engagement" label={r("engagement")} render={({ value, onChange }) => <Select value={value} onValueChange={onChange} options={[{ value: "any", label: r("anyEngagement") }, { value: "delivered_mock", label: r("deliveredMock") }, { value: "not_delivered_mock", label: r("notDeliveredMock") }]} />} /></div>
    <Checkbox label={t("ruleQualified")} checked={values.qualifiedOnly} onCheckedChange={value => form.setValue("qualifiedOnly", Boolean(value))} />
    <section className="flex flex-col gap-3 border-t border-line pt-4"><h2 className="text-title-sm font-semibold">{r("audiencePreview")}</h2><SimulatedTag />{loading ? <LoadingState rows={2} /> : previewError ? <ErrorState size="compact" onRetry={() => setRevision(value => value + 1)} /> : result?.contacts.length ? <><p className="text-body-sm">{f.number(result.total)}</p><ul className="max-h-48 divide-y divide-line overflow-y-auto">{result.contacts.map(contact => <li key={contact.id} className="flex flex-wrap gap-3 py-2 text-body-sm"><bdi>{contact.name}</bdi><bdi>{contact.email}</bdi></li>)}</ul></> : <EmptyState size="compact" title={r("noMatch")} />}</section>
  </FormDialog>;
}
