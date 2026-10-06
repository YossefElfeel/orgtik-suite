import { Pulse as ActivitySquare } from "@phosphor-icons/react";
import { SectionCard } from "./SectionCard";
import type { ActivityItem } from "./types";

import { InfoCardSkeleton } from "@/components/ui/info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

type ActivitySectionProps = {
  activities: ActivityItem[];
  isLoading?: boolean;
};

export function ActivitySection({
  activities,
  isLoading,
}: ActivitySectionProps) {
  const t = useTranslations("employees.details");

  if (isLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </InfoCardSkeleton>
    );
  }
  return (
    <SectionCard
      title={t("sections.activity")}
      icon={ActivitySquare}
      action={
        <span className="text-xs font-medium text-secondary">{t("activity.allTime")}</span>
      }
    >
      <ul className="divide-y divide-border">
        {activities.map((entry) => (
          <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
            <div className="space-y-1.5">
              <p className="text-sm leading-5 text-foreground">{entry.body}</p>
              <p className="text-xs text-secondary">{entry.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
