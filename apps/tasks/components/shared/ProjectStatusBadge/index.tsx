"use client";
import { StatusBadge } from "@orgtik/ui";

export type IProjectStatus = "todo" | "in_progress" | "done";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

// A project's status reads like a task's (the status matrix): To do, In progress, Done.
function ProjectStatusBadge({ status, size = "md", className }: { status: IProjectStatus; size?: BadgeSize; className?: string }) {
  return <StatusBadge entity="task" state={status} size={size === "md" || size === "lg" ? "md" : "sm"} className={className} />;
}

export default ProjectStatusBadge;
