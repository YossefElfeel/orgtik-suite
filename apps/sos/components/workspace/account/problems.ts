"use client";
// What a failed platform call says, in the reader's language (the API's own messages are English).
// A screen shows it where the action happened: field errors on their fields, the rest next to the
// button or in the dialog. Shared by the team, services, support and account screens.
import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Localized, PlatformError } from "@/redux/features/platform/platformApi";

export function usePlatformProblem() {
  const t = useTranslations("Account.errors");
  return useCallback(
    (e: unknown): string => {
      const p = (e ?? {}) as Partial<PlatformError>;
      if (p.status === "offline") return t("offline");
      if (p.code === "suspended" || p.status === 423) return t("suspended");
      if (p.code === "read_only") return t("readOnly");
      if (p.status === 403) return t("forbidden");
      if (p.status === 404) return t("notFound");
      if (p.code === "wrong_state" || p.status === 409) return t("wrongState");
      if (p.status === 422) return t("invalid");
      return t("failed");
    },
    [t],
  );
}

/** A catalogue name in the reader's language, else English. */
export function useLocalized() {
  const locale = useLocale() as keyof Localized;
  return useCallback((v: Localized | undefined | null) => (v ? (v[locale] ?? v.en) : ""), [locale]);
}

/** The API's field errors, or none. */
export const fieldErrorsOf = (e: unknown): Record<string, string> => ((e as PlatformError | undefined)?.fieldErrors ?? {}) as Record<string, string>;
