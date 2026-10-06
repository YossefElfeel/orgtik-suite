"use client";

// A role's name in the reader's language. Roles come from the API as keys ("project_manager");
// known ones are translated (the Roles catalog), any other is shown as readable words, never as
// the raw key.
import { useTranslations } from "next-intl";

export function useRoleLabel() {
  const t = useTranslations("Roles");
  return (key: string) => (t.has(key) ? t(key) : key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()));
}
