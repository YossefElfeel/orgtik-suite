// Due dates are days, not instants (FS-TASKS-8, TASKS-052). The API stores an instant (5 pm on the
// day), and each screen used to read its day in the viewer's own time zone, so a task due on the 3rd
// showed on the 2nd or the 4th elsewhere. Now the day is read once, in the organisation's time
// zone, and every screen shows that same day.

/** The organisation's time zone. One setting for now; the workspace will carry it later. */
export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";

/** "YYYY-MM-DD" of a due date, in the organisation's time zone. */
export function dueDayKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: ORG_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

/**
 * The due day as a Date at midnight UTC: format it with `timeZone: "UTC"` and every viewer sees the
 * same calendar day.
 */
export function dueDay(value: string | Date): Date {
  return new Date(`${dueDayKey(value)}T00:00:00Z`);
}

/** Today in the organisation's time zone, as "YYYY-MM-DD" (for overdue and "due today"). */
export function todayKey(now: Date = new Date()): string {
  return dueDayKey(now);
}

/** Whole days from today to the due day: negative when overdue, 0 when due today. */
export function daysUntil(value: string | Date, now: Date = new Date()): number {
  return Math.round((dueDay(value).getTime() - dueDay(todayKey(now)).getTime()) / 86_400_000);
}
