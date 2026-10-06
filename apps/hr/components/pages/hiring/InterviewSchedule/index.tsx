"use client";
import { LinkSimple as Link2 } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";

export type InterviewScheduleView = "day" | "week" | "month";

export type InterviewScheduleEvent = {
  id: string;
  title: string;
  /** Who interviews; user data, so the caller isolates it (<bdi>). */
  interviewer: ReactNode;
  start: Date;
  end: Date;
  linkLabel: string;
  /** The interview note or link (user data) or a translated fallback. */
  meetingLabel: ReactNode;
  timeLabel?: string;
};

type InterviewScheduleProps = {
  events: InterviewScheduleEvent[];
  initialDate?: Date;
  initialView?: InterviewScheduleView;
  className?: string;
  dayStartHour?: number;
  dayEndHour?: number;
  view: InterviewScheduleView;
  setView: (view: InterviewScheduleView) => void;
};

const VIEW_OPTIONS: InterviewScheduleView[] = ["day", "week", "month"];

const TIME_COLUMN_WIDTH = 44;
function buildHourSlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    return startHour + index;
  });
}

const hourSlotDate = (hour: number) => setMinutes(setHours(new Date(), hour), 0);

function InterviewCard({
  event,
  compact = false,
}: {
  event: InterviewScheduleEvent;
  compact?: boolean;
}) {
  const format = useFormatter();
  const eventTime =
    event.timeLabel ??
    `${format.dateTime(event.start, { timeStyle: "short" })} - ${format.dateTime(event.end, { timeStyle: "short" })}`;

  if (compact) {
    return (
      <article className="rounded-[10px] border border-border bg-card px-2.5 py-2 shadow-[0_8px_20px_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
        <p className="truncate text-[11px] font-semibold leading-4 text-foreground">
          {event.title}
        </p>
        <p className="mt-1 truncate text-[10px] leading-4 text-tertiary">
          {eventTime}
        </p>
      </article>
    );
  }

  return (
    <article className="w-full overflow-hidden rounded-[10px] border border-border bg-card px-3 py-2.5 shadow-[0_8px_20px_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
      <p className="truncate text-[13px] font-semibold leading-5 text-foreground">
        {event.title}
      </p>
      <p className="mt-0.5 truncate text-[13px] leading-5 text-tertiary">
        {eventTime}
      </p>
      <p className="mt-2 truncate text-[13px] font-medium leading-5 text-foreground">
        {event.interviewer}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-2 text-[12px] leading-4 text-tertiary">
        <Link2 className="size-3.5 shrink-0 text-secondary" />
        <span className="truncate">{event.linkLabel}</span>
      </div>
      <p className="mt-1 line-clamp-2 ps-5 text-[13px] leading-5 text-foreground">
        {event.meetingLabel}
      </p>
    </article>
  );
}

export default function InterviewSchedule({
  events,
  initialDate = new Date("2018-04-25T09:00:00"),
  initialView = "week",
  className,
  dayStartHour = 9,
  dayEndHour = 12,
  view,
  setView,
}: InterviewScheduleProps) {
  const t = useTranslations("jobs");
  const formatter = useFormatter();
  // Hour labels wait for the browser: Node and the browser ship different locale data (Italian
  // "9" on the server, "09" in Chrome), which broke hydration on this page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // const [view, setView] = useState<InterviewScheduleView>(initialView);
  const [currentDate] = useState<Date>(startOfDay(initialDate));

  const visibleDays = useMemo(() => {
    if (view === "day") {
      return [currentDate];
    }

    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    }

    const monthStart = startOfWeek(startOfMonth(currentDate), {
      weekStartsOn: 0,
    });
    const monthEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days: Date[] = [];

    for (
      let cursor = monthStart;
      cursor <= monthEnd;
      cursor = addDays(cursor, 1)
    ) {
      days.push(cursor);
    }

    return days;
  }, [currentDate, view]);

  const hourSlots = useMemo(() => {
    return buildHourSlots(dayStartHour, dayEndHour);
  }, [dayEndHour, dayStartHour]);

  const weeklyEventsByKey = useMemo(() => {
    const slotMap = new Map<string, InterviewScheduleEvent[]>();

    for (const event of events) {
      const key = `${format(event.start, "yyyy-MM-dd")}-${event.start.getHours()}`;
      const currentItems = slotMap.get(key) ?? [];
      currentItems.push(event);
      slotMap.set(key, currentItems);
    }

    return slotMap;
  }, [events]);

  const monthlyEventsByDay = useMemo(() => {
    const dayMap = new Map<string, InterviewScheduleEvent[]>();

    for (const event of events) {
      const key = format(event.start, "yyyy-MM-dd");
      const currentItems = dayMap.get(key) ?? [];
      currentItems.push(event);
      dayMap.set(key, currentItems);
    }

    return dayMap;
  }, [events]);

  const monthHeaderDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), index),
    );
  }, [currentDate]);

  const weekGridTemplateColumns = `${TIME_COLUMN_WIDTH}px repeat(${visibleDays.length}, minmax(0, 1fr))`;

  return (
    <section className={cn("w-full", className)}>
      <div className="border-b border-border">
        <div className="flex items-center gap-6 px-1">
          {VIEW_OPTIONS.map((option) => {
            const isActive = option === view;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => setView(option)}
                className={cn(
                  "border-b-2 border-transparent px-0 pb-3 text-[15px] leading-6 text-secondary transition-colors",
                  isActive && "border-primary font-medium text-primary",
                )}
              >
                {t(`hiringOverall.views.${option}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pb-2">
        {view === "month" ? (
          <div className="w-full overflow-hidden rounded-[18px] border border-border bg-card">
            <div className="grid grid-cols-7 border-b border-border">
              {monthHeaderDays.map((day) => (
                <div
                  key={format(day, "EEE")}
                  className="flex h-[56px] items-center justify-center border-e border-border text-[12px] font-medium text-secondary last:border-e-0"
                >
                  {formatter.dateTime(day, { weekday: "long" })}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {visibleDays.map((day, index) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayEvents = monthlyEventsByDay.get(dayKey) ?? [];
                const isMuted = !isSameMonth(day, currentDate);
                const visibleEventCount = dayEvents.slice(0, 3);
                const isLastColumn = (index + 1) % 7 === 0;

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-[168px] border-e border-b border-border p-3",
                      isLastColumn && "border-e-0",
                      index >= visibleDays.length - 7 && "border-b-0",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 text-sm font-medium text-foreground",
                        isMuted && "text-tertiary",
                      )}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-2">
                      {visibleEventCount.map((event) => (
                        <InterviewCard key={event.id} event={event} compact />
                      ))}

                      {dayEvents.length > 3 ? (
                        <p className="text-[11px] font-medium text-primary">
                          {t("hiringOverall.moreEvents", { count: dayEvents.length - 3 })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-[18px] border border-border bg-card">
            <div
              className="grid"
              style={{ gridTemplateColumns: weekGridTemplateColumns }}
            >
              <div className="h-[40px] border-e border-b border-border" />

              {visibleDays.map((day, index) => (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "flex h-[40px] bg-sunken/50 flex-col items-center justify-center border-e border-line-strong border-b px-2 text-center last:border-e-0",
                    index === visibleDays.length - 1 && "border-e-0",
                  )}
                >
                  <span className="text-[12px] leading-4 text-secondary">
                    {formatter.dateTime(day, { weekday: "long" })}
                  </span>
                  <span className="mt-1 text-[12px] leading-4 text-tertiary">
                    {formatter.dateTime(day, { dateStyle: "short" })}
                  </span>
                </div>
              ))}

              {hourSlots.map((hour, rowIndex) => {
                return (
                  <Fragment key={hour}>
                    <div
                      className={cn(
                        "flex h-[180px]  flex-col items-center justify-start border-e border-b border-border pt-8 text-[13px] text-secondary",
                        rowIndex === hourSlots.length - 1 && "border-b-0",
                      )}
                    >
                      <span className="leading-none">
                        {mounted ? formatter.dateTime(hourSlotDate(hour), { hour: "numeric" }) : null}
                      </span>
                    </div>

                    {visibleDays.map((day, columnIndex) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const slotEvents =
                        weeklyEventsByKey.get(`${dayKey}-${hour}`) ?? [];
                      const isLastColumn =
                        columnIndex === visibleDays.length - 1;
                      const isLastRow = rowIndex === hourSlots.length - 1;

                      return (
                        <div
                          key={`${dayKey}-${hour}`}
                          className={cn(
                            "flex h-[180px] items-start justify-center overflow-hidden border-e border-b border-border px-2 py-2 ",
                            isLastColumn && "border-e-0",
                            isLastRow && "border-b-0",
                          )}
                        >
                          <div className="flex w-full min-w-0 max-w-[122px] flex-col gap-2">
                            {slotEvents.map((event) => (
                              <InterviewCard key={event.id} event={event} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
