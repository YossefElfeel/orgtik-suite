"use client";

import React, { useEffect, useState } from "react";
import type { Control } from "react-hook-form";
import {
  UseFormReturn,
  FieldPath,
  FieldValues,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";
import { CalendarIcon } from "lucide-react";

function toDateOrUndefined(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);
      if (!Number.isNaN(localDate.getTime())) return localDate;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function toYyyyMmDdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDdMmYyyy(value: unknown): string {
  const d = toDateOrUndefined(value);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toStartOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

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
      "w-auto rounded-lg border border-greyscale-200 bg-white p-0",
  },
};

interface DateTimeFormElementProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  form?: UseFormReturn<TFieldValues>;
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
  /** When `showTime` is false: store a `Date` (default) or `YYYY-MM-DD` string in the form. */
  dateValueAs?: "date" | "yyyy-mm-dd";
  /** Disable all dates before today in the calendar picker. */
  disablePast?: boolean;
}

export function DateTimeFormElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  description,
  placeholder,
  disabled,
  className,
  inputClassName,
  buttonClassName,
  labelClassName,
  showTime = true,
  dateValueAs = "date",
  disablePast = false,
}: DateTimeFormElementProps<TFieldValues, TName>) {
  const formContext = useFormContext();
  const actualForm = form || formContext;

  const [isOpen, setIsOpen] = useState(false);
  const [timeValue, setTimeValue] = useState("");
  const watchedValue = useWatch({
    control: actualForm.control as Control<TFieldValues>,
    name,
  });

  useEffect(() => {
    if (!showTime) return;
    const d = toDateOrUndefined(watchedValue);
    if (!d) {
      setTimeValue("");
      return;
    }
    const hasTime =
      d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
    setTimeValue(
      hasTime
        ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
        : "",
    );
  }, [watchedValue, showTime]);

  const handleDateSelect = (
    selectedDate: Date,
    fieldOnChange: (value: Date | string) => void,
  ) => {
    const baseLocal = toStartOfDay(selectedDate);
    if (showTime) {
      const combinedDateTime = new Date(baseLocal);
      if (timeValue) {
        const [hours, minutes] = timeValue.split(":").map(Number);
        combinedDateTime.setHours(hours, minutes, 0, 0);
      } else {
        combinedDateTime.setHours(0, 0, 0, 0);
      }
      fieldOnChange(combinedDateTime);
    } else if (dateValueAs === "yyyy-mm-dd") {
      fieldOnChange(toYyyyMmDdLocal(baseLocal));
    } else {
      fieldOnChange(baseLocal);
    }
    if (!showTime) {
      setIsOpen(false);
    }
    void actualForm.trigger(name);
  };

  const applyTimeToField = (
    time: string,
    fieldValue: unknown,
    fieldOnChange: (value: Date | undefined) => void,
  ) => {
    setTimeValue(time);
    const base = toDateOrUndefined(fieldValue);
    if (!time) {
      if (base) {
        const dateOnly = new Date(base);
        dateOnly.setHours(0, 0, 0, 0);
        fieldOnChange(dateOnly);
      } else {
        fieldOnChange(undefined);
      }
      void actualForm.trigger(name);
      return;
    }
    if (!base) return;
    const [hours, minutes] = time.split(":").map(Number);
    const updatedDateTime = new Date(base);
    updatedDateTime.setHours(hours, minutes, 0, 0);
    fieldOnChange(updatedDateTime);
    void actualForm.trigger(name);
  };


  return (
    <FormField
      control={actualForm.control as Control<TFieldValues>}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(globalConfig.styles.mainClassName, className, " ")}
        >
          {label ? (
            <FormLabel
              className={cn(globalConfig.styles.labelClassName, labelClassName)}
            >
              {label}
            </FormLabel>
          ) : null}
          {description ? (
            <FormDescription className="text-sm">{description}</FormDescription>
          ) : null}
          <div className="flex gap-2">
            <div className="relative w-full flex-1">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <FormControl>
                  <PopoverTrigger
                    type="button"
                    disabled={disabled}
                    className={cn(
                      globalConfig.styles.buttonClassName,
                      "flex items-center justify-between gap-2 disabled:cursor-not-allowed disabled:opacity-50",
                      inputClassName,
                      buttonClassName,
                    )}
                  >
                    <span
                      className={cn(
                        !formatDdMmYyyy(field.value) && "text-secondary/80",
                      )}
                    >
                      {formatDdMmYyyy(field.value) ||
                        placeholder ||
                        "dd/mm/yyyy"}
                    </span>
                    <CalendarIcon className="size-4.5 shrink-0 text-greyscale-400" />
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent
                  className={cn(globalConfig.styles.popoverClassName, "p-3")}
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={toDateOrUndefined(field.value)}
                    onSelect={(selectedDate: Date | undefined) => {
                      if (selectedDate) {
                        handleDateSelect(
                          selectedDate,
                          field.onChange as (value: Date | string) => void,
                        );
                      }
                    }}
                    disabled={
                      disablePast ? { before: todayDate() } : undefined
                    }
                    startMonth={new Date(1900, 0)}
                    endMonth={new Date(new Date().getFullYear() + 50, 11)}
                    captionLayout="dropdown"
                    defaultMonth={toDateOrUndefined(field.value) ?? todayDate()}
                    className="p-0"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {showTime ? (
              <FormControl>
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) =>
                    applyTimeToField(
                      e.target.value,
                      field.value,
                      field.onChange,
                    )
                  }
                  disabled={disabled}
                  className={cn(
                    globalConfig.styles.timeInputClassName,
                    "w-33",
                    inputClassName,
                  )}
                />
              </FormControl>
            ) : null}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
