"use client";

// Competitors: the benchmark list the API returns (GET /analytics/competitors), with search,
// a platform filter and a sort that work on the client and live in the URL. The page was all
// constants, "Dribbble" included, and its filters and sort did nothing (MKT-021, MKT-068). There
// is no endpoint to add a competitor, so the page doesn't offer it.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Binoculars } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, Field, PageHeader, SegmentedControl, Select, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { BarChart } from "@orgtik/ui/charts";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { Link } from "@/i18n/routing";
import { useGetCompetitorsQuery } from "@/redux/features/reports/reportsApi";
import { ExportButton, csvName } from "../ourReports/shared/ExportButton";
import { useMetricLabel } from "../ourReports/shared/metrics";
import { SearchField } from "../ourReports/shared/SearchField";
import { useProjectArg, useSearchState } from "../ourReports/shared/period";
import { sortRows, useUrlSort } from "../ourReports/shared/tableSort";
import { COMPETITOR_SORTS, competitorRow, type CompetitorRow, type CompetitorSort } from "./shared";

export function CompetitorsReport() {
  const t = useTranslations("Competitors");
  const label = useMetricLabel();
  const f = useFormatter();
  const { ready, projectId } = useProjectArg();
  const { params, set } = useSearchState();
  const sort = useUrlSort(COMPETITOR_SORTS, "followers");
  const search = params.get("q") ?? "";
  const platform = params.get("platform");
  const { data, isLoading, isFetching, isError, refetch } = useGetCompetitorsQuery(projectId ? { projectId } : undefined, { skip: !ready });
  const all = useMemo(() => data?.data ?? [], [data]);

  const platformOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of all) for (const p of c.profiles) seen.add(p.platform);
    return [...seen].sort().map((p) => ({ value: p, label: platformMeta(p).name }));
  }, [all]);

  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    const list = all
      .map((c) => competitorRow(c, platform))
      .filter((r): r is CompetitorRow => !!r && (!needle || r.name.toLocaleLowerCase().includes(needle) || r.handle.toLocaleLowerCase().includes(needle)));
    return sortRows(list, (r) => r[sort.id], sort.dir);
  }, [all, platform, search, sort.id, sort.dir]);

  const metric = (k: Exclude<CompetitorSort, "name">) => label(k);
  const columns = useMemo<ColumnDef<CompetitorRow, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("colCompetitor"),
        accessorFn: (r) => r.name,
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link href={`/competitors-reports/${row.original.id}`} className="truncate font-medium text-fg-brand hover:underline" dir="auto">
              {row.original.name}
            </Link>
            <span className="flex items-center gap-1.5 text-caption text-fg-muted">
              <bdi dir="ltr">@{row.original.handle}</bdi>
              <span className="flex items-center gap-1" aria-label={row.original.platforms.map((p) => platformMeta(p).name).join(", ")} role="img">
                {row.original.platforms.map((p) => (
                  <PlatformIcon key={p} platform={p} className="size-3.5" />
                ))}
              </span>
            </span>
          </div>
        ),
      },
      ...(["followers", "followersGained", "impressions", "engagements"] as const).map<ColumnDef<CompetitorRow, unknown>>((k) => ({
        id: k,
        header: label(k),
        accessorFn: (r) => r[k],
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      })),
      { id: "engagementRate", header: label("engagementRate"), accessorFn: (r) => r.engagementRate, meta: { numeric: true }, cell: ({ getValue }) => f.percent((getValue() as number) / 100, 2) },
      { id: "postsPublished", header: label("postsPublished"), accessorFn: (r) => r.postsPublished, meta: { numeric: true }, cell: ({ getValue }) => f.number(getValue() as number) },
    ],
    [t, f, label],
  );

  const filtered = !!search.trim() || !!platform;
  const status = !ready || isLoading || (isFetching && !data) ? "loading" : isError && !data ? "error" : rows.length ? "ready" : "empty";
  const head = [t("colCompetitor"), t("colHandle"), t("colPlatforms"), metric("followers"), metric("followersGained"), metric("impressions"), metric("engagements"), `${metric("engagementRate")} (%)`, metric("postsPublished")];
  const csvRows = rows.map((r) => [r.name, `@${r.handle}`, r.platforms.map((p) => platformMeta(p).name).join(" / "), r.followers, r.followersGained, r.impressions, r.engagements, r.engagementRate, r.postsPublished]);
  const clear = () => set({ q: null, platform: null });

  const header = <PageHeader title={t("title")} description={t("description")} actions={<ExportButton fileName={csvName("competitors", platform)} head={head} rows={csvRows} />} />;

  if (isError && !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState size="page" title={t("loadError")} onRetry={() => refetch()} />
      </div>
    );
  }
  if (status !== "loading" && !all.length) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState size="page" icon={<Binoculars />} title={t("emptyTitle")} description={t("emptyBody")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div role="search" aria-label={t("filters")} className="flex flex-wrap items-end gap-3">
        <SearchField label={t("search")} placeholder={t("searchPlaceholder")} value={search} onChange={(v) => set({ q: v })} className="min-w-56 flex-1 sm:max-w-80" />
        <Field label={t("platform")} className="min-w-44">
          <Select
            aria-label={t("platform")}
            options={[{ value: "all", label: t("allPlatforms") }, ...platformOptions]}
            value={platform ?? "all"}
            onValueChange={(v) => set({ platform: !v || v === "all" ? null : v })}
          />
        </Field>
        <Field label={t("sortBy")} className="min-w-44">
          <Select<CompetitorSort>
            aria-label={t("sortBy")}
            options={COMPETITOR_SORTS.map((k) => ({ value: k, label: k === "name" ? t("colCompetitor") : metric(k) }))}
            value={sort.id}
            onValueChange={(v) => v && sort.setSort(v, sort.dir)}
          />
        </Field>
        <SegmentedControl
          label={t("order")}
          value={sort.dir}
          onValueChange={(v) => sort.setSort(sort.id, v)}
          segments={[
            { value: "desc", label: t("desc") },
            { value: "asc", label: t("asc") },
          ]}
        />
        {filtered ? (
          <Button variant="ghost" onClick={clear}>
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>
      <BarChart
        title={platform ? t("chartFollowersOn", { platform: platformMeta(platform).name }) : t("chartFollowers")}
        description={t("chartFollowersHint")}
        loading={status === "loading"}
        error={isError}
        onRetry={() => refetch()}
        emptyText={t("noMatch")}
        layout="rows"
        valueFormat={{ maximumFractionDigits: 0 }}
        data={rows.slice(0, 10).map((r) => ({ name: r.name, followers: r.followers }))}
        x={{ key: "name", label: t("colCompetitor") }}
        series={[{ key: "followers", label: metric("followers") }]}
      />
      <DataTable
        label={t("table")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        status={status}
        onRetry={() => refetch()}
        sorting={sort.sorting}
        onSortingChange={sort.onSortingChange}
        paginate
        error={{ title: t("loadError") }}
        empty={filtered ? { title: t("noMatch"), action: <Button variant="secondary" onClick={clear}>{t("clearFilters")}</Button> } : { title: t("emptyTitle") }}
      />
    </div>
  );
}
