import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { SOS_URL } from "@/constants";

/** UI retirement only. Original screens remain in legacy.tsx; no old identifier
 * is treated as an authoritative platform plan, invoice or ticket identifier. */
export async function retiredSalesRoute(destination: "admin" | "account", replacement: string): Promise<null> {
  const locale = await getLocale();
  const origin = (process.env.NEXT_PUBLIC_SOS_URL || SOS_URL).replace(/\/$/, "");
  // Customer pages return to SOS in the original window, where its existing
  // tab session is retained. Home is not an app in the /go scope list.
  const href = destination === "admin"
    ? `${origin}/go/platform_admin?redirect=${encodeURIComponent(replacement)}`
    : `${origin}${replacement}`;
  redirect({ href, locale });
  return null;
}
