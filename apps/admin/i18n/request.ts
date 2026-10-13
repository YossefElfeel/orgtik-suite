import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// Messages are one file per area (messages/<locale>/<area>.json) so areas can be built in parallel
// without touching the same file; each file is one namespace named after it.
const AREAS = ["common", "overview", "catalog", "pricing", "commerce", "customers", "billing", "services", "support", "system", "presentation", "console"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as never)) locale = routing.defaultLocale;
  const parts = await Promise.all(AREAS.map((a) => import(`../messages/${locale}/${a}.json`).then((m) => m.default as Record<string, unknown>)));
  return { locale, messages: Object.assign({}, ...parts) };
});
