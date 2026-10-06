"use client";

// One event in the activity feed (FS-FILES-6), on the Activity logs page and the dashboard: what
// happened (in the reader's language, not the API's "uploaded"), by whom, to what, and when (a
// relative time in the reader's language, the exact time on hover).
import React from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Eye, File, Folder, Info, PencilSimple, PushPin, PushPinSlash, Trash, UploadSimple } from "@phosphor-icons/react";
import { useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useRelativeTime } from "@/hooks/useRelativeTime";

const ACTIONS = ["uploaded", "created", "updated", "renamed", "moved", "deleted", "viewed", "pinned", "unpinned", "archived", "restored", "shared"] as const;
type Action = (typeof ACTIONS)[number];

// The icon and tone tell the kind of event at a glance; the words say it (never colour alone).
const STYLE: Record<string, { icon: React.ReactNode; tone: string }> = {
  uploaded: { icon: <UploadSimple />, tone: "bg-info-subtle text-info" },
  created: { icon: <Folder />, tone: "bg-info-subtle text-info" },
  viewed: { icon: <Eye />, tone: "bg-sunken text-fg-muted" },
  pinned: { icon: <PushPin />, tone: "bg-warning-subtle text-warning" },
  unpinned: { icon: <PushPinSlash />, tone: "bg-sunken text-fg-muted" },
  updated: { icon: <PencilSimple />, tone: "bg-success-subtle text-success" },
  renamed: { icon: <PencilSimple />, tone: "bg-success-subtle text-success" },
  moved: { icon: <ArrowUpRight />, tone: "bg-brand-subtle text-fg-brand" },
  deleted: { icon: <Trash />, tone: "bg-danger-subtle text-danger" },
};

type Activity = {
  id: string | number;
  action?: string;
  entityType?: "file" | "folder" | string;
  entityId?: string | null;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; username?: string } | null;
  metadata?: { name?: string; folderId?: string | null } | null;
};

const ActivityItem = ({ activity, isLast }: { activity: Activity; isLast: boolean; tc?: unknown }) => {
  const t = useTranslations("Activity");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const relative = useRelativeTime();
  const action = (ACTIONS as readonly string[]).includes(activity.action ?? "") ? (activity.action as Action) : "other";
  const style = STYLE[action] ?? { icon: <Info />, tone: "bg-sunken text-fg-muted" };
  const actor = activity.actor ? [activity.actor.firstName, activity.actor.lastName].filter(Boolean).join(" ") || activity.actor.username : null;
  const name = activity.metadata?.name || activity.entityId || "";
  const isFolder = activity.entityType === "folder";
  const href = isFolder && activity.entityId ? `/my-files/${activity.entityId}` : activity.metadata?.folderId ? `/my-files/${activity.metadata.folderId}` : "/my-files";

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span aria-hidden="true" className={cn("z-10 grid size-10 shrink-0 place-items-center rounded-pill [&>svg]:size-5", style.tone)}>
          {style.icon}
        </span>
        {!isLast ? <span aria-hidden="true" className="my-1 w-px flex-1 border-s-2 border-dashed border-line" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-8 pt-1">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-body font-semibold text-fg">
            {t(`actions.${action}`)}
            {actor ? (
              <bdi className="ms-2 text-body-sm font-normal text-fg-muted">{t("by", { name: actor })}</bdi>
            ) : null}
          </p>
          <time dateTime={activity.createdAt} title={f.date(activity.createdAt, { dateStyle: "medium", timeStyle: "short" })} className="text-caption text-fg-subtle">
            {relative(activity.createdAt)}
          </time>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-field border border-line bg-sunken p-2">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="shrink-0 text-fg-subtle [&>svg]:size-5">
              {isFolder ? <Folder weight="duotone" /> : <File weight="duotone" />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span dir="auto" className="truncate text-body-sm font-semibold text-fg">
                {name}
              </span>
              <span className="text-caption text-fg-muted">{isFolder ? tc("folder") : tc("file")}</span>
            </span>
          </div>
          {action !== "deleted" ? (
            <Link href={href} aria-label={t("open", { name })} className="grid size-8 shrink-0 place-items-center rounded-pill text-fg-brand hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus">
              <ArrowUpRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
