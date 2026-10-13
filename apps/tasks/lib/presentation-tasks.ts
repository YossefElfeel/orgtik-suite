import { csvCell } from "@orgtik/ui";
/** Client-only presentation adapter. Nothing here writes to the existing Tasks API. */
export type PresentationTask = {
  id: string; title: string; status: "todo" | "doing" | "done";
  owner: string; label: string; due: string; recurrence: "none" | "weekly" | "monthly";
  watchers: string[]; reminder: boolean;
  fileRefs?: { id: string; name: string; workspace: string; version: number; source: string; versions?: { version: number; source: string }[] }[];
  priority?: "low" | "normal" | "high" | "urgent";
};
export const PRESENTATION_PEOPLE = ["Nour Khaled", "Rana Saad", "Omar Farouk", "Salma Nabil", "Mona Adel", "Hoda Ashraf", "Hany Samir"];
export type PresentationTemplate = { id: string; titleKey?: string; name?: string; task: Partial<PresentationTask> };
export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  { id: "onboarding", titleKey: "templateTitle", task: { label: "people", recurrence: "weekly", watchers: [PRESENTATION_PEOPLE[1]], reminder: true } },
  { id: "launch", titleKey: "launchTemplate", task: { label: "launch", due: "2026-10-12", watchers: [PRESENTATION_PEOPLE[2]], reminder: true } },
  { id: "review", titleKey: "reviewTemplate", task: { label: "operations", recurrence: "monthly", due: "2026-10-15", watchers: [PRESENTATION_PEOPLE[0]], reminder: true } },
];
export function seedPresentationTasks(workspace: string): PresentationTask[] {
  if (workspace === "new") return [];
  const prefix = workspace === "orgtik" ? "OrgTik launch" : workspace === "spree" ? "Spree renewal" : "Nile Foods launch";
  return [
    { id: "demo-1", title: `${prefix}: approve product brief`, status: "doing", owner: PRESENTATION_PEOPLE[0], label: "launch", due: "2026-10-09", recurrence: "none", watchers: [PRESENTATION_PEOPLE[1]], reminder: true },
    { id: "demo-2", title: "Review campaign artwork", status: "todo", owner: PRESENTATION_PEOPLE[2], label: "design", due: "2026-10-06", recurrence: "none", watchers: [], reminder: false },
    { id: "demo-3", title: "Weekly delivery review", status: "todo", owner: PRESENTATION_PEOPLE[3], label: "operations", due: "2026-10-12", recurrence: "weekly", watchers: [PRESENTATION_PEOPLE[0]], reminder: true },
    { id: "demo-4", title: "Prepare onboarding checklist", status: "done", owner: PRESENTATION_PEOPLE[1], label: "people", due: "2026-10-07", recurrence: "monthly", watchers: [], reminder: false },
  ];
}
export function newPresentationTask(title: string, owner = PRESENTATION_PEOPLE[0]): PresentationTask {
  return { id: `demo-${crypto.randomUUID()}`, title: title.trim(), status: "todo", owner, label: "", due: "", recurrence: "none", watchers: [], reminder: false };
}
export function nextPresentationDue(due: string, recurrence: PresentationTask["recurrence"]): string {
  const date = new Date(`${due || "2026-10-08"}T12:00:00Z`);
  if (recurrence === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  else if (recurrence === "monthly") {
    const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }
  return date.toISOString().slice(0, 10);
}
// RFC4180 fields including escaped quotes and newlines. A small bounded text import, not binary upload.
export { parseTaskCsv as parsePresentationCsv } from "./task-csv";

export function presentationCsv(tasks: PresentationTask[]): string {
  // Spreadsheet apps treat these prefixes as formulas even in quoted fields.
  const cell = csvCell;
  return [["title", "owner", "status", "label", "due", "recurrence"], ...tasks.map(t => [t.title, t.owner, t.status, t.label, t.due, t.recurrence])].map(row => row.map(cell).join(",")).join("\r\n");
}
