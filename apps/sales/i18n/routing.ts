import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import localeConfig from "./locales.json";

export const routing = defineRouting(localeConfig);

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
