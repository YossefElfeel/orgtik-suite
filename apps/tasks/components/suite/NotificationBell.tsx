"use client";

// The bell in the top bar: how many are unread, said in words as well as the badge, and the latest
// five in a popover with "See all". It replaces a dropdown whose filters and counts were English.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "@phosphor-icons/react";
import { EmptyState, LoadingState, Popover, PopoverContent, PopoverTrigger } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { useGetNotificationsQuery } from "@/redux/features/notifications/notificationsApi";
import type { NotificationLike } from "@/lib/notifications";

export function NotificationBell() {
  const t = useTranslations("Notifications");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetNotificationsQuery();
  const latest = (data?.data?.notifications ?? []) as unknown as NotificationLike[];
  const unread = (data?.data as { unreadCount?: number } | undefined)?.unreadCount ?? latest.filter((n) => !n.readAt).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread ? t("bellUnread", { count: unread }) : t("bell")}
        className="relative grid size-control-sm place-items-center rounded-pill text-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unread ? (
          <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-pill bg-danger-solid px-1 text-micro font-semibold text-on-danger-solid">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" title={t("title")} className="w-[min(24rem,calc(100vw-2rem))]">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <LoadingState rows={3} />
          ) : latest.length ? (
            <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {latest.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <NotificationItem n={n} compact onOpen={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="compact" title={t("emptyTitle")} />
          )}
          <Link href="/notifications" onClick={() => setOpen(false)} className="self-end text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {t("seeAll")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
