import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, fromAcceptLanguage, isLocale } from "./config";

// The customer dashboard's areas (Phase E, USR) keep their messages apart, one file per area and
// one namespace per file (messages/usr/<locale>/<area>.json), so areas grow without editing the
// one big catalog.
const USR_AREAS = ["workspace", "tools", "billing", "team", "services", "support", "account", "invitations", "mailbox"] as const;

// The person's choice (the cookie the language menu sets), else their browser's language, else
// English. No locale in the URL: see config.ts.
export default getRequestConfig(async () => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(chosen) ? chosen : (fromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE);
  const base = (await import(`../messages/${locale}.json`)).default;
  const areas = await Promise.all(USR_AREAS.map((a) => import(`../messages/usr/${locale}/${a}.json`).then((m) => m.default as Record<string, unknown>)));
  return { locale, messages: Object.assign({}, base, ...areas) };
});
