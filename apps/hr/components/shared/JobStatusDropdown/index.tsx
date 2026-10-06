"use client";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type JobStatusTone = "success" | "warning" | "info" | "neutral";

export type JobStatusOption = {
  value: string;
  label?: string;
  tone?: JobStatusTone;
};

const statusToneStyles: Record<JobStatusTone, { container: string; dot: string }> = {
  success: {
    container:
      "border-success bg-success-subtle text-success shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25),inset_0px_-1px_0px_0px_rgba(50,177,131,0.15)]",
    dot: "bg-success-solid",
  },
  warning: {
    container:
      "border-warning bg-warning-subtle text-warning shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25),inset_0px_-1px_0px_0px_rgba(216,154,0,0.12)]",
    dot: "bg-warning-solid",
  },
  info: {
    container:
      "border-fg-brand bg-brand-subtle text-fg-brand shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25),inset_0px_-1px_0px_0px_rgba(128,78,236,0.12)]",
    dot: "bg-action-primary",
  },
  neutral: {
    container:
      "border-line bg-sunken text-fg-muted shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25),inset_0px_-1px_0px_0px_rgba(89,99,117,0.08)]",
    dot: "bg-fg",
  },
};

type JobStatusDropdownProps = {
  status: string;
  options: JobStatusOption[];
  defaultTone?: JobStatusTone;
  disabled?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
};

export default function JobStatusDropdown({
  status,
  options,
  defaultTone = "success",
  disabled = false,
  onChange,
  className,
  align = "start",
}: JobStatusDropdownProps) {
  const resolvedOptions =
    options && options.length > 0
      ? options
      : [{ value: status, label: status, tone: defaultTone }];

  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  const activeOption =
    resolvedOptions.find((option) => option.value === selectedStatus) ??
    resolvedOptions[0];
  const tone =
    statusToneStyles[activeOption?.tone ?? defaultTone] ??
    statusToneStyles[defaultTone];

  const handleStatusSelect = (value: string) => {
    setSelectedStatus(value);
    setIsMenuOpen(false);
    onChange?.(value);
  };

  if (resolvedOptions.length <= 1) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-[4px] border px-1 pe-2 py-[3px] text-[14px] leading-[18px] font-medium",
          tone.container,
          className,
        )}
      >
        <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden="true" />
        <span>{activeOption.label ?? activeOption.value}</span>
        <ChevronDown className="size-4 stroke-[1.8]" />
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-[4px] border px-1 pe-2 py-[3px] text-[14px] leading-[18px] font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
              tone.container,
              className,
            )}
          />
        }
      >
        <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden="true" />
        <span>{activeOption.label ?? activeOption.value}</span>
        <ChevronDown
          className={cn("size-4 stroke-[1.8] transition-transform", isMenuOpen && "rotate-180")}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="mt-1 min-w-[160px] rounded-xl border border-line bg-raised p-1.5 shadow-[0_12px_30px_rgba(31,44,76,0.12)]"
      >
        {resolvedOptions.map((option) => {
          const isActive = option.value === selectedStatus;

          return (
            <DropdownMenuItem
              key={option.value}
              disabled={isActive || disabled}
              onClick={() => handleStatusSelect(option.value)}
              className={cn(
                "mb-0.5 cursor-pointer rounded-[8px] px-3 py-2 text-[13px] leading-4 text-fg-muted last:mb-0",
                isActive ? "bg-brand-subtle font-medium text-fg-brand" : "hover:bg-sunken",
              )}
            >
              {option.label ?? option.value}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
