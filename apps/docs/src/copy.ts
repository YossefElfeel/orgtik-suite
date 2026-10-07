import { useOrgtik } from "@orgtik/ui";

/** Story copy in English and Arabic; the other languages show English for sample content (the library's own words are translated). */
export function useCopy<T>(copy: { en: T; ar: T }): T {
  const { locale } = useOrgtik();
  return locale === "ar" ? copy.ar : copy.en;
}
