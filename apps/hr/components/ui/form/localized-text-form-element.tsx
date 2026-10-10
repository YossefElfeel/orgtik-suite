"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@orgtik/ui";
import { Textarea } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

type LocaleCode = "en" | "de" | "fr" | "it";

const LOCALES: Array<{ code: LocaleCode; label: string; flag: string }> = [
  { code: "en", label: "EN", flag: "/images/flags/united-kingdom.png" },
  { code: "de", label: "DE", flag: "/images/flags/german.png" },
  { code: "fr", label: "FR", flag: "/images/flags/france.png" },
  { code: "it", label: "IT", flag: "/images/flags/italy.png" },
];

interface LocalizedTextFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  /** Base field name pointing to the localized object, e.g. "name" */
  name: string;
  label?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: "text" | "textarea";
  disabled?: boolean;
  readOnly?: boolean;
}

export default function LocalizedTextFormEle<T extends FieldValues>({
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
}: LocalizedTextFormEleProps<T>) {
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("en");
  const isTextarea = type === "textarea";
  const inputRefs = useRef<Partial<Record<LocaleCode, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  // When submit is attempted and this field has errors, switch to the first invalid locale tab
  const { submitCount, errors } = form.formState;

  useEffect(() => {
    if (submitCount === 0) return;
    // Defer so we run after the resolver has set errors (validation can be async)
    const timer = setTimeout(() => {
      const firstErrorLocale = LOCALES.find(({ code }) => {
        const fieldPath = `${name}.${code}` as Path<T>;
        return !!form.getFieldState(fieldPath).error;
      });
      if (firstErrorLocale) {
        setActiveLocale(firstErrorLocale.code);
        inputRefs.current[firstErrorLocale.code]?.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [submitCount, errors, form, name]);

  return (
    <div className={cn(formStyles.item, className)}>
      <div className="flex items-center justify-between border-b border-border">
        {label && (
          <FormLabel className={cn(formStyles.label, labelClassName)}>
            {label}
          </FormLabel>
        )}

        {/* Language tabs */}
        <div className="flex items-center gap-0.5">
          {LOCALES.map(({ code, label: localeLabel, flag }) => {
            const fieldPath = `${name}.${code}` as Path<T>;
            const fieldState = form.getFieldState(fieldPath);
            const hasError = !!fieldState.error;
            const isActive = activeLocale === code;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setActiveLocale(code)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all duration-150 rounded-t",
                  isActive
                    ? hasError
                      ? "text-destructive border-b-2 border-destructive -mb-px bg-destructive/5"
                      : "text-primary border-b-2 border-primary -mb-px"
                    : hasError
                      ? "text-destructive/70 hover:text-destructive"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Image
                  src={flag}
                  alt={localeLabel}
                  width={18}
                  height={18}
                  className="rounded-sm object-cover shrink-0"
                />
                <span>{localeLabel}</span>
                {hasError && !isActive && (
                  <span className="absolute top-1 end-1 size-1.5 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Inputs per locale */}
      {LOCALES.map(({ code }) => {
        const fieldPath = `${name}.${code}` as Path<T>;
        return (
          <div key={code} className={cn(activeLocale !== code && "hidden")}>
            <FormField
              control={form.control}
              name={fieldPath}
              render={({ field, fieldState }) => (
                <FormItem className="gap-1">
                  <FormControl>
                    {isTextarea ? (
                      <Textarea
                        {...field}
                        ref={(el) => {
                          inputRefs.current[code] = el;
                          if (typeof field.ref === "function") field.ref(el);
                        }}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        className={cn(
                          formStyles.textarea,
                          "min-h-[100px]",
                          // fieldState.error && "border-destructive focus:ring-destructive/30",
                          inputClassName
                        )}
                        value={field.value ?? ""}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          form.trigger(fieldPath);
                        }}
                      />
                    ) : (
                      <Input
                        {...field}
                        ref={(el) => {
                          inputRefs.current[code] = el;
                          if (typeof field.ref === "function") field.ref(el);
                        }}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        type="text"
                        className={cn(
                          formStyles.input,
                          fieldState.error && "border-destructive focus:ring-destructive/30",
                          inputClassName
                        )}
                        value={field.value ?? ""}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          form.trigger(fieldPath);
                        }}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
