"use client";
import { useTranslations } from "next-intl";
import { PageHeader, LoadingState, ErrorState, OnboardingChecklist, Stat, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useHrWorkspace } from "@/hooks/useHrWorkspace";
export default function HrHomePage() {
  const t = useTranslations("HrWorkspace"), r = useTranslations("Roadmap"), f = useFormatter(), { data, error, reload } = useHrWorkspace();
  if (error) return <ErrorState onRetry={() => void reload()} />;
  if (!data) return <LoadingState rows={5} />;
  return <div className="flex flex-col gap-6"><PageHeader title={r("dailyOverview")} description={f.date(data.now, { dateStyle: "full" })} /><div className="grid gap-4 sm:grid-cols-3"><Stat label={t("directory")} value={f.number(data.employees.length)} /><Stat label={t("documents")} value={f.number(data.employees.reduce((count,employee) => count + employee.documents.length, 0))} /><Stat label={t("onboarding")} value={f.number(data.employees.reduce((count,employee) => count + employee.checklist.filter(item => !item.done).length, 0))} /></div><div className="flex flex-wrap gap-4"><Link href="/attendance" className="text-fg-brand underline">{t("attendance")}</Link><Link href="/people/profile" className="text-fg-brand underline">{t("profile")}</Link><Link href="/time-off" className="text-fg-brand underline">{t("policies")}</Link><Link href="/people/fields" className="text-fg-brand underline">{r("customFields")}</Link></div>{!data.employees.length || !data.policyConfigured ? <OnboardingChecklist title={t("firstRun")} steps={[{ id: "people", title: t("openEmployees"), complete: data.employees.length > 0, href: "/employees" }, { id: "policy", title: t("openPolicies"), complete: data.policyConfigured, href: "/people/policies" }, { id: "tasks", title: t("openOnboarding"), complete: data.employees.some(employee => employee.checklist.length > 0), href: "/people/onboarding" }]} /> : null}</div>;
}
