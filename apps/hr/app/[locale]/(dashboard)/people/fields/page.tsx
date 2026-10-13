"use client";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, ErrorState, Input, LoadingState, PageHeader, Select, ConfirmDialog } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { hrRequest } from "@/lib/hr-workspace";
import { useUserRoles } from "@/hooks/useUserRoles";
import { employeeFieldSchema } from "@/schemas/custom-fields.schemas";
import type { EmployeeFields, EmployeeFieldForm } from "@/types/custom-fields";
import { EmployeeFieldValues } from "@/components/pages/employee/EmployeeFieldValues";
export default function EmployeeFieldsPage() {
  const t = useTranslations("Roadmap"), { canWrite, hasRole } = useUserRoles(), [data, setData] = useState<EmployeeFields>(), [error, setError] = useState(false), [saved, setSaved] = useState(false);
  const form = useForm<EmployeeFieldForm>({ resolver: zodResolver(employeeFieldSchema(t("saveError"))), defaultValues: { definitions: [] } });
  const fields = useFieldArray({ control: form.control, name: "definitions", keyName: "rowKey" });
  const load = async () => { try { setError(false); const value = await hrRequest<EmployeeFields>("/hr/custom-fields"); setData(value); if (!form.formState.isDirty) form.reset({ definitions: value.definitions.map(field => ({ ...field, choices: field.options.join(", ") })) }); } catch { setError(true); } };
  useEffect(() => { void load(); }, []);
  const manage = canWrite && (hasRole("hr") || hasRole("super_admin"));
  return <div className="flex flex-col gap-5"><PageHeader title={t("customFields")} />{error ? <ErrorState onRetry={() => void load()} /> : !data ? <LoadingState rows={4} /> : <>{manage ? <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(async values => { setSaved(false); try { await hrRequest("/hr/custom-fields", "PUT", { definitions: values.definitions.map(field => ({ id: field.id, name: field.name, type: field.type, options: field.choices.split(/[,،]/).map(value => value.trim()).filter(Boolean) })) }); form.reset(values); await load(); setSaved(true); } catch { form.setError("root", { message: t("saveError") }); } })}>{fields.fields.map((field,index) => <fieldset key={field.rowKey} className="grid gap-4 rounded-field border border-line p-4 sm:grid-cols-3"><RHFField control={form.control} name={`definitions.${index}.name`} label={t("title")} required render={value => <Input {...value} />} /><RHFField control={form.control} name={`definitions.${index}.type`} label={t("type")} render={({ value, onChange }) => <Select value={value} onValueChange={onChange} options={["text", "number", "date", "select"].map(type => ({ value: type, label: type === "select" ? t("choices") : t(type) }))} />} /><RHFField control={form.control} name={`definitions.${index}.choices`} label={t("choices")} optional render={value => <Input {...value} disabled={form.watch(`definitions.${index}.type`) !== "select"} />} /><ConfirmDialog trigger={<Button variant="ghost" type="button">{t("remove")}</Button>} title={t("remove")} impact={field.name || t("customFields")} confirmLabel={t("remove")} onConfirm={() => fields.remove(index)} /></fieldset>)}<div className="flex gap-3"><Button type="button" variant="secondary" disabled={fields.fields.length >= 30} onClick={() => fields.append({ id: crypto.randomUUID(), name: "", type: "text", choices: "" })}>{t("add")}</Button><Button type="submit" loading={form.formState.isSubmitting}>{t("save")}</Button></div>{form.formState.errors.root ? <p role="alert" className="text-danger">{form.formState.errors.root.message}</p> : saved ? <p role="status" className="text-success">{t("saved")}</p> : null}</form> : null}{data.employees.map(employee => <EmployeeFieldValues key={employee.id} employee={employee} definitions={data.definitions} readOnly={!canWrite || !employee.canEdit} />)}</>}</div>;
}
