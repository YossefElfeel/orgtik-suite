"use client";

// Every connected profile's figures for the period. The platform filter and the sort are in the
// URL; the profile's name opens its report (/our-reports/:profileId). The fake status switch,
// e-mail and "Delete" that only logged are gone.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plugs } from "@phosphor-icons/react";
import { Button, EmptyState, MultiSelect, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { BarChart } from "@orgtik/ui/charts";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { Link } from "@/i18n/routing";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetInsightsIntegrationsQuery, useGetOurReportsProfilesQuery } from "@/redux/features/reports/reportsApi";
import type { IProfileReportItem } from "@/types/reports";
import { ExportButton, csvName } from "./shared/ExportButton";
import { SyncNotice, useMetricLabel } from "./shared/metrics";
import { useProjectArg, useSearchState, type useReportPeriod } from "./shared/period";
import { sortRows, useUrlSort } from "./shared/tableSort";

const SORTS = ["name", "impressions", "reach", "engagements", "engagementRate", "followersGained", "followers", "postsPublished"] as const;
type SortKey = (typeof SORTS)[number];
const valueOf = (p: IProfileReportItem, k: SortKey): string | number =>
  k === "name" ? p.profileName : k === "followers" ? p.unifiedMetrics?.followers ?? 0 : (p[k as keyof IProfileReportItem] as number) ?? 0;

export function ProfilesReport({ period }: { period: ReturnType<typeof useReportPeriod> }) {
  const t = useTranslations("Reports");
  const label = useMetricLabel();
  const f = useFormatter();
  const roles = useMarketingRoles();
  const { ready, projectId } = useProjectArg();
  const { params, set } = useSearchState();
  const sort = useUrlSort(SORTS, "impressions");
  const platforms = (params.get("platforms") ?? "").split(",").filter(Boolean);

  const accounts = useGetInsightsIntegrationsQuery(projectId ? { projectId } : undefined, { skip: !ready });
  const q = period.query;
  const report = useGetOurReportsProfilesQuery({ projectId, ...q, platforms: platforms.length ? platforms : undefined }, { skip: !ready || !q });
  const items = report.data?.data.items ?? [];

  const platformOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const a of accounts.data?.data ?? []) seen.add(a.platform);
    for (const p of platforms) seen.add(p);
    return [...seen].map((p) => ({ value: p, label: platformMeta(p).name }));
  }, [accounts.data, platforms]);

  const rows = useMemo(() => sortRows(items, (p) => valueOf(p, sort.id), sort.dir), [items, sort.id, sort.dir]);

  const columns = useMemo<ColumnDef<IProfileReportItem, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("colProfile"),
        accessorFn: (p) => p.profileName,
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link href={`/our-reports/${row.original.profileId}`} className="truncate font-medium text-fg-brand hover:underline" dir="auto">
              {row.original.profileName}
            </Link>
            <PlatformBadge platform={row.original.platform} className="text-fg-muted" />
          </div>
        ),
      },
      ...(["impressions", "reach", "engagements"] as const).map<ColumnDef<IProfileReportItem, unknown>>((k) => ({
        id: k,
        header: label(k),
        accessorFn: (p) => p[k],
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      })),
      {
        id: "engagementRate",
        header: label("engagementRate"),
        accessorFn: (p) => p.engagementRate,
        meta: { numeric: true },
        cell: ({ getValue }) => f.percent((getValue() as number) / 100, 2),
      },
      { id: "followersGained", header: label("followersGained"), accessorFn: (p) => p.followersGained, meta: { numeric: true }, cell: ({ getValue }) => f.number(getValue() as number) },
      { id: "followers", header: label("followers"), accessorFn: (p) => p.unifiedMetrics?.followers ?? 0, meta: { numeric: true }, cell: ({ getValue }) => f.number(getValue() as number) },
      { id: "postsPublished", header: label("postsPublished"), accessorFn: (p) => p.postsPublished, meta: { numeric: true }, cell: ({ getValue }) => f.number(getValue() as number) },
    ],
    [t, label, f],
  );

  if (!q) return null;
  const noAccounts = accounts.isSuccess && !(accounts.data?.data ?? []).length;
  if (noAccounts) {
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

  const status = !ready || report.isLoading || (report.isFetching && !report.data) ? "loading" : report.isError && !report.data ? "error" : rows.length ? "ready" : "empty";
  const head = [t("colProfile"), t("colPlatform"), label("impressions"), label("reach"), label("engagements"), `${label("engagementRate")} (%)`, label("followersGained"), label("followers"), label("postsPublished")];
  const csvRows = rows.map((p) => [p.profileName, platformMeta(p.platform).name, p.impressions, p.reach, p.engagements, p.engagementRate, p.followersGained, p.unifiedMetrics?.followers ?? 0, p.postsPublished]);

  return (
    <div className="flex flex-col gap-5">
      <SyncNotice status={report.data?.data.syncStatus} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <MultiSelect
          aria-label={t("filterPlatforms")}
          placeholder={t("allPlatforms")}
          className="min-w-60 max-w-full"
          options={platformOptions}
          value={platforms}
          onValueChange={(v) => set({ platforms: v.length ? v.join(",") : null })}
        />
        <ExportButton fileName={csvName("profiles", period.range.start, period.range.end)} head={head} rows={csvRows} />
      </div>
      <BarChart
        title={t("chartByProfile")}
        description={t("chartByProfileHint")}
        loading={status === "loading"}
        error={status === "error"}
        onRetry={() => report.refetch()}
        emptyText={t("noProfilesMatch")}
        layout="rows"
        valueFormat={{ maximumFractionDigits: 0 }}
        data={rows.map((p) => ({ name: p.profileName, engagements: p.engagements, impressions: p.impressions }))}
        x={{ key: "name", label: t("colProfile") }}
        series={[{ key: "engagements", label: label("engagements"), color: 4 }]}
      />
      <DataTable
        label={t("profilesTable")}
        columns={columns}
        data={rows}
        getRowId={(p) => p.profileId}
        status={status}
        onRetry={() => report.refetch()}
        sorting={sort.sorting}
        onSortingChange={sort.onSortingChange}
        paginate
        error={{ title: t("loadError") }}
        empty={
          platforms.length
            ? { title: t("noProfilesMatch"), action: <Button variant="secondary" onClick={() => set({ platforms: null })}>{t("clearFilters")}</Button> }
            : { title: t("noProfiles"), description: t("noProfilesBody") }
        }
      />
    </div>
  );
}
