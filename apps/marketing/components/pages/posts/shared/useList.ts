"use client";

import { useLocale } from "next-intl";

/** "Facebook, Instagram and X" in the reader's language. */
export function useListFormat() {
  const locale = useLocale();
  return (items: string[]) => new Intl.ListFormat(locale, { type: "conjunction" }).format(items);
}
