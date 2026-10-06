"use client";

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

import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, Plus, VideoCamera } from "@phosphor-icons/react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button, Panel } from "@/components/ui/Primitives";
import { MonthGrid, monthOf, sameMonth, shiftMonth, type YearMonth } from "@/components/ui/Calendar";
import { useRoom, useUsers } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { dayLabel, formatRange, formatTime, minutesUntil, localeFormat } from "@/lib/time";
import { addDays, fromKey, toKey, weekdayOf, type DateKey } from "@/lib/analytics";
import type { Meeting } from "@/entities";

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
  const today = toKey(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [day, setDay] = useState<DateKey>(today);
  const [month, setMonth] = useState<YearMonth>(monthOf(today));
  const [focusDay, setFocusDay] = useState<DateKey | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<DateKey, Meeting[]>();
    for (const m of meetings) {
      const k = toKey(new Date(m.startsAt));
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    for (const list of map.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return map;
  }, [meetings]);

  const marks = useMemo(() => Object.fromEntries([...byDay.entries()].map(([k, v]) => [k, v.length])), [byDay]);

  const weekStart = addDays(day, -weekdayOf(day));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToday = () => {
    setDay(today);
    setMonth(monthOf(today));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-0.5 p-0.5"
          style={{ background: "var(--color-surface-sunken)", borderRadius: "var(--radius-control)" }}
          role="group"
          aria-label={t("calendar.view", "Calendar view")}
        >
          {(["month", "week"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "secondary" : "ghost"}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              style={view === v ? { boxShadow: "var(--shadow-raise)" } : undefined}
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
            <span className="tabular px-1 text-[13px] font-semibold" style={{ color: "var(--color-ink)" }}>
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
              focusDay={focusDay}
              onFocusDay={setFocusDay}
              onMonthChange={setMonth}
              cell={44}
              label={t("calendar.monthGrid", "Meetings by day")}
            />
          </Panel>
          <DayList day={day} meetings={byDay.get(day) ?? []} today={today} onSchedule={() => onSchedule(day)} />
        </div>
      ) : (
        <WeekGrid days={weekDays} byDay={byDay} today={today} selected={day} onSelect={setDay} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the day */

function DayList({ day, meetings, today, onSchedule }: { day: DateKey; meetings: Meeting[]; today: DateKey; onSchedule: () => void }) {
  const t = useT();
  const title = dayFmt.format(fromKey(day));
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--color-ink)" }}>
          {title}
          {day === today && (
            <span className="ms-2 text-[12px] font-medium" style={{ color: "var(--color-ink-brand)" }}>
              {t("calendar.todayLabel", "today")}
            </span>
          )}
        </h2>
        <span className="tabular text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
          {meetings.length === 0
            ? t("calendar.free", "Nothing booked")
            : t("calendar.nBooked", "{n} booked", { n: meetings.length })}
        </span>
      </div>
      {meetings.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("calendar.freeBody", "A clear day. Most conversations here do not need a meeting.")}
          </p>
          <Button size="sm" className="mt-3" onClick={onSchedule}>
            {t("meetings.schedule", "Schedule")}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {meetings.map((m) => (
            <DayRow key={m.id} meeting={m} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DayRow({ meeting }: { meeting: Meeting }) {
  const room = useRoom(meeting.roomId ?? "");
  const users = useUsers();
  const t = useT();
  const people = meeting.participantIds.map((id) => users.find((u) => u.id === id)).filter((u): u is NonNullable<typeof u> => Boolean(u));
  const mins = minutesUntil(meeting.startsAt);
  const soon = !meeting.endedAt && mins <= 15 && mins > -60;
  const over = Boolean(meeting.endedAt) || new Date(meeting.endsAt).getTime() < Date.now();
  return (
    <li
      className="hq-row relative flex items-center gap-3 px-3 py-2"
      style={{
        borderRadius: "var(--radius-control)",
        borderInlineStart: `3px solid ${over ? "var(--color-paper-500)" : "var(--color-accent)"}`,
        background: "var(--color-surface-sunken)",
      }}
    >
      <span className="tabular w-[92px] shrink-0 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
        {formatRange(meeting.startsAt, meeting.endsAt)}
      </span>
      <Link href={`/hq/meetings/${meeting.id}`} className="min-w-0 flex-1 after:absolute after:inset-0 after:content-['']">
        <span className="block truncate text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
          <bdi>{meeting.title}</bdi>
        </span>
        {room && (
          <span className="block truncate text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
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
}: {
  days: DateKey[];
  byDay: Map<DateKey, Meeting[]>;
  today: DateKey;
  selected: DateKey;
  onSelect: (d: DateKey) => void;
}) {
  const t = useT();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
  const now = new Date();
  const nowY = ((now.getHours() + now.getMinutes() / 60 - FIRST_HOUR) / (LAST_HOUR - FIRST_HOUR + 1)) * (hours.length * ROW);

  return (
    <Panel className="overflow-x-auto">
      <div style={{ minWidth: 760 }}>
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, minmax(0, 1fr))` }}>
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
                className="hq-btn flex flex-col items-center py-1.5"
                style={{ borderRadius: "var(--radius-control)", color: "var(--color-ink)" }}
              >
                <span className="text-[10.5px] font-semibold uppercase" style={{ color: "var(--color-ink-subtle)", letterSpacing: "0.04em" }}>
                  {dayLabel(i)}
                </span>
                <span
                  className="tabular mt-0.5 inline-flex items-center justify-center text-[13px] font-semibold"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "var(--radius-chip)",
                    background: isToday ? "var(--color-accent)" : isSelected ? "var(--color-accent-soft)" : "transparent",
                    color: isToday ? "var(--color-ink-inverse)" : "var(--color-ink)",
                  }}
                >
                  {fromKey(d).getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative mt-1 grid" style={{ gridTemplateColumns: `52px repeat(7, minmax(0, 1fr))`, height: hours.length * ROW }}>
          {/* Hour rules and labels. */}
          {hours.map((h, i) => (
            <div key={h} className="absolute inset-x-0" style={{ top: i * ROW, height: ROW }}>
              <span className="tabular absolute -top-[7px] text-[10.5px]" style={{ left: 0, width: 44, textAlign: "end", color: "var(--color-ink-subtle)" }}>
                {String(h).padStart(2, "0")}:00
              </span>
              <span className="absolute" style={{ left: 52, right: 0, top: 0, borderTop: "1px solid var(--color-hairline)" }} />
            </div>
          ))}
          <span />
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            const isToday = d === today;
            return (
              <div
                key={d}
                className="relative"
                style={{
                  borderInlineStart: "1px solid var(--color-hairline)",
                  background: isToday ? "var(--color-accent-soft)" : "transparent",
                  opacity: isToday ? 0.999 : 1,
                }}
              >
                {isToday && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 z-10"
                    style={{ top: nowY, borderTop: "2px solid var(--color-ink-brand)" }}
                  />
                )}
                {list.map((m) => {
                  const s = new Date(m.startsAt);
                  const e = new Date(m.endsAt);
                  const startH = s.getHours() + s.getMinutes() / 60;
                  const endH = e.getHours() + e.getMinutes() / 60;
                  const top = Math.max(0, (startH - FIRST_HOUR) * ROW);
                  const height = Math.max(22, (endH - startH) * ROW - 2);
                  const over = Boolean(m.endedAt) || e.getTime() < Date.now();
                  return (
                    <Link
                      key={m.id}
                      href={`/hq/meetings/${m.id}`}
                      className="absolute inset-x-[3px] block overflow-hidden px-1.5 py-1"
                      title={`${m.title} · ${formatRange(m.startsAt, m.endsAt)}`}
                      style={{
                        top,
                        height,
                        borderRadius: 6,
                        background: over ? "var(--color-surface-sunken)" : "var(--color-brand-100)",
                        borderInlineStart: `3px solid ${over ? "var(--color-paper-500)" : "var(--color-accent)"}`,
                        color: "var(--color-ink)",
                      }}
                    >
                      <span className="block truncate text-[11.5px] font-semibold"><bdi>{m.title}</bdi></span>
                      {height >= 36 && (
                        <span className="tabular block truncate text-[10.5px]" style={{ color: "var(--color-ink-muted)" }}>
                          {formatTime(m.startsAt)}
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
      <p className="mt-2 text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
        {t("calendar.weekHint", "Working hours only, {a}:00 to {b}:00. Pick a day to schedule on it.", { a: FIRST_HOUR, b: LAST_HOUR + 1 })}
      </p>
    </Panel>
  );
}
