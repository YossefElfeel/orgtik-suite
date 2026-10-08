import type { WorkspaceContext } from "@orgtik/ui/auth";
import { parseDateTime, toZoned } from "@internationalized/date";

export type AvailabilityItem = {
  id: string;
  personId: number;
  personName: string;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  durationType: "full_day" | "half_day" | "partial";
  halfDayPeriod: "morning" | "afternoon" | null;
};
export type AvailabilityData = { workspaceId: string; timeZone: string; fromDate: string; toDate: string; items: AvailabilityItem[] };
export type AvailabilityRequest = { workspaceId: string; timeZone: string; fromDate: string; toDate: string; namespace: string; guest: boolean };

/** Map instants to workspace civil days, never the browser's local calendar. */
export function workspaceDayKey(value: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
export function zonedHour(value: string | Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  return Number(parts.find(p => p.type === "hour")?.value) + Number(parts.find(p => p.type === "minute")?.value) / 60;
}
/** Repeated times pick the earlier instant; missing DST wall times are rejected. */
export function workspaceStart(day: string, time: string, timeZone: string): Date {
  const local = parseDateTime(`${day}T${time}:00`);
  const zoned = toZoned(local, timeZone, "earlier");
  if (zoned.year !== local.year || zoned.month !== local.month || zoned.day !== local.day || zoned.hour !== local.hour || zoned.minute !== local.minute) throw new RangeError("missing_workspace_time");
  return zoned.toDate();
}

export function availabilityNamespace(context: WorkspaceContext | null | undefined): string {
  const tool = context?.tools.chat;
  return context ? JSON.stringify([context.realm, context.workspace.id, context.workspace.timeZone, context.actor.effectiveUserId, context.actor.readOnly, context.member.role, context.member.revision, context.member.accessEpoch, tool?.access, tool?.roles, tool?.canWrite]) : "";
}

function validDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

/** Copy only the calendar projection. No HR record fields enter the UI cache. */
export function validateAvailability(raw: unknown, expected: AvailabilityRequest): AvailabilityData | null {
  const data = raw as Partial<AvailabilityData> | null;
  if (!data || data.workspaceId !== expected.workspaceId || data.timeZone !== expected.timeZone || data.fromDate !== expected.fromDate || data.toDate !== expected.toDate || !Array.isArray(data.items) || (expected.guest && data.items.length)) return null;
  const items: AvailabilityItem[] = [];
  const seen = new Set<string>();
  for (const row of data.items) {
    if (!row || typeof row.id !== "string" || !row.id || seen.has(row.id) || !Number.isSafeInteger(row.personId) || row.personId <= 0 || typeof row.personName !== "string" || !row.personName.trim() || !validDay(row.startDate) || !validDay(row.endDate) || row.endDate < row.startDate || row.endDate < expected.fromDate || row.startDate > expected.toDate || typeof row.startAt !== "string" || typeof row.endAt !== "string" || !Number.isFinite(Date.parse(row.startAt)) || !Number.isFinite(Date.parse(row.endAt)) || Date.parse(row.endAt) <= Date.parse(row.startAt) || !["full_day", "half_day", "partial"].includes(row.durationType) || (row.durationType === "half_day" ? !["morning", "afternoon"].includes(row.halfDayPeriod ?? "") : row.halfDayPeriod !== null)) return null;
    seen.add(row.id);
    items.push({ id: row.id, personId: row.personId, personName: row.personName, startDate: row.startDate, endDate: row.endDate, startAt: row.startAt, endAt: row.endAt, durationType: row.durationType, halfDayPeriod: row.halfDayPeriod });
  }
  return { workspaceId: expected.workspaceId, timeZone: expected.timeZone, fromDate: expected.fromDate, toDate: expected.toDate, items };
}
