"use client";

// One event (a notification or an activity item): what happened, in the reader's language, where
// it leads, when, and whether it's been read. The title is a real link to the record it's about
// (it used to be a clickable <div> that only marked the item read: SAL-038, SAL-046), and "Mark as
// read" is a named button that's always there, not a hover-only action.
import { useTranslations } from "next-intl";
import { Check } from "@phosphor-icons/react";
import { IconButton, cn } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";
import {
  TONE_CHIP,
  categoryIcon,
  categoryOf,
  eventHref,
  exactTime,
  timeAgo,
  toneOf,
  useEventText,
  useFormatTag,
} from "@/components/pages/activity-feed/feed";

export type EventRowProps = {
  type: string;
  priority?: string;
  /** The API's own title and message (English); used only when the type is unknown or the reader reads English. */
  apiTitle?: string | null;
  apiMessage?: string | null;
  data?: Record<string, unknown> | null;
  target?: { resource: string; id: string } | null;
  category?: string;
  isRead: boolean;
  /** ISO instant. */
  at: string;
  /** Inside the bell: a tighter row. */
  compact?: boolean;
  /** Mark it read (opening it does too). Leave out where nothing may change (a View as session). */
  onMarkRead?: () => void;
  /** Called when the row's link is followed (the bell closes). */
  onOpen?: () => void;
};

export default function EventRow({ type, priority, apiTitle, apiMessage, data, target, category, isRead, at, compact = false, onMarkRead, onOpen }: EventRowProps) {
  const t = useTranslations("SalesNotify");
  const tag = useFormatTag();
  const { role } = useRole();
  const { title, context } = useEventText();
  const heading = title(type, apiTitle);
  const line = context(type, data, apiMessage);
  const href = eventHref(role, data, target);
  const unread = !isRead;
  const tone = toneOf(type, priority);

  const open = () => {
    if (unread) onMarkRead?.();
    onOpen?.();
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-card", compact ? "p-3" : "border border-line p-4", unread ? "bg-brand-subtle" : "bg-raised")}>
      <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-pill [&>svg]:size-4", TONE_CHIP[tone])}>
        {categoryIcon(category ?? categoryOf(type))}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {href ? (
          <Link
            href={href}
            onClick={open}
            className="text-body-sm font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {heading}
          </Link>
        ) : (
          <p className="text-body-sm font-medium text-fg">{heading}</p>
        )}
        {line ? (
          <p dir="auto" className={cn("text-body-sm text-fg-muted", compact && "line-clamp-2")}>
            {line}
          </p>
        ) : null}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
          <time dateTime={at} title={exactTime(at, tag)} suppressHydrationWarning>
            {timeAgo(at, tag)}
          </time>
          {unread ? (
            <span className="inline-flex items-center gap-1 font-semibold text-fg-brand">
              <span aria-hidden="true" className="size-1.5 rounded-pill bg-action-brand" />
              {t("unread")}
            </span>
          ) : null}
        </span>
      </div>
      {unread && onMarkRead ? (
        <IconButton size="sm" variant="ghost" label={t("markReadNamed", { title: isolate(heading) })} icon={<Check />} onClick={onMarkRead} />
      ) : null}
    </div>
  );
}
