import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // The suite's five languages (D-001); Arabic reads right to left.
  locales: ["en", "ar", "de", "fr", "it"],
  defaultLocale: "en",
  localePrefix: "always",
});
export type Locale = (typeof routing)["locales"][number];
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
