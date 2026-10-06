"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@orgtik/ui";
import { LOCALES, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

const NAMES: Record<AppLocale, string> = { en: "English", ar: "العربية", de: "Deutsch", fr: "Français", it: "Italiano" };

/** Signed-out people pick their language here; it's remembered for a year (i18n/request.ts reads it). */
export function LanguageSelect() {
  const t = useTranslations("Auth");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Select
      size="sm"
      aria-label={t("language")}
      value={locale}
      disabled={pending}
      className="w-36"
      options={LOCALES.map((l) => ({ value: l, label: <span lang={l} dir={l === "ar" ? "rtl" : "ltr"}>{NAMES[l]}</span> }))}
      onValueChange={(next) => {
        if (!next || next === locale) return;
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        start(() => router.refresh());
      }}
    />
  );
}
