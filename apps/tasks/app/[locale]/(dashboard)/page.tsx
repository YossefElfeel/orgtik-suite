"use client";

// The Tasks dashboard (FS-TASKS-9): four figures and four charts, all on @orgtik/ui. Every chart has
// a table view and a text alternative (the old ones had none, TASKS-048), labels come from the API's
// keys in the reader's language, and each figure says what it's compared with (the old cards all
// said "Tasks finished last month", whatever they counted, TASKS-068).
import { useTranslations } from "next-intl";
import { CheckCircle, Circle, Stack, WarningCircle } from "@phosphor-icons/react";
import { ErrorState, PageHeader, Stat, useStatusLabel, useFormatter } from "@orgtik/ui";
import { BarChart, DonutChart, LineChart } from "@orgtik/ui/charts";
import { useGetDashboardAnalyticsQuery } from "@/redux/features/home/homeApi";
import { TaskOnboarding } from "@/components/task/TaskOnboarding";

type Card = { key: "open" | "completed" | "total" | "overdue"; value: number; percentage: number };
type StatusRow = { status: "todo" | "in_progress" | "in_review" | "done" | "backlog"; count: number };
type Dashboard = {
  topCards: Card[];
  workloadByStatus: StatusRow[];
  taskAssigneeData: { date: string; thisMonth: number; lastMonth: number }[];
  priorityBreakdown: { monthKey: string; low: number; medium: number; high: number; urgent: number }[];
  incompleteTasksByProject: { projectId: number; projectName: string; totalIncompleteTasks: number }[];
};

const ICON = { open: <Circle />, completed: <CheckCircle />, total: <Stack />, overdue: <WarningCircle /> };

export default function TasksDashboard() {
  const t = useTranslations("Dashboard");
  const tp = useTranslations("Priority");
  const statusLabel = useStatusLabel();
  const f = useFormatter();
  const { data, isLoading, isError, refetch } = useGetDashboardAnalyticsQuery();
  const d = data?.data as unknown as Dashboard | undefined;

  if (isError) return <ErrorState size="page" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} />;

  const cards: Card["key"][] = ["open", "completed", "total", "overdue"];
  const card = (k: Card["key"]) => d?.topCards.find((c) => c.key === k);
  const day = (v: string | number) => f.date(`${v}T00:00:00Z`, { day: "numeric", month: "short", timeZone: "UTC" });
  const month = (v: string | number) => f.date(`${v}-01T00:00:00Z`, { month: "short", timeZone: "UTC" });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <TaskOnboarding />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((k) => {
          const c = card(k);
          return (
            <li key={k}>
              <Stat
                loading={isLoading}
                icon={ICON[k]}
                label={t(`cards.${k}`)}
                value={c ? f.number(c.value) : "–"}
                change={c ? { value: c.percentage / 100, good: k === "overdue" || k === "open" ? "down" : "up", against: t(k === "completed" ? "vsPrevious30" : "vsLastWeek") } : undefined}
              />
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <BarChart
          className="xl:col-span-2"
          title={t("byProject")}
          description={t("byProjectHint")}
          loading={isLoading}
          layout="rows"
          valueFormat={{ maximumFractionDigits: 0 }}
          data={(d?.incompleteTasksByProject ?? []).map((p) => ({ project: p.projectName, open: p.totalIncompleteTasks }))}
          x={{ key: "project", label: t("project") }}
          series={[{ key: "open", label: t("openTasks") }]}
          emptyText={t("noProjects")}
        />
        <DonutChart
          title={t("byStatus")}
          loading={isLoading}
          data={(d?.workloadByStatus ?? []).map((s) => ({ key: s.status, label: statusLabel("task", s.status), value: s.count }))}
          totalLabel={t("tasks")}
          categoryLabel={t("status")}
          valueLabel={t("tasks")}
        />
        <LineChart
          valueFormat={{ maximumFractionDigits: 0 }}
          className="xl:col-span-2"
          title={t("assignments")}
          description={t("assignmentsHint")}
          loading={isLoading}
          data={(d?.taskAssigneeData ?? []).map((r) => ({ date: r.date, thisMonth: r.thisMonth, lastMonth: r.lastMonth }))}
          x={{ key: "date", label: t("day"), format: day }}
          series={[
            { key: "thisMonth", label: t("last30") },
            { key: "lastMonth", label: t("previous30"), dashed: true },
          ]}
        />
        <BarChart
          title={t("byPriority")}
          description={t("byPriorityHint")}
          loading={isLoading}
          stacked
          valueFormat={{ maximumFractionDigits: 0 }}
          data={(d?.priorityBreakdown ?? []).map((r) => ({ month: r.monthKey, urgent: r.urgent, high: r.high, medium: r.medium, low: r.low }))}
          x={{ key: "month", label: t("month"), format: month }}
          series={[
            { key: "urgent", label: tp("urgent"), color: 6 },
            { key: "high", label: tp("high"), color: 5 },
            { key: "medium", label: tp("medium"), color: 2 },
            { key: "low", label: tp("low"), color: 8 },
          ]}
        />
      </div>
    </section>
  );
}
