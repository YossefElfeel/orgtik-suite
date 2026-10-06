"use client";

// The profile's performance, followers and mentions. Followers and Mentions were the same static
// list with pravatar.cc avatars on both routes (MKT-066).
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChatsCircle, UsersThree } from "@phosphor-icons/react";
import { Badge, EmptyState, ErrorState, ListStates, Stat, useFormatter, type Tone } from "@orgtik/ui";
import { BarChart, LineChart } from "@orgtik/ui/charts";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import { useGetFollowersReportQuery, useGetMentionsReportQuery } from "@/redux/features/reports/reportsApi";
import { ReportOverview } from "../ReportOverview";
import { ExportButton, csvName } from "../shared/ExportButton";
import { METRIC_ICON, useDayFormat, useMetricLabel } from "../shared/metrics";
import { useProjectArg } from "../shared/period";
import { profileName } from "../shared/accounts";
import { useProfileReport } from "./ProfileReportFrame";

/** The reports name X "TWITTER"; the accounts call it "X". */
const samePlatform = (a: string, b: string) => {
  const n = (p: string) => (p.toUpperCase() === "TWITTER" ? "X" : p.toUpperCase());
  return n(a) === n(b);
};

export function ProfilePerformance() {
  const { profile, period } = useProfileReport();
  return <ReportOverview period={period} profileId={profile.id} fileLabel={profileName(profile)} />;
}

export function ProfileFollowers() {
  const t = useTranslations("Reports");
  const label = useMetricLabel();
  const day = useDayFormat();
  const f = useFormatter();
  const { profile, period } = useProfileReport();
  const { ready, projectId } = useProjectArg();
  const q = period.query;
  const { data, isLoading, isFetching, isError, refetch } = useGetFollowersReportQuery({ projectId, ...q, profileIds: [profile.id] }, { skip: !ready || !q });
  if (!q) return null;
  const loading = !ready || isLoading || (isFetching && !data);
  if (isError && !data) return <ErrorState size="page" title={t("loadError")} onRetry={() => refetch()} />;
  const item = data?.data.items.find((i) => i.profileId === profile.id);
  if (!loading && !item) {
    return <EmptyState size="page" icon={<UsersThree />} title={t("noFollowersTitle")} description={t("noFollowersBody", { platform: platformMeta(profile.platform).name })} />;
  }
  const series = item?.series ?? [];
  const first = series[0];
  const x = { key: "date", label: t("day"), format: day };
  const head = [t("day"), label("followers"), label("followersGained")];
  const csvRows = series.map((p) => [p.date, p.followers, p.followersGained]);
  const net = first && item ? item.followers - (first.followers - first.followersGained) : 0;

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <li>
          <Stat loading={loading} icon={METRIC_ICON.followers} label={t("followersNow")} value={item ? f.number(item.followers) : "–"} className="h-full" />
        </li>
        <li>
          <Stat loading={loading} icon={METRIC_ICON.followersGained} label={label("followersGained")} value={item ? f.number(item.followersGained) : "–"} hint={t("inPeriod", { count: period.days })} className="h-full" />
        </li>
        <li>
          <Stat
            loading={loading}
            label={t("followersGrowth")}
            value={item && first && first.followers - first.followersGained > 0 ? f.percent(net / (first.followers - first.followersGained), 1) : "–"}
            hint={t("growthHint")}
            className="h-full"
          />
        </li>
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title-sm text-fg">{t("followersTitle")}</h2>
        <ExportButton fileName={csvName(profileName(profile), "followers", period.range.start, period.range.end)} head={head} rows={csvRows} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LineChart
          area
          title={t("chartFollowers")}
          description={t("chartFollowersHint")}
          loading={loading}
          error={isError}
          onRetry={() => refetch()}
          emptyText={t("noTrend")}
          valueFormat={{ maximumFractionDigits: 0 }}
          data={series}
          x={x}
          series={[{ key: "followers", label: label("followers") }]}
        />
        <BarChart
          title={t("chartGained")}
          description={t("chartGainedHint")}
          loading={loading}
          error={isError}
          onRetry={() => refetch()}
          emptyText={t("noTrend")}
          valueFormat={{ maximumFractionDigits: 0 }}
          data={series}
          x={x}
          series={[{ key: "followersGained", label: label("followersGained"), color: 2 }]}
        />
      </div>
    </div>
  );
}

const SENTIMENT: Record<string, Tone> = { POSITIVE: "success", NEUTRAL: "neutral", NEGATIVE: "danger" };

export function ProfileMentions() {
  const t = useTranslations("Reports");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const { profile } = useProfileReport();
  const { ready, projectId } = useProjectArg();
  const { data, isLoading, isFetching, isError, refetch } = useGetMentionsReportQuery(projectId ? { projectId } : undefined, { skip: !ready });
  const items = useMemo(() => (data?.data.items ?? []).filter((m) => samePlatform(m.platform, profile.platform)).sort((a, b) => b.postedAt.localeCompare(a.postedAt)), [data, profile.platform]);
  const status = !ready || isLoading || (isFetching && !data) ? "loading" : isError && !data ? "error" : items.length ? "ready" : "empty";
  const sentiment = (s: string) => (t.has(`sentiment.${s}`) ? t(`sentiment.${s}`) : t("sentiment.UNKNOWN"));
  const head = [t("colAuthor"), t("colHandle"), t("colMention"), t("colPlatform"), t("colSentiment"), t("colLikes"), t("colReplies"), t("colReposts"), t("colPosted")];
  const csvRows = items.map((m) => [m.name, m.username, m.text, platformMeta(m.platform).name, sentiment(m.sentiment), m.likes, m.replies, m.reposts, m.postedAt]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-title-sm text-fg">{t("mentionsTitle")}</h2>
          <p className="text-body-sm text-fg-muted">{t("mentionsHint", { platform: platformMeta(profile.platform).name })}</p>
        </div>
        <ExportButton fileName={csvName(profileName(profile), "mentions")} head={head} rows={csvRows} />
      </div>
      <ListStates
        status={status}
        onRetry={() => refetch()}
        error={{ title: t("loadError") }}
        empty={{ icon: <ChatsCircle />, title: t("noMentions"), description: t("noMentionsBody", { platform: platformMeta(profile.platform).name }) }}
      >
        <ul className="flex flex-col gap-3">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-card border border-line bg-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-fg" dir="auto">
                    {m.name}
                  </span>
                  <bdi dir="ltr" className="text-body-sm text-fg-muted">
                    {m.username}
                  </bdi>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={m.platform} className="text-fg-muted" />
                  <Badge tone={SENTIMENT[m.sentiment] ?? "neutral"} size="sm">
                    {sentiment(m.sentiment)}
                  </Badge>
                </div>
              </div>
              <p className="text-body text-fg" dir="auto">
                {m.text}
              </p>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-fg-muted">
                <div className="flex gap-1">
                  <dt>{t("colLikes")}</dt>
                  <dd className="tabular-nums text-fg">{f.number(m.likes)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>{t("colReplies")}</dt>
                  <dd className="tabular-nums text-fg">{f.number(m.replies)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>{t("colReposts")}</dt>
                  <dd className="tabular-nums text-fg">{f.number(m.reposts)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="sr-only">{t("colPosted")}</dt>
                  <dd>
                    <time dateTime={m.postedAt}>{f.date(m.postedAt, { dateStyle: "medium", timeStyle: "short", timeZone })}</time>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </ListStates>
    </div>
  );
}
