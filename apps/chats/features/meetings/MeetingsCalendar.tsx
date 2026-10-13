"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - MEETINGS CALENDAR
 *
 * The same meetings as the list, laid out in time. A month for the shape of
 * things - which days are heavy - and a week for the day itself, with each
 * meeting drawn at its hour. Picking a day in the month shows that day
 * beside it; picking a column header in the week does the same.
 *
 * It is a view, not a second source: every block links to the meeting the
 * list already shows, and scheduling from a day opens the same form with
 * that day filled in.
 */

import {ChatConnection} from "@/features/chat/ChatFeatures";
import { useMemo, useState } from "react";
import { useClientSession } from "@orgtik/ui/auth";
import Link from "next/link";
import { CaretLeft, CaretRight, Plus, VideoCamera } from "@phosphor-icons/react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button, Panel } from "@/components/ui/Primitives";
import { MonthGrid, monthOf, sameMonth, type YearMonth } from "@/components/ui/Calendar";
import { useRoom, useUsers } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { dayLabel, formatRange, formatTime, minutesUntil, localeFormat } from "@/lib/time";
import{workspaceDate}from"@/lib/time";
import { addDays, fromKey, toKey, weekdayOf, type DateKey } from "@/lib/analytics";
import type { Meeting } from "@/entities";
import { workspaceDayKey, zonedHour, type AvailabilityItem } from "@/lib/calendar-availability";
import { useAvailability } from "./useAvailability";

const FIRST_HOUR = 7;
const LAST_HOUR = 19;
const ROW = 44;

const dayFmt = localeFormat({ weekday: "long", day: "numeric", month: "long" });
const shortFmt = localeFormat({ day: "numeric", month: "short" });

export function MeetingsCalendar({
  meetings,
  onSchedule,
}: {
  meetings: Meeting[];
  onSchedule: (day: DateKey) => void;
}) {
  const t = useT();
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const today = workspaceDayKey(workspaceDate(), timeZone);
  const [view, setView] = useState<"month" | "week">("month");
  const [day, setDay] = useState<DateKey>(today);
  const [month, setMonth] = useState<YearMonth>(monthOf(today));
  const [focusDay, setFocusDay] = useState<DateKey | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<DateKey, Meeting[]>();
    for (const m of meetings) {
      const k = workspaceDayKey(m.startsAt, timeZone);
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    for (const list of map.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return map;
  }, [meetings, timeZone]);

  const marks = useMemo(() => Object.fromEntries([...byDay.entries()].map(([k, v]) => [k, v.length])), [byDay]);

  const weekStart = addDays(day, -weekdayOf(day));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthFirst = toKey(new Date(month.year, month.month, 1));
  const monthLast = toKey(new Date(month.year, month.month + 1, 0));
  const availability = useAvailability(view === "month" ? monthFirst : weekStart, view === "month" ? monthLast : weekDays[6]!);
  const availableByDay = new Map<DateKey, AvailabilityItem[]>();
  for (const item of availability.data?.items ?? []) {
    const first = item.startDate < availability.data!.fromDate ? availability.data!.fromDate : item.startDate;
    const last = item.endDate > availability.data!.toDate ? availability.data!.toDate : item.endDate;
    for (let key = first; key <= last; key = addDays(key, 1)) availableByDay.set(key, [...(availableByDay.get(key) ?? []), item]);
  }
  const availabilityMarks = Object.fromEntries([...availableByDay].map(([key, rows]) => [key, rows.length]));

  const goToday = () => {
    setDay(today);
    setMonth(monthOf(today));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={"flex items-center gap-0.5 p-0.5 "+("ch-background-314b28"+' '+"ch-border-radius-332348")}

          role="group"
          aria-label={t("calendar.view", "Calendar view")}
        >
          {(["month", "week"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "secondary" : "ghost"}
              onClick={() => { setView(v); if (v === "month") setMonth(monthOf(day)); }}
              aria-pressed={view === v}
              className={(view === v?"ch-box-shadow-03c10c":"")}
            >
              {v === "month" ? t("calendar.month", "Month") : t("calendar.week", "Week")}
            </Button>
          ))}
        </div>
        {/* Already on today: the button has nothing to do, and says so by
            being inert rather than by doing nothing. */}
        <Button size="sm" onClick={goToday} disabled={day === today && sameMonth(month, monthOf(today))}>
          {t("calendar.today", "Today")}
        </Button>
        {view === "week" && (
          <span className="flex items-center gap-1">
            <Button size="sm" iconOnly label={t("calendar.prevWeek", "Previous week")} onClick={() => setDay(addDays(day, -7))}>
              <CaretLeft size={13} weight="bold" aria-hidden="true" />
            </Button>
            <span className={"tabular px-1 text-body-sm font-semibold "+("ch-color-7f7330")} >
              {shortFmt.format(fromKey(weekStart))} – {shortFmt.format(fromKey(addDays(weekStart, 6)))}
            </span>
            <Button size="sm" iconOnly label={t("calendar.nextWeek", "Next week")} onClick={() => setDay(addDays(day, 7))}>
              <CaretRight size={13} weight="bold" aria-hidden="true" />
            </Button>
          </span>
        )}
        <span className="ms-auto">
          <Button variant="primary" size="sm" onClick={() => onSchedule(day)}>
            <Plus size={13} weight="bold" aria-hidden="true" />
            {t("calendar.scheduleOn", "Schedule on {d}", { d: shortFmt.format(fromKey(day)) })}
          </Button>
        </span>
      </div>
      <ChatConnection requires="hr" write={false}>      <div className={"flex flex-wrap items-center justify-between gap-2 text-body-sm "+("ch-color-4a0211")}  aria-live="polite" aria-busy={availability.status === "loading"}>
        <p>{t("availability.title", "Approved availability")} · <bdi>{timeZone}</bdi></p>
        {availability.status === "error" ? <div className="flex flex-wrap items-center gap-2" role="alert"><span>{t("availability.error", "Availability could not be loaded. Meetings are still shown.")}</span><Button size="sm" onClick={availability.refetch}>{t("availability.retry", "Retry availability")}</Button></div> : <span>{availability.status === "loading" ? t("availability.loading", "Loading availability…") : t("availability.legend", "Outlined dot: approved absence · read-only")}</span>}
      </div></ChatConnection>

      {view === "month" ? (
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <Panel>
            <MonthGrid
              month={month}
              today={today}
              range={{ from: day, to: day }}
              onPick={(d) => {
                setDay(d);
                setMonth(monthOf(d));
              }}
              marks={marks}
              availabilityMarks={availabilityMarks}
              focusDay={focusDay}
              onFocusDay={setFocusDay}
              onMonthChange={(next) => { setMonth(next); setDay(toKey(new Date(next.year, next.month, 1))); setFocusDay(null); }}
              cell={44}
              label={t("calendar.monthGrid", "Meetings by day")}
            />
          </Panel>
          <DayList day={day} meetings={byDay.get(day) ?? []} today={today} timeZone={timeZone} availability={availableByDay.get(day) ?? []} availabilityStatus={availability.status} onSchedule={() => onSchedule(day)} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <WeekGrid days={weekDays} byDay={byDay} availability={availableByDay} timeZone={timeZone} today={today} selected={day} onSelect={setDay} />
          <DayList day={day} meetings={byDay.get(day) ?? []} today={today} timeZone={timeZone} availability={availableByDay.get(day) ?? []} availabilityStatus={availability.status} onSchedule={() => onSchedule(day)} />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the day */

function DayList({ day, meetings, today, onSchedule, timeZone, availability, availabilityStatus }: { day: DateKey; meetings: Meeting[]; today: DateKey; onSchedule: () => void; timeZone: string; availability: AvailabilityItem[]; availabilityStatus: "loading" | "ready" | "error" }) {
  const t = useT();
  const title = dayFmt.format(fromKey(day));
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
          {title}
          {day === today && (
            <span className={"ms-2 text-caption font-medium "+("ch-color-55f463")} >
              {t("calendar.todayLabel", "today")}
            </span>
          )}
        </h2>
        <span className={"tabular text-caption "+("ch-color-4a0211")} >
          {meetings.length === 0
            ? t("calendar.free", "Nothing booked")
            : t("calendar.nBooked", "{n} booked", { n: meetings.length })}
        </span>
      </div>
      <section className={"mb-3 border-b pb-3 "+("ch-border-color-407eb5")}  aria-label={t("availability.title", "Approved availability")}>
        <h3 className={"mb-2 text-body-sm font-semibold "+("ch-color-7f7330")} >{t("availability.title", "Approved availability")}</h3>
        {availabilityStatus === "ready" && availability.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {availability.map(item => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-body-sm">
                <span className={"ch-color-7f7330"} ><bdi>{item.personName}</bdi> · {t("availability.unavailable", "Unavailable")}</span>
                <span className={"tabular "+("ch-color-4a0211")} >
                  {availabilityPeriod(item, t)}{item.durationType !== "full_day" ? ` · ${formatRange(item.startAt, item.endAt, timeZone)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={"text-body-sm "+("ch-color-4a0211")} >
            {availabilityStatus === "loading" ? t("availability.loading", "Loading availability…") : availabilityStatus === "error" ? t("availability.notLoaded", "Availability is not loaded.") : t("availability.emptyDay", "No shared approved absences for this day.")}
          </p>
        )}
      </section>
      {meetings.length === 0 ? (
        <div className="py-6 text-center">
          <p className={"text-body-sm "+("ch-color-4a0211")} >
            {availability.length ? t("availability.noMeetings", "No meetings booked. Check availability before scheduling.") : t("calendar.freeBody", "A clear day. Most conversations here do not need a meeting.")}
          </p>
          <Button size="sm" className="mt-3" onClick={onSchedule}>
            {t("meetings.schedule", "Schedule")}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {meetings.map((m) => (
            <DayRow key={m.id} meeting={m} timeZone={timeZone} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DayRow({ meeting, timeZone }: { meeting: Meeting; timeZone: string }) {
  const room = useRoom(meeting.roomId ?? "");
  const users = useUsers();
  const t = useT();
  const people = meeting.participantIds.map((id) => users.find((u) => u.id === id)).filter((u): u is NonNullable<typeof u> => Boolean(u));
  const mins = minutesUntil(meeting.startsAt);
  const soon = !meeting.endedAt && mins <= 15 && mins > -60;
  const over = Boolean(meeting.endedAt) || new Date(meeting.endsAt).getTime() < workspaceDate().getTime();
  return (
    <li
      className={"hq-row relative flex items-center gap-3 px-3 py-2 "+("ch-border-radius-332348"+' '+(over?"ch-border-inline-start-844669":"ch-border-inline-start-f158c3")+' '+"ch-background-314b28")}

    >
      <span className={"tabular w-[92px] shrink-0 text-caption "+("ch-color-4a0211")} >
        {formatRange(meeting.startsAt, meeting.endsAt, timeZone)}
      </span>
      <Link href={`/hq/meetings/${meeting.id}`} className="min-w-0 flex-1 after:absolute after:inset-0 after:content-['']">
        <span className={"block truncate text-body-sm font-medium "+("ch-color-7f7330")} >
          <bdi>{meeting.title}</bdi>
        </span>
        {room && (
          <span className={"block truncate text-caption "+("ch-color-4a0211")} >
            <bdi>{room.name}</bdi>
          </span>
        )}
      </Link>
      <span className="relative z-10 flex items-center gap-2">
        <AvatarStack people={people} size={20} max={3} />
        {soon && (
          <Button variant="primary" size="sm" href={`/hq/meetings/${meeting.id}/call`}>
            <VideoCamera size={13} weight="fill" aria-hidden="true" />
            {t("meetings.join", "Join")}
          </Button>
        )}
      </span>
    </li>
  );
}

/* --------------------------------------------------------------- the week */

function WeekGrid({
  days,
  byDay,
  today,
  selected,
  onSelect,
  availability,
  timeZone,
}: {
  days: DateKey[];
  byDay: Map<DateKey, Meeting[]>;
  today: DateKey;
  selected: DateKey;
  onSelect: (d: DateKey) => void;
  availability: Map<DateKey, AvailabilityItem[]>;
  timeZone: string;
}) {
  const t = useT();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
  const now = workspaceDate();
  const nowY = (zonedHour(now, timeZone) - FIRST_HOUR) * ROW;

  return (
    <Panel className="overflow-x-auto">
      <div className={"ch-min-width-af5b40"} >
        <div className={"grid "+("ch-grid-template-columns-3fb748")} >
          <span />
          {days.map((d, i) => {
            const isToday = d === today;
            const isSelected = d === selected;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(d)}
                aria-pressed={isSelected}
                className={"hq-btn flex flex-col items-center py-1.5 "+("ch-border-radius-332348"+' '+"ch-color-7f7330")}

              >
                <span className={"text-micro font-semibold uppercase "+("ch-color-094083"+' '+"ch-letter-spacing-47bb2f")} >
                  {dayLabel(i)}
                </span>
                <span
                  className={"tabular mt-0.5 inline-flex items-center justify-center text-body-sm font-semibold "+("ch-width-4b2fb4"+' '+"ch-height-b9ab46"+' '+"ch-border-radius-189003"+' '+(isToday?"ch-background-3f17cb":(isSelected?"ch-background-1416a8":"ch-background-a8869d"))+' '+(isToday?"ch-color-7b8a5e":"ch-color-7f7330"))}

                >
                  {fromKey(d).getDate()}
                </span>
              </button>
            );
          })}
        </div>
        <div className={"mt-1 grid border-y py-2 "+("ch-grid-template-columns-3fb748"+' '+"ch-border-color-407eb5")}  aria-label={t("availability.title", "Approved availability")}>
          <span className={"px-1 text-micro "+("ch-color-4a0211")} >{t("availability.away", "Away")}</span>
          {days.map(key => (
            <div key={key} className={"min-w-0 px-1.5 text-caption "+("ch-color-4a0211")} >
              {(availability.get(key) ?? []).map(item => (
                <div key={item.id} className="mb-1" title={`${item.personName} · ${availabilityPeriod(item, t)}${item.durationType !== "full_day" ? ` · ${formatRange(item.startAt, item.endAt, timeZone)}` : ""}`}>
                  <span className="block truncate font-semibold"><bdi>{item.personName}</bdi></span>
                  <span className="block truncate">{availabilityPeriod(item, t)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className={("relative mt-1 grid "+("ch-grid-template-columns-3fb748"))+" "+(geometryClass({height:hours.length * ROW}))} >
          {/* Hour rules and labels. */}
          {hours.map((h, i) => (
            <div key={h} className={("absolute inset-x-0 "+("ch-height-69c02c"))+" "+(geometryClass({top:i * ROW}))} >
              <span className={"tabular absolute -top-[7px] text-micro "+("ch-left-ced581"+' '+"ch-width-8fb32a"+' '+"ch-text-align-1dfa36"+' '+"ch-color-094083")} >
                {String(h).padStart(2, "0")}:00
              </span>
              <span className={"absolute "+("ch-left-cb9bdb"+' '+"ch-right-9682c6"+' '+"ch-top-0d4406"+' '+"ch-border-top-c9ce2a")}  />
            </div>
          ))}
          <span />
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            const isToday = d === today;
            return (
              <div
                key={d}
                className={"relative "+("ch-border-inline-start-c791b2"+' '+(isToday?"ch-background-1416a8":"ch-background-a8869d")+' '+(isToday?"ch-opacity-047007":"ch-opacity-c6e797"))}

              >
                {isToday && (
                  <span
                    aria-hidden="true"
                    className={("absolute inset-x-0 z-10 "+("ch-border-top-fa61bf"))+" "+(geometryClass({top:nowY}))}

                  />
                )}
                {list.map((m) => {
                  const s = new Date(m.startsAt);
                  const e = new Date(m.endsAt);
                  const startH = zonedHour(s, timeZone);
                  const endH = workspaceDayKey(s, timeZone) !== workspaceDayKey(e, timeZone) ? 24 : zonedHour(e, timeZone);
                  const top = Math.max(0, (startH - FIRST_HOUR) * ROW);
                  const height = Math.max(22, (endH - startH) * ROW - 2);
                  const over = Boolean(m.endedAt) || e.getTime() < Date.now();
                  return (
                    <Link
                      key={m.id}
                      href={`/hq/meetings/${m.id}`}
                      className={("absolute inset-x-[3px] block overflow-hidden px-1.5 py-1 "+("ch-border-radius-edd97e"+' '+(over?"ch-background-314b28":"ch-background-198f75")+' '+(over?"ch-border-inline-start-844669":"ch-border-inline-start-f158c3")+' '+"ch-color-7f7330"))+" "+(geometryClass({top:top,height:height}))}
                      title={`${m.title} · ${formatRange(m.startsAt, m.endsAt, timeZone)}`}

                    >
                      <span className="block truncate text-caption font-semibold"><bdi>{m.title}</bdi></span>
                      {height >= 36 && (
                        <span className={"tabular block truncate text-micro "+("ch-color-4a0211")} >
                          {formatTime(m.startsAt, timeZone)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className={"mt-2 text-caption "+("ch-color-094083")} >
        {t("calendar.weekHint", "Working hours only, {a}:00 to {b}:00. Pick a day to schedule on it.", { a: FIRST_HOUR, b: LAST_HOUR + 1 })}
      </p>
    </Panel>
  );
}

function availabilityPeriod(item: AvailabilityItem, t: ReturnType<typeof useT>) {
  if (item.durationType === "full_day") return t("availability.allDay", "All day");
  if (item.durationType === "half_day") return item.halfDayPeriod === "morning" ? t("availability.morning", "Morning") : t("availability.afternoon", "Afternoon");
  return t("availability.partial", "Part of the day");
}
