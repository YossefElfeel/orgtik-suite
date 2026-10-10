"use client";
import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { Badge, Button, ConfirmDialog, ErrorState, NoPermissionState, PageHeader, Toolbar, EmptyState } from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import { useServiceCatalogQuery, useServicePublicationQuery, usePublishServiceCatalogMutation } from "@/redux/features/services/servicesApi";
import ServiceOfferSheet from "@/components/sheets/ServiceOfferSheet";
import ServiceBundleSheet from "@/components/sheets/ServiceBundleSheet";
import { serviceLabel, serviceForbidden } from "@/lib/service-catalog";
import { Link } from "@/i18n/routing";
import ServiceCatalogNavigation from "@/components/ServiceCatalogNavigation";
import { catalogColumns } from "./columns";
export default function ServiceCatalogPage() {
  const t = useTranslations("ServiceCatalog"), locale = useLocale(), f = useFormatter(), query = useServiceCatalogQuery(), publication = useServicePublicationQuery(), [publish, mutation] = usePublishServiceCatalogMutation();
  const [search, setSearch] = useState(""), [density, setDensity] = useState<"comfortable" | "compact">("comfortable"), [offerId, setOfferId] = useState<string>(), [bundleId, setBundleId] = useState<string>(), [saved, setSaved] = useState(false), [published, setPublished] = useState<number>();
  const publishReference = useRef<string | undefined>(undefined);
  const data = query.data, drafts = (data?.offers.filter(offer => offer.draft).length || 0) + (data?.bundles.filter(bundle => bundle.draft).length || 0) + Number(Boolean(publication.data?.drafts.policy));
  const offers = useMemo(() => (data?.offers || []).filter(offer => serviceLabel(offer.draft?.name || offer.name, locale).toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))), [data?.offers, search, locale]);
  const columns = useMemo(() => catalogColumns(t, locale, amount => f.number(amount, { style: "currency", currency: "CHF" }), Boolean(data?.canPublish), setOfferId), [t, locale, f, data?.canPublish]);
  return <div className="flex min-w-0 flex-col gap-5"><PageHeader title={t("title")} description={t("subtitle")} meta={data ? <Badge>{t("version", { version: f.number(data.priceVersion) })}</Badge> : undefined} actions={<Link href="/service-requests" className="text-body-sm font-semibold text-fg-brand underline">{t("delivery")}</Link>} />
    {query.isError ? serviceForbidden(query.error) ? <NoPermissionState title={t("internalOnly")} description={t("internalOnlyBody")} action={<Link href="/" className="text-fg-brand underline">{t("backCRM")}</Link>} /> : <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} /> : <>
    <ServiceCatalogNavigation />
    <Toolbar label={t("toolbar")} search={{ value: search, onChange: setSearch, label: t("search") }} density={density} onDensityChange={setDensity} actions={data?.canPublish ? <ConfirmDialog trigger={<Button disabled={!drafts}>{t("publish")}</Button>} tone="primary" title={t("publishTitle")} impact={t("publishImpact", { count: drafts })} confirmLabel={t("publish")} cancelLabel={t("cancel")} onConfirm={async () => { publishReference.current ||= crypto.randomUUID(); const result = await publish({ operationId: publishReference.current }).unwrap(); publishReference.current = undefined; setPublished(result.priceVersion); setSaved(false); }} /> : null} />
    {saved ? <p role="status" className="rounded-field bg-info-subtle p-3 text-body-sm text-fg">{t("draftSaved")}</p> : null}{published !== undefined ? <p role="status" className="rounded-field bg-success-subtle p-3 text-body-sm text-fg">{t("publishedNotice", { version: f.number(published) })}</p> : null}{mutation.isError ? <p role="alert" className="text-body-sm text-danger">{t("publishError")}</p> : null}
    <DataTable label={t("title")} columns={columns} data={offers} getRowId={offer => offer.id} status={query.isLoading ? "loading" : "ready"} density={density} columnChooser resizable empty={{ title: t(search ? "noMatch" : "empty"), description: t(search ? "noMatchHelp" : "emptyHelp"), action: search ? <Button variant="secondary" onClick={() => setSearch("")}>{t("clearSearch")}</Button> : <Button variant="secondary" onClick={() => void query.refetch()}>{t("retry")}</Button> }} />
    <section aria-labelledby="service-bundles-heading" className="flex flex-col gap-3"><h2 id="service-bundles-heading" className="font-display text-title-sm">{t("bundles")}</h2><p className="max-w-prose text-body-sm text-fg-muted">{t("bundleHelp")}</p>{data?.bundles.length ? <ul className="divide-y divide-line rounded-card border border-line bg-raised">{data.bundles.map(bundle => <li key={bundle.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 dir="auto" className="text-body font-semibold">{serviceLabel(bundle.draft?.name || bundle.name, locale)}</h3>{bundle.draft ? <Badge tone="warning">{t("draft")}</Badge> : null}</div><p className="mt-1 text-body-sm text-fg-muted">{(bundle.draft?.ids || bundle.ids).map(id => serviceLabel(data.offers.find(offer => offer.id === id)?.name, locale)).join(" · ")}</p></div>{data.canPublish ? <Button variant="secondary" size="sm" shape="control" onClick={() => setBundleId(bundle.id)}>{t("editBundle")}</Button> : null}</li>)}</ul> : !query.isLoading ? <EmptyState size="compact" title={t("noBundles")} /> : null}</section>
    <p className="max-w-prose text-caption text-fg-subtle">{t("pricingHelp")}</p>
    </>}
    {offerId ? <ServiceOfferSheet id={offerId} open onOpenChange={open => { if (!open) setOfferId(undefined); }} onSaved={() => { setSaved(true); setPublished(undefined); }} /> : null}{bundleId ? <ServiceBundleSheet id={bundleId} open onOpenChange={open => { if (!open) setBundleId(undefined); }} onSaved={() => { setSaved(true); setPublished(undefined); }} /> : null}
  </div>;
}
