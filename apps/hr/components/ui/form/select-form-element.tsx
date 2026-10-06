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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    labelClassName: formStyles.label,
    selectClassName: formStyles.select,
    selectContentClassName:
      "max-h-[250px] rounded-lg border border-input bg-popover p-1 shadow-[0_1px_2px_rgba(37,40,45,0.1)]",
  },
};

interface SelectOption {
  value: string;
  label?: string | ReactNode;
  component?: ReactNode;
}

/** Sentinel for "no selection" when placeholder is an option. Select.Item cannot use value="". */
export const SELECT_EMPTY_VALUE = "__none__";

interface SelectFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T, any, any>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  options: SelectOption[];
  /**
   * When set, the option with this value is treated as empty (form stores "").
   * Use with an option like { value: SELECT_EMPTY_VALUE, label: "اختر..." }.
   */
  emptyOptionValue?: string;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
  renderSelectedValue?: (option: SelectOption) => ReactNode;
}

function SelectFormEle<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  options,
  emptyOptionValue,
  className,
  labelClassName,
  selectClassName,
  disabled,
  renderSelectedValue,
}: SelectFormEleProps<T>) {
  const rawValue = form.watch(name);
  const selectValue =
    emptyOptionValue != null && (rawValue === "" || rawValue == null)
      ? emptyOptionValue
      : rawValue;
  const selectedOption = options.find(
    (option) => option.value === selectValue || option.value === rawValue
  );

  return (
    <FormField
      control={form.control as any}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig?.styles.mainClassName, className)}>
          {label && (
            <FormLabel
              className={cn(
                globalConfig?.styles.labelClassName,
                labelClassName
              )}
            >
              {label}
            </FormLabel>
          )}
          <Select
            onValueChange={(value) => {
              const next =
                emptyOptionValue != null && value === emptyOptionValue
                  ? ""
                  : value;
              field.onChange(next);
              form.trigger(name);
            }}
            value={selectValue}
          >
            <FormControl>
              <SelectTrigger
                disabled={disabled}
                className={cn(
                  globalConfig?.styles.selectClassName,
                  selectClassName
                )}
              >
                <SelectValue placeholder={placeholder}>
                  {selectedOption && renderSelectedValue
                    ? renderSelectedValue(selectedOption)
                    : selectedOption
                    ? selectedOption.component || selectedOption.label
                    : placeholder}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent
              className={globalConfig?.styles.selectContentClassName}
            >
              {options
                .filter((option) => option.value !== "")
                .map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="rounded-md px-2 py-2 text-base"
                  >
                    {option.component || option.label || option.value}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default SelectFormEle;
