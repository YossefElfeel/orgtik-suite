"use client";
import { CaretDown as ChevronDown, MagnifyingGlass as Search } from "@phosphor-icons/react";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type TicketsFiltersBarProps = {
  statusOptions?: Option[];
  sortOptions?: Option[];
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  className?: string;
};

export function TicketsFiltersBar({
  statusOptions = [{ label: "All Status", value: "all" }],
  sortOptions = [{ label: "Sort By : Last 7 Days", value: "last-7-days" }],
  onSearchChange,
  onStatusChange,
  onSortChange,
  className,
}: TicketsFiltersBarProps) {
  const activeStatus = statusOptions[0];
  const activeSort = sortOptions[0];

  return (
    <section className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="relative w-full max-w-[266px]">
        <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-fg-muted" />
        <Input
          placeholder="Search..."
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="h-8 border-line bg-raised pe-2.5 ps-8 text-sm text-fg-muted placeholder:text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange?.(activeStatus?.value ?? "all")}
          className="h-8 gap-1.5 rounded-lg border-line bg-raised px-2 text-xs font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] hover:bg-raised"
        >
          {activeStatus?.label ?? "All Status"}
          <ChevronDown className="size-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortChange?.(activeSort?.value ?? "last-7-days")}
          className="h-8 gap-1.5 rounded-lg border-line bg-raised px-2 text-xs font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] hover:bg-raised"
        >
          {activeSort?.label ?? "Sort By : Last 7 Days"}
          <ChevronDown className="size-4" />
        </Button>
      </div>
    </section>
  );
}
