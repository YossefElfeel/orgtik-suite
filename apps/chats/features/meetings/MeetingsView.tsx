"use client";

/**
 * SOMION HQ - MEETINGS
 *
 * Upcoming and past, scheduling, meeting now, and the detail view with the
 * meeting link. A client meeting carries its CRM record, so afterwards the
 * recording and the notes sit on the client rather than in a folder nobody
 * opens.
 */

import { useRef, useState } from "react";
import { useClientSession } from "@orgtik/ui/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarBlank, Plus, VideoCamera } from "@phosphor-icons/react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button, Chip, EmptyState, Field, Panel, SectionHead } from "@/components/ui/Primitives";
import { ContextCard } from "@/features/chat/ContextCard";
import { PeoplePicker } from "@/features/chat/ChannelDialogs";
import { MeetingSummary } from "./MeetingSummary";
import { MeetingsCalendar } from "./MeetingsCalendar";
import { MeetingLinkRow, useLinkPolicy } from "./ShareMeeting";
import { addDays, type DateKey } from "@/lib/analytics";
import { workspaceDayKey, workspaceStart } from "@/lib/calendar-availability";
import { useCan, useMe, useMeetings, usePastMeetings, useRoom, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatRange, formatShortDay, formatTime, minutesUntil } from "@/lib/time";
import type { Meeting } from "@/entities";
import { useTitle } from "@/lib/useTitle";

export function MeetingsView() {
  const upcoming = useMeetings();
  const past = usePastMeetings();
  const [tab, setTab] = useState<"upcoming" | "past" | "calendar">("upcoming");
  const [scheduling, setScheduling] = useState(false);
  /* The day a schedule was started from, when it came from the calendar. */
  const [scheduleDate, setScheduleDate] = useState<DateKey | null>(null);
  const startInstantMeeting = useWorkspace((s) => s.startInstantMeeting);
  const me = useMe();
  const router = useRouter();
  const t = useT();

  /* Meet now skips the form: a meeting that starts this minute needs nothing
     but a way in, and the call hands out its link the moment it opens. One
     press is one meeting, however fast the second click comes. */
  const starting = useRef(false);
  const [pending, setPending] = useState(false);
  const meetNow = () => {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    const id = startInstantMeeting({
      title: t("meetings.instantTitle", "{name}'s meeting", { name: me.name.split(" ")[0] ?? me.name }),
    });
    router.push(`/hq/meetings/${id}/call`);
  };

  /* Soonest first, so a meeting started this minute sits at the top rather
     than wherever it happened to be added. */
  const list = tab === "past" ? past : [...upcoming].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const TABS: { id: "upcoming" | "past" | "calendar"; label: string }[] = [
    { id: "upcoming", label: t("meetings.upcoming", "Upcoming") },
    { id: "past", label: t("meetings.past", "Past") },
    { id: "calendar", label: t("meetings.calendar", "Calendar") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* On a phone the actions take a line of their own rather than
          crushing the title into the tabs. */}
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <h1 className="hq-title" style={{ color: "var(--color-ink)" }}>
            {t("meetings.title", "Meetings")}
          </h1>
          <div
            className="flex items-center gap-0.5 p-0.5"
            style={{ background: "var(--color-surface-sunken)", borderRadius: "var(--radius-control)" }}
            role="group"
          >
            {TABS.map((x) => (
              <Button
                key={x.id}
                size="sm"
                variant={tab === x.id ? "secondary" : "ghost"}
                onClick={() => setTab(x.id)}
                aria-pressed={tab === x.id}
                style={tab === x.id ? { boxShadow: "var(--shadow-raise)" } : undefined}
              >
                {x.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={meetNow} disabled={pending}>
            <VideoCamera size={13} weight="fill" aria-hidden="true" />
            {t("meetings.meetNow", "Meet now")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setScheduleDate(null);
              setScheduling(true);
            }}
          >
            <Plus size={13} weight="bold" aria-hidden="true" />
            {t("meetings.schedule", "Schedule")}
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto w-full px-4 py-4 ${tab === "calendar" ? "max-w-[1180px]" : "max-w-[760px]"}`}>
          {scheduling && <ScheduleForm date={scheduleDate} onClose={() => setScheduling(false)} />}

          {tab === "calendar" ? (
            <MeetingsCalendar
              meetings={[...upcoming, ...past]}
              onSchedule={(day) => {
                setScheduleDate(day);
                setScheduling(true);
              }}
            />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<CalendarBlank size={20} aria-hidden="true" />}
              title={
                tab === "upcoming"
                  ? t("meetings.noneTitle", "Nothing scheduled")
                  : t("meetings.noPastTitle", "No past meetings yet")
              }
              body={t(
                "meetings.noneBody",
                "Most conversations here do not need a meeting. Knock on someone instead.",
              )}
              action={
                tab === "upcoming" ? (
                  <Button variant="primary" size="sm" onClick={() => setScheduling(true)}>
                    {t("meetings.schedule", "Schedule")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((m) => (
                <MeetingRow key={m.id} meeting={m} past={tab === "past"} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingRow({ meeting, past }: { meeting: Meeting; past: boolean }) {
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const room = useRoom(meeting.roomId ?? "");
  const users = useUsers();
  const t = useT();

  const people = meeting.participantIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const mins = minutesUntil(meeting.startsAt);
  const soon = !past && mins <= 15 && mins > -60;
  const waiting = meeting.guests.filter((g) => g.state === "lobby");

  return (
    <li
      className="hq-row relative flex flex-col gap-2.5 px-3.5 py-3"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${soon ? "var(--color-accent)" : "var(--color-hairline)"}`,
        borderRadius: "var(--radius-card)",
      }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/hq/meetings/${meeting.id}`}
                className="min-w-0 after:absolute after:inset-0 after:content-['']"
              >
                <h3 className="truncate text-[14px] font-semibold" style={{ color: "var(--color-ink)" }}>
                  <bdi>{meeting.title}</bdi>
                </h3>
              </Link>
              {waiting.length > 0 && (
                <Chip tone="accent">
                  {t("meetings.guestWaiting", "{n} waiting", { n: waiting.length })}
                </Chip>
              )}
              {meeting.recordingState === "ready" && <Chip>{t("meetings.recorded", "Recorded")}</Chip>}
              {meeting.recurrence === "weekly" && <Chip>{t("meetings.weekly", "Weekly")}</Chip>}
            </div>
            <p className="tabular mt-0.5 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
              {past ? `${formatShortDay(meeting.startsAt, timeZone)} · ` : ""}
              {formatRange(meeting.startsAt, meeting.endsAt, timeZone)}
              {room && (<>{" · "}<bdi>{room.name}</bdi></>)}
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <AvatarStack people={people} size={20} max={3} />
            {soon ? (
              <Button variant="primary" size="sm" href={`/hq/meetings/${meeting.id}/call`}>
                <VideoCamera size={13} weight="fill" aria-hidden="true" />
                {t("meetings.join", "Join")}
                {/* Each Join says which meeting: a list of identical names is no list at all (CHT-038). */}
                <span className="sr-only"> <bdi>{meeting.title}</bdi></span>
              </Button>
            ) : (
              <Button size="sm" href={`/hq/meetings/${meeting.id}`}>
                {t("meetings.open", "Open")}
                <span className="sr-only"> <bdi>{meeting.title}</bdi></span>
              </Button>
            )}
          </div>
        </div>

        {meeting.contextRef && (
          <span className="relative z-10">
            <ContextCard object={meeting.contextRef} compact />
          </span>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- scheduling */

const DURATIONS = [30, 45, 60, 90] as const;

/**
 * Everything a meeting is: what, when, for how long, where, with whom, and
 * a line on why. Participants come from the directory and a guest from an
 * email; the room is one of the floor's. Nothing here is a placeholder.
 */
function ScheduleForm({ onClose, date }: { onClose: () => void; date: DateKey | null }) {
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const scheduleMeeting = useWorkspace((s) => s.scheduleMeeting);
  const me = useWorkspace((s) => s.me);
  const users = useUsers();
  const rooms = useWorkspace((s) => s.floor.rooms);
  const defaultMinutes = useWorkspace((s) => s.settings.meetingDefaultMinutes);
  const t = useT();

  const [title, setTitle] = useState("");
  const [day, setDay] = useState<DateKey>(date ?? workspaceDayKey(new Date(), timeZone));
  const [time, setTime] = useState("15:00");
  const [minutes, setMinutes] = useState<number>(defaultMinutes);
  const [roomId, setRoomId] = useState<string>(() => rooms.find((r) => r.kind === "meeting" || r.kind === "boardroom")?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [weekly, setWeekly] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bookable = rooms.filter((r) => r.kind !== "desk");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("meetings.titleRequired", "Give the meeting a title so people know what it is."));
      return;
    }
    let starts: Date[];
    try { starts = Array.from({ length: weekly ? 4 : 1 }, (_, index) => workspaceStart(addDays(day, index * 7), time, timeZone)); }
    catch { setError(t("availability.invalidTime", "This time does not exist in the workspace timezone. Choose another start time.")); return; }

    /* A weekly meeting is its next four occurrences, each a meeting of its
       own, so the calendar and the rooms see them without a rule engine. */
    const stamp = Date.now();
    for (let i = 0; i < starts.length; i++) {
      const s0 = starts[i]!;
      const e0 = new Date(s0.getTime() + minutes * 60_000);
      scheduleMeeting({
        id: `mt-${stamp}${weekly ? `-${i}` : ""}`,
        title: title.trim(),
        startsAt: s0.toISOString(),
        endsAt: e0.toISOString(),
        ...(roomId ? { roomId } : {}),
        participantIds: [me, ...picked.filter((id) => id !== me)],
        guests: guestEmail.trim()
          ? [{ name: guestEmail.split("@")[0] ?? "Guest", email: guestEmail.trim(), state: "invited" }]
          : [],
        recordingState: "none",
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(weekly ? { recurrence: "weekly" as const } : {}),
      });
    }
    onClose();
  };

  return (
    <Panel className="mb-4">
      <SectionHead title={t("meetings.newMeeting", "New meeting")} />
      <p className="mb-3 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>{t("availability.workspaceTime", "Times use the workspace timezone: {zone}", { zone: timeZone })}</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field
          label={t("meetings.titleLabel", "Title")}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder={t("meetings.titlePlaceholder", "What is this about?")}
          {...(error ? { error } : {})}
          autoFocus
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t("meetings.dateLabel", "Day")}
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
          />
          <Field
            label={t("meetings.timeLabel", "Start")}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <span className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t("meetings.durationLabel", "Length")}
            </span>
            <div className="flex gap-1" role="radiogroup" aria-label={t("meetings.durationLabel", "Length")}>
              {DURATIONS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={minutes === m}
                  variant={minutes === m ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => setMinutes(m)}
                >
                  <span className="tabular">{m}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t("meetings.roomLabel", "Room")}
            </span>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              aria-label={t("meetings.roomLabel", "Room")}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-hairline-strong)",
                borderRadius: "var(--radius-control)",
                padding: "8px 10px",
                fontSize: 13,
                minHeight: 36,
                color: "var(--color-ink)",
              }}
            >
              <option value="">{t("meetings.noRoom", "No room, a call only")}</option>
              {bookable.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {t("meetings.roomPlaces", "{n} places", { n: r.capacity })}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={t("meetings.guestLabel", "Guest email")}
            hint={t("meetings.guestHint", "They join from a link, with no account")}
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="name@company.ch"
          />
        </div>

        <PeoplePicker
          label={t("meetings.peopleLabel", "People")}
          hint={t("meetings.peopleHint", "From the directory. You are in it already.")}
          users={users}
          exclude={[me]}
          picked={picked}
          onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />

        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
            {t("meetings.descriptionLabel", "What is it for?")}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            aria-label={t("meetings.descriptionLabel", "What is it for?")}
            placeholder={t("meetings.descriptionPlaceholder", "A line for the people invited, and for the summary afterwards.")}
            className="w-full resize-none"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 10px",
              fontSize: 13,
              color: "var(--color-ink)",
            }}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-[12.5px]" style={{ color: "var(--color-ink)" }}>
          <input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--color-accent)" }} />
          {t("meetings.weeklyLabel", "Repeats weekly, for the next four weeks")}
        </label>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm">
            {t("meetings.create", "Schedule")}
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* ----------------------------------------------------------------- detail */

export function MeetingDetail({ meetingId }: { meetingId: string }) {
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const meeting = useWorkspace((s) =>
    s.meetings.find((m) => m.id === meetingId) ?? s.pastMeetings.find((m) => m.id === meetingId),
  );
  const room = useRoom(meeting?.roomId ?? "");
  useTitle(meeting?.title);
  const users = useUsers();
  const can = useCan();
  const linkPolicy = useLinkPolicy();
  const t = useT();

  if (!meeting) {
    return (
      <EmptyState
        title={t("meetings.gone", "This meeting is not here")}
        body={t("meetings.goneBody", "It may have been cancelled.")}
        action={
          <Button size="sm" href="/hq/meetings">
            {t("meetings.back", "Back to meetings")}
          </Button>
        }
      />
    );
  }

  const ended = Boolean(meeting.endedAt);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[760px] px-5 py-6">
        <Link href="/hq/meetings" className="text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
          {t("meetings.back", "Back to meetings")}
        </Link>

        <h1 className="hq-display mt-3" style={{ color: "var(--color-ink)" }}>
          <bdi>{meeting.title}</bdi>
        </h1>
        <p className="tabular mt-1 text-[13.5px]" style={{ color: "var(--color-ink-muted)" }}>
          {formatShortDay(meeting.startsAt, timeZone)} · {formatRange(meeting.startsAt, meeting.endsAt, timeZone)}
          {room && (<>{" · "}<bdi>{room.name}</bdi></>)}
        </p>
        {meeting.description && (
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink)", maxWidth: "62ch" }}>
            {meeting.description}
          </p>
        )}
        {meeting.recurrence === "weekly" && (
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("meetings.repeatsWeekly", "Repeats weekly. Each week is its own meeting, with its own notes.")}
          </p>
        )}

        {meeting.contextRef && (
          <div className="mt-4 max-w-[520px]">
            <ContextCard object={meeting.contextRef} />
          </div>
        )}

        <div className="mt-5">{ended && <MeetingSummary meeting={meeting} />}</div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!ended && (
          <Link
            href={`/hq/meetings/${meeting.id}/call`}
            className="hq-btn inline-flex items-center gap-1.5 px-3.5 text-[13.5px] font-medium"
            style={{
              minHeight: 36,
              background: "var(--color-accent)",
              color: "var(--color-ink-inverse)",
              borderRadius: "var(--radius-control)",
            }}
          >
            <VideoCamera size={14} weight="fill" aria-hidden="true" />
            {t("meetings.joinNow", "Join meeting")}
          </Link>
          )}
        </div>

        <section className="mt-6">
          <SectionHead title={t("meetings.people", "People")} />
          <ul className="flex flex-col gap-1.5">
            {meeting.participantIds.map((id) => {
              const u = users.find((x) => x.id === id);
              if (!u) return null;
              return (
                <li key={id} className="flex items-center gap-2.5">
                  <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                  <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                    <bdi>{u.name}</bdi>
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                    <bdi>{u.title}</bdi>
                  </span>
                </li>
              );
            })}
            {meeting.guests.map((g) => (
              <li key={g.email} className="flex items-center gap-2.5">
                <Avatar name={g.name} initials={g.name.slice(0, 2).toUpperCase()} tint={3} size={28} guest hideStatus />
                <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                  <bdi>{g.name}</bdi>
                </span>
                <Chip>{t("call.guest", "Guest")}</Chip>
                {g.company && (
                  <span className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                    <bdi>{g.company}</bdi>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Every meeting that is still to happen has a link, not only the ones
            a guest was invited to: whoever needs to be in it can be sent it. */}
        {!ended && can.inviteGuests && (
          <section className="mt-6">
            <SectionHead title={t("meetings.meetingLink", "Meeting link")} />
            <Panel>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)", maxWidth: "68ch" }}>
                {t("meetings.linkLead", "Send this link to anyone outside the workspace.")} {linkPolicy}{" "}
                {t("meetings.linkBranding", "The page carries your branding, never a third party's.")}
              </p>
              <div className="mt-2.5">
                <MeetingLinkRow meeting={meeting} preview />
              </div>
            </Panel>
          </section>
        )}

        {meeting.notes && (
          <section className="mt-6">
            <SectionHead title={t("meetings.notes", "Notes")} meta={formatTime(meeting.endsAt, timeZone)} />
            <Panel>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink)", maxWidth: "68ch" }}>
                {meeting.notes}
              </p>
            </Panel>
          </section>
        )}
      </div>
    </div>
  );
}
