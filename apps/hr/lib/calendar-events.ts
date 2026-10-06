import type { Tone } from "@orgtik/ui";
import type { CalendarDays, HrCalendarEvent, ICalendarEvent } from "@/types/calendar";

// The calendar API lists each event under every day it touches: a three-day leave comes three
// times. The grid wants each event once, with its first and last day (FS-HR-4).
const TONE: Record<ICalendarEvent["type"], Tone> = {
  meeting: "info",
  timeOff: "brand",
  task: "warning",
  publicHoliday: "success",
};

export function toCalendarEvents(days: CalendarDays): HrCalendarEvent[] {
  const seen = new Map<string, HrCalendarEvent>();
  for (const list of Object.values(days)) {
    for (const event of list) {
      const id = `${event.type}-${event.id}`;
      if (seen.has(id)) continue;
      const span = event.type === "timeOff" ? { start: event.startDate, end: event.endDate } : { start: event.date };
      seen.set(id, { id, title: event.title, tone: TONE[event.type] ?? "neutral", source: event, ...span });
    }
  }
  return [...seen.values()];
}
