"use client";

// One competitor (/competitors-reports/:id): its figures and each platform's. The route showed a
// constant post list whatever the id, and its "followers" sub-route showed the report (MKT-066).
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState, ErrorState, LoadingState, PageHeader, Stat, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { BarChart } from "@orgtik/ui/charts";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useGetCompetitorsQuery } from "@/redux/features/reports/reportsApi";
import type { ICompetitorProfile } from "@/types/reports";
import { ExportButton, csvName } from "../ourReports/shared/ExportButton";
import { METRIC_ICON, useMetricLabel } from "../ourReports/shared/metrics";
import { useProjectArg } from "../ourReports/shared/period";

export function CompetitorDetail() {
  const t = useTranslations("Competitors");
  const label = useMetricLabel();
  const f = useFormatter();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { ready, projectId } = useProjectArg();
  const { data, isLoading, isError, refetch } = useGetCompetitorsQuery(projectId ? { projectId } : undefined, { skip: !ready });

  const columns = useMemo<ColumnDef<ICompetitorProfile, unknown>[]>(
    () => [
      { id: "platform", header: t("platform"), accessorFn: (p) => platformMeta(p.platform).name, cell: ({ row }) => <PlatformBadge platform={row.original.platform} /> },
      ...(["followers", "followersGained", "impressions", "engagements"] as const).map<ColumnDef<ICompetitorProfile, unknown>>((k) => ({
        id: k,
        header: label(k),
        accessorFn: (p) => p[k],
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      })),
      { id: "engagementRate", header: label("engagementRate"), accessorFn: (p) => p.engagementRate, meta: { numeric: true }, cell: ({ getValue }) => f.percent((getValue() as number) / 100, 2) },
      { id: "postsPublished", header: label("postsPublished"), accessorFn: (p) => p.postsPublished, meta: { numeric: true }, cell: ({ getValue }) => f.number(getValue() as number) },
    ],
    [t, label, f],
  );

  if (!ready || isLoading) return <LoadingState />;
  if (isError && !data) return <ErrorState size="page" titleAs="h1" title={t("loadError")} onRetry={() => refetch()} />;
  const c = (data?.data ?? []).find((x) => x.id === id);
  if (!c) {
    return (
      <EmptyState
        size="page"
        titleAs="h1"
        icon={<MagnifyingGlass />}
        title={t("notFound")}
        description={t("notFoundBody")}
        action={<ButtonLink href="/competitors-reports">{t("backToCompetitors")}</ButtonLink>}
      />
    );
  }

  const head = [t("platform"), label("followers"), label("followersGained"), label("impressions"), label("engagements"), `${label("engagementRate")} (%)`, label("postsPublished")];
  const csvRows = c.profiles.map((p) => [platformMeta(p.platform).name, p.followers, p.followersGained, p.impressions, p.engagements, p.engagementRate, p.postsPublished]);
  const tiles = [
    { k: "followers", v: f.number(c.followers) },
    { k: "followersGained", v: f.number(c.followersGained) },
    { k: "engagementRate", v: f.percent(c.engagementRate / 100, 2) },
    { k: "postsPublished", v: f.number(c.postsPublished) },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: t("title"), href: `/${locale}/competitors-reports` }, { label: <bdi>{c.name}</bdi> }]}
        title={<bdi>{c.name}</bdi>}
        description={<bdi dir="ltr">@{c.handle}</bdi>}
        actions={<ExportButton fileName={csvName("competitor", c.handle)} head={head} rows={csvRows} />}
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.k}>
            <Stat icon={tile.k === "engagementRate" ? METRIC_ICON.engagements : tile.k === "postsPublished" ? METRIC_ICON.posts : METRIC_ICON[tile.k]} label={label(tile.k)} value={tile.v} className="h-full" />
          </li>
        ))}
      </ul>
      <BarChart
        title={t("chartByPlatform")}
        description={t("chartByPlatformHint")}
        valueFormat={{ maximumFractionDigits: 0 }}
        data={c.profiles.map((p) => ({ platform: platformMeta(p.platform).name, followers: p.followers, followersGained: p.followersGained }))}
        x={{ key: "platform", label: t("platform") }}
        series={[{ key: "followers", label: label("followers") }]}
      />
      <DataTable label={t("platformsTable", { name: c.name })} columns={columns} data={c.profiles} getRowId={(p) => p.platform} paginate={false} empty={{ title: t("noPlatforms") }} />
    </div>
  );
}
