"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import LocalizedLanguageTabs from "@/components/shared/LocalizedLanguageTabs";
import { FormLabel } from "@/components/ui/form";
import { useLocalizedValidationAttempt } from "@/components/ui/form/LocalizedValidationFocus";
import { CATALOG_LANGUAGE_OPTIONS } from "@/lib/i18n/catalog-languages";
import { getDefaultFormLanguage } from "@/lib/form/localized-fields";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";
import type { CatalogLanguageOption } from "@/types/catalog-language";
import type { SupportedLanguage } from "@/types/localized";

type LocalizedFormFieldShellProps = {
  label?: string;
  labelAddon?: ReactNode;
  labelClassName?: string;
  className?: string;
  languages?: CatalogLanguageOption[];
  activeLocale: SupportedLanguage;
  setActiveLocale: (code: SupportedLanguage) => void;
  getHasError?: (code: SupportedLanguage) => boolean;
  children: ReactNode;
};

export function LocalizedFormFieldShell({
  label,
  labelAddon,
  labelClassName,
  className,
  languages = CATALOG_LANGUAGE_OPTIONS,
  activeLocale,
  setActiveLocale,
  getHasError,
  children,
}: LocalizedFormFieldShellProps) {
  const showTabs = languages.length > 1;

  return (
    <div className={cn(formStyles.item, className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        {label ? (
          <div className="flex min-w-0 items-center gap-1">
            <FormLabel className={cn(formStyles.label, labelClassName)}>
              {label}
            </FormLabel>
            {labelAddon}
          </div>
        ) : (
          <span />
        )}

        {showTabs ? (
          <LocalizedLanguageTabs
            languages={languages}
            activeLanguage={activeLocale}
            setActiveLanguage={setActiveLocale}
            size="sm"
            getHasError={getHasError}
          />
        ) : null}
      </div>

      {children}
    </div>
  );
}

type UseLocalizedFieldLocaleOptions = {
  languages?: CatalogLanguageOption[];
  getFieldError: (code: SupportedLanguage) => boolean;
  submitCount: number;
  /** Nested RHF errors for this localized field — used after submit to pick the invalid tab. */
  fieldErrors?: unknown;
  focusRef?: {
    current: Partial<Record<SupportedLanguage, HTMLElement | null>>;
  };
};

export function useLocalizedFieldLocale({
  languages = CATALOG_LANGUAGE_OPTIONS,
  getFieldError,
  submitCount,
  fieldErrors,
  focusRef,
}: UseLocalizedFieldLocaleOptions) {
  const [activeLocale, setActiveLocale] = useState<SupportedLanguage>(() =>
    getDefaultFormLanguage(languages),
  );
  const validationAttempt = useLocalizedValidationAttempt();
  const lastHandledSubmitCountRef = useRef(0);
  const lastHandledValidationAttemptRef = useRef(0);
  const pendingFocusLocaleRef = useRef<SupportedLanguage | null>(null);
  const getFieldErrorRef = useRef(getFieldError);
  getFieldErrorRef.current = getFieldError;

  useEffect(() => {
    if (!languages.some((language) => language.code === activeLocale)) {
      setActiveLocale(getDefaultFormLanguage(languages));
    }
  }, [languages, activeLocale]);

  // Jump to the first invalid language only after submit or an explicit Next validation.
  useEffect(() => {
    const shouldHandleSubmit = submitCount > lastHandledSubmitCountRef.current;
    const shouldHandleAttempt =
      validationAttempt > lastHandledValidationAttemptRef.current;

    if (!shouldHandleSubmit && !shouldHandleAttempt) {
      return;
    }

    const firstErrorLanguage = languages.find(({ code }) => {
      if (hasLocaleFieldError(fieldErrors, code)) {
        return true;
      }

      return getFieldErrorRef.current(code);
    });

    // Errors may not have flushed into this field yet — wait for `fieldErrors` update.
    if (!firstErrorLanguage) {
      return;
    }

    if (shouldHandleSubmit) {
      lastHandledSubmitCountRef.current = submitCount;
    }
    if (shouldHandleAttempt) {
      lastHandledValidationAttemptRef.current = validationAttempt;
    }

    pendingFocusLocaleRef.current = firstErrorLanguage.code;
    setActiveLocale(firstErrorLanguage.code);
  }, [submitCount, validationAttempt, fieldErrors, languages]);

  useEffect(() => {
    const code = pendingFocusLocaleRef.current;
    if (!code || activeLocale !== code) {
      return;
    }

    pendingFocusLocaleRef.current = null;
    focusRef?.current[code]?.focus();
  }, [activeLocale, focusRef]);

  return {
    languages,
    activeLocale,
    setActiveLocale,
    getHasError: (code: SupportedLanguage) =>
      hasLocaleFieldError(fieldErrors, code) || getFieldError(code),
  };
}

function hasLocaleFieldError(fieldErrors: unknown, code: string) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return false;
  }

  const entry = (fieldErrors as Record<string, unknown>)[code];
  if (!entry || typeof entry !== "object") {
    return false;
  }

  return "message" in entry || "type" in entry || "types" in entry;
}
