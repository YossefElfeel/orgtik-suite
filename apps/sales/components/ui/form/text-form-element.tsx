"use client";
import { useTranslations } from "next-intl";

import { useState, type ReactNode } from "react";
import type React from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";
import { Eye, EyeOff } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { DateTimeFormElement } from "./date-time-form-element";

const globalConfig = {
  styles: {
    mainClassName: formStyles.item,
    inputClassName: formStyles.input,
    textareaClassName: cn(formStyles.textarea, "min-h-[100px]"),
    labelClassName: formStyles.label,
    inlineAdornment:
      "absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground group-focus-within:text-primary pointer-events-none",
    inlinePrefixPlaceholder: "left-4",
    inlineSuffixPlaceholder: "right-4",
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

  disabled?: boolean;
  readOnly?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  icon?: ReactNode;
  /** Trailing text/adornment inside the input (e.g. `%`). */
  suffix?: ReactNode;
  /** When `type="password"`, shows an eye toggle to reveal/hide the value. Defaults to true. */
  showPasswordToggle?: boolean;
  /**
   * Only when `type="date"`: form field stores `YYYY-MM-DD` (default) or a `Date`
   * (use with `z.date()` / `z.coerce.date()`).
   */
  dateFormValue?: "string" | "date";
  /** Only when `type="date"`: disable all past dates in the calendar. */
  disablePast?: boolean;
  /** When `type="number"`, empty input stores `null` instead of `0`. */
  allowEmptyNumber?: boolean;
  /** When `type="number"`, allows negative integers (e.g. basement floor `-1`). */
  allowNegativeNumber?: boolean;
  /** Shows a gray `{tCommon("optional")}` suffix next to the label. */
  optional?: boolean;
  /** Shows a red `*` next to the label. */
  required?: boolean;
}

function sanitizeDecimalInput(raw: string): string {
  // Allow empty, digits, and a single decimal separator. Accept "," but store ".".
  const normalized = raw.replace(/,/g, ".");
  const stripped = normalized.replace(/[^0-9.]/g, "");
  const firstDotIndex = stripped.indexOf(".");
  if (firstDotIndex === -1) return stripped;
  const before = stripped.slice(0, firstDotIndex + 1);
  const after = stripped.slice(firstDotIndex + 1).replace(/\./g, "");
  return `${before}${after}`;
}

function sanitizeSignedIntegerInput(raw: string): string {
  const trimmed = raw.trim();
  const isNegative = trimmed.startsWith("-");
  const digits = (isNegative ? trimmed.slice(1) : trimmed).replace(/\D/g, "");
  if (!digits) return isNegative ? "-" : "";
  return isNegative ? `-${digits}` : digits;
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
  disabled,
  readOnly,
  inputProps,
  icon,
  suffix,
  showPasswordToggle = true,
  dateFormValue = "string",
  disablePast = false,
  allowEmptyNumber: allowEmptyNumberProp,
  allowNegativeNumber = false,
  optional = false,
  required = false,
}: CustomInputProps<T>) {
  const tCommon = useTranslations("common");
  const [showPassword, setShowPassword] = useState(false);
  const [negativeNumberDraft, setNegativeNumberDraft] = useState<string | null>(
    null,
  );
  const isTextarea = type === "textarea";
  const isNumberInput = type === "number";
  const allowEmptyNumber = allowEmptyNumberProp ?? isNumberInput;
  const isPasswordInput = type === "password";
  const hasLeadingIcon = Boolean(icon);
  const hasSuffix = Boolean(suffix);
  const hasPasswordToggle = isPasswordInput && showPasswordToggle;
  const resolvedInputType = isPasswordInput
    ? showPassword
      ? "text"
      : "password"
    : (type as React.InputHTMLAttributes<HTMLInputElement>["type"]);

  if (type === "date") {
    return (
      <DateTimeFormElement<T, Path<T>>
        form={form}
        name={name}
        label={label}
        placeholder={placeholder}
        disabled={Boolean(disabled || readOnly)}
        // className={"h-12! "}
        inputClassName={inputClassName}
        labelClassName={labelClassName}
        buttonClassName={inputClassName}
        showTime={false}
        dateValueAs={dateFormValue === "string" ? "yyyy-mm-dd" : "date"}
        disablePast={disablePast}
      />
    );
  }

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
              {required ? (
                <span className={formStyles.required} aria-hidden>
                  *
                </span>
              ) : null}
              {optional ? (
                <span className={formStyles.optional}>{tCommon("optional")}</span>
              ) : null}
            </FormLabel>
          )}
          <FormControl className={readOnly ? "bg-muted/80!" : ""}>
            {isTextarea ? (
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
            ) : (
              <div className="relative group">
                {icon ? (
                  <span className="pointer-events-none absolute inset-s-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-greyscale-400 [&_svg]:size-5">
                    {icon}
                  </span>
                ) : null}
                <Input
                  {...field}
                  {...inputProps}
                  ref={field.ref}
                  readOnly={readOnly}
                  placeholder={placeholder}
                  type={resolvedInputType}
                  inputMode={isNumberInput ? "decimal" : inputProps?.inputMode}
                  pattern={
                    isNumberInput
                      ? allowNegativeNumber
                        ? "^-?[0-9]*[\\.,]?[0-9]*$"
                        : "^[0-9]*[\\.,]?[0-9]*$"
                      : inputProps?.pattern
                  }
                  step={
                    type === "number" ? (inputProps?.step ?? "1") : undefined
                  }
                  className={cn(
                    globalConfig.styles.inputClassName,
                    hasLeadingIcon && "ps-10",
                    (hasPasswordToggle || hasSuffix) && "pe-10",
                    inputClassName,
                  )}
                  value={
                    negativeNumberDraft !== null
                      ? negativeNumberDraft
                      : field.value === undefined || field.value === null
                        ? ""
                        : field.value
                  }
                  disabled={disabled}
                  onBlur={(e) => {
                    if (allowNegativeNumber && negativeNumberDraft === "-") {
                      setNegativeNumberDraft(null);
                      field.onChange(allowEmptyNumber ? null : 0);
                    }
                    field.onBlur();
                    inputProps?.onBlur?.(e);
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (isNumberInput) {
                      const sanitized = allowNegativeNumber
                        ? sanitizeSignedIntegerInput(raw)
                        : sanitizeDecimalInput(raw);

                      if (sanitized.trim() === "") {
                        setNegativeNumberDraft(null);
                        field.onChange(allowEmptyNumber ? null : 0);
                      } else if (allowNegativeNumber && sanitized === "-") {
                        setNegativeNumberDraft("-");
                      } else {
                        setNegativeNumberDraft(null);
                        field.onChange(Number(sanitized));
                      }
                    } else {
                      field.onChange(raw);
                    }
                    inputProps?.onChange?.(e);
                    form.trigger(name);
                  }}
                />
                {suffix ? (
                  <span
                    className={cn(
                      globalConfig.styles.inlineAdornment,
                      "inset-e-3 text-sm font-medium",
                    )}
                  >
                    {suffix}
                  </span>
                ) : null}
                {hasPasswordToggle ? (
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute cursor-pointer inset-e-3 top-1/2 -translate-y-1/2 text-greyscale-400 transition-colors hover:text-greyscale-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                ) : null}
              </div>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
