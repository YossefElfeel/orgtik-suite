"use client";
import { useTranslations, useFormatter } from "next-intl";
import { ErrorState, LoadingState } from "@orgtik/ui";
import { useServicePricePolicyQuery } from "@/redux/features/services/servicesApi";
export default function ServicePricePolicy() {
  const t = useTranslations("ServiceCatalog"), f = useFormatter(), policy = useServicePricePolicyQuery();
  if (policy.isLoading) return <LoadingState rows={2} />;
  if (policy.isError || !policy.data) return <ErrorState size="compact" title={t("policyError")} onRetry={() => void policy.refetch()} />;
  return <section className="flex flex-col gap-3 border-t border-line pt-5" aria-labelledby="service-price-policy"><h2 id="service-price-policy" className="font-display text-title-sm">{t("policyTitle")}</h2><p className="max-w-prose text-body-sm text-fg-muted">{t("policyHelp")}</p><div className="grid gap-6 sm:grid-cols-2"><div><h3 className="mb-3 text-body-sm font-semibold">{t("durationPolicy")}</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">{policy.data.terms.map(months => <div key={months} className="contents"><dt>{t("months", { months })}</dt><dd>{f.number(((policy.data!.serviceDurationSavings || policy.data!.durationSavings)[months] || 0) / 100, { style: "percent" })}</dd></div>)}</dl></div><div><h3 className="mb-3 text-body-sm font-semibold">{t("countPolicy")}</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">{(policy.data.serviceCountBands || policy.data.countBands).map(band => <div key={band.min} className="contents"><dt>{t("items", { count: f.number(band.min) })}</dt><dd>{f.number(band.saving / 100, { style: "percent" })}</dd></div>)}</dl></div></div></section>;
}
