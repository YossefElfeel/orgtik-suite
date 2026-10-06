"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  LocalizedFormFieldShell,
  useLocalizedFieldLocale,
} from "@/components/ui/form/LocalizedFormFieldShell";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogLanguageOption } from "@/types/catalog-language";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: string;
  label?: string;
  labelAddon?: ReactNode;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: "text" | "textarea";
  disabled?: boolean;
  readOnly?: boolean;
  languages?: CatalogLanguageOption[];
};

export default function LocalizedTextFormEle<T extends FieldValues>({
  form,
  name,
  label,
  labelAddon,
  placeholder,
  className,
  labelClassName,
  inputClassName,
  type = "text",
  disabled,
  readOnly,
  languages,
}: Props<T>) {
  const isTextarea = type === "textarea";
  const inputRefs = useRef<
    Partial<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});
  const parentPath = name as Path<T>;

  const { submitCount, errors } = form.formState;
  const fieldErrors = (errors as Record<string, unknown>)[name];

  const { languages: resolvedLanguages, activeLocale, setActiveLocale, getHasError } =
    useLocalizedFieldLocale({
      languages,
      getFieldError: (code) =>
        Boolean(form.getFieldState(`${name}.${code}` as Path<T>).error),
      submitCount,
      fieldErrors,
      focusRef: inputRefs,
    });

  return (
    <LocalizedFormFieldShell
      label={label}
      labelAddon={labelAddon}
      labelClassName={labelClassName}
      className={className}
      languages={resolvedLanguages}
      activeLocale={activeLocale}
      setActiveLocale={setActiveLocale}
      getHasError={getHasError}
    >
      {resolvedLanguages.map(({ code, direction }) => {
        const fieldPath = `${name}.${code}` as Path<T>;
        const isVisible = activeLocale === code || resolvedLanguages.length === 1;

        return (
          <div key={code} className={cn(!isVisible && "hidden")}>
            <FormField
              control={form.control}
              name={fieldPath}
              render={({ field, fieldState }) => (
                <FormItem className="gap-1">
                  <FormControl>
                    {isTextarea ? (
                      <Textarea
                        {...field}
                        ref={(element) => {
                          inputRefs.current[code] = element;
                          if (typeof field.ref === "function") {
                            field.ref(element);
                          }
                        }}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        dir={direction}
                        className={cn(
                          formStyles.textarea,
                          "min-h-[100px]",
                          fieldState.error &&
                            "border-destructive focus:ring-destructive/30",
                          inputClassName,
                        )}
                        value={field.value ?? ""}
                        disabled={disabled}
                        onFocus={() => setActiveLocale(code)}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          // Re-validate the whole localized map so sibling
                          // language errors clear once any language is filled.
                          void form.trigger(parentPath);
                        }}
                      />
                    ) : (
                      <Input
                        {...field}
                        ref={(element) => {
                          inputRefs.current[code] = element;
                          if (typeof field.ref === "function") {
                            field.ref(element);
                          }
                        }}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        type="text"
                        dir={direction}
                        className={cn(
                          formStyles.input,
                          fieldState.error &&
                            "border-destructive focus:ring-destructive/30",
                          inputClassName,
                        )}
                        value={field.value ?? ""}
                        disabled={disabled}
                        onFocus={() => setActiveLocale(code)}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          void form.trigger(parentPath);
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
    </LocalizedFormFieldShell>
  );
}
