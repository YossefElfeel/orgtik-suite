"use client";

// Tasks on a month or week calendar (FS-TASKS-8), on the library's CalendarGrid: a real grid with
// arrow-key moves, the week starting where the reader's locale starts it, mirrored in Arabic
// (TASKS-047). A task sits on its due day as read in the organisation's time zone, the same day for
// every viewer (TASKS-052). The month, view and project filter live in the address; the old
// "All projects" filter changed nothing (TASKS-043).
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseDate, today, type CalendarDate } from "@internationalized/date";
import { SegmentedControl, Select, type Tone } from "@orgtik/ui";
import { CalendarGrid } from "@orgtik/ui/dates";
import { usePathname, useRouter } from "@/i18n/routing";
import { ORG_TIME_ZONE, dueDayKey } from "@/lib/dates";
import type { IProjectTask } from "@/types/tasks";

type Event = { id: string; title: string; start: string; tone?: Tone; projectId: number; taskId: number };
const TONE: Record<string, Tone> = { urgent: "danger", high: "warning", medium: "info", low: "neutral" };

export function TaskCalendar({
  tasks,
  projectId,
  loading,
  error,
  onRetry,
  filterByProject = false,
}: {
  tasks: (IProjectTask & { project?: { id: number; title?: string; name?: string } })[];
  /** Set on a project's calendar: tasks open in its sheet. My tasks opens each on its own board. */
  projectId?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  filterByProject?: boolean;
}) {
  const t = useTranslations("Calendar");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const view = params.get("view") === "week" ? "week" : "month";
  const now = today(ORG_TIME_ZONE);
  const month: CalendarDate = useMemo(() => {
    const raw = params.get("date");
    try {
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseDate(raw) : now;
    } catch {
      return now;
    }
  }, [params, now]);
  const project = params.get("project");

  const projects = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of tasks) if (x.project?.id) m.set(x.project.id, x.project.title ?? x.project.name ?? String(x.project.id));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);
  const events: Event[] = tasks
    .filter((x) => x.dueDate && (!project || String(x.project?.id) === project))
    .map((x) => ({ id: String(x.id), title: x.title, start: dueDayKey(String(x.dueDate)), tone: TONE[x.priority], projectId: x.project?.id ?? projectId ?? 0, taskId: x.id }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<"month" | "week">
          label={t("view")}
          value={view}
          onValueChange={(v) => set({ view: v === "month" ? null : v })}
          segments={[
            { value: "month", label: t("month") },
            { value: "week", label: t("week") },
          ]}
        />
        {filterByProject && projects.length > 1 ? (
          <div className="sm:w-64">
            <Select
              aria-label={t("project")}
              value={project ?? "all"}
              onValueChange={(v) => set({ project: v && v !== "all" ? v : null })}
              options={[{ value: "all", label: t("allProjects") }, ...projects.map(([id, title]) => ({ value: String(id), label: title }))]}
            />
          </div>
        ) : null}
      </div>
      <CalendarGrid
        view={view}
        month={month}
        today={now}
        onMonthChange={(d) => set({ date: d.compare(now) === 0 ? null : d.toString() })}
        events={events}
        timeZone={ORG_TIME_ZONE}
        status={loading ? "loading" : error ? "error" : "ready"}
        onRetry={onRetry}
        onOpenEvent={(e) => (projectId ? set({ "task-id": e.id }) : router.push(`/projects/${e.projectId}/board?task-id=${e.taskId}`))}
      />
    </div>
  );
}
