"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, EmptyState, ImportWizard } from "@orgtik/ui";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { hrImportSchema } from "@/schemas/presentation/presentation.schemas";
import { HR_DEMO_IMPORT, parseHrCsv } from "@/mock/presentation";
import type { DemoEmployee, ImportFormValues, ImportProps } from "@/types/presentation";
export default function CsvImport({ employees, canManage, onImport }: ImportProps) {
  const t = useTranslations("HrPresentation"), [step, setStep] = useState(0), [count, setCount] = useState(0);
  const form = useForm<ImportFormValues>({ resolver: zodResolver(hrImportSchema(t("csvError"))), defaultValues: { csv: HR_DEMO_IMPORT, nameColumn: "0", emailColumn: "1", currencyColumn: "2" } });
  const text = form.watch("csv"), nameColumn = form.watch("nameColumn"), emailColumn = form.watch("emailColumn"), currencyColumn = form.watch("currencyColumn");
  const parsed = useMemo(() => { try { return parseHrCsv(text); } catch { return []; } }, [text]);
  const columns = (parsed[0] ?? []).map((label, i) => ({ label: label || String(i + 1), value: String(i) }));
  const validateRows = (): DemoEmployee[] | null => {
    const emails = new Set(employees.map(person => person.email.toLowerCase()));
    const rows: DemoEmployee[] = [];
    for (const row of parsed.slice(1)) {
      const name = row[Number(nameColumn)]?.trim(), email = row[Number(emailColumn)]?.trim(), currency = row[Number(currencyColumn)]?.trim().toUpperCase();
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || emails.has(email.toLowerCase()) || !["CHF", "AED"].includes(currency)) return null;
      emails.add(email.toLowerCase()); rows.push({ id: crypto.randomUUID(), name, email, currency: currency as "CHF" | "AED", phone: "", department: "operations", salary: 0, taken: 0, documentExpiry: "2027-10-08" });
    }
    return rows.length > 0 && rows.length <= 100 ? rows : null;
  };
  return <section className="flex flex-col gap-5 rounded-panel border border-line bg-raised p-4"><h2 className="text-title-sm font-semibold">{t("import")}</h2><p className="text-body-sm text-fg-muted">{t("importNote")}</p><ImportWizard label={t("import")} stages={["source", "mapping", "review", "result"].map(key => t(key))} step={step} onStepChange={setStep} /><Form {...form}><form onSubmit={form.handleSubmit(() => { if (step === 0) { if (!columns.length || parsed.length < 2 || parsed.length > 101) { form.setError("csv", { message: t("csvError") }); return; } setStep(1); } else if (step === 1) { const rows = validateRows(); if (!rows) { form.setError("nameColumn", { message: t("mappingError") }); return; } setCount(rows.length); setStep(2); } else if (step === 2) { const rows = validateRows(); if (!rows) { setStep(1); form.setError("nameColumn", { message: t("mappingError") }); return; } onImport(rows); setStep(3); } })} className="flex flex-col gap-4">
    {step === 0 ? <TextFormEle form={form} name="csv" type="textarea" label={t("csvText")} disabled={!canManage} /> : null}
    {step === 1 ? <div className="grid gap-4 sm:grid-cols-3"><SelectFormEle form={form} name="nameColumn" label={t("nameColumn")} options={columns} disabled={!canManage} /><SelectFormEle form={form} name="emailColumn" label={t("emailColumn")} options={columns} disabled={!canManage} /><SelectFormEle form={form} name="currencyColumn" label={t("currencyColumn")} options={columns} disabled={!canManage} /></div> : null}
    {step === 2 ? <div><p className="mb-3 text-body">{t("importCount", { count })}</p><ul className="divide-y divide-line">{parsed.slice(1, 9).map((row, i) => <li key={i} className="py-2 text-body-sm" dir="auto">{row[Number(nameColumn)]} · <bdi>{row[Number(currencyColumn)]}</bdi></li>)}</ul></div> : null}
    {step === 3 ? <EmptyState size="compact" title={t("imported")} description={t("importCount", { count })} /> : <Button type="submit" className="self-start" disabled={!canManage}>{t(step === 2 ? "importPeople" : "continue")}</Button>}
    {step === 3 ? <Button className="self-start" variant="secondary" onClick={() => { form.reset(); setStep(0); }}>{t("newImport")}</Button> : null}
  </form></Form></section>;
}
