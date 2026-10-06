"use client";
import { Check } from "@phosphor-icons/react";

import React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName:
      "flex min-h-10 items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 shadow-[0_1px_2px_rgba(37,40,45,0.1)]",
    contentClassName: "space-y-0.5",
    labelClassName: formStyles.label,
    descriptionClassName: "text-sm leading-[18px] text-muted-foreground",
  },
};

interface SwitchFormElementProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues, any, any>;
  name: TName;
  label: string | React.ReactNode;
  description?: string;
  onIcon?: React.ReactNode;
  offIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  dir?: "rtl" | "ltr";
}

export function SwitchFormElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  description,
  onIcon = (
    <Check strokeWidth={3} className="h-2.5 w-2.5 text-fg-brand" />
  ),
  offIcon,
  disabled,
  className,
  labelClassName,
  descriptionClassName,
  dir = "ltr",
}: SwitchFormElementProps<TFieldValues, TName>) {
  return (
    <FormField
      control={form.control as any}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            globalConfig?.styles.mainClassName,
            dir === "ltr" ? "justify-end flex-row-reverse" : "justify-start",
            className
          )}
        >
          <div className={globalConfig?.styles.contentClassName}>
            <FormLabel
              className={cn(
                globalConfig?.styles.labelClassName,
                labelClassName
              )}
            >
              {label}
            </FormLabel>
            {description && (
              <FormDescription
                className={cn(
                  globalConfig?.styles.descriptionClassName,
                  descriptionClassName
                )}
              >
                {description}
              </FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              dir={dir}
              checkedIcon={onIcon}
              uncheckedIcon={offIcon}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
