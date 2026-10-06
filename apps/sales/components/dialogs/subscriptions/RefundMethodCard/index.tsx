"use client";

import { Icon } from "@iconify/react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  className?: string;
  onSelect: () => void;
};

export default function RefundMethodCard({
  title,
  description,
  icon,
  selected,
  className,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-colors",
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background hover:border-border/80",
        className,
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon icon={icon} className="size-6 shrink-0 text-foreground" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {selected ? (
          <CheckIcon
            className="size-4 shrink-0 text-primary"
            strokeWidth={2.5}
          />
        ) : null}
      </div>
      <p className="text-xs text-secondary">{description}</p>
    </button>
  );
}
