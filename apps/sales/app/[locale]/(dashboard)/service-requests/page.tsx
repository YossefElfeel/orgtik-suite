"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, NoPermissionState, PageHeader, Select, Toolbar } from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import { Link, useRouter } from "@/i18n/routing";
import { useServiceRequestsQuery } from "@/redux/features/services/servicesApi";
import { serviceForbidden } from "@/lib/service-catalog";
import ServiceRequestInspector from "@/components/ServiceRequestInspector";
import { requestColumns } from "./columns";
export default function ServiceRequestsPage() {
  const t = useTranslations("ServiceRequests"), query = useServiceRequestsQuery(), params = useSearchParams(), router = useRouter(), [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const search = params.get("q") || "", status = params.get("status") || "all", selected = params.get("request"), request = query.data?.find(row => row.id === selected);
  const update = (key: string, value: string) => { const next = new URLSearchParams(params.toString()); if (value) next.set(key, value); else next.delete(key); router.replace(`/service-requests${next.size ? `?${next}` : ""}`); };
  const rows = (query.data || []).filter(row => (status === "all" || row.state === status) && `${row.title} ${row.number} ${row.workspaceName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <div className="flex min-w-0 flex-col gap-5"><PageHeader title={t("title")} description={t("subtitle")} actions={<Link href="/service-catalog" className="text-body-sm font-semibold text-fg-brand underline">{t("catalog")}</Link>} />{query.isError ? serviceForbidden(query.error) ? <NoPermissionState title={t("internalOnly")} description={t("internalOnlyBody")} action={<Link href="/" className="text-fg-brand underline">{t("backCRM")}</Link>} /> : <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} /> : <><Toolbar label={t("toolbar")} search={{ value: search, onChange: value => update("q", value), label: t("search") }} density={density} onDensityChange={setDensity} filters={<Select label={t("status")} value={status} onValueChange={value => update("status", value === "all" ? "" : value || "")} options={[{ value: "all", label: t("all") }, ...["new", "under_review", "quoted", "awaiting_payment", "in_progress", "on_hold", "in_review", "completed", "cancelled", "rejected", "expired"].map(value => ({ value, label: t(`states.${value}`) }))]} />} /><DataTable label={t("title")} data={rows} columns={requestColumns(t, id => update("request", id))} getRowId={row => row.id} status={query.isLoading ? "loading" : "ready"} columnChooser resizable density={density} empty={{ title: t(search || status !== "all" ? "noMatch" : "empty"), description: t(search || status !== "all" ? "noMatchHelp" : "emptyHelp"), action: <Button variant="secondary" onClick={() => { if (search || status !== "all") router.replace("/service-requests"); else void query.refetch(); }}>{t(search || status !== "all" ? "clearFilters" : "retry")}</Button> }} />{selected && !request && !query.isLoading ? <ErrorState size="compact" title={t("notFound")} action={<Button variant="secondary" onClick={() => update("request", "")}>{t("close")}</Button>} /> : null}</>}{request ? <ServiceRequestInspector request={request} onClose={() => update("request", "")} /> : null}</div>;
}
