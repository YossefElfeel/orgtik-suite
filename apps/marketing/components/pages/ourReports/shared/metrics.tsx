"use client";

// Metric names, KPI tiles and the sync notice shared by the dashboard and the report screens.
// The tiles were titled with the API's keys ("followersGained"), showed every delta in green with an
// up arrow, and printed `value.toString()` (MKT-064). Now each is a library Stat: its words, a
// grouped number, and a change whose sign, tone and arrow come from the value, with what it is
// compared with ("vs the previous 30 days").
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  BookmarkSimple,
  ChatCircle,
  CursorClick,
  Eye,
  HandHeart,
  IdentificationCard,
  Notepad,
  PlayCircle,
  ShareFat,
  Target,
  ThumbsUp,
  UserPlus,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import { Stat, useFormatter, type StatChange } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { isolate } from "@/lib/bidi";
import type { IMetricWithRate, ISyncStatus, MetricKey } from "@/types/reports";

export const METRIC_ICON: Partial<Record<MetricKey, ReactNode>> = {
  impressions: <Eye />,
  reach: <Target />,
  engagements: <HandHeart />,
  followers: <Users />,
  followersGained: <UserPlus />,
  clicks: <CursorClick />,
  profileViews: <IdentificationCard />,
  videoViews: <PlayCircle />,
  likes: <ThumbsUp />,
  comments: <ChatCircle />,
  shares: <ShareFat />,
  saves: <BookmarkSimple />,
  posts: <Notepad />,
};

/** The metric's name in the reader's language. */
export function useMetricLabel() {
  const t = useTranslations("Insights.metric");
  return (k: MetricKey | "engagementRate" | "postsPublished") => t(k);
}

/** A report day ("2026-09-14") as "14 Sep", the same in every time zone. */
export function useDayFormat() {
  const f = useFormatter();
  return (v: string | number) => f.date(`${v}T00:00:00Z`, { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The API's change (in percent, null when there was nothing to compare with) as a Stat change. */
export function useChange() {
  const t = useTranslations("Insights");
  return (rate: number | null | undefined, days: number): StatChange | undefined =>
    rate == null ? undefined : { value: rate / 100, against: t("vsPrevious", { count: days }) };
}

export function KpiGrid({
  keys,
  values,
  days,
  loading,
  className,
}: {
  keys: MetricKey[];
  values: Partial<Record<MetricKey, IMetricWithRate>> | undefined;
  days: number;
  loading?: boolean;
  className?: string;
}) {
  const t = useTranslations("Insights");
  const label = useMetricLabel();
  const change = useChange();
  const f = useFormatter();
  return (
    <ul className={className ?? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
      {keys.map((k) => {
        const m = values?.[k];
        return (
          <li key={k} className="min-w-0">
            <Stat
              loading={loading}
              icon={METRIC_ICON[k]}
              label={label(k)}
              value={m ? f.number(m.value, { maximumFractionDigits: 0 }) : "–"}
              change={m ? change(m.rate, days) : undefined}
              hint={m && m.rate == null && !loading ? t("noComparison") : undefined}
              className="h-full"
            />
          </li>
        );
      })}
    </ul>
  );
}

/** Profiles whose figures stopped syncing: the report leaves them out until they are reconnected. */
export function SyncNotice({ status }: { status: ISyncStatus | undefined }) {
  const t = useTranslations("Insights");
  const failures = status?.failures ?? [];
  if (!failures.length) return null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-card border border-line bg-warning-subtle p-4 text-body-sm text-fg">
      <WarningCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" weight="fill" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">{t("syncFailed", { count: failures.length })}</p>
        <ul className="flex flex-col gap-0.5">
          {failures.map((f) => (
            <li key={f.integrationId}>
              <Link href={`/integrations/platform/${f.integrationId}`} className="text-fg-brand underline underline-offset-2">
                {t("syncFailedItem", { name: isolate(f.profileName) })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
