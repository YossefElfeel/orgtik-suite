"use client";
// The suite adapter (plan: sos-bar Stage B). The library's AppRail owns the look; this file owns
// the data and the hand-off, so SoSBar is no longer needed in this app.
import { useEffect, useState, type JSX } from "react";
import {
  Browser,
  ChartLineUp,
  ChatsCircle,
  CheckSquareOffset,
  Folder,
  House,
  Megaphone,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { SOS_API_URL } from "@/constants/env";
import { SOS_URL } from "@somion/sos-bar";
import type { RailApp } from "@orgtik/ui";

/** This app's scope, so the rail can mark it current. */
export const CURRENT_SCOPE = "task_manager";

type Scope = { id: number; name: string; displayName: string; domain: string; isActive: boolean };

// D-008: Phosphor everywhere. The scopes carry iconify ids; the rail ignores them.
const ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder />,
  task_manager: <CheckSquareOffset weight="fill" />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
};

/**
 * Where a launcher tile goes. Today's hand-off puts the token in the address, which the other
 * apps' /auth pages read: the same contract SoSBar used. It lives here alone so D-017 (a
 * one-time code instead of the token) changes one function.
 */
export function buildScopeHref(scope: Scope, token: string | null, locale: string): string {
  if (!token) return scope.domain;
  return `${scope.domain}/${locale}/auth?token=${encodeURIComponent(token)}`;
}

let cache: { token: string; scopes: Scope[] } | null = null;

/** The suite apps this person can open, as rail entries: Home first, then the scopes. */
export function useSuiteApps(token: string | null): RailApp[] {
  const t = useTranslations("Suite");
  const locale = useLocale();
  const [scopes, setScopes] = useState<Scope[]>(cache && cache.token === token ? cache.scopes : []);

  useEffect(() => {
    if (!token || (cache && cache.token === token)) return;
    let live = true;
    fetch(`${SOS_API_URL}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => {
        const list: Scope[] = (body?.data ?? []).filter((s: Scope) => s.isActive);
        cache = { token, scopes: list };
        if (live) setScopes(list);
      })
      // Without the list the rail still shows Home and this app; the rest appear on the next load.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [token]);

  const label = (name: string, fallback: string) => (t.has(`apps.${name}`) ? t(`apps.${name}`) : fallback);
  const home: RailApp = { id: "global", label: label("global", "Home"), href: token ? `${SOS_URL}/${locale}` : SOS_URL, icon: ICONS.global };
  const apps = scopes.map((s) => ({
    id: s.name,
    label: label(s.name, s.displayName),
    href: s.name === CURRENT_SCOPE ? `/${locale}` : buildScopeHref(s, token, locale),
    icon: ICONS[s.name] ?? <SquaresFour />,
  }));
  if (!apps.some((a) => a.id === CURRENT_SCOPE)) {
    apps.unshift({ id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "Tasks"), href: `/${locale}`, icon: ICONS[CURRENT_SCOPE]! });
  }
  return [home, ...apps];
}
