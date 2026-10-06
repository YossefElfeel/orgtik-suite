"use client";

// The profile's published posts in the period, with their figures (GET
// /analytics/reports/post-performance, narrowed to this profile and to the period's days in the
// project's zone). Each title opens the post.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { BarChart } from "@orgtik/ui/charts";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { Link } from "@/i18n/routing";
import { dayInZone, useProjectContext } from "@/lib/project-context";
import { usePostPerformanceQuery } from "@/redux/features/reports/reportsApi";
import type { IPostPerformance } from "@/types/reports";
import { ExportButton, csvName } from "../shared/ExportButton";
import { useMetricLabel } from "../shared/metrics";
import { useProjectArg } from "../shared/period";
import { sortRows, useUrlSort } from "../shared/tableSort";
import { profileName } from "../shared/accounts";
import { useProfileReport } from "./ProfileReportFrame";

const SORTS = ["date", "title", "impressions", "reach", "engagements", "engagementRate", "likes", "comments", "shares"] as const;
type SortKey = (typeof SORTS)[number];
const titleOf = (p: IPostPerformance) => p.unifiedPostTitle || p.postContent || "";
const valueOf = (p: IPostPerformance, k: SortKey): string | number => (k === "date" ? p.date : k === "title" ? titleOf(p) : (p[k] as number) ?? 0);

export function ProfilePosts() {
  const t = useTranslations("Reports");
  const label = useMetricLabel();
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const { profile, period } = useProfileReport();
  const { ready, projectId } = useProjectArg();
  const sort = useUrlSort(SORTS, "date");
  const { data, isLoading, isFetching, isError, refetch } = usePostPerformanceQuery(projectId ? { projectId } : undefined, { skip: !ready });

  const rows = useMemo(() => {
    const { start, end } = period.range;
    const mine = (data?.data ?? []).filter((p) => {
      if (p.profileId !== profile.id) return false;
      const day = dayInZone(p.date, timeZone);
      return day >= start && day <= end;
    });
    return sortRows(mine, (p) => valueOf(p, sort.id), sort.dir);
  }, [data, profile.id, period.range, timeZone, sort.id, sort.dir]);

  const columns = useMemo<ColumnDef<IPostPerformance, unknown>[]>(
    () => [
      {
        id: "title",
        header: t("colPost"),
        accessorFn: titleOf,
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link href={`/posts/${row.original.unifiedPostId}`} className="truncate font-medium text-fg-brand hover:underline" dir="auto">
              {titleOf(row.original)}
            </Link>
            {row.original.url ? (
              <a href={row.original.url} target="_blank" rel="noreferrer" className="inline-flex min-h-6 w-fit items-center gap-1 py-0.5 text-caption text-fg-muted hover:text-fg hover:underline">
                {t("openOnPlatform", { platform: platformMeta(row.original.platform).name })}
                <ArrowSquareOut aria-hidden className="size-3.5 rtl:-scale-x-100" />
                <span className="sr-only">{t("opensNewTab")}</span>
              </a>
            ) : null}
          </div>
        ),
      },
      {
        id: "date",
        header: t("colPublished"),
        accessorFn: (p) => p.date,
        meta: { numeric: true },
        cell: ({ row }) => f.date(row.original.date, { dateStyle: "medium", timeStyle: "short", timeZone }),
      },
      ...(["impressions", "reach", "engagements"] as const).map<ColumnDef<IPostPerformance, unknown>>((k) => ({
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
      ...(["likes", "comments", "shares"] as const).map<ColumnDef<IPostPerformance, unknown>>((k) => ({
        id: k,
        header: label(k),
        accessorFn: (p) => p[k],
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      })),
    ],
    [t, label, f, timeZone],
  );

  const status = !ready || isLoading || (isFetching && !data) ? "loading" : isError && !data ? "error" : rows.length ? "ready" : "empty";
  const top = [...rows].sort((a, b) => b.engagements - a.engagements).slice(0, 8);
  const head = [t("colPost"), t("colPublished"), label("impressions"), label("reach"), label("engagements"), `${label("engagementRate")} (%)`, label("likes"), label("comments"), label("shares"), t("colLink")];
  const csvRows = rows.map((p) => [titleOf(p), p.date, p.impressions, p.reach, p.engagements, p.engagementRate, p.likes, p.comments, p.shares, p.url]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title-sm text-fg">{t("postsTitle")}</h2>
        <ExportButton fileName={csvName(profileName(profile), "posts", period.range.start, period.range.end)} head={head} rows={csvRows} />
      </div>
      <BarChart
        title={t("chartTopPosts")}
        description={t("chartTopPostsHint")}
        loading={status === "loading"}
        error={status === "error"}
        onRetry={() => refetch()}
        emptyText={t("noPostsInPeriod")}
        layout="rows"
        valueFormat={{ maximumFractionDigits: 0 }}
        data={top.map((p) => ({ post: titleOf(p), engagements: p.engagements }))}
        x={{ key: "post", label: t("colPost") }}
        series={[{ key: "engagements", label: label("engagements"), color: 4 }]}
      />
      <DataTable
        label={t("postsTable")}
        columns={columns}
        data={rows}
        getRowId={(p) => p.id}
        status={status}
        onRetry={() => refetch()}
        sorting={sort.sorting}
        onSortingChange={sort.onSortingChange}
        error={{ title: t("loadError") }}
        empty={{ title: t("noPostsInPeriod"), description: t("noPostsInPeriodBody") }}
      />
    </div>
  );
}
