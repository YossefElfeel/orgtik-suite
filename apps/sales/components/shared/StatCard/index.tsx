import type { ReactNode } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import statCardPattern from "@/public/images/statCard-pattern.svg";

export type StatCardTrend = {
  value: string;
  label?: string;
  direction?: "up" | "down";
};

export type StatCardProps = {
  label: string;
  value: number | string | ReactNode;
  variant?: "primary" | "secondary";
  description?: string;
  trend?: StatCardTrend;
  className?: string;
};

export function StatCard({
  label,
  value,
  variant = "secondary",
  description,
  trend,
  className,
}: StatCardProps) {
  const isPrimary = variant === "primary";

  return (
    <article
      className={cn(
        "relative flex min-h-[140px] border border-border/60 flex-1 flex-col gap-4 overflow-hidden rounded-2xl px-5 py-4",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "bg-background text-foreground",
        className,
      )}
    >
      {isPrimary ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-6 -right-12 flex size-[222px] items-center justify-center"
        >
          <div className="rotate-30">
            <Image
              src={statCardPattern}
              alt=""
              width={163}
              height={163}
              className="size-[163px] object-contain"
            />
          </div>
        </div>
      ) : null}

      <p
        className={cn(
          "relative text-16 font-medium leading-6",
          isPrimary ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {label}
      </p>

      <div className="relative text-32 font-medium leading-10 tracking-tight tabular-nums">
        {value}
      </div>

      <div className="relative min-h-5">
        {trend ? (
          <div className="flex max-w-full items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-xs font-medium",
                isPrimary
                  ? "bg-background text-primary"
                  : trend.direction === "down"
                    ? "bg-red/10 text-red"
                    : "bg-green/10 text-green",
              )}
            >
              <Icon
                icon="solar:alt-arrow-up-bold"
                className={cn(
                  "size-4 shrink-0",
                  trend.direction === "down" && "rotate-180",
                )}
              />
              {trend.value}
            </span>
            {trend.label ? (
              <span
                className={cn(
                  "truncate text-xs",
                  isPrimary ? "text-primary-foreground" : "text-secondary",
                )}
              >
                {trend.label}
              </span>
            ) : null}
          </div>
        ) : description ? (
          <p
            className={cn(
              "text-12",
              isPrimary ? "text-primary-foreground/80" : "text-secondary",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export type StatItem = StatCardProps & {
  id: string;
};

type StatsCardsProps = {
  stats: StatItem[];
  className?: string;
};

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4",
        className,
      )}
    >
      {stats.map(({ id, ...stat }) => (
        <StatCard key={id} {...stat} />
      ))}
    </div>
  );
}

export default StatCard;
