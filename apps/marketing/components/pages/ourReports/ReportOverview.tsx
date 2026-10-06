"use client";

// The overview of a period: KPI tiles against the previous period of the same length, and the
// daily trends the API returns. The old charts plotted one constant "Click rate / Open rate"
// series for every brand and ignored `trends[]` (MKT-021); each chart now has its table view
// (MKT-074), and its loading, error and empty states (MKT-072).
import { useId } from "react";
import { useTranslations } from "next-intl";
import { Plugs } from "@phosphor-icons/react";
import { EmptyState, ErrorState } from "@orgtik/ui";
import { BarChart, LineChart } from "@orgtik/ui/charts";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetOurReportsOverviewQuery } from "@/redux/features/reports/reportsApi";
import type { MetricKey } from "@/types/reports";
import { ExportButton, csvName } from "./shared/ExportButton";
import { KpiGrid, SyncNotice, useDayFormat, useMetricLabel } from "./shared/metrics";
import { useProjectArg, type useReportPeriod } from "./shared/period";

const KPIS: MetricKey[] = ["impressions", "reach", "engagements", "clicks", "followers", "followersGained", "profileViews", "videoViews"];
const DAILY: MetricKey[] = ["followers", "followersGained", "impressions", "reach", "engagements", "clicks", "likes", "comments", "shares", "saves"];

export function ReportOverview({ period, profileId, fileLabel }: { period: ReturnType<typeof useReportPeriod>; profileId?: string; fileLabel?: string }) {
  const t = useTranslations("Reports");
  const label = useMetricLabel();
  const day = useDayFormat();
  const roles = useMarketingRoles();
  const id = useId();
  const { ready, projectId } = useProjectArg();
  const q = period.query;
  const { data, isLoading, isFetching, isError, refetch } = useGetOurReportsOverviewQuery(
    { projectId, ...q, ...(profileId ? { profileIds: [profileId] } : {}) },
    { skip: !ready || !q },
  );
  const d = data?.data;
  const loading = !ready || isLoading || (isFetching && !d);

  if (!q) return null;
  if (isError && !d) return <ErrorState size="page" title={t("loadError")} onRetry={() => refetch()} />;

  if (!profileId && d && d.syncStatus.totalIntegrations === 0) {
    return (
      <EmptyState
        size="page"
        icon={<Plugs />}
        title={t("noAccountsTitle")}
        description={t("noAccountsBody")}
        action={roles.manageIntegrations ? <ButtonLink href="/integrations">{t("connectAccount")}</ButtonLink> : undefined}
      />
    );
  }

  const rows = (d?.trends ?? []).map((r) => ({ date: r.date, ...Object.fromEntries(DAILY.map((k) => [k, r.metrics[k] ?? 0])) }));
  const head = [t("day"), ...DAILY.map((k) => label(k))];
  const csvRows = rows.map((r) => [r.date, ...DAILY.map((k) => (r as Record<string, number | string>)[k])]);
  const x = { key: "date", label: t("day"), format: day };
  const chartState = { loading, error: isError, onRetry: () => refetch(), emptyText: t("noTrend"), valueFormat: { maximumFractionDigits: 0 } };

  return (
    <div className="flex flex-col gap-5">
      <SyncNotice status={d?.syncStatus} />
      <section aria-labelledby={`${id}-kpi`} className="flex flex-col gap-3">
        <h2 id={`${id}-kpi`} className="font-display text-title-sm text-fg">
          {t("kpiTitle")}
        </h2>
        <KpiGrid keys={KPIS} values={d?.totals.withRate} days={period.days} loading={loading} />
      </section>
      <section aria-labelledby={`${id}-trend`} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${id}-trend`} className="font-display text-title-sm text-fg">
            {t("trendTitle")}
          </h2>
          <ExportButton fileName={csvName(fileLabel ?? "report", "daily", period.range.start, period.range.end)} head={head} rows={csvRows} label={t("exportDaily")} />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <LineChart {...chartState} area title={t("chartFollowers")} description={t("chartFollowersHint")} data={rows} x={x} series={[{ key: "followers", label: label("followers") }]} />
          <BarChart {...chartState} title={t("chartGained")} description={t("chartGainedHint")} data={rows} x={x} series={[{ key: "followersGained", label: label("followersGained"), color: 2 }]} />
          <LineChart
            {...chartState}
            title={t("chartReach")}
            description={t("chartReachHint")}
            data={rows}
            x={x}
            series={[
              { key: "impressions", label: label("impressions"), color: 1 },
              { key: "reach", label: label("reach"), color: 3, dashed: true },
            ]}
          />
          <LineChart
            {...chartState}
            title={t("chartEngagement")}
            description={t("chartEngagementHint")}
            data={rows}
            x={x}
            series={[
              { key: "engagements", label: label("engagements"), color: 4 },
              { key: "clicks", label: label("clicks"), color: 5, dashed: true },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
