"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type TaskStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "solved"
  | "new_tickets"
  | "open"
  | "todo"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled"
  | "backlog"
  | "in_review"
  | "done"
  | "closed"
  | "in-progress"
  | "unknown"
  | "late"
  | "frozen"
  | "paid"
  | "queued"
  | "paid"
  | "draft"
  | "auto"
  | "submitted"
  | "change"
  | "active" // تم الإضافة هنا
  | "paused" // تم الإضافة هنا
  | string;

export type BadgeSize = "xs" | "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: BadgeSize;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning-subtle text-warning ",
  approved: "bg-success-subtle text-success ",
  rejected: "bg-danger-subtle text-danger ",
  solved: "bg-success-subtle text-success",
  new_tickets: "bg-brand-subtle text-fg-brand ",
  todo: "bg-info-subtle text-info ",
  in_progress: "bg-warning-subtle text-warning ",
  completed: "bg-success-subtle text-success ",
  on_hold: "bg-warning-subtle text-warning ",
  cancelled: "bg-danger-subtle text-danger ",
  backlog: "bg-sunken text-fg-muted ",
  in_review: "bg-brand-subtle text-fg-brand ",
  done: "bg-success-subtle text-success ",
  open: "bg-success-subtle text-success ",
  closed: "bg-sunken text-fg-muted ",
  "in-progress": "bg-warning-subtle text-warning ",
  unknown: "bg-sunken text-fg-muted ",
  late: "bg-warning-subtle text-warning",
  frozen: "bg-sunken text-info",
  queued: "bg-sunken text-info",
  paid: "bg-success-subtle text-success",
  draft: "bg-sunken text-fg-muted ",
  auto: "bg-brand-subtle text-fg-brand",
  submitted: "bg-warning-subtle text-warning ",
  change: "bg-danger-subtle text-danger",
  active: "bg-success-subtle text-success", 
  paused: "bg-warning-subtle text-warning", 
  change_requested:"bg-danger-subtle text-danger"
};

// Dot colour per status code (the codes are the API's values).
const statusDots: Record<string, string> = {
  pending: "bg-warning-solid",
  approved: "bg-success-solid",
  rejected: "bg-danger-solid",
  solved: "bg-success-solid",
  new_tickets: "bg-action-primary",
  open: "bg-success-solid",
  todo: "bg-info-solid",
  in_progress: "bg-warning-solid",
  completed: "bg-success-solid",
  on_hold: "bg-warning-solid",
  cancelled: "bg-danger-solid",
  backlog: "bg-line-strong",
  in_review: "bg-action-primary",
  done: "bg-success-solid",
  closed: "bg-line-strong",
  "in-progress": "bg-warning-solid",
  unknown: "bg-line-strong",
  late: "bg-danger-solid",
  frozen: "bg-info-solid",
  queued: "bg-info-solid",
  paid: "bg-success-solid",
  draft: "bg-line-strong",
  auto: "bg-action-primary",
  submitted: "bg-warning-solid",
  change: "bg-danger-solid",
  active: "bg-success-solid",
  paused: "bg-warning-solid",
  change_requested: "bg-danger-solid",
};

// Status code -> its label in the "statusBadge" catalog. A code not listed here is shown as the API
// sent it (underscores as spaces).
const statusLabelKeys: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  solved: "solved",
  new_tickets: "new_tickets",
  open: "open",
  todo: "todo",
  in_progress: "in_progress",
  completed: "completed",
  on_hold: "on_hold",
  cancelled: "cancelled",
  backlog: "backlog",
  in_review: "in_review",
  done: "done",
  closed: "closed",
  "in-progress": "in_progress",
  unknown: "unknown",
  late: "late",
  frozen: "frozen",
  queued: "queued",
  paid: "paid",
  draft: "draft",
  auto: "auto",
  submitted: "submitted",
  change: "change",
  active: "active",
  paused: "paused",
  change_requested: "change_requested",
};

const sizeStyles = {
  xs: { badge: "px-1.5 py-0.5 text-[10px] gap-1", dot: "h-1 w-1" },
  sm: { badge: "px-2 py-0.5 text-xs gap-1.5", dot: "h-1.5 w-1.5" },
  md: { badge: "px-2.5 py-1 text-xs gap-2", dot: "h-2 w-2" },
  lg: { badge: "px-3 py-1.5 text-sm gap-2.5", dot: "h-2.5 w-2.5" },
};

function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const t = useTranslations("statusBadge");
  // A missing status reads "Unknown"; an unmapped code is shown as the API sent it.
  const labelKey = !status
    ? "unknown"
    : Object.prototype.hasOwnProperty.call(statusLabelKeys, status)
      ? statusLabelKeys[status]
      : undefined;
  const config = {
    label: labelKey ? t(labelKey) : status.replace("_", " "),
    dotColor: statusDots[status] ?? "bg-line-strong",
  };

  const sizeConfig = sizeStyles[size];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center border rounded-[4px] shadow-none transition-colors whitespace-nowrap",

        "border-b-2 border-current pb-[1px]",
        statusStyles[status] ?? "bg-sunken text-fg-subtle border-line",
        sizeConfig?.badge,
        className,
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-full",
          sizeConfig?.dot,
          config.dotColor,
        )}
      />
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
