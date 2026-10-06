// Projects made before the sections had names kept the default ones as codes ("IN_PROGRESS",
// "TODO"). Those read as the status they stand for, in the reader's language; any other name is
// shown exactly as its project manager wrote it.
const CODES: Record<string, "backlog" | "todo" | "in_progress" | "in_review" | "done"> = {
  BACKLOG: "backlog",
  TODO: "todo",
  TO_DO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

export function sectionTitle(title: string, statusLabel: (entity: "task", state: "todo") => string): string {
  const code = CODES[title.trim().toUpperCase().replace(/\s+/g, "_")];
  return code && /^[A-Z_ ]+$/.test(title.trim()) ? statusLabel("task", code as "todo") : title;
}
