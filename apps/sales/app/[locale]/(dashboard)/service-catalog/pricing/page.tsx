"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { ErrorState, NoPermissionState, PageHeader } from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import { useServiceCatalogQuery } from "@/redux/features/services/servicesApi";
import { serviceForbidden } from "@/lib/service-catalog";
import ServicePriceSheet from "@/components/sheets/ServicePriceSheet";
import ServicePricePolicy from "@/components/ServicePricePolicy";
import { Link } from "@/i18n/routing";
import { priceColumns } from "./columns";
export default function ServicePricingPage() { const t = useTranslations("ServiceCatalog"), locale = useLocale(), f = useFormatter(), query = useServiceCatalogQuery(), [id, setId] = useState<string>(), [saved, setSaved] = useState(false); const columns = useMemo(() => priceColumns(query.data, t, locale, (amount, currency) => f.number(amount, { style: "currency", currency }), setId), [query.data, t, locale, f]); return <div className="flex min-w-0 flex-col gap-5"><PageHeader title={t("pricingTitle")} description={t("overrideHelp")} actions={<Link href="/service-catalog" className="text-body-sm font-semibold text-fg-brand underline">{t("backCatalog")}</Link>} />{query.isError ? serviceForbidden(query.error) ? <NoPermissionState title={t("internalOnly")} description={t("internalOnlyBody")} /> : <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} /> : <>{saved ? <p role="status" className="rounded-field bg-info-subtle p-3 text-body-sm">{t("draftSaved")}</p> : null}<DataTable label={t("pricingTitle")} data={query.data?.offers || []} columns={columns} getRowId={row => row.id} status={query.isLoading ? "loading" : "ready"} density="compact" empty={{ title: t("empty"), description: t("emptyHelp") }} /><ServicePricePolicy /></>}{id ? <ServicePriceSheet id={id} open onOpenChange={open => { if (!open) setId(undefined); }} onSaved={() => setSaved(true)} /> : null}</div>; }
