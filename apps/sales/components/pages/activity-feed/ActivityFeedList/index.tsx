"use client";

// The activity timeline: one section per day (Today, Yesterday, then the date in the reader's
// language), each a list of events on a line that follows the reading direction. Days used to be
// "MMM d, yyyy" in English with an English "Event Count" (SAL-050).
import { useId } from "react";
import { useTranslations } from "next-intl";
import EventRow from "@/components/pages/activity-feed/EventRow";
import { dayHeading, useFormatTag } from "@/components/pages/activity-feed/feed";
import type { ActivityFeedGroup } from "@/types/activity-feed";

type Props = {
  groups: ActivityFeedGroup[];
  /** Leave out where nothing may change (a View as session). */
  onMarkRead?: (id: string) => void;
};

export default function ActivityFeedList({ groups, onMarkRead }: Props) {
  const t = useTranslations("SalesActivity");
  const tag = useFormatTag();
  const id = useId();

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group, i) => (
        <section key={group.date} aria-labelledby={`${id}-${i}`} className="flex flex-col gap-3">
          <h2 id={`${id}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-label text-fg">
            <span suppressHydrationWarning>{dayHeading(group.date, tag)}</span>
            <span className="text-body-sm font-normal text-fg-muted">{t("eventCount", { count: group.count })}</span>
          </h2>
          <ol className="ms-2 flex flex-col gap-3 border-s border-line ps-4">
            {group.items.map((item) => (
              <li key={item.id}>
                <EventRow
                  type={item.type}
                  priority={item.priority}
                  apiTitle={item.title}
                  apiMessage={item.message}
                  target={item.target}
                  category={item.category}
                  isRead={item.isRead}
                  at={item.occurredAt}
                  onMarkRead={onMarkRead ? () => onMarkRead(item.id) : undefined}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
