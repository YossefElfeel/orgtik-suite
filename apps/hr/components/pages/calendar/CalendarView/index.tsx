"use client";

// HR's calendar on the library CalendarGrid (FS-HR-4, HR-027). It replaces a hand-built grid that
// mixed a Radix tooltip with Base UI dialogs, used divs as buttons, always drew the current month
// whatever month was fetched, and opened the payroll adjustments dialog for a meeting. Now: a real
// grid (arrows, PageUp/PageDown, mirrored in Arabic, an agenda on a phone), each chip a button
// named "{title}, {date}", and each event opens its own details.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@orgtik/ui";
import { CalendarGrid } from "@orgtik/ui/dates";
import { SOS_URL } from "@somion/sos-bar";
import { ORG_TIME_ZONE } from "@/constants/dates";
import { toCalendarEvents } from "@/lib/calendar-events";
import { TimeOffRequestDialog } from "@/components/pages/time-off/TimeOffRequestDialog";
import { PublicHolidayDialog } from "@/components/pages/time-off/PublicHolidayDialog";
import { MeetingDetailsDialog } from "@/components/dialogs/MeetingDetailsDialog";
import type { CalendarViewProps, HrCalendarEvent } from "@/types/calendar";

export default function CalendarView({ days, view, month, onViewChange, onMonthChange, status, onRetry }: CalendarViewProps) {
  const t = useTranslations("calendar");
  const events = useMemo(() => toCalendarEvents(days), [days]);
  const [opened, setOpened] = useState<HrCalendarEvent | null>(null);
  const close = (open: boolean) => {
    if (!open) setOpened(null);
  };
  const source = opened?.source;

  return (
    <section className="flex w-full flex-col gap-4">
      <SegmentedControl<"month" | "week">
        label={t("view")}
        value={view}
        onValueChange={onViewChange}
        className="self-start"
        segments={[
          { value: "month", label: t("views.month") },
          { value: "week", label: t("views.week") },
        ]}
      />
      <CalendarGrid<HrCalendarEvent>
        view={view}
        month={month}
        onMonthChange={onMonthChange}
        events={events}
        timeZone={ORG_TIME_ZONE}
        status={status}
        onRetry={onRetry}
        onOpenEvent={(e) =>
          // A task lives in Tasks: open it on its board there, through SOS (no token in the address).
          e.source.type === "task"
            ? window.location.assign(
                `${SOS_URL}/go/task_manager?redirect=${encodeURIComponent(`/projects/${e.source.projectId}/board?task-id=${e.source.id}`)}`,
              )
            : setOpened(e)
        }
      />

      {source?.type === "timeOff" ? <TimeOffRequestDialog id={source.id} open onOpenChange={close} /> : null}
      {source?.type === "publicHoliday" ? (
        <PublicHolidayDialog title={source.title} date={source.date} open onOpenChange={close} />
      ) : null}
      {source?.type === "meeting" ? <MeetingDetailsDialog meeting={source} open onOpenChange={close} /> : null}
    </section>
  );
}
