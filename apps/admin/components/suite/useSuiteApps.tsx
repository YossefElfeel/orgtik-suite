"use client";
// The suite rail's data: the apps this person can open, from SOS (/auth/my-scopes). Other apps open
// through SOS's /go/<scope>, which hands them a one-time code; a token never goes in an address
// (D-017).
import { useEffect, useState, type JSX } from "react";
import { Archive, Browser, ChartLineUp, ChatsCircle, CheckSquareOffset, Folder, House, Megaphone, ShieldCheck, SquaresFour, UsersThree } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import type { RailApp } from "@orgtik/ui";
import { SOS_API, SOS_URL } from "@/lib/env";

export const CURRENT_SCOPE = "platform_admin";

type Scope = { name: string; displayName: string; domain: string; isActive: boolean };

const ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder />,
  task_manager: <CheckSquareOffset />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
  website_manager_legacy: <Archive />,
  platform_admin: <ShieldCheck weight="fill" />,
};

export function useSuiteApps(token: string | null): RailApp[] {
  const t = useTranslations("Suite");
  const locale = useLocale();
  const [scopes, setScopes] = useState<Scope[]>([]);
  useEffect(() => {
    if (!token) return;
    let live = true;
    fetch(`${SOS_API}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => live && setScopes((body?.data ?? []).filter((s: Scope) => s.isActive)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [token]);
  const label = (name: string, fallback: string) => (t.has(name) ? t(name) : fallback);
  const apps: RailApp[] = scopes.map((s) => ({
    id: s.name,
    label: label(s.name, s.displayName),
    href: s.name === CURRENT_SCOPE ? `/${locale}` : `${SOS_URL}/go/${s.name}`,
    icon: ICONS[s.name] ?? <SquaresFour />,
  }));
  if (!apps.some((a) => a.id === CURRENT_SCOPE)) apps.unshift({ id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "Admin"), href: `/${locale}`, icon: ICONS[CURRENT_SCOPE]! });
  return [{ id: "global", label: label("global", "Home"), href: SOS_URL, icon: ICONS.global! }, ...apps];
}
