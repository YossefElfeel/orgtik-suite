import { csvCell } from "@orgtik/ui";
/**
 * SOMION HQ - ANALYTICS
 *
 * The shape of the numbers Insights shows, and the one function that makes
 * them from facts. In production the API returns an `Aggregate` for a range
 * and a cohort and this file keeps only the types and the date helpers; the
 * fact table it reads today is the disposable mock in `mock/analytics.ts`.
 *
 * Two rules are enforced here, in code, not in the UI:
 *
 *   1. An aggregate describes a cohort, never a person. The only way to get
 *      a single person's numbers is to ask for a cohort of one that is
 *      yourself, and the UI is the one that decides that.
 *   2. A cohort below the workspace minimum is not aggregated at all. With a
 *      group that small an average is a person.
 */

import type { Id } from "@/entities";
import { localeFormat } from "./time";

/* ------------------------------------------------------------------ facts */

/** One person, one day. Team numbers are sums of these, never the row. */
export interface DayFact {
  date: DateKey;
  userId: Id;
  /** Fraction of each hour the person was signed in and here, 24 entries. */
  present: number[];
  presentHours: number;
  focusHours: number;
  messages: number;
  messagesByChannel: Record<string, number>;
  threads: number;
  /** Threads started from a Business OS object - the product's whole point. */
  objectThreads: number;
  knocksReceived: number;
  knocksAnswered: number;
  /** Hours in rooms that are not meetings: focus, lounge, prayer. */
  roomHours: Record<string, number>;
  /** Mentions of this person that day, and how long the first reply took. */
  mentionsReceived: number;
  mentionReplyMinutes: number | null;
}

export interface MeetingFact {
  id: string;
  date: DateKey;
  startHour: number;
  hours: number;
  attendeeIds: Id[];
  roomId?: string;
  /** Clients who joined by link. */
  guests: number;
}

/* ------------------------------------------------------------------ dates */

/** A local calendar day as YYYY-MM-DD. Never a timestamp: a day is a day. */
export type DateKey = string;

export interface DateRange {
  from: DateKey;
  to: DateKey;
}

export type RangePreset = "7d" | "30d" | "90d" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";

export const toKey = (d: Date): DateKey =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromKey = (k: DateKey): Date => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (k: DateKey, n: number): DateKey => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

/** Inclusive count of days in a range. */
export const daysIn = (r: DateRange): number =>
  Math.round((fromKey(r.to).getTime() - fromKey(r.from).getTime()) / 864e5) + 1;

export const eachDay = (r: DateRange): DateKey[] => {
  const out: DateKey[] = [];
  for (let k = r.from; k <= r.to; k = addDays(k, 1)) out.push(k);
  return out;
};

/** Monday = 0 ... Sunday = 6, matching DAY_LABELS. */
export const weekdayOf = (k: DateKey): number => (fromKey(k).getDay() + 6) % 7;

export const isWorkday = (k: DateKey): boolean => weekdayOf(k) < 5;

export function presetRange(preset: RangePreset, today: DateKey): DateRange {
  const d = fromKey(today);
  switch (preset) {
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "thisWeek":
      return { from: addDays(today, -weekdayOf(today)), to: today };
    case "thisMonth":
      return { from: toKey(new Date(d.getFullYear(), d.getMonth(), 1)), to: today };
    case "lastMonth": {
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const last = new Date(d.getFullYear(), d.getMonth(), 0);
      return { from: toKey(first), to: toKey(last) };
    }
    default:
      return { from: addDays(today, -29), to: today };
  }
}

/** The same length of time, ending the day before this range starts. */
export function previousRange(r: DateRange): DateRange {
  const n = daysIn(r);
  const to = addDays(r.from, -1);
  return { from: addDays(to, -(n - 1)), to };
}

const dayMonth = localeFormat({ day: "numeric", month: "short" });
const dayMonthYear = localeFormat({ day: "numeric", month: "short", year: "numeric" });

export function formatRangeLabel(r: DateRange): string {
  const a = fromKey(r.from);
  const b = fromKey(r.to);
  if (r.from === r.to) return dayMonthYear.format(a);
  const sameYear = a.getFullYear() === b.getFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(a)} – ${dayMonthYear.format(b)}`;
}

export const isoWeek = (k: DateKey): { year: number; week: number } => {
  const d = fromKey(k);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - yearStart) / 864e5 + 1) / 7) };
};

/* -------------------------------------------------------------- aggregate */

export interface DailyRow {
  date: DateKey;
  activePeople: number;
  presentHours: number;
  meetingHours: number;
  meetingCount: number;
  focusHours: number;
  messages: number;
}

export type SizeBand = "2" | "3-4" | "5-8" | "9+";
export type LengthBand = "15" | "30" | "45" | "60" | "90+";

export interface Aggregate {
  range: DateRange;
  days: number;
  workdays: number;
  people: number;
  activePeople: number;
  presentHours: number;
  /** Sum of meeting durations: the calendar cost. */
  meetingHours: number;
  /** Sum of durations times attendees in the cohort: the people cost. */
  meetingPersonHours: number;
  meetingCount: number;
  avgMeetingHours: number;
  /** Share of time here that was spent in meetings. */
  meetingShare: number;
  focusHours: number;
  focusShare: number;
  messages: number;
  threads: number;
  objectThreads: number;
  objectShare: number;
  knocksReceived: number;
  knocksAnswered: number;
  answerRate: number;
  /** Typical minutes from a mention to its first reply, weighted by mentions. */
  mentionsReceived: number;
  mentionReplyMinutes: number | null;
  /** Adoption: conversations that saw a message, and clients who joined. */
  activeChannels: number;
  guestVisits: number;
  daily: DailyRow[];
  /** Average headcount, [weekday][hour]. Team totals only. */
  heat: number[][];
  byWeekday: { presentHours: number[]; meetingHours: number[] };
  rooms: { roomId: string; hours: number }[];
  roomCapacityHours: number;
  sizes: { band: SizeBand; count: number; hours: number }[];
  lengths: { band: LengthBand; count: number; hours: number }[];
  channels: { channelId: string; messages: number }[];
  peak: { day: number; hour: number; headcount: number };
}

const sizeBand = (n: number): SizeBand => (n <= 2 ? "2" : n <= 4 ? "3-4" : n <= 8 ? "5-8" : "9+");
const lengthBand = (h: number): LengthBand =>
  h <= 0.25 ? "15" : h <= 0.5 ? "30" : h <= 0.75 ? "45" : h <= 1 ? "60" : "90+";

export function aggregate(
  facts: DayFact[],
  meetings: MeetingFact[],
  range: DateRange,
  cohort: Id[],
  rooms: { id: string; kind: string; capacity: number }[],
): Aggregate {
  const inCohort = new Set(cohort);
  const days = eachDay(range);
  const daySet = new Set(days);
  const rows = facts.filter((f) => daySet.has(f.date) && inCohort.has(f.userId));
  const met = meetings.filter((m) => daySet.has(m.date) && m.attendeeIds.some((a) => inCohort.has(a)));

  const dailyMap = new Map<DateKey, DailyRow>();
  for (const d of days) {
    dailyMap.set(d, { date: d, activePeople: 0, presentHours: 0, meetingHours: 0, meetingCount: 0, focusHours: 0, messages: 0 });
  }

  const heat: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  for (const d of days) weekdayCounts[weekdayOf(d)] = (weekdayCounts[weekdayOf(d)] ?? 0) + 1;

  const byWeekday = { presentHours: Array.from({ length: 7 }, () => 0), meetingHours: Array.from({ length: 7 }, () => 0) };
  const roomHours = new Map<string, number>();
  const channelMsgs = new Map<string, number>();
  const active = new Set<Id>();

  let presentHours = 0;
  let focusHours = 0;
  let messages = 0;
  let threads = 0;
  let objectThreads = 0;
  let knocksReceived = 0;
  let knocksAnswered = 0;
  let mentions = 0;
  let mentionMinutes = 0;

  for (const f of rows) {
    const row = dailyMap.get(f.date);
    if (!row) continue;
    if (f.presentHours > 0) {
      row.activePeople += 1;
      active.add(f.userId);
    }
    row.presentHours += f.presentHours;
    row.focusHours += f.focusHours;
    row.messages += f.messages;
    presentHours += f.presentHours;
    focusHours += f.focusHours;
    messages += f.messages;
    threads += f.threads;
    objectThreads += f.objectThreads;
    knocksReceived += f.knocksReceived;
    knocksAnswered += f.knocksAnswered;
    if (f.mentionReplyMinutes !== null && f.mentionsReceived > 0) {
      mentions += f.mentionsReceived;
      mentionMinutes += f.mentionReplyMinutes * f.mentionsReceived;
    }
    const wd = weekdayOf(f.date);
    byWeekday.presentHours[wd] = (byWeekday.presentHours[wd] ?? 0) + f.presentHours;
    const heatRow = heat[wd];
    if (heatRow) f.present.forEach((v, h) => (heatRow[h] = (heatRow[h] ?? 0) + v));
    for (const [roomId, h] of Object.entries(f.roomHours)) roomHours.set(roomId, (roomHours.get(roomId) ?? 0) + h);
    for (const [ch, n] of Object.entries(f.messagesByChannel)) channelMsgs.set(ch, (channelMsgs.get(ch) ?? 0) + n);
  }

  let meetingHours = 0;
  let meetingPersonHours = 0;
  let guestVisits = 0;
  const sizes = new Map<SizeBand, { count: number; hours: number }>();
  const lengths = new Map<LengthBand, { count: number; hours: number }>();
  for (const m of met) {
    const row = dailyMap.get(m.date);
    if (row) {
      row.meetingHours += m.hours;
      row.meetingCount += 1;
    }
    meetingHours += m.hours;
    guestVisits += m.guests;
    const here = m.attendeeIds.filter((a) => inCohort.has(a)).length;
    meetingPersonHours += m.hours * here;
    const wd = weekdayOf(m.date);
    byWeekday.meetingHours[wd] = (byWeekday.meetingHours[wd] ?? 0) + m.hours;
    if (m.roomId) roomHours.set(m.roomId, (roomHours.get(m.roomId) ?? 0) + m.hours);
    const sb = sizeBand(m.attendeeIds.length);
    const s = sizes.get(sb) ?? { count: 0, hours: 0 };
    sizes.set(sb, { count: s.count + 1, hours: s.hours + m.hours });
    const lb = lengthBand(m.hours);
    const l = lengths.get(lb) ?? { count: 0, hours: 0 };
    lengths.set(lb, { count: l.count + 1, hours: l.hours + m.hours });
  }

  /* Average headcount per weekday-hour: sums divided by how many of that
     weekday the range holds, so a 90-day view is comparable to a 7-day one. */
  heat.forEach((row, wd) => {
    const n = weekdayCounts[wd] ?? 0;
    row.forEach((v, h) => (row[h] = n > 0 ? v / n : 0));
  });
  let peak = { day: 0, hour: 0, headcount: 0 };
  heat.forEach((row, day) =>
    row.forEach((v, hour) => {
      if (v > peak.headcount) peak = { day, hour, headcount: v };
    }),
  );

  const workdays = days.filter(isWorkday).length;
  const bookable = rooms.filter((r) => r.kind !== "desk");
  const roomCapacityHours = bookable.length * 10 * workdays;

  const order: SizeBand[] = ["2", "3-4", "5-8", "9+"];
  const lorder: LengthBand[] = ["15", "30", "45", "60", "90+"];

  return {
    range,
    days: days.length,
    workdays,
    people: cohort.length,
    activePeople: active.size,
    presentHours,
    meetingHours,
    meetingPersonHours,
    meetingCount: met.length,
    avgMeetingHours: met.length ? meetingHours / met.length : 0,
    meetingShare: presentHours > 0 ? meetingPersonHours / presentHours : 0,
    focusHours,
    focusShare: presentHours > 0 ? focusHours / presentHours : 0,
    messages,
    threads,
    objectThreads,
    objectShare: threads > 0 ? objectThreads / threads : 0,
    knocksReceived,
    knocksAnswered,
    answerRate: knocksReceived > 0 ? knocksAnswered / knocksReceived : 0,
    mentionsReceived: mentions,
    mentionReplyMinutes: mentions > 0 ? mentionMinutes / mentions : null,
    activeChannels: [...channelMsgs.keys()].filter((k) => k !== "dm").length,
    guestVisits,
    daily: days.map((d) => dailyMap.get(d)!),
    heat,
    byWeekday,
    rooms: [...roomHours.entries()].map(([roomId, hours]) => ({ roomId, hours })).sort((a, b) => b.hours - a.hours),
    roomCapacityHours,
    sizes: order.map((band) => ({ band, ...(sizes.get(band) ?? { count: 0, hours: 0 }) })),
    lengths: lorder.map((band) => ({ band, ...(lengths.get(band) ?? { count: 0, hours: 0 }) })),
    channels: [...channelMsgs.entries()].map(([channelId, n]) => ({ channelId, messages: n })).sort((a, b) => b.messages - a.messages),
    peak,
  };
}

/* ---------------------------------------------------------------- buckets */

export interface Bucket {
  key: string;
  label: string;
  presentHours: number;
  meetingHours: number;
  meetingCount: number;
  focusHours: number;
  messages: number;
}

/**
 * Daily rows up to about six weeks; weekly beyond that. Ninety daily points
 * on a 600px chart is a texture, not a series.
 */
export function bucketize(daily: DailyRow[]): { mode: "day" | "week"; buckets: Bucket[] } {
  const mode: "day" | "week" = daily.length > 45 ? "week" : "day";
  const map = new Map<string, Bucket>();
  for (const row of daily) {
    const key = mode === "day" ? row.date : (() => {
      const w = isoWeek(row.date);
      return `${w.year}-W${String(w.week).padStart(2, "0")}`;
    })();
    const label = mode === "day" ? dayMonth.format(fromKey(row.date)) : `W${key.split("-W")[1] ?? ""}`;
    const b = map.get(key) ?? { key, label, presentHours: 0, meetingHours: 0, meetingCount: 0, focusHours: 0, messages: 0 };
    b.presentHours += row.presentHours;
    b.meetingHours += row.meetingHours;
    b.meetingCount += row.meetingCount;
    b.focusHours += row.focusHours;
    b.messages += row.messages;
    map.set(key, b);
  }
  return { mode, buckets: [...map.values()] };
}

/* -------------------------------------------------------------------- csv */

/** Team rows only: the export carries exactly what the table shows. */
export function toCsv(daily: DailyRow[]): string {
  const head = ["date", "people_here", "hours_here", "meetings", "meeting_hours", "focus_hours", "messages"];
  const lines = daily.map((r) =>
    [r.date, r.activePeople, r.presentHours.toFixed(2), r.meetingCount, r.meetingHours.toFixed(2), r.focusHours.toFixed(2), r.messages].map(csvCell).join(","),
  );
  return [head.map(csvCell).join(","), ...lines].join("\r\n");
}
