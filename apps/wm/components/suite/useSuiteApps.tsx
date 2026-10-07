"use client";
import { Browser, House, ShieldCheck } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useClientSession } from "@orgtik/ui/auth";
import type { RailApp } from "@orgtik/ui";
import { SOS_URL } from "@/lib/env";
export const CURRENT_SCOPE = "website_manager";
export function useSuiteApps(_token: string | null): RailApp[] {
  const session = useClientSession(), t = useTranslations("Suite"), locale = useLocale();
  const apps = session?.staffAccess?.apps || [];
  return [{ id: "global", label: t("global"), href: SOS_URL, icon: <House /> }, ...apps.map(target => ({
    id: target === "admin" ? "platform_admin" : "website_manager",
    label: t(target === "admin" ? "platform_admin" : "website_manager"),
    href: target === "wm" ? "/" + locale : "/" + locale + "/go/" + target,
    icon: target === "admin" ? <ShieldCheck /> : <Browser />,
  }))];
}
