"use client";

import type React from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Textarea } from "../textarea";

const globalConfig = {
  styles: {
    mainClassName: "space-y-0 gap-1",
    inputClassName:
      "w-full bg-gray-100/30 rounded-md border border-gray-300 !text-[12px] !p-3 h-10",
    labelClassName: "text-sm font-medium text-black/70",
  },
};

interface CustomInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"] | "textarea";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
}

export default function TextFormEle<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  className,
  labelClassName,
  inputClassName,
  type = "text",
  prefix,
  suffix,
  disabled,
}: CustomInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig.styles.mainClassName, className)}>
          {label && (
            <FormLabel
              className={cn(globalConfig.styles.labelClassName, labelClassName)}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative flex">
              {prefix}
              {type === "textarea" ? (
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  className={cn(
                    "resize-none !h-36",
                    globalConfig.styles.inputClassName,
                    inputClassName
                  )}
                  value={
                    type === "date" && (field.value as any) instanceof Date
                      ? new Date(field.value).toISOString().split("T")[0]
                      : field.value ?? ""
                  }
                  disabled={disabled}
                  onChange={(e) => {
                    let value: string | number | Date = e.target.value;
                    if (type === "number")
                      value = value === "" ? "" : Number(value);
                    else if (type === "date") value = new Date(value);
                    field.onChange(value);
                    form.trigger(name);
                  }}
                />
              ) : (
                <Input
                  {...field}
                  placeholder={placeholder}
                  type={type}
                  className={cn(
                    globalConfig.styles.inputClassName,
                    inputClassName
                  )}
                  value={
                    type === "date" && (field.value as any) instanceof Date
                      ? new Date(field.value).toISOString().split("T")[0]
                      : field.value ?? ""
                  }
                  disabled={disabled}
                  onChange={(e) => {
                    let value: string | number | Date = e.target.value;
                    if (type === "number")
                      value = value === "" ? "" : Number(value);
                    else if (type === "date") value = new Date(value);
                    field.onChange(value);
                    form.trigger(name);
                  }}
                />
              )}
              {suffix}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
