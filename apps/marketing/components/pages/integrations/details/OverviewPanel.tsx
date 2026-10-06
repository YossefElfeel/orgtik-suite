"use client";

// The account's figures for the API's period, each with its change against the period before. The
// old cards showed every change as green growth, and the bars had no text alternative; the chart's
// table view is its alternative now.
import { useTranslations } from "next-intl";
import { Eye, Heart, ChatCircle, ShareFat, Users, UserPlus, Notepad, Broadcast, UserFocus, Percent } from "@phosphor-icons/react";
import { Stat, useFormatter } from "@orgtik/ui";
import { LineChart } from "@orgtik/ui/charts";
import { useProjectContext } from "@/lib/project-context";
import type { IntegrationResponse, MetricValue } from "@/types/integrations";

export function OverviewPanel({ data }: { data: IntegrationResponse }) {
  const t = useTranslations("IntegrationDetail");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const a = data.analytics;
  const overview = a?.overview;
  const engagement = a?.engagement;
  const growth = a?.growth;
  const period = a?.period;

  const against = period ? t("vsPrevious") : undefined;
  // The API's rate is a percent change (12.5 = +12.5%); Stat takes a ratio.
  const change = (m: MetricValue | undefined) => (m && m.rate != null ? { value: m.rate / 100, against } : undefined);
  const n = (m: MetricValue | undefined) => (m ? f.number(m.value) : "—");

  const periodText = period
    ? t("periodLabel", {
        start: f.date(period.start, { dateStyle: "medium", timeZone }),
        end: f.date(period.end, { dateStyle: "medium", timeZone }),
      })
    : null;

  const series = (growth?.series ?? []).map((s) => ({ date: s.date, followers: s.followers, impressions: s.impressions }));

  return (
    <div className="flex flex-col gap-6">
      {periodText ? <p className="text-body-sm text-fg-muted">{periodText}</p> : null}

      <section aria-labelledby="ov-audience" className="flex flex-col gap-3">
        <h2 id="ov-audience" className="font-display text-title-sm text-fg">
          {t("sectionReach")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label={t("followers")} icon={<Users />} value={n(overview?.followers)} change={change(overview?.followers)} />
          <Stat label={t("following")} icon={<UserPlus />} value={n(overview?.following)} change={change(overview?.following)} />
          <Stat label={t("totalPosts")} icon={<Notepad />} value={n(overview?.totalPosts)} change={change(overview?.totalPosts)} />
          <Stat label={t("reach")} icon={<Broadcast />} value={n(overview?.reach)} change={change(overview?.reach)} />
          <Stat label={t("impressions")} icon={<Eye />} value={n(overview?.impressions)} change={change(overview?.impressions)} />
        </div>
      </section>

      <section aria-labelledby="ov-engagement" className="flex flex-col gap-3">
        <h2 id="ov-engagement" className="font-display text-title-sm text-fg">
          {t("sectionEngagement")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat
            label={t("engagementRate")}
            icon={<Percent />}
            value={engagement ? f.percent(engagement.engagementRate.value / 100, 2) : "—"}
            change={change(engagement?.engagementRate)}
          />
          <Stat label={t("avgLikes")} icon={<Heart />} value={n(engagement?.avgLikes)} change={change(engagement?.avgLikes)} />
          <Stat label={t("avgComments")} icon={<ChatCircle />} value={n(engagement?.avgComments)} change={change(engagement?.avgComments)} />
          <Stat label={t("avgShares")} icon={<ShareFat />} value={n(engagement?.avgShares)} change={change(engagement?.avgShares)} />
          <Stat label={t("profileViews")} icon={<UserFocus />} value={n(engagement?.profileViews)} change={change(engagement?.profileViews)} />
        </div>
      </section>

      <LineChart
        title={t("growthTitle")}
        description={growth?.followersDelta ? t("growthDelta", { delta: f.number(growth.followersDelta.value, { signDisplay: "exceptZero" }) }) : undefined}
        data={series}
        x={{ key: "date", label: t("week"), format: (v) => f.date(String(v), { day: "numeric", month: "short", timeZone }) }}
        series={[{ key: "followers", label: t("followers") }]}
        emptyText={t("growthEmpty")}
      />
    </div>
  );
}
