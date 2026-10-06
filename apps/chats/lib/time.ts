/**
 * SOMION HQ - TIME
 *
 * The clock is accelerable so a 90-minute Focus block can be shown in ten
 * seconds during the demo. This file is DISPOSABLE in the sense that the
 * acceleration goes away; the formatters stay.
 */

/* Formats in the reader's language (Chats wave, FS-CHT-3). The I18nProvider sets the locale on every
   render; Arabic keeps Latin digits (D-016). Dates and times are never hand-assembled. */
import { formatLocale, type Locale } from "@orgtik/ui";

let tag = "en";
const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat | Intl.RelativeTimeFormat>();
function fmt<T>(key: string, make: () => T): T {
  const k = `${tag}|${key}`;
  if (!cache.has(k)) cache.set(k, make() as never);
  return cache.get(k) as T;
}

export function setFormatLocale(locale: Locale): void {
  tag = formatLocale(locale);
}

const timeFmt = () => fmt("time", () => new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }));
const dayFmt = () => fmt("day", () => new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long" }));
const shortDayFmt = () => fmt("shortDay", () => new Intl.DateTimeFormat(tag, { weekday: "short", day: "numeric", month: "short" }));
const unit = (u: "minute" | "hour" | "day") =>
  fmt(`unit-${u}`, () => new Intl.NumberFormat(tag, { style: "unit", unit: u, unitDisplay: "short" }));
const relative = () => fmt("relative", () => new Intl.RelativeTimeFormat(tag, { numeric: "auto" }));

export const formatTime = (iso: string): string => timeFmt().format(new Date(iso));
export const formatDay = (iso: string): string => dayFmt().format(new Date(iso));
export const formatShortDay = (iso: string): string => shortDayFmt().format(new Date(iso));

/** "10:00–11:30", in the reader's own range style. */
export const formatRange = (startIso: string, endIso: string): string =>
  timeFmt().formatRange(new Date(startIso), new Date(endIso));

/** "now", "12 min", "2 hr", "yesterday", "Tue 3 Mar" - short enough for a dense list. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return relative().format(0, "second");
  if (min < 60) return unit("minute").format(min);
  const hours = Math.floor(min / 60);
  if (hours < 24) return unit("hour").format(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return relative().format(-1, "day");
  if (days < 7) return unit("day").format(days);
  return formatShortDay(iso);
}

/** Duration in a call or a huddle: 0:07, 12:41. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Decimal hours as people read them: 3.25 -> "3 hr, 15 min". */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return unit("minute").format(m);
  if (m === 0) return unit("hour").format(h);
  return `${unit("hour").format(h)} ${unit("minute").format(m)}`;
}

/** Short weekday name, Monday = 0. */
export function dayLabel(index: number): string {
  // 2024-01-01 was a Monday.
  return fmt("weekday", () => new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" })).format(new Date(Date.UTC(2024, 0, 1 + index)));
}

/** Minutes until an ISO timestamp; negative once it has passed. */
export const minutesUntil = (iso: string, now: Date = new Date()): number =>
  Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);

/* ------------------------------------------------------------ quiet hours */

/**
 * Whether a wall-clock window is currently open. The window normally wraps
 * midnight (19:00 to 08:00), so the comparison cannot be a simple range check -
 * getting this wrong means the setting silently does nothing all evening,
 * which is exactly when it is supposed to work.
 */
export function isWithinWindow(
  window: { from: string; to: string } | null,
  now: Date = new Date(),
): boolean {
  if (!window) return false;
  const toMinutes = (hhmm: string): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  };
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  if (from === null || to === null || from === to) return false;
  const at = now.getHours() * 60 + now.getMinutes();
  return from < to ? at >= from && at < to : at >= from || at < to;
}

/** When the open window closes, for telling someone how long they have. */
export function windowEndsAt(window: { from: string; to: string } | null): string {
  return window?.to ?? "";
}

/** The seven short weekday names, Monday first. */
export const dayLabels = (): string[] => Array.from({ length: 7 }, (_, i) => dayLabel(i));

/**
 * A date formatter in the reader's language, resolved when it formats: modules can hold one as a
 * constant (`const monthFmt = localeFormat({ month: "long", year: "numeric" })`) without fixing a
 * locale at import time.
 */
export const localeFormat = (opts: Intl.DateTimeFormatOptions) => {
  const key = `custom|${JSON.stringify(opts)}`;
  return { format: (d: Date | number) => fmt(key, () => new Intl.DateTimeFormat(tag, opts)).format(d) };
};

/** The tag to hand to Intl directly (Arabic with Latin digits). */
export const formatTag = (): string => tag;
