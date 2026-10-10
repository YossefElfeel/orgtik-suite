"use client";

// Tasks on a month or week calendar (FS-TASKS-8), on the library's CalendarGrid: a real grid with
// arrow-key moves, the week starting where the reader's locale starts it, mirrored in Arabic
// (TASKS-047). A task sits on its due day as read in the organisation's time zone, the same day for
// every viewer (TASKS-052). The month, view and project filter live in the address; the old
// "All projects" filter changed nothing (TASKS-043).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { endOfMonth, endOfWeek, parseDate, startOfMonth, startOfWeek, today, type CalendarDate } from "@internationalized/date";
import { Button, ConnectedFeature, SegmentedControl, Select, formatLocale, useOrgtik, useSuite, type Tone } from "@orgtik/ui";
import { useClientSession } from "@orgtik/ui/auth";
import { CalendarGrid } from "@orgtik/ui/dates";
import { usePathname, useRouter } from "@/i18n/routing";
import { dueDayKey } from "@/lib/dates";
import { availabilityNamespace, type AvailabilityItem } from "@/lib/calendar-availability";
import { useGetCalendarAvailabilityQuery } from "@/redux/features/calendar/calendarApi";
import type { IProjectTask } from "@/types/tasks";

type Event = { id: string; title: string; start: string; end?: string; tone?: Tone; projectId?: number; taskId?: number; availability?: AvailabilityItem };
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
  const suite = useSuite();
  const connected = suite.connectionState("hr", "tasks", false) === "available";
  const requestHR = () => suite.mutate("/access-requests", "POST", { tool: "hr", reason: "Show HR availability in the Tasks calendar" });
  const trialHR = async () => { const plans = await suite.request<{ id: string; trialDays: number }[]>("/tools/hr/plans"); const plan = plans.find(row => row.trialDays > 0); if (!plan) throw new Error(t("availabilityError")); await suite.mutate("/tools/hr/trial", "POST", { planId: plan.id }); };
  const context = useClientSession()?.workspaceContext;
  const timeZone = context?.workspace.timeZone ?? "UTC";
  const namespace = availabilityNamespace(context);
  const { locale, digits } = useOrgtik();
  const tag = formatLocale(locale, digits);
  const detailId = useId();
  const detailRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<{ namespace: string; id: string } | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const view = params.get("view") === "week" ? "week" : "month";
  const now = today(timeZone);
  const month: CalendarDate = useMemo(() => {
    const raw = params.get("date");
    try {
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseDate(raw) : now;
    } catch {
      return now;
    }
  }, [params, now]);
  const project = params.get("project");
  const fromDate = startOfWeek(view === "month" ? startOfMonth(month) : month, tag).toString();
  const toDate = endOfWeek(view === "month" ? endOfMonth(month) : month, tag).toString();
  const availability = useGetCalendarAvailabilityQuery({ workspaceId: context?.workspace.id ?? "", timeZone, fromDate, toDate, namespace, guest: context?.member.role === "guest" }, { skip: !context || !connected, pollingInterval: 15000, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true });
  // currentData belongs to this exact context/range; a failed poll must not look like no leave.
  const items = !connected || availability.isError ? [] : availability.currentData?.items ?? [];
  const detail = selected?.namespace === namespace ? items.find(item => item.id === selected.id) : undefined;
  // The month can extend below the app's scroll pane. A detail action must have a visible result.
  // Focus only on a deliberate selection, never again on each background poll.
  useEffect(() => {
    if (selected?.namespace !== namespace) return;
    detailRef.current?.focus({ preventScroll: true });
    detailRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected, namespace]);
  const dateFormat = new Intl.DateTimeFormat(tag, { timeZone: "UTC", dateStyle: "medium" });
  const timeFormat = new Intl.DateTimeFormat(tag, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const duration = (item: AvailabilityItem) => item.durationType === "full_day" ? t("allDay") : item.durationType === "half_day" ? t(item.halfDayPeriod === "morning" ? "morning" : "afternoon") : t("partial");
  const times = (item: AvailabilityItem) => item.durationType === "full_day" ? t("allDay") : timeFormat.formatRange(new Date(item.startAt), new Date(item.endAt));

  const projects = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of tasks) if (x.project?.id) m.set(x.project.id, x.project.title ?? x.project.name ?? String(x.project.id));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);
  const events: Event[] = tasks
    .filter((x) => x.dueDate && (!project || String(x.project?.id) === project))
    .map((x) => ({ id: String(x.id), title: x.title, start: dueDayKey(String(x.dueDate), timeZone), tone: TONE[x.priority], projectId: x.project?.id ?? projectId ?? 0, taskId: x.id }));
  events.push(...items.map(item => ({ id: `availability:${item.id}`, title: t("unavailablePerson", { name: item.personName, period: duration(item) }), start: item.startDate, end: item.endDate, tone: "neutral" as Tone, availability: item })));

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
      <ConnectedFeature requires="hr" source="tasks" write={false} compact onTrial={trialHR} onRequestTool={requestHR} onRequestAccess={requestHR} billingHref={`${suite.sosUrl}/billing`} settingsHref="/admin/connections"><div className="flex flex-wrap items-center justify-between gap-2 text-caption text-fg-muted" aria-live="polite" aria-busy={availability.isLoading || availability.isFetching}>
        <p>{t("availabilityTitle")} · <bdi>{timeZone}</bdi></p>
        {availability.isError ? (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <span>{t("availabilityError")}</span>
            <Button size="sm" variant="secondary" onClick={() => void availability.refetch()}>{t("retryAvailability")}</Button>
          </div>
        ) : <span>{availability.isLoading || !availability.currentData ? t("availabilityLoading") : items.length ? t("availabilityReadOnly") : t("availabilityEmpty")}</span>}
      </div></ConnectedFeature>
      <CalendarGrid
        view={view}
        month={month}
        today={now}
        onMonthChange={(d) => set({ date: d.compare(now) === 0 ? null : d.toString() })}
        events={events}
        timeZone={timeZone}
        status={loading ? "loading" : error ? "error" : "ready"}
        onRetry={onRetry}
        onOpenEvent={(e) => {
          if (e.availability) {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setSelected({ namespace, id: e.availability.id });
            return;
          }
          if (projectId) set({ "task-id": e.id });
          else router.push(`/projects/${e.projectId}/board?task-id=${e.taskId}`);
        }}
      />
      {detail ? (
        <section ref={detailRef} id={detailId} tabIndex={-1} aria-label={t("availabilityTitle")} className="rounded-panel border border-line bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-body font-semibold text-fg"><bdi>{detail.personName}</bdi> · {t("unavailable")}</h3>
              <p className="mt-1 text-body-sm text-fg-muted">{dateFormat.formatRange(new Date(`${detail.startDate}T00:00:00Z`), new Date(`${detail.endDate}T00:00:00Z`))} · {duration(detail)}{detail.durationType !== "full_day" ? ` · ${times(detail)}` : ""}</p>
              <p className="mt-2 text-caption text-fg-muted">{t("availabilityReadOnly")} · <bdi>{timeZone}</bdi></p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setSelected(null); returnFocusRef.current?.focus(); }}>{t("closeAvailability")}</Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
