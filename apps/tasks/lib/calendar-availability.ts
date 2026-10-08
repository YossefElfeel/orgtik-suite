import type { WorkspaceContext } from "@orgtik/ui/auth";

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

export function availabilityNamespace(context: WorkspaceContext | null | undefined): string {
  const tool = context?.tools.tasks;
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
