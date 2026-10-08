"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, Field, Select, SimulatedTag, useFormatter } from "@orgtik/ui";
import { demoBankFile } from "@/mock/presentation";
import type { BankProps } from "@/types/presentation";
export default function BankPreview({ employees, canManage, onDownload }: BankProps) {
  const t = useTranslations("HrPresentation"), f = useFormatter(), [region, setRegion] = useState<"CH" | "UAE">("CH");
  const currency = region === "CH" ? "CHF" : "AED", people = employees.filter(person => person.currency === currency);
  const download = () => { const blob = new Blob(["\uFEFF", demoBankFile(employees, region)], { type: "text/csv;charset=utf-8" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `orgtik-SIMULATED-payroll-${region}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); onDownload(); };
  return <section className="flex flex-col gap-4 rounded-panel border border-line bg-raised p-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-title-sm font-semibold">{t("bank")}</h2><SimulatedTag /></div><p className="max-w-prose text-body-sm text-fg-muted">{t("bankNote")}</p><Field label={t("region")}><Select value={region} onValueChange={value => value && setRegion(value as "CH" | "UAE")} options={[{ value: "CH", label: t("switzerland") }, { value: "UAE", label: t("uae") }]} /></Field>{people.length ? <ul className="divide-y divide-line">{people.map(person => <li key={person.id} className="flex justify-between gap-3 py-3 text-body-sm"><span dir="auto">{person.name}</span><span className="tabular-nums">{f.money(person.salary, person.currency)}</span></li>)}</ul> : <EmptyState size="compact" title={t("noPayroll")} />}<Button className="self-start" disabled={!canManage || !people.length} onClick={download}>{t("downloadBank")}</Button><pre dir="ltr" className="max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-field bg-sunken p-3 text-caption">{demoBankFile(employees, region)}</pre></section>;
}
