"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, CurrencyCircleDollar, Hourglass, Receipt, UserMinus } from "@phosphor-icons/react";
import { Badge, ErrorState, PageHeader, Stat, useFormatter } from "@orgtik/ui";
import { BarChart } from "@orgtik/ui/charts";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { listStatus, useCountryName } from "@/components/system/kit";
import { useReportsQuery, type ReportPayment } from "@/store/system";
import { Metrics } from '@/components/console/Metrics';

const TOOLS = ["general", "tasks", "files", "chat", "hr", "crm", "marketing", "email", "website", "hosting"];
const GATEWAYS: Record<string, string> = { gw_paymob: "Paymob", gw_fawry: "Fawry", gw_moyasar: "Moyasar", gw_checkout: "Checkout.com", gw_knet: "KNET", gw_stripe: "Stripe" };

function Reports() {
  const t = useTranslations("System");
  const tco = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const country = useCountryName();
  const { data, isLoading, error, refetch } = useReportsQuery();
  const usd = (n: number) => f.money(n, "USD");

  const byTool = useMemo(
    () => Object.entries(data?.mrrByTool ?? {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: TOOLS.includes(k) ? tco(`tools.${k}`) : k, mrr: v })),
    [data, tco],
  );
  const byCountry = useMemo(() => Object.entries(data?.mrrByCountry ?? {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: country(k), mrr: v })), [data, country]);

  const columns = useMemo<ColumnDef<ReportPayment, unknown>[]>(
    () => [
      { id: "at", header: t("reports.paidOn"), cell: ({ row }) => f.date(row.original.at, { dateStyle: "medium" }) },
      { id: "invoice", header: t("reports.invoice"), cell: ({ row }) => <span dir="ltr">{row.original.invoice}</span> },
      { id: "gateway", header: t("reports.gateway"), cell: ({ row }) => <bdi>{GATEWAYS[row.original.gateway] ?? row.original.gateway}</bdi> },
      { id: "amount", header: t("reports.amount"), meta: { numeric: true }, cell: ({ row }) => <span dir="ltr">{f.money(row.original.amount, row.original.currency)}</span> },
      {
        id: "rate",
        header: t("reports.rate"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span dir="ltr" className="tabular-nums">
            {t("reports.rateValue", { currency: row.original.currency, rate: f.number(row.original.usdRate, { maximumFractionDigits: 4 }) })}
          </span>
        ),
      },
      { id: "usd", header: t("reports.usdAmount"), meta: { numeric: true }, cell: ({ row }) => <span dir="ltr" className="font-medium">{usd(row.original.usdAmount)}</span> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, f],
  );

  if (error && !data) return <ErrorState size="page" titleAs="h1" title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  const fmt = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("reports.title")} description={t("reports.description")} status={<Badge tone="info">{t("reports.allUsd")}</Badge>} />
      <Metrics />
      <section aria-labelledby="rp-numbers" aria-busy={isLoading || undefined} className="flex flex-col gap-4">
        <h2 id="rp-numbers" className="sr-only">
          {t("reports.numbers")}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(13rem,100%),1fr))] gap-3">
          <Stat loading={isLoading} icon={<CurrencyCircleDollar />} label={t("reports.mrr")} value={data ? usd(data.mrrUsd) : ""} hint={t("reports.mrrHint")} />
          <Stat loading={isLoading} icon={<Receipt />} label={t("reports.revenue")} value={data ? usd(data.revenueUsd) : ""} hint={t("reports.revenueHint")} />
          <Stat loading={isLoading} icon={<ArrowCounterClockwise />} label={t("reports.refunds")} value={data ? usd(data.refundsUsd) : ""} hint={t("reports.refundsHint")} />
          <Stat loading={isLoading} icon={<Hourglass />} label={t("reports.trials")} value={data ? f.number(data.trials.active) : ""} hint={t("reports.trialsHint")} />
          <Stat loading={isLoading} icon={<UserMinus />} label={t("reports.churn")} value={data ? f.number(data.churn.cancelling + data.churn.ended) : ""} hint={data ? t("reports.churnHint", { cancelling: data.churn.cancelling, ended: data.churn.ended }) : undefined} />
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <BarChart loading={isLoading} error={Boolean(error)} onRetry={refetch} layout="rows" title={t("reports.byTool")} description={t("reports.chartHint")} data={byTool} x={{ key: "name", label: t("reports.tool") }} series={[{ key: "mrr", label: t("reports.mrr") }]} valueFormat={fmt} />
        <BarChart loading={isLoading} error={Boolean(error)} onRetry={refetch} layout="rows" title={t("reports.byCountry")} description={t("reports.chartHint")} data={byCountry} x={{ key: "name", label: t("reports.country") }} series={[{ key: "mrr", label: t("reports.mrr"), color: 2 }]} valueFormat={fmt} />
      </div>
      <section aria-labelledby="rp-payments" className="flex flex-col gap-3">
        <h2 id="rp-payments" className="font-display text-title-sm text-fg">
          {t("reports.payments")}
        </h2>
        <p className="text-body-sm text-fg-muted">{t("reports.rateNote")}</p>
        <DataTable label={t("reports.payments")} columns={columns} data={data?.payments ?? []} getRowId={(r) => r.id} status={listStatus(isLoading, error)} paginate onRetry={refetch} empty={{ title: t("reports.noPayments") }} />
      </section>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports:view">
      <Reports />
    </RequirePermission>
  );
}
