"use client";
// The suite adapter (plan: sos-bar Stage B). The library's AppRail owns the look; this file owns
// the data; the hand-off is SOS's /go (D-017), so SoSBar is no longer needed in this app.
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
export const CURRENT_SCOPE = "file_manager";

type Scope = { id: number; name: string; displayName: string; domain: string; isActive: boolean };

// D-008: Phosphor everywhere. The scopes carry iconify ids; the rail ignores them.
const ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder weight="fill" />,
  task_manager: <CheckSquareOffset />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
};

/**
 * Where a launcher tile goes: SOS's /go/<app>, which hands over with a one-time code (D-017).
 * No token in any address; SOS sends a signed-out person to its sign-in first.
 */
export function buildScopeHref(scope: Scope): string {
  return `${SOS_URL}/go/${encodeURIComponent(scope.name)}`;
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
  const home: RailApp = { id: "global", label: label("global", "Home"), href: `${SOS_URL}/`, icon: ICONS.global };
  const apps = scopes.map((s) => ({
    id: s.name,
    label: label(s.name, s.displayName),
    href: s.name === CURRENT_SCOPE ? `/${locale}` : buildScopeHref(s),
    icon: ICONS[s.name] ?? <SquaresFour />,
  }));
  if (!apps.some((a) => a.id === CURRENT_SCOPE)) {
    apps.unshift({ id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "Files"), href: `/${locale}`, icon: ICONS[CURRENT_SCOPE]! });
  }
  return [home, ...apps];
}
