"use client";

/**
 * CHATS - INTERFACE STRINGS (Chats wave, FS-CHT-3)
 *
 * Every string goes through `t(key, defaultText, vars)`. The key is looked up in the reader's catalog
 * (messages/<locale>.json, chosen by the root layout from the NEXT_LOCALE cookie); the English default
 * written at the call site is the fallback and the source of messages/en.json
 * (`node scripts/i18n-extract.mjs` regenerates it and fails on drift).
 *
 * Messages are ICU-lite: `{name}` fills a value, and `{n, plural, one {# person} other {# people}}`
 * picks the plural form for the reader's language through Intl.PluralRules (Arabic has six).
 *
 * The pseudo-locales are a development tool, not languages: they lengthen every string by 30%
 * (German) or 20% (French) so a layout can be checked against long text.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type AppLocale } from "./locale";
import { setFormatLocale } from "./time";
import { formatMessage, type Vars } from "./messages";

export { formatMessage };

export type Locale = AppLocale;
export type Pseudo = "off" | "de" | "fr";
export type Messages = Record<string, string>;

/** Lengthens a string by roughly `factor` without making it unreadable. */
const pseudo = (text: string, factor: number): string => {
  const target = Math.round(text.length * factor);
  const pad = target - text.length;
  if (pad <= 0) return text;
  /* Extend the longest word so wrapping behaves like real German compounds. */
  const words = text.split(" ");
  let longestAt = 0;
  words.forEach((w, i) => {
    if (w.length > (words[longestAt]?.length ?? 0)) longestAt = i;
  });
  const filler = "erungsverwaltung".slice(0, Math.max(2, pad));
  const targetWord = words[longestAt];
  if (targetWord) words[longestAt] = targetWord + filler;
  return words.join(" ");
};

interface I18nValue {
  locale: Locale;
  /** Sets the person's language (the suite cookie) and re-renders the app in it. */
  setLocale: (l: Locale) => void;
  pseudo: Pseudo;
  setPseudo: (p: Pseudo) => void;
  t: (key: string, defaultText: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const router = useRouter();
  const [pseudoMode, setPseudo] = useState<Pseudo>("off");
  // Dates and times in lib/time follow the same language.
  setFormatLocale(locale);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const t = useCallback(
    (key: string, defaultText: string, vars?: Vars) => {
      const out = formatMessage(messages[key] ?? defaultText, vars, locale);
      if (pseudoMode === "de") return pseudo(out, 1.3);
      if (pseudoMode === "fr") return pseudo(out, 1.2);
      return out;
    },
    [messages, locale, pseudoMode],
  );

  const value = useMemo(() => ({ locale, setLocale, pseudo: pseudoMode, setPseudo, t }), [locale, setLocale, pseudoMode, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Convenience: `const t = useT()` reads better at call sites. */
export function useT() {
  return useI18n().t;
}
