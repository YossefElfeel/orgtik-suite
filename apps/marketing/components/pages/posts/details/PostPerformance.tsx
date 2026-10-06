"use client";

// The post's results, summed over its platforms, once they report back. The old tiles used five
// palette colours and "1.2K" built by hand.
import { useTranslations } from "next-intl";
import { ChartBar, ChatCircle, Eye, Heart, ShareNetwork } from "@phosphor-icons/react";
import { Card, CardHeader, EmptyState, Stat, useFormatter } from "@orgtik/ui";
import type { IPostDetail } from "@/types/post";

const METRICS = [
  { key: "impressions", icon: <ChartBar /> },
  { key: "reach", icon: <Eye /> },
  { key: "likes", icon: <Heart /> },
  { key: "comments", icon: <ChatCircle /> },
  { key: "shares", icon: <ShareNetwork /> },
] as const;

export function PostPerformance({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const live = post.targets.filter((x) => x.analyticsAvailable);
  const sum = (key: string) => live.reduce((n, x) => n + (x.performanceMatrix?.[key]?.value ?? 0), 0);

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("performanceTitle")} description={live.length ? t("performanceHint", { count: live.length }) : undefined} />
      {live.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {METRICS.map((m) => (
            <Stat key={m.key} label={t(`metric_${m.key}`)} value={f.number(sum(m.key), { notation: "compact" })} icon={m.icon} />
          ))}
        </div>
      ) : (
        <EmptyState size="compact" title={t("noResultsTitle")} description={t("noResultsBody")} />
      )}
    </Card>
  );
}
