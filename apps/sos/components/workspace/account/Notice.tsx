"use client";
// A message in the page where something happened: why an action was refused and what to do next,
// or a fact the reader should know before acting (a quote that expired). Danger and warning are
// announced; info is read in place.
import type { ReactNode } from "react";
import { Info, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@orgtik/ui";

const TONES = {
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-subtle text-warning",
  info: "bg-info-subtle text-info",
  success: "bg-success-subtle text-success",
} as const;

export function Notice({ tone = "info", title, children, action, className }: { tone?: keyof typeof TONES; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircle : tone === "info" ? Info : WarningCircle;
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex flex-wrap items-start gap-3 rounded-card px-4 py-3", TONES[tone], className)}>
      <Icon aria-hidden="true" weight="fill" className="mt-[0.2em] size-[1.15em] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-body-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-fg">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
