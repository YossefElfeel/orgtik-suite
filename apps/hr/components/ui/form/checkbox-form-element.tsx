"use client";

import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { ReactNode } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Label } from "../label";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    labelClassName: formStyles.label,
    checkboxGroupClassName: "space-y-2",
    checkboxGroupHorizontalClassName: "flex flex-wrap gap-3 space-y-0",
    checkboxItemClassName: "group flex items-center gap-2",
    checkboxLabelClassName: formStyles.optionLabel,
  },
};

interface CheckboxOption {
  value: string;
  label: string | ReactNode;
  component?: ReactNode;
  disabled?: boolean;
}

interface CheckboxFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  options: CheckboxOption[];
  className?: string;
  labelClassName?: string;
  checkboxGroupClassName?: string;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
}

function CheckboxFormEle<T extends FieldValues>({
  form,
  name,
  label,
  options,
  className,
  labelClassName,
  checkboxGroupClassName,
  orientation = "vertical",
  disabled,
}: CheckboxFormEleProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig.styles.mainClassName, className)}>
          {label && (
            <FormLabel className={cn(globalConfig.styles.labelClassName, labelClassName)}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div
              className={cn(
                globalConfig.styles.checkboxGroupClassName,
                orientation === "horizontal" && globalConfig.styles.checkboxGroupHorizontalClassName,
                checkboxGroupClassName
              )}
            >
              {options.map((option) => {
                const isChecked = Array.isArray(field.value)
                  ? field.value.includes(option.value)
                  : field.value === option.value;

                return (
                  <div
                    key={option.value}
                    className={globalConfig.styles.checkboxItemClassName}
                  >
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      className="size-5"
                      onCheckedChange={(checked) => {
                        if (Array.isArray(field.value)) {
                          // Multiple selection mode
                          const updatedValue = checked
                            ? [...field.value, option.value]
                            : field.value.filter((val: string) => val !== option.value);
                          field.onChange(updatedValue);
                        } else {
                          // Single selection mode
                          field.onChange(checked ? option.value : "");
                        }
                      }}
                      disabled={option.disabled || disabled}
                    />
                    <Label
                      htmlFor={option.value}
                      className={globalConfig.styles.checkboxLabelClassName}
                    >
                      {option.component || option.label}
                    </Label>
                  </div>
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

/** Single checkbox that stores a boolean (e.g. "تشمل ضريبة"). */
interface SingleCheckboxFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: ReactNode;
  className?: string;
  labelClassName?: string;
  checkboxClassName?: string;
  disabled?: boolean;
}

function SingleCheckboxFormEle<T extends FieldValues>({
  form,
  name,
  label,
  className,
  labelClassName,
  checkboxClassName,
  disabled,
}: SingleCheckboxFormEleProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            formStyles.checkboxRow,
            "mt-0! space-y-0",
            className
          )}
        >
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={cn(formStyles.control, "size-5", checkboxClassName)}
            />
          </FormControl>
          <FormLabel className={cn(formStyles.optionLabel, labelClassName)}>
            {label}
          </FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default CheckboxFormEle;
export { SingleCheckboxFormEle };