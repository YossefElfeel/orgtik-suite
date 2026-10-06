"use client";

import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

interface TabsFormOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

interface TabsFormEleProps<
  T extends FieldValues,
  TValue extends string = string,
> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  options: readonly TabsFormOption<TValue>[];
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export default function TabsFormEle<
  T extends FieldValues,
  TValue extends string = string,
>({
  form,
  name,
  label,
  options,
  className,
  labelClassName,
  disabled,
}: TabsFormEleProps<T, TValue>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(formStyles.item, className)}>
          {label ? (
            <FormLabel className={cn(formStyles.label, labelClassName)}>
              {label}
            </FormLabel>
          ) : null}
          <FormControl>
            <div className="flex gap-3" role="tablist">
              {options.map((option) => {
                const isSelected = field.value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    disabled={disabled}
                    onClick={() => {
                      field.onChange(option.value as PathValue<T, Path<T>>);
                      form.trigger(name);
                    }}
                    className={cn(
                      "h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
