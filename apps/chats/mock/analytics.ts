/**
 * SOMION HQ - ANALYTICS FACTS (mock, disposable)
 *
 * A deterministic daily fact table for the last 120 days, so Insights has
 * something real to aggregate over any range and any cohort. The same seed
 * gives the same numbers every run: nothing narrated in a demo is random.
 *
 * Nothing here is shown as a row. The store never holds it; `lib/analytics`
 * sums it into team numbers and that is the only way out. In production the
 * API returns those sums and this file is deleted.
 *
 * The shape is deliberately uneven: a summer dip, a person away for a week,
 * a Friday that thins out after lunch, a director who lives in meetings and
 * an engineer who mostly does not. Tidy data reads as fake.
 */

import { DEMO_EPOCH, channels, floor, users } from "./seed";
import { addDays, isWorkday, toKey, weekdayOf, type DayFact, type MeetingFact } from "@/lib/analytics";

const DAYS = 120;

/* A small deterministic generator. Not for anything but this. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260907);
const between = (a: number, b: number): number => a + (b - a) * rnd();
const chance = (p: number): boolean => rnd() < p;
const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)] as T;
const round2 = (n: number): number => Math.round(n * 4) / 4;

interface Profile {
  start: number;
  end: number;
  meetingLoad: number;
  focus: number;
  chat: number;
  objectShare: number;
  shift: number;
}

/** What a role's day looks like. Titles come from the seed's directory. */
function profileFor(title: string, timezone: string): Profile {
  const shift = timezone === "Europe/Lisbon" ? -1 : 0;
  const base: Profile = { start: 8.5, end: 17.5, meetingLoad: 0.15, focus: 0.2, chat: 20, objectShare: 0.3, shift };
  if (/Managing/.test(title)) return { ...base, start: 8, end: 18, meetingLoad: 0.45, focus: 0.05, chat: 14, objectShare: 0.2 };
  if (/Lead/.test(title)) return { ...base, meetingLoad: 0.3, focus: 0.15, chat: 26, objectShare: 0.35 };
  if (/Engineer/.test(title)) return { ...base, start: 9, end: 18, meetingLoad: 0.12, focus: 0.32, chat: 18, objectShare: 0.4 };
  if (/Product/.test(title)) return { ...base, meetingLoad: 0.35, focus: 0.1, chat: 40, objectShare: 0.45 };
  if (/Designer/.test(title)) return { ...base, meetingLoad: 0.2, focus: 0.28, chat: 22, objectShare: 0.35 };
  if (/Account/.test(title)) return { ...base, meetingLoad: 0.3, focus: 0.08, chat: 30, objectShare: 0.5 };
  if (/Support/.test(title)) return { ...base, start: 8, end: 17, meetingLoad: 0.08, focus: 0.12, chat: 36, objectShare: 0.55 };
  if (/Marketing/.test(title)) return { ...base, meetingLoad: 0.18, focus: 0.18, chat: 28, objectShare: 0.25 };
  if (/Finance/.test(title)) return { ...base, meetingLoad: 0.14, focus: 0.3, chat: 12, objectShare: 0.45 };
  return base;
}

const today = toKey(DEMO_EPOCH);
const firstDay = addDays(today, -(DAYS - 1));

const publicChannels = channels.filter((c) => c.kind !== "dm" && c.kind !== "group" && !c.archived).map((c) => c.id);
const meetingRooms = floor.rooms.filter((r) => r.kind === "meeting" || r.kind === "boardroom").map((r) => r.id);
const focusRooms = floor.rooms.filter((r) => r.kind === "focus").map((r) => r.id);
const breakRooms = floor.rooms.filter((r) => r.kind === "lounge").map((r) => r.id);
const prayerRooms = floor.rooms.filter((r) => r.kind === "prayer").map((r) => r.id);

/** How heavy the calendar is on a given day: a summer dip, then September. */
function season(index: number): number {
  const phase = (index / DAYS) * Math.PI * 2;
  return 1 + 0.22 * Math.sin(phase - Math.PI / 2) + (index / DAYS) * 0.12;
}

/* One week off per person, staggered, plus the national holiday. */
const away = new Map<string, Set<string>>();
users.forEach((u, i) => {
  const start = addDays(firstDay, 10 + i * 9);
  const set = new Set<string>();
  for (let k = 0; k < 7; k++) set.add(addDays(start, k));
  away.set(u.id, set);
});
const holiday = new Set<string>([`${DEMO_EPOCH.getFullYear()}-08-01`]);

/**
 * Built on first use, not at import. Every page imports the store's hooks,
 * and only Insights needs a hundred and twenty days of facts; the rest
 * should not pay for them at startup.
 */
let cache: { dayFacts: DayFact[]; meetingFacts: MeetingFact[] } | null = null;

export function getFacts(): { dayFacts: DayFact[]; meetingFacts: MeetingFact[] } {
  if (cache) return cache;
  const dayFacts: DayFact[] = [];
  const meetingFacts: MeetingFact[] = [];

for (let i = 0; i < DAYS; i++) {
  const date = addDays(firstDay, i);
  const workday = isWorkday(date) && !holiday.has(date);
  const wd = weekdayOf(date);
  const heavy = season(i);
  const presentToday: { id: string; start: number; end: number; p: Profile }[] = [];

  for (const u of users) {
    const p = profileFor(u.title, u.timezone);
    const off = away.get(u.id)?.has(date) ?? false;
    const present = workday ? !off && chance(0.9) : chance(0.06);
    const record: DayFact = {
      date,
      userId: u.id,
      present: Array.from({ length: 24 }, () => 0),
      presentHours: 0,
      focusHours: 0,
      messages: 0,
      messagesByChannel: {},
      threads: 0,
      objectThreads: 0,
      knocksReceived: 0,
      knocksAnswered: 0,
      roomHours: {},
      mentionsReceived: 0,
      mentionReplyMinutes: null,
    };
    if (present) {
      const start = p.start + p.shift + between(-0.75, 0.75);
      /* Fridays thin out after lunch; weekends are a couple of hours. */
      const end = workday ? p.end + p.shift + between(-0.75, 0.5) - (wd === 4 ? between(0.5, 2) : 0) : start + between(1, 3);
      for (let h = 0; h < 24; h++) {
        const from = Math.max(h, start);
        const to = Math.min(h + 1, end);
        let v = Math.max(0, to - from);
        if (h === 12) v *= 0.4; /* lunch */
        record.present[h] = Math.round(v * 100) / 100;
      }
      record.presentHours = round2(record.present.reduce((a, b) => a + b, 0));
      presentToday.push({ id: u.id, start, end, p });
    }
    dayFacts.push(record);
  }

  /* Meetings: how many depends on the season and who is around. */
  if (workday && presentToday.length >= 2) {
    const count = Math.round(between(3, 8) * heavy * (wd === 4 ? 0.6 : 1));
    for (let m = 0; m < count; m++) {
      const organiser = presentToday.reduce((best, x) => (rnd() < x.p.meetingLoad * 1.6 ? x : best), pick(presentToday));
      const r = rnd();
      const size = r < 0.36 ? 2 : r < 0.7 ? 2 + Math.ceil(between(1, 2)) : r < 0.92 ? 4 + Math.ceil(between(1, 4)) : 8 + Math.ceil(between(1, 4));
      const others = presentToday
        .filter((x) => x.id !== organiser.id)
        .sort(() => rnd() - 0.5)
        .slice(0, Math.min(size - 1, presentToday.length - 1));
      const attendeeIds = [organiser.id, ...others.map((o) => o.id)];
      const hours =
        size <= 2 ? pick([0.25, 0.5, 0.5, 0.75]) : size <= 4 ? pick([0.5, 0.5, 0.75, 1]) : size <= 8 ? pick([0.5, 1, 1, 1.5]) : pick([1, 1, 1.5]);
      const startHour = Math.floor(between(9, 16.5));
      const roomId = chance(0.65) && meetingRooms.length ? pick(meetingRooms) : undefined;
      /* Client calls bring a guest or two; the account manager's and the
         director's meetings most often. */
      const guests = chance(0.1 + organiser.p.meetingLoad * 0.35) ? Math.ceil(between(1, 2)) : 0;
      const fact: MeetingFact = { id: `m-${date}-${m}`, date, startHour, hours, attendeeIds, guests };
      if (roomId) fact.roomId = roomId;
      meetingFacts.push(fact);
    }
  }

  /* The rest of the day for everyone who was here. */
  const meetingsToday = meetingFacts.filter((m) => m.date === date);
  for (const x of presentToday) {
    const rec = dayFacts.find((f) => f.date === date && f.userId === x.id);
    if (!rec) continue;
    const personMeeting = meetingsToday.filter((m) => m.attendeeIds.includes(x.id)).reduce((a, m) => a + m.hours, 0);
    const free = Math.max(0, rec.presentHours - personMeeting);
    rec.focusHours = round2(free * x.p.focus * between(0.7, 1.4));
    if (rec.focusHours > 0 && focusRooms.length) {
      const room = pick(focusRooms);
      rec.roomHours[room] = round2(rec.focusHours * (chance(0.6) ? 1 : 0.5));
    }
    if (breakRooms.length && chance(0.7)) rec.roomHours[pick(breakRooms)] = pick([0.25, 0.5, 0.5, 0.75]);
    if (prayerRooms.length && chance(0.18)) rec.roomHours[pick(prayerRooms)] = 0.25;

    const msgs = Math.round(x.p.chat * (rec.presentHours / 8) * between(0.5, 1.5));
    rec.messages = msgs;
    let left = msgs;
    const dm = Math.round(msgs * between(0.2, 0.4));
    rec.messagesByChannel["dm"] = dm;
    left -= dm;
    publicChannels.forEach((ch, idx) => {
      if (left <= 0) return;
      const weight = idx === 0 ? 0.3 : idx === 1 ? 0.25 : 0.45 / Math.max(1, publicChannels.length - 2);
      const n = Math.min(left, Math.round(msgs * weight * between(0.4, 1.3)));
      if (n > 0) rec.messagesByChannel[ch] = n;
      left -= n;
    });
    rec.threads = Math.round(msgs / between(6, 10));
    rec.objectThreads = Math.round(rec.threads * x.p.objectShare * between(0.7, 1.3));
    rec.knocksReceived = Math.round(between(0, 3));
    rec.knocksAnswered = Math.round(rec.knocksReceived * between(0.6, 1));
    /* Mentions arrive in proportion to how much someone is talked to, and
       the reply takes longer for people whose day is mostly focus. */
    rec.mentionsReceived = Math.round(between(0, 2.4) * (x.p.chat / 24));
    rec.mentionReplyMinutes = rec.mentionsReceived > 0 ? Math.round(between(4, 70) * (1 + x.p.focus)) : null;
  }
}

  cache = { dayFacts, meetingFacts };
  return cache;
}

export const FACTS_FROM = firstDay;
export const FACTS_TO = today;
