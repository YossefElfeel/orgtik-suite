"use client";

// A task in an activity list: where it lives, who made it, its dates, status, priority and progress.
// The title opens the task on its board (it used to open only the project), dates are due days in
// the reader's language (they used the browser's default format), and the progress has a label.
import { useTranslations } from "next-intl";
import { Card, Progress, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { dueDay } from "@/lib/dates";
import type { ITaskActivity } from "@/types";

export default function TaskActivityCard({ TaskActivity: task }: { TaskActivity: ITaskActivity }) {
  const t = useTranslations("ActivityCard");
  const f = useFormatter();
  const day = (v?: string) => (v ? f.date(dueDay(v), { dateStyle: "medium", timeZone: "UTC" }) : t("noDate"));
  const by = task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : t("unknown");
  const href = task.project?.id ? `/projects/${task.project.id}/board?task-id=${task.id}` : undefined;

  return (
    <Card padding="md" className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        {task.project?.title ? (
          <span dir="auto" className="truncate text-caption text-fg-muted">
            {task.project.title}
          </span>
        ) : null}
        {href ? (
          <Link href={href} dir="auto" className="line-clamp-2 font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {task.title}
          </Link>
        ) : (
          <span dir="auto" className="line-clamp-2 font-semibold text-fg">
            {task.title}
          </span>
        )}
        <span className="text-caption text-fg-muted">
          {t("createdBy")} <span dir="auto">{by}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={task.status} size="sm" />
        <PriorityBadge priority={task.priority} size="sm" />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-body-sm">
        <div>
          <dt className="text-caption text-fg-muted">{t("start")}</dt>
          <dd>{day(task.startDate)}</dd>
        </div>
        <div>
          <dt className="text-caption text-fg-muted">{t("due")}</dt>
          <dd>{day(task.dueDate)}</dd>
        </div>
      </dl>
      <Progress value={Math.round(Number(task.progress) || 0)} label={t("progress")} className="mt-auto" />
    </Card>
  );
}
