"use client";
import { useTranslations } from "next-intl";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value?: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  startIcon?: ReactNode;
  onValueChange: (value: string) => void;
  className?: string;
};

export default function PlanOptionSelect({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  required = false,
  startIcon,
  onValueChange,
  className,
}: Props) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) {
      setOpen(false);
      return;
    }

    setOpen(nextOpen);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className={formStyles.label}>
        {label}
        {required ? <span className="text-red"> *</span> : null}
      </span>
      <Popover open={open} onOpenChange={handleOpenChange} modal>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              aria-expanded={open}
              className={cn(
                formStyles.select,
                "h-auto min-h-10 w-full justify-between gap-3 px-3 py-2.5 font-normal shadow-none",
                disabled && "bg-muted/50 text-secondary",
                !selectedOption && "text-secondary",
              )}
            />
          }
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            {startIcon}
            <span className="truncate text-xs text-foreground">
              {displayLabel}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-secondary" />
        </PopoverTrigger>
        <PopoverContent
          nested
          align="start"
          matchTriggerWidth
          className="p-1"
        >
          <div className="flex max-h-60 flex-col overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-secondary">
                {tCommon("noOptionsAvailable")}
              </p>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    option.value === value &&
                      "bg-primary/5 font-medium text-primary",
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
