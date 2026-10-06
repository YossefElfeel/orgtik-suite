"use client";
import { CaretDown as ChevronDown, PencilSimple as Pencil, UserCircle as CircleUserRound } from "@phosphor-icons/react";
import type { Icon as LucideIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

export type InfoCardItem = {
  id: string;
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  /**
   * The value is user data (a name, an email, an address): it stays as written and is
   * isolated with <bdi> so it reads correctly inside a right-to-left page. Leave it off for
   * translated values, so a missing translation still shows up in the checks.
   */
  userContent?: boolean;
};

// A placeholder for an empty value ("-", "—") is not user content.
const isPlaceholder = (v: unknown) => v === "-" || v === "—" || v === "--";

type InfoCardProps = {
  title: string;
  icon?: LucideIcon;
  onEdit?: () => void;
  items?: InfoCardItem[];
  children?: React.ReactNode;
  className?: string;
  gridClassName?: string;
};

export function InfoCardSkeleton({
  itemCount = 6,
  className,
  gridClassName,
  children,
}: {
  itemCount?: number;
  className?: string;
  gridClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl border bg-raised p-6 animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-6 w-[150px]" />
      </div>

      <div className="h-px w-full bg-line" />

      <div className="space-y-4">
        <div className={cn("grid gap-4 md:grid-cols-2", gridClassName)}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}

export function InfoCard({
  title,
  icon: Icon = CircleUserRound,
  onEdit,
  items,
  children,
  className,
  gridClassName,
}: InfoCardProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl border  bg-raised p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Icon className="size-6 text-fg" />
          <h3 className="text-lg leading-6 font-medium text-fg">
            {title}
          </h3>
        </div>
        {/* {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 gap-1.5 rounded-lg border-line px-2 text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] hover:bg-sunken transitions-all duration-200"
          >
            <Pencil className="size-4" />
            <span className="text-xs leading-4 font-medium">Edit</span>
            <ChevronDown className="size-4" />
          </Button>
        )} */}
      </div>

      <div className="h-px w-full bg-line" />

      <div className="space-y-4">
        {items && items.length > 0 && (
          <div className={cn("grid gap-4 md:grid-cols-2", gridClassName)}>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                {item.icon && (
                  <item.icon className="size-5 shrink-0 text-fg-muted" />
                )}
                <p className="w-[150px] shrink-0 text-sm leading-[18px] font-normal text-fg-muted">
                  {item.label}
                </p>
                <div className="min-w-0 flex-1 text-sm leading-[18px] font-medium text-fg">
                  {item.userContent && item.value != null && !isPlaceholder(item.value) ? (
                    <bdi>{item.value}</bdi>
                  ) : (
                    item.value
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
