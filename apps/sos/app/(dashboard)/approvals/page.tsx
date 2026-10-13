"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Badge, EmptyState, PageHeader, Select, Toolbar, SUITE_TOOLS, type Locale } from "@orgtik/ui";
import { useAccountResource } from "@/components/account/useAccount";
import { AccountState } from "@/components/account/AccountState";
import type { ApprovalItem } from "@/types/approvals";
export default function ApprovalsPage() {
  const t = useTranslations("Roadmap"), account = useTranslations("Suite"), locale = useLocale() as Locale, resource = useAccountResource<ApprovalItem[]>("suite:/approvals");
  const [query, setQuery] = useState(""), [tool, setTool] = useState("all");
  const rows = (resource.data || []).filter(item => (tool === "all" || item.tool === tool) && item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const tools = [...new Set((resource.data || []).map(item => item.tool))];
  return <div className="flex flex-col gap-5"><PageHeader title={t("approvals")} /><Toolbar label={t("approvals")} search={{ value: query, onChange: setQuery, label: t("search") }} filters={<Select aria-label={t("allTools")} value={tool} onValueChange={value => setTool(value || "all")} options={[{ value: "all", label: t("allTools") }, ...tools.map(key => ({ value: key, label: key === "account" ? account("home") : SUITE_TOOLS[key].labels[locale] }))]} />} /><AccountState loading={resource.loading} error={resource.error} retry={resource.refetch}>{rows.length ? <ul className="divide-y divide-line rounded-card border border-line bg-raised">{rows.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="min-w-0"><Badge>{item.tool === "account" ? account("home") : SUITE_TOOLS[item.tool].labels[locale]}</Badge><p dir="auto" className="mt-2 text-body font-semibold">{item.sourceTool ? SUITE_TOOLS[item.sourceTool].labels[locale] + " · " : ""}{item.title}</p></div><Link className="text-body-sm font-semibold text-fg-brand underline" href={item.tool === "account" ? item.path : `/go/${SUITE_TOOLS[item.tool].scope}?redirect=${encodeURIComponent(item.path)}`}>{t("review")}</Link></li>)}</ul> : <EmptyState title={query || tool !== "all" ? t("noMatch") : t("noApprovals")} />}</AccountState></div>;
}
