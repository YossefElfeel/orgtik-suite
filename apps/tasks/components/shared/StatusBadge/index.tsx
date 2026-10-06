"use client";
import { useTranslations } from "next-intl";
import { Badge, StatusBadge as LibraryStatusBadge } from "@orgtik/ui";

export type TaskStatus = "todo" | "in_progress" | "completed" | "on_hold" | "cancelled" | "backlog" | "in_review" | "done";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

const MATRIX = new Set(["backlog", "todo", "in_progress", "in_review", "done"]);

/** A task's status from the status matrix (label, tone and icon in the reader's language). */
function StatusBadge({ status, size = "md", className }: { status: TaskStatus; size?: BadgeSize; className?: string }) {
  const t = useTranslations("TaskStatus");
  const badgeSize = size === "md" || size === "lg" ? "md" : "sm";
  const state = status === "completed" ? "done" : status;
  if (MATRIX.has(state)) return <LibraryStatusBadge entity="task" state={state as "todo"} size={badgeSize} className={className} />;
  if (state === "on_hold" || state === "cancelled") return <Badge tone="neutral" size={badgeSize} className={className}>{t(state)}</Badge>;
  return null;
}

export default StatusBadge;
