"use client";

// My work at a glance (FS-TASKS-9). The period lives in the address. Up next opens the task on its
// own project's board (it used the task's id as the project's, TASKS-013). The priority chart reads
// the API's day and month keys, so it has data in every language (in German it was all zeros,
// TASKS-050). Activity is worded here, in the reader's language, from the API's codes.
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowsClockwise, CalendarCheck, CheckCircle, PlusCircle, WarningCircle } from "@phosphor-icons/react";
import { Avatar, Card, CardHeader, EmptyState, ErrorState, LoadingState, SegmentedControl, Stat, useFormatter, useStatusLabel } from "@orgtik/ui";
import { BarChart, DonutChart, LineChart } from "@orgtik/ui/charts";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { AvatarStack } from "@/components/shared/AvatarStack";
import { useGetMyTaskOverviewQuery } from "@/redux/features/task/taskApi";
import { dueDay } from "@/lib/dates";
import { timeAgo } from "@/lib/relative";
import { isolate } from "@/lib/bidi";

export type IPeriod = "7d" | "1m" | "1y";
type Metric = { count: number; percentage: number };
type Overview = {
  metrics: Record<"completed" | "updated" | "created" | "dueSoon" | "overdue", Metric>;
  statusOverview: { status: string; count: number }[];
  recentActivity: { code: string; value: string | null; taskId: number; projectId: number; userName: string; userAvatar: string | null; taskTitle: string; timestamp: string }[];
  upNext: null | {
    id: number;
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "todo";
    project: { id: number; name: string };
    assignees: { id: number; name: string; avatar: string | null }[];
  };
  priorityBreakdown: Record<"urgentPriority" | "highPriority" | "mediumPriority" | "lowPriority", { count: number; trend: { key: string; value: number }[] }>;
  completedByAssignee: { totalCompleted: number; assignees: { id: number; name: string; count: number }[] };
};

const METRICS = [
  { key: "completed", icon: <CheckCircle />, good: "up" },
  { key: "updated", icon: <ArrowsClockwise />, good: "up" },
  { key: "created", icon: <PlusCircle />, good: "up" },
  { key: "dueSoon", icon: <CalendarCheck />, good: "down" },
  { key: "overdue", icon: <WarningCircle />, good: "down" },
] as const;
const ACTIONS = new Set([
  "created", "assigned", "unassigned", "status_changed", "subtask_added", "subtask_completed", "subtask_uncompleted", "subtask_deleted",
  "attachment_added", "attachment_deleted", "commented", "due_date_changed", "priority_changed", "updated", "moved", "archived",
]);

export default function MyTasksOverview() {
  const t = useTranslations("MyWork");
  const tp = useTranslations("Priority");
  const statusLabel = useStatusLabel();
  const f = useFormatter();
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const period = (["7d", "1m", "1y"].includes(params.get("period") ?? "") ? params.get("period") : "7d") as IPeriod;
  const { data, isLoading, isError, refetch } = useGetMyTaskOverviewQuery({ period });
  const d = data?.data as unknown as Overview | undefined;

  if (isError) return <ErrorState size="page" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} />;

  const against = t(`vs.${period}`);
  const trendKeys = d?.priorityBreakdown.urgentPriority.trend.map((p) => p.key) ?? [];
  const trendRows = trendKeys.map((key, i) => ({
    key,
    urgent: d!.priorityBreakdown.urgentPriority.trend[i]?.value ?? 0,
    high: d!.priorityBreakdown.highPriority.trend[i]?.value ?? 0,
    medium: d!.priorityBreakdown.mediumPriority.trend[i]?.value ?? 0,
    low: d!.priorityBreakdown.lowPriority.trend[i]?.value ?? 0,
  }));
  const trendLabel = (v: string | number) => {
    const s = String(v);
    if (s.length === 7) return f.date(`${s}-01T00:00:00Z`, { month: "short", timeZone: "UTC" });
    return f.date(`${s}T00:00:00Z`, period === "7d" ? { weekday: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });
  };
  const sentence = (a: Overview["recentActivity"][number]) => {
    const task = isolate(a.taskTitle);
    if (!ACTIONS.has(a.code)) return t("activity.other", { task });
    if (a.code === "status_changed") return t("activity.status_changed", { task, status: a.value ? statusLabel("task", (a.value === "completed" ? "done" : a.value) as "todo") : "" });
    if (a.code === "priority_changed") return t("activity.priority_changed", { task, priority: a.value && ["low", "medium", "high", "urgent"].includes(a.value) ? tp(a.value) : "" });
    return t(`activity.${a.code}`, { task });
  };
  const up = d?.upNext;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <SegmentedControl<IPeriod>
          label={t("period")}
          value={period}
          onValueChange={(v) => router.replace(v === "7d" ? pathname : `${pathname}?period=${v}`)}
          segments={[
            { value: "7d", label: t("periods.7d") },
            { value: "1m", label: t("periods.1m") },
            { value: "1y", label: t("periods.1y") },
          ]}
        />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {METRICS.map((m) => {
          const v = d?.metrics[m.key];
          return (
            <li key={m.key}>
              <Stat loading={isLoading} icon={m.icon} label={t(`metrics.${m.key}`)} value={v ? f.number(v.count) : "–"} change={v ? { value: v.percentage / 100, good: m.good, against } : undefined} />
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card padding="md" className="flex flex-col gap-3">
          <CardHeader title={t("upNext")} />
          {isLoading ? (
            <LoadingState rows={3} />
          ) : up ? (
            <div className="flex flex-col gap-3">
              <span dir="auto" className="text-caption text-fg-muted">
                {up.project.name}
              </span>
              <Link href={`/projects/${up.project.id}/board?task-id=${up.id}`} dir="auto" className="text-body-lg font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                {up.title}
              </Link>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={up.status} size="sm" />
                <PriorityBadge priority={up.priority} size="sm" />
              </div>
              <p className="text-body-sm text-fg-muted">{t("dueOn", { date: f.date(dueDay(up.dueDate), { dateStyle: "full", timeZone: "UTC" }) })}</p>
              <AvatarStack people={up.assignees} label={t("assignees")} />
            </div>
          ) : (
            <EmptyState size="compact" title={t("nothingNext")} description={t("nothingNextBody")} />
          )}
        </Card>
        <DonutChart
          title={t("byStatus")}
          loading={isLoading}
          data={(d?.statusOverview ?? []).map((s) => {
            const state = (s.status === "completed" ? "done" : s.status) as "todo";
            return { key: state, label: statusLabel("task", state), value: s.count };
          })}
          totalLabel={t("tasks")}
          categoryLabel={t("status")}
          valueLabel={t("tasks")}
        />
        <BarChart
          title={t("completedBy")}
          description={d ? t("completedTotal", { count: d.completedByAssignee.totalCompleted }) : undefined}
          loading={isLoading}
          layout="rows"
          valueFormat={{ maximumFractionDigits: 0 }}
          data={(d?.completedByAssignee.assignees ?? []).map((a) => ({ person: a.name, done: a.count }))}
          x={{ key: "person", label: t("person") }}
          series={[{ key: "done", label: t("completedTasks") }]}
          emptyText={t("noneCompleted")}
        />
        <LineChart
          valueFormat={{ maximumFractionDigits: 0 }}
          className="xl:col-span-2"
          title={t("byPriority")}
          description={t("byPriorityHint")}
          loading={isLoading}
          data={trendRows}
          x={{ key: "key", label: period === "1y" ? t("month") : t("day"), format: trendLabel }}
          series={[
            { key: "urgent", label: tp("urgent"), color: 6 },
            { key: "high", label: tp("high"), color: 5 },
            { key: "medium", label: tp("medium"), color: 2 },
            { key: "low", label: tp("low"), color: 8, dashed: true },
          ]}
        />
        <Card padding="md" className="flex flex-col gap-3">
          <CardHeader title={t("recent")} />
          {isLoading ? (
            <LoadingState rows={4} />
          ) : d?.recentActivity.length ? (
            <ol className="flex flex-col gap-3">
              {d.recentActivity.slice(0, 6).map((a, i) => (
                <li key={`${a.taskId}-${a.timestamp}-${i}`} className="flex items-start gap-3">
                  <Avatar name={a.userName} src={a.userAvatar || undefined} size="sm" decorative />
                  <div className="flex min-w-0 flex-col">
                    <p className="text-body-sm text-fg">
                      <span dir="auto" className="font-semibold">
                        {a.userName}
                      </span>{" "}
                      <Link href={`/projects/${a.projectId}/board?task-id=${a.taskId}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                        {sentence(a)}
                      </Link>
                    </p>
                    <time dateTime={a.timestamp} className="text-caption text-fg-muted">
                      {timeAgo(a.timestamp, locale)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState size="compact" title={t("noActivity")} />
          )}
        </Card>
      </div>
    </div>
  );
}
