"use client";

// The bell in the shell's top bar (FS-SAL-2). It was a hand-rolled popover with iconify icons,
// English times and labels, clickable <div> rows, a physical badge offset that drifted inward in
// RTL, and "No new notifications" shown when the list failed to load. Now, from library pieces:
// - the bell's name says how many are unread, in words; the badge is decoration;
// - each row says what happened in the reader's language and opens what it's about (EventRow);
// - "Mark all as read", and loading, error (with Retry) and empty states;
// - "View all activity" only for roles that can open the activity feed (SAL-041);
// - a View as session (D-017) only looks: nothing is marked read.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Checks } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, LoadingState, Popover, PopoverContent, PopoverTrigger } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import EventRow from "@/components/pages/activity-feed/EventRow";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/features/notifications/notificationsApi";

const LATEST = 8;

export function NotificationPopover() {
  const t = useTranslations("SalesNotify");
  const { role, canEdit } = useRole();
  const [open, setOpen] = useState(false);
  const count = useGetUnreadCountQuery();
  const list = useGetNotificationsQuery({ limit: LATEST });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markingAll] = useMarkAllNotificationsReadMutation();

  const items = list.data?.data?.items ?? [];
  const unread = count.data?.data?.count ?? items.filter((n) => !n.isRead).length;
  const canSeeAll = canAccessRoute(role, "/activity-feed");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread ? t("bellUnread", { count: unread }) : t("bell")}
        className="relative grid size-control-sm place-items-center rounded-pill text-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unread ? (
          <span
            aria-hidden="true"
            className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-pill bg-danger-solid px-1 text-micro font-semibold text-on-danger-solid tabular-nums"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" title={t("title")} className="w-[min(26rem,calc(100vw-2rem))]">
        <div className="flex flex-col gap-3">
          {unread && canEdit ? (
            <Button
              size="sm"
              variant="ghost"
              className="self-end"
              startIcon={<Checks />}
              loading={markingAll.isLoading}
              onClick={() => void markAll().unwrap().catch(() => undefined)}
            >
              {t("markAllRead")}
            </Button>
          ) : null}

          {list.isLoading ? (
            <LoadingState rows={3} label={t("loading")} />
          ) : list.isError && !items.length ? (
            <ErrorState size="compact" title={t("loadError")} onRetry={() => void list.refetch()} />
          ) : items.length ? (
            <ul className="flex max-h-[min(28rem,60vh)] flex-col gap-2 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <EventRow
                    compact
                    type={n.type}
                    priority={n.priority}
                    apiTitle={n.title}
                    apiMessage={n.message}
                    data={n.data}
                    isRead={n.isRead}
                    at={n.createdAt}
                    onMarkRead={canEdit ? () => void markRead(n.id).unwrap().catch(() => undefined) : undefined}
                    onOpen={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="compact" icon={<Bell />} title={t("emptyTitle")} description={t("emptyBody")} />
          )}

          {canSeeAll ? (
            <Link
              href="/activity-feed"
              onClick={() => setOpen(false)}
              className="self-end text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus"
            >
              {t("viewAll")}
            </Link>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
