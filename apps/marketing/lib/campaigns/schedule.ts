// Schedule rules checked before a step is saved (MKT-059): the end comes after the start, and a
// new start isn't in the past. The server only said "End date must be after the start date" in a
// toast after Next, with no field marked. A start that was already saved (a running campaign) may
// be in the past; only a changed one is checked.

export type ScheduleError = "required" | "past" | "beforeStart";

export function scheduleErrors(
  value: { startAt: string | null; endAt?: string | null },
  options: { savedStartAt?: string | null; requireStart?: boolean; requireEnd?: boolean } = {},
): { start?: ScheduleError; end?: ScheduleError } {
  const out: { start?: ScheduleError; end?: ScheduleError } = {};
  const start = value.startAt ? Date.parse(value.startAt) : NaN;
  const end = value.endAt ? Date.parse(value.endAt) : NaN;
  if (!value.startAt && options.requireStart) out.start = "required";
  else if (!Number.isNaN(start) && value.startAt !== options.savedStartAt && start < Date.now() - 60_000) out.start = "past";
  if (!value.endAt && options.requireEnd) out.end = "required";
  else if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) out.end = "beforeStart";
  return out;
}
