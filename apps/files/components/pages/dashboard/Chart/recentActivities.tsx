"use client";

import { useTranslations } from "next-intl";
import { useDashboardOverviewQuery } from "@/redux/features/file/fileApi";
import ActivityItem from "@/components/shared/ActivityItem";

export const RecentActivities = () => {
  const t = useTranslations("Dashboard");
  const { data } = useDashboardOverviewQuery();
  const activities = data?.data?.myLastActivity || [];
  return (
    <section aria-labelledby="recent-activity" className="flex flex-col gap-3 p-3 pb-1">
      <h3 id="recent-activity" className="font-display text-title-sm text-fg">
        {t("recentActivities")}
      </h3>
      {activities.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-fg-muted">{t("noActivities")}</p>
      ) : (
        <ol className="max-h-[400px] overflow-y-auto pe-2" tabIndex={0} aria-labelledby="recent-activity">
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
          ))}
        </ol>
      )}
    </section>
  );
};
