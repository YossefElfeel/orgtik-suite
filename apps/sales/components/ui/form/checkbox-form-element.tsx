"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface CheckboxFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export default function CheckboxFormEle<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,
}: CheckboxFormEleProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("gap-2", className)}>
          <div className="flex items-start gap-3">
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  form.trigger(name);
                }}
                className="mt-0.5 size-4.5"
              />
            </FormControl>
            <div className="space-y-1">
              <FormLabel
                className="cursor-pointer text-sm font-semibold normal-case 
              tracking-normal text-foreground"
              >
                {label}
              </FormLabel>
              {description ? (
                <p className="text-xs leading-4.5 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}
