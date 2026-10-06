"use client";
import { Ticket, TrendDown as TrendingDown, TrendUp as TrendingUp } from "@phosphor-icons/react";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  /** A real change from the API ("+12%"); left out when there is none, never made up (HR-029). */
  trend?: string;
  subtitle: string;
  icon?: ReactNode;
  iconBgClassName?: string;
  trendDirection?: "up" | "down";
  className?: string;
};

export function DashboardMetricCard({
  title,
  value,
  trend,
  subtitle,
  icon = <Ticket className="size-5 text-primary-foreground" />,
  iconBgClassName = "bg-primary",
  trendDirection = "up",
  className,
}: DashboardMetricCardProps) {
  const isUp = trendDirection === "up";

  return (
    <article
      className={cn(
        "w-full rounded-xl border border-border bg-card p-4 shadow-[0px_1px_2px_0px_color-mix(in_oklab,var(--foreground)_12%,transparent)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0px_-2px_6px_0px_color-mix(in_oklab,white_88%,transparent)]",
            iconBgClassName,
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-5 font-medium text-secondary">
            {title}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-[34px] leading-[34px] font-semibold text-foreground">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs leading-4 font-medium",
                  isUp ? "text-primary" : "text-destructive",
                )}
              >
                {isUp ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                {trend}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-[18px] font-normal text-fg-subtle">
        {subtitle}
      </p>
    </article>
  );
}
