"use client";

import type { ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";

import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface SwitchFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  /** Shows an info icon next to the label. */
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: ReactNode;
}

export default function SwitchFormEle<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,
  ariaLabel,
  icon,
}: SwitchFormEleProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex items-start justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3.5",
            className,
          )}
        >
          <div className="min-w-0 space-y-1">
            <FormLabel className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold normal-case tracking-normal text-foreground">
              {label}
              {icon}
            </FormLabel>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                form.trigger(name);
              }}
              aria-label={ariaLabel ?? label}
              className="mt-0.5"
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
