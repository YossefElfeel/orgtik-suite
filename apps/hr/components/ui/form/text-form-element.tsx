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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    inputClassName: formStyles.input,
    textareaClassName: cn(formStyles.textarea, "min-h-[100px]"),
    labelClassName: formStyles.label,
    inlineAdornment:
      "absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground group-focus-within:text-primary pointer-events-none",
    inlinePrefixPlaceholder: "start-4",
    inlineSuffixPlaceholder: "end-4",
  },
};

interface CustomInputProps<T extends FieldValues> {
  form: UseFormReturn<T, any, any>;
  name: Path<T>;
  label?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"] | "textarea";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /**
   * Inline start adornment (rendered inside input area, absolutely positioned).
   * Use for labels like "ر.س (بدون ضريبة)" or icons; input gets pl-24 by default.
   */
  inlinePrefix?: React.ReactNode;
  /**
   * Inline end adornment (rendered inside input area, absolutely positioned).
   * Use for labels like "كغ"; input gets pr-12 by default.
   */
  inlineSuffix?: React.ReactNode;
  inlinePrefixClassName?: string;
  inlineSuffixClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
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
  prefix = null,
  suffix = null,
  inlinePrefix,
  inlineSuffix,
  inlinePrefixClassName,
  inlineSuffixClassName,
  disabled,
  readOnly,
  inputProps,
}: CustomInputProps<T>) {
  const isTextarea = type === "textarea";
  const hasInlineAdornment = inlinePrefix != null || inlineSuffix != null;

  return (
    <FormField
      control={form.control as any}
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
          {/* FormControl wraps the input itself, so the label and the hint/error reach it (FS-HR-4). */}
          {isTextarea ? (
            <FormControl className={readOnly ? "bg-muted/80!" : ""}>
            <Textarea
              {...field}
              readOnly={readOnly}
              placeholder={placeholder}
              className={cn(
                globalConfig.styles.textareaClassName,
                inputClassName,
              )}
              value={field.value ?? ""}
              disabled={disabled}
              onChange={(e) => {
                field.onChange(e.target.value);
                form.trigger(name);
              }}
            />
            </FormControl>
          ) : hasInlineAdornment ? (
            <div className="relative group">
              {inlinePrefix != null && (
                <span
                  className={cn(
                    globalConfig.styles.inlineAdornment,
                    globalConfig.styles.inlinePrefixPlaceholder,
                    inlinePrefixClassName,
                  )}
                >
                  {inlinePrefix}
                </span>
              )}
              {inlineSuffix != null && (
                <span
                  className={cn(
                    globalConfig.styles.inlineAdornment,
                    globalConfig.styles.inlineSuffixPlaceholder,
                    inlineSuffixClassName,
                  )}
                >
                  {inlineSuffix}
                </span>
              )}
              <FormControl className={readOnly ? "bg-muted/80!" : ""}>
                <Input
                  {...field}
                  {...inputProps}
                  readOnly={readOnly}
                  placeholder={placeholder}
                  type={
                    type as React.InputHTMLAttributes<HTMLInputElement>["type"]
                  }
                  step={type === "number" ? "0.01" : undefined}
                  className={cn(
                    globalConfig.styles.inputClassName,
                    inlinePrefix != null && "ps-24",
                    inlineSuffix != null && "pe-12",
                    inputClassName,
                  )}
                  value={
                    type === "date" && (field.value as unknown) instanceof Date
                      ? (field.value as Date).toISOString().split("T")[0]
                      : (field.value ?? "")
                  }
                  disabled={disabled}
                  onChange={(e) => {
                    let value: string | number | Date = e.target.value;
                    if (type === "number")
                      value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                    else if (type === "date") value = new Date(value);
                    field.onChange(value);
                    form.trigger(name);
                  }}
                />
              </FormControl>
            </div>
          ) : (
            <div
              className={cn(
                "group flex h-10 w-full items-center overflow-hidden rounded-lg border  bg-raised shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] transition-colors focus-within:border-fg-brand focus-within:ring-1 focus-within:ring-fg-brand/30",
                disabled && "opacity-60",
              )}
            >
              {prefix !== null && (
                <span className="inline-flex h-full items-center border-e  px-4 text-sm leading-none text-fg-muted">
                  {prefix}
                </span>
              )}
              <FormControl className={readOnly ? "bg-muted/80!" : ""}>
                <Input
                  {...field}
                  {...inputProps}
                  readOnly={readOnly}
                  placeholder={placeholder}
                  type={
                    type as React.InputHTMLAttributes<HTMLInputElement>["type"]
                  }
                  className={cn(
                    "h-full flex-1 rounded-none border-0 bg-transparent px-4 py-0 text-[30px] leading-none text-fg-muted shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0",
                    suffix !== null && "pe-4",
                    inputClassName,
                  )}
                  value={
                    type === "date" && (field.value as unknown) instanceof Date
                      ? (field.value as Date).toISOString().split("T")[0]
                      : (field.value ?? "")
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
              </FormControl>
              {suffix !== null && (
                <span className="inline-flex h-full items-center border-s border-line px-4 text-sm leading-none text-fg-muted">
                  {suffix}
                </span>
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
