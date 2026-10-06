"use client";
import { useId, useMemo, type JSX, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { Avatar, EmptyState, ErrorState, LoadingState, useFormatter } from "@orgtik/ui";
import { useGetActivitiesQuery } from "@/redux/features/task/taskApi";
import { timeAgo } from "@/lib/relative";
import type { IActivity } from "@/types/tasks";
import { useActivitySentence } from "./activity/useActivitySentence";

/** The day an instant falls on, for the reader (activity times are instants, not due days). */
function localDayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * What happened to a task, newest first, grouped by day. Each entry is the person, a sentence in
 * the reader's language built from the action code (the API's own text was English), and when.
 */
export function ActivityPanel({ taskId }: { taskId: number }): JSX.Element {
  const t = useTranslations("TaskActivity");
  const locale = useLocale();
  const f = useFormatter();
  const sentence = useActivitySentence();
  const { data, isLoading, isError, refetch } = useGetActivitiesQuery(taskId, { skip: !taskId });

  const groups = useMemo(() => {
    const list = [...(data?.data ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id
    );
    const out: { key: string; first: string; items: IActivity[] }[] = [];
    for (const a of list) {
      const key = localDayKey(a.createdAt);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(a);
      else out.push({ key, first: a.createdAt, items: [a] });
    }
    return out;
  }, [data]);

  if (isLoading) return <LoadingState rows={4} label={t("loading")} />;
  if (isError && !data) {
    return <ErrorState size="compact" title={t("errorTitle")} onRetry={() => void refetch()} />;
  }
  if (groups.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={<ClockCounterClockwise />}
        title={t("emptyTitle")}
        description={t("emptyBody")}
      />
    );
  }

  const now = new Date();
  const today = localDayKey(now.toISOString());
  const yesterday = localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString());
  const dayLabel = (key: string, iso: string) =>
    key === today ? t("today") : key === yesterday ? t("yesterday") : f.date(iso, { dateStyle: "medium" });

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <DayGroup key={g.key} label={dayLabel(g.key, g.first)}>
          {g.items.map((a) => {
            const name = a.user ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim() : "";
            const shown = name || t("someone");
            return (
              <li key={a.id} className="flex items-start gap-3">
                <Avatar name={shown} src={a.user?.avatar} size="sm" decorative />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span dir="auto" className="text-body-sm font-semibold text-fg">
                      {shown}
                    </span>
                    <time dateTime={a.createdAt} className="text-caption text-fg-subtle">
                      {timeAgo(a.createdAt, locale)}
                    </time>
                  </p>
                  <p className="break-words text-body-sm text-fg-muted">{sentence(a)}</p>
                </div>
              </li>
            );
          })}
        </DayGroup>
      ))}
    </div>
  );
}

function DayGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-label text-fg-muted">
        {label}
      </h3>
      <ol className="flex flex-col gap-4">{children}</ol>
    </section>
  );
}
