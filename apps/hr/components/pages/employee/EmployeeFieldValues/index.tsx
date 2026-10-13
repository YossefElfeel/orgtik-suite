"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeValuesSchema } from "@/schemas/custom-fields.schemas";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { hrRequest } from "@/lib/hr-workspace";
import type { EmployeeFields, EmployeeField } from "@/types/custom-fields";
export function EmployeeFieldValues({ employee, definitions, readOnly }: { employee: EmployeeFields["employees"][number]; definitions: EmployeeField[]; readOnly: boolean }) {
  const t = useTranslations("Roadmap"), form = useForm<{ values: Record<string,string> }>({ resolver: zodResolver(employeeValuesSchema), values: { values: employee.values } });
  if (!definitions.length) return null;
  return <form className="flex flex-col gap-4 rounded-card border border-line p-4" onSubmit={form.handleSubmit(async values => { try { await hrRequest(`/hr/employees/${employee.id}/custom-fields`, "PATCH", values); form.reset(values); } catch { form.setError("root", { message: t("saveError") }); } })}><h2 dir="auto" className="text-title-sm font-semibold">{employee.name}</h2><div className="grid gap-4 sm:grid-cols-2">{definitions.map(field => <RHFField key={field.id} control={form.control} name={`values.${field.id}`} label={field.name} optional render={({ value, onChange, ...input }) => field.type === "select" ? <Select value={value || ""} disabled={readOnly} onValueChange={onChange} options={field.options.map(option => ({ value: option, label: option }))} /> : <Input {...input} value={value || ""} onChange={onChange} type={field.type === "number" || field.type === "date" ? field.type : "text"} disabled={readOnly} />} />)}</div>{!readOnly ? <Button className="self-start" type="submit" loading={form.formState.isSubmitting}>{t("save")}</Button> : null}{form.formState.errors.root ? <p role="alert" className="text-danger">{form.formState.errors.root.message}</p> : null}</form>;
}
