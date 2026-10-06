"use client";

// One notification: who, what (in the reader's language), when, and whether it's been read. The row's
// sentence is the link to its target, and its actions are a named menu that's always there (they
// used to appear only on hover, on a clickable div, TASKS-049). Opening one marks it read.
import { useLocale, useTranslations } from "next-intl";
import { Check, DotsThreeVertical, X } from "@phosphor-icons/react";
import { Avatar, Menu, MenuContent, MenuItem, MenuTrigger, cn, useStatusLabel } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { actorName, notificationHref, notificationText, type NotificationLike } from "@/lib/notifications";
import { timeAgo } from "@/lib/relative";
import { useClearNotificationsMutation, useMarkReadnotificationsMutation } from "@/redux/features/notifications/notificationsApi";

export function useNotificationSentence() {
  const t = useTranslations("NotificationText");
  const statusLabel = useStatusLabel();
  return (n: NotificationLike) => {
    const { key, values } = notificationText(n);
    const s = values.status;
    const status = s && ["backlog", "todo", "in_progress", "in_review", "done"].includes(s) ? statusLabel("task", s as "todo") : s;
    return t(key, { ...values, status });
  };
}

export function NotificationItem({ n, compact = false, onOpen }: { n: NotificationLike; compact?: boolean; onOpen?: () => void }) {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const sentence = useNotificationSentence();
  const [markRead] = useMarkReadnotificationsMutation();
  const [clear] = useClearNotificationsMutation();
  const unread = !n.readAt && !n.clearedAt;
  const href = notificationHref(n);
  const text = sentence(n);
  const open = () => {
    if (unread) void markRead({ notificationIds: [n.id] });
    onOpen?.();
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-card p-3", unread ? "bg-brand-subtle" : "bg-raised")}>
      <Avatar name={actorName(n) || "?"} src={n.actor?.avatar || undefined} size="sm" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {href ? (
          <Link href={href} onClick={open} className="text-body-sm text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {text}
          </Link>
        ) : (
          <p className="text-body-sm text-fg">{text}</p>
        )}
        <span className="flex items-center gap-2 text-caption text-fg-muted">
          <time dateTime={n.createdAt}>{timeAgo(n.createdAt, locale)}</time>
          {unread ? (
            <span className="inline-flex items-center gap-1 font-semibold text-fg-brand">
              <span aria-hidden="true" className="size-1.5 rounded-pill bg-action-brand" />
              {t("unread")}
            </span>
          ) : null}
        </span>
      </div>
      {compact ? null : (
        <Menu>
          <MenuTrigger
            aria-label={t("actionsFor", { text })}
            className="grid size-8 shrink-0 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
          >
            <DotsThreeVertical weight="bold" aria-hidden="true" className="size-5" />
          </MenuTrigger>
          <MenuContent align="end">
            {unread ? (
              <MenuItem icon={<Check />} onClick={() => markRead({ notificationIds: [n.id] })}>
                {t("markRead")}
              </MenuItem>
            ) : null}
            {n.clearedAt ? null : (
              <MenuItem icon={<X />} onClick={() => clear({ notificationIds: [n.id] })}>
                {t("clear")}
              </MenuItem>
            )}
          </MenuContent>
        </Menu>
      )}
    </div>
  );
}
