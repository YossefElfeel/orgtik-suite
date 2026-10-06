"use client";
import { CalendarBlank as CalendarIcon, Clock } from "@phosphor-icons/react";

import React, { useState } from "react";
import { UseFormReturn, FieldPath, FieldValues, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@orgtik/ui/dates";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FormButton } from "@/components/ui/form/form-button";
import { formStyles } from "@/lib/form-styles";
import { format } from "date-fns";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    labelClassName: formStyles.label,
    buttonClassName: cn(
      formStyles.input,
      "justify-start text-start font-normal hover:bg-background",
    ),
    timeInputClassName: formStyles.input,
    popoverClassName:
      "w-auto rounded-lg border border-input bg-popover p-0 shadow-[0_1px_2px_rgba(37,40,45,0.1)]",
  },
};

interface DateTimeFormElementProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  form?: UseFormReturn<TFieldValues, any, any>;
  name: TName;
  label?: string | React.ReactNode;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  labelClassName?: string;
  showTime?: boolean;
  timeFormat?: "12" | "24";
  returnFormat?: "date" | "datetime" | "dd-mm-yyyy" | "yyyy-mm-dd" | "timestamp";
}

export function DateTimeFormElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  description,
  placeholder = "Pick a date",
  disabled,
  className,
  inputClassName,
  buttonClassName,
  labelClassName,
  showTime = true,
  timeFormat = "24",
  returnFormat,
}: DateTimeFormElementProps<TFieldValues, TName>) {
  const formContext = useFormContext();
  const actualForm = form || (formContext as any);
  
  const [isOpen, setIsOpen] = useState(false);
  const [timeValue, setTimeValue] = useState("12:00");

  const toIso = (d?: Date) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null;

  const parseValueToDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    
    if (typeof value === "string") {
      // Handle dd/MM/yyyy or dd-MM-yyyy
      const sep = value.includes("/") ? "/" : value.includes("-") ? "-" : null;
      if (sep && value.split(sep).length === 3) {
        const parts = value.split(sep).map(Number);
        // Check if it's yyyy-mm-dd (first part is 4 digits)
        if (parts[0] > 1000) {
          const [y, m, d] = parts;
          const date = new Date(y, m - 1, d);
          if (!isNaN(date.getTime())) return date;
        } else {
          // It's dd-mm-yyyy or dd/mm/yyyy
          const [d, m, y] = parts;
          const date = new Date(y, m - 1, d);
          if (!isNaN(date.getTime())) return date;
        }
      }
      
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (typeof value === "number") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    
    return undefined;
  };

  const handleDateSelect = (
    selectedDate: Date | undefined,
    fieldOnChange: (value: any) => void,
  ) => {
    if (selectedDate) {
      let finalValue: any = selectedDate;
      if (showTime) {
        // Parse time and combine with date
        const [hours, minutes] = timeValue.split(":").map(Number);
        finalValue = new Date(selectedDate);
        finalValue.setHours(hours, minutes, 0, 0);
      }

      if (returnFormat === "dd-mm-yyyy") {
        fieldOnChange(format(finalValue, "dd-MM-yyyy"));
      } else if (returnFormat === "yyyy-mm-dd") {
        fieldOnChange(format(finalValue, "yyyy-MM-dd"));
      } else if (returnFormat === "timestamp") {
        fieldOnChange(finalValue.getTime());
      } else {
        fieldOnChange(finalValue);
      }
      setIsOpen(false);
    }
  };

  const handleTimeChange = (
    time: string,
    fieldValue: any,
    fieldOnChange: (value: any) => void,
  ) => {
    setTimeValue(time);
    const dateValue = parseValueToDate(fieldValue);
    if (dateValue) {
      const [hours, minutes] = time.split(":").map(Number);
      const updatedDateTime = new Date(dateValue);
      updatedDateTime.setHours(hours, minutes, 0, 0);
      
      if (returnFormat === "dd-mm-yyyy") {
        fieldOnChange(format(updatedDateTime, "dd-MM-yyyy"));
      } else if (returnFormat === "yyyy-mm-dd") {
        fieldOnChange(format(updatedDateTime, "yyyy-MM-dd"));
      } else if (returnFormat === "timestamp") {
        fieldOnChange(updatedDateTime.getTime());
      } else {
        fieldOnChange(updatedDateTime);
      }
    }
  };

  const formatDisplayValue = (value: any) => {
    const date = parseValueToDate(value);
    if (!date) return placeholder;

    if (showTime) {
      const timeStr =
        timeFormat === "12"
          ? format(date, "dd-MM-yyyy hh:mm aa")
          : format(date, "dd-MM-yyyy HH:mm");
      return timeStr;
    }
    return format(date, "dd-MM-yyyy");
  };

  return (
    <FormField
      control={actualForm.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig.styles.mainClassName, className)}>
          <FormLabel
            className={cn(globalConfig.styles.labelClassName, labelClassName)}
          >
            {label}
          </FormLabel>
          {description && (
            <FormDescription className="text-sm leading-[18px] text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <div className="flex gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              {/* One button: the trigger renders FormButton, which takes the field's id, hint and error. */}
              <PopoverTrigger
                disabled={disabled}
                render={
                  <FormButton
                    variant="outline"
                    className={cn(
                      globalConfig.styles.buttonClassName,
                      !field.value && "text-muted-foreground",
                      showTime ? "flex-1" : "w-full",
                      buttonClassName,
                    )}
                  />
                }
              >
                <div className="flex w-full items-center justify-between">
                  {formatDisplayValue(field.value)}
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className={globalConfig.styles.popoverClassName}
                align="start"
              >
                {/* The library calendar (FS-HR-4): a real grid, in the reader's language and week start,
                    with month and year selects so a date of birth is two choices, not hundreds of clicks. */}
                <Calendar
                  jump
                  className="p-3"
                  min="1900-01-01"
                  max={`${new Date().getFullYear() + 50}-12-31`}
                  value={toIso(parseValueToDate(field.value))}
                  onChange={(iso) => handleDateSelect(new Date(`${iso}T00:00:00`), field.onChange)}
                />
                {showTime && (
                  <div className="border-t border-input p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) =>
                          handleTimeChange(
                            e.target.value,
                            field.value,
                            field.onChange,
                          )
                        }
                        className={cn(
                          globalConfig.styles.timeInputClassName,
                          inputClassName,
                        )}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
