"use client";

import { Icon } from "@iconify/react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
};

export default function InvoiceBillToTypeCard({
  title,
  description,
  icon,
  selected,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-1 flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-primary/40",
      )}
    >
      {selected ? (
        <CheckIcon
          className="absolute end-3 top-3 size-5 text-primary"
          strokeWidth={2.5}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="size-5 shrink-0 text-foreground" />
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-sm text-secondary">{description}</p>
    </button>
  );
}
