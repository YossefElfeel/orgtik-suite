import "server-only";

import { getRequestConfig } from "next-intl/server";
import localeConfig from "./locales.json";

const { locales, defaultLocale } = localeConfig;

type Tree = { [key: string]: string | Tree };

// A language's catalog laid over the English one, so a key missing in that language reads English
// instead of its path. The ~600 `t(key, { fallback })` calls relied on a next-intl option that
// doesn't exist, so a missing key showed "customers.table.status" in production (SAL-047 in the log).
function over(base: Tree, top: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(top)) {
    const b = out[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? over(b as Tree, v as Tree) : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  const english = (await import(`../messages/en.json`)).default as Tree;
  const own = locale === "en" ? english : ((await import(`../messages/${locale}.json`)).default as Tree);
  return { locale, messages: locale === "en" ? english : over(english, own) };
});
