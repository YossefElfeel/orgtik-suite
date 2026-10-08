"use client";
import { useTranslations } from "next-intl";
import { Button, Checkbox, EmptyState, SimulatedTag } from "@orgtik/ui";
import type { OnboardingProps } from "@/types/presentation";
export default function OnboardingChecklist({ employees, tasks, canManage, onToggle, onCreate }: OnboardingProps) {
  const t = useTranslations("HrPresentation");
  return <section className="rounded-panel border border-line bg-raised p-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-title-sm font-semibold">{t("onboarding")}</h2><SimulatedTag /></div><p className="my-3 max-w-prose text-body-sm text-fg-muted">{t("taskNote")}</p>{employees.length ? <ul className="divide-y divide-line">{employees.map(person => <li key={person.id} className="py-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-body font-semibold" dir="auto">{person.name}</h3><Button size="sm" variant="secondary" disabled={!canManage || tasks.some(task => task.employeeId === person.id)} onClick={() => onCreate(person.id)}>{t("createOnboarding")}</Button></div><ul className="flex flex-col gap-3">{tasks.filter(task => task.employeeId === person.id).map(task => <li key={task.id}><Checkbox label={t(task.titleKey)} description={task.owner} checked={task.done} disabled={!canManage} onCheckedChange={() => onToggle(task.id)} /></li>)}</ul></li>)}</ul> : <EmptyState title={t("noPeople")} description={t("noPersonBody")} />}</section>;
}
