"use client";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { ReactNode, useId } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Label } from "../label";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    labelClassName: formStyles.label,
    radioGroupClassName: formStyles.groupContainer,
    radioGroupHorizontalClassName: "flex flex-row gap-4 items-start",
    radioGroupVerticalClassName: "grid gap-2",
    radioItemClassName: "group flex items-start gap-2",
    radioLabelClassName: formStyles.optionLabel,
  },
};

interface RadioOption {
  value: string;
  label: string | ReactNode;
  component?: ReactNode;
  disabled?: boolean;
}

interface RadioGroupFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T, any, any>;
  name: Path<T>;
  label?: string | ReactNode;
  options: RadioOption[];
  className?: string;
  labelClassName?: string;
  radioGroupClassName?: string;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
}

function RadioGroupFormEle<T extends FieldValues>({
  form,
  name,
  label,
  options,
  className,
  labelClassName,
  radioGroupClassName,
  orientation = "vertical",
  disabled,
}: RadioGroupFormEleProps<T>) {
  // A label's for= can't name a group: the group points at the label instead (FS-HR-4).
  const labelId = useId();
  return (
    <FormField
      control={form.control as any}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig.styles.mainClassName, className)}>
          {label && (
            <FormLabel
              id={labelId}
              className={cn(globalConfig.styles.labelClassName, labelClassName)}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              aria-labelledby={label ? labelId : undefined}
              onValueChange={field.onChange}
              value={field.value}
              className={cn(
                globalConfig.styles.radioGroupClassName,
                orientation === "horizontal"
                  ? globalConfig.styles.radioGroupHorizontalClassName
                  : globalConfig.styles.radioGroupVerticalClassName,
                radioGroupClassName
              )}
              disabled={disabled}
            >
              {options.map((option, index) => (
                <div
                  key={index}
                  className={globalConfig.styles.radioItemClassName}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    checked={field.value === option.value}
                    disabled={option.disabled || disabled}
                    className="size-5 border-[1.5px] data-checked:bg-transparent data-checked:text-primary"
                  />
                  <Label
                    htmlFor={option.value}
                    className={globalConfig.styles.radioLabelClassName}
                  >
                    {option.component || option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default RadioGroupFormEle;
