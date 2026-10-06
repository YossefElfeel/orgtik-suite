"use client";
import { Bell as BellIcon, CircleNotch as Loader2 } from "@phosphor-icons/react";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de, enUS, fr, it as itLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { getNotificationHref } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/features/notifications/notificationApi";
import type {
  NotificationDto,
  NotificationPriority,
} from "@/types/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dateLocales = { en: enUS, de, fr, it: itLocale } as const;

function priorityBadgeVariant(
  p: NotificationPriority,
): "destructive" | "secondary" | "outline" {
  if (p === "urgent" || p === "high") return "destructive";
  if (p === "normal") return "secondary";
  return "outline";
}

export function NotificationDropdown() {
  const t = useTranslations("notificationBell");
  const locale = useLocale() as keyof typeof dateLocales;
  const dfLocale = dateLocales[locale] ?? enUS;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [readTab, setReadTab] = useState<"all" | "unread">("all");
  const [priorityValue, setPriorityValue] = useState<string>("all");
  const [loadBatches, setLoadBatches] = useState(1);

  useEffect(() => {
    if (!open) return;
    setLoadBatches(1);
  }, [readTab, priorityValue, open]);

  const listParams = useMemo(() => {
    const priority: NotificationPriority | undefined =
      priorityValue === "all"
        ? undefined
        : (priorityValue as NotificationPriority);
    return {
      page: 1,
      limit: 20 * loadBatches,
      ...(readTab === "unread" ? { read: false as const } : {}),
      ...(priority ? { priority } : {}),
    };
  }, [readTab, priorityValue, loadBatches]);

  const { data, isFetching, isLoading } = useGetNotificationsQuery(listParams, {
    skip: !open,
  });

  const { data: unreadRes, refetch: refetchUnread } =
    useGetUnreadNotificationCountQuery();

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  const items = data?.data?.items ?? [];
  const hasNext = data?.data?.meta?.hasNext ?? false;
  const unreadCount = unreadRes?.data?.count ?? 0;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void refetchUnread();
    }
  };

  const handleItemActivate = async (n: NotificationDto) => {
    if (!n.readAt) {
      try {
        await markRead(n.id).unwrap();
      } catch {
        /* keep navigation even if read fails */
      }
    }
    const href = getNotificationHref(n) ?? "/";
    setOpen(false);
    router.push(href);
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllRead().unwrap();
    } catch {
      /* handled by base query toast */
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="relative shrink-0 rounded-md border text-secondary! min-h-8 min-w-8"
            aria-label={t("title")}
          >
            <BellIcon
              
              width={32}
              height={32}
              className="size-5!" weight="duotone" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span
                className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
                aria-live="polite"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex w-[min(100vw-1.5rem,24rem)] max-h-[min(100dvh-5rem,32rem)] flex-col gap-0 overflow-hidden p-0 shadow-lg ring-1 ring-foreground/10"
      >
        <div className="flex items-start justify-between gap-2 border-b px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("title")}
            </p>
            {open && data?.data?.meta ? (
              <p className="text-xs text-muted-foreground">
                {t("listMeta", {
                  loaded: items.length,
                  total: data.data.meta.total,
                })}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            disabled={unreadCount === 0 || markingAll}
            onClick={() => void handleMarkAll()}
          >
            {markingAll ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              t("markAllRead")
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-b px-3 py-2">
          <div className="flex rounded-md bg-muted/60 p-0.5">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                readTab === "all"
                  ? "bg-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setReadTab("all")}
            >
              {t("filterAll")}
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                readTab === "unread"
                  ? "bg-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setReadTab("unread")}
            >
              {t("filterUnread")}
            </button>
          </div>

          {/* <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("priorityLabel")}
            </span>
            <Select
              value={priorityValue}
              onValueChange={(v) => setPriorityValue(v ?? "all")}
            >
              <SelectTrigger size="sm" className="h-9 w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="w-(--anchor-width)">
                <SelectItem value="all">{t("priorityAll")}</SelectItem>
                <SelectItem value="low">{t("priorityLow")}</SelectItem>
                <SelectItem value="normal">{t("priorityNormal")}</SelectItem>
                <SelectItem value="high">{t("priorityHigh")}</SelectItem>
                <SelectItem value="urgent">{t("priorityUrgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && open ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-1 px-3 py-2.5 text-start transition-colors hover:bg-muted/80",
                      !n.readAt && "bg-primary/4",
                    )}
                    onClick={() => void handleItemActivate(n)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium text-foreground">
                        {n.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        {(n.priority === "high" || n.priority === "urgent") && (
                          <Badge
                            variant={priorityBadgeVariant(n.priority)}
                            className="h-5 px-1.5 text-[10px] capitalize"
                          >
                            {n.priority === "urgent"
                              ? t("priorityUrgent")
                              : t("priorityHigh")}
                          </Badge>
                        )}
                        {!n.readAt ? (
                          <span
                            className="size-2 rounded-full bg-primary"
                            title={t("unreadIndicator")}
                          />
                        ) : null}
                      </div>
                    </div>
                    {n.body ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: dfLocale,
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasNext ? (
          <div className="border-t px-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isFetching}
              onClick={() => setLoadBatches((b) => b + 1)}
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                t("loadMore")
              )}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
