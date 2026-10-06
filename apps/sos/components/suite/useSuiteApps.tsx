"use client";
// The suite rail's data (FS-SOS-1; the Files adapter's twin). The library's AppRail owns the look;
// this file owns which apps the person can open and how they're handed over, so SoSBar goes.
import { useEffect, useState, type JSX } from "react";
import { Browser, ChartLineUp, ChatsCircle, CheckSquareOffset, Folder, House, Megaphone, Newspaper, ShieldCheck, SquaresFour, UsersThree } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { RailApp } from "@orgtik/ui";
import { API_URL } from "@/constants/env";

/** SOS is the suite's home: its scope is "global". */
export const CURRENT_SCOPE = "global";

export type Scope = { id: number; name: string; displayName: string; domain: string; isActive: boolean; description?: string };

// D-008: Phosphor everywhere. The scopes carry iconify ids; the rail ignores them.
export const APP_ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder />,
  task_manager: <CheckSquareOffset />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
  website_manager_legacy: <Newspaper />,
  platform_admin: <ShieldCheck />,
};

/**
 * Where a launcher tile goes: SOS's own /go/<app> page, which hands over with a one-time code
 * (FS-SOS-2, lib/handoff). The address carries no token.
 */
export function buildScopeHref(scope: Scope): string {
  return `/go/${encodeURIComponent(scope.name)}`;
}

let cache: { token: string; scopes: Scope[] } | null = null;

/** The person's active apps, from the identity API (cached per session). */
export function useMyScopes(token: string | null) {
  const [scopes, setScopes] = useState<Scope[] | null>(cache && cache.token === token ? cache.scopes : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!token) return;
    // Already fetched in this session (e.g. on Home): use it. The state may have started empty,
    // before the token was known, so it's set here rather than only at first render.
    if (cache && cache.token === token) {
      setScopes(cache.scopes);
      return;
    }
    let live = true;
    fetch(`${API_URL}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => {
        const list: Scope[] = (body?.data ?? []).filter((s: Scope) => s.isActive);
        cache = { token, scopes: list };
        if (live) setScopes(list);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [token]);
  return { scopes, failed };
}

/** A scope's name in the reader's language (the catalog), else the name the API gives it. */
export function useAppLabel() {
  const t = useTranslations("Suite");
  return (name: string, fallback: string) => (t.has(`apps.${name}`) ? t(`apps.${name}`) : fallback);
}

/** The rail: Home first, then the apps this person can open. */
export function useSuiteApps(token: string | null): RailApp[] {
  const label = useAppLabel();
  const { scopes } = useMyScopes(token);
  const home: RailApp = { id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "Home"), href: "/", icon: APP_ICONS.global };
  const apps = (scopes ?? [])
    .filter((s) => s.name !== CURRENT_SCOPE)
    .map((s) => ({ id: s.name, label: label(s.name, s.displayName), href: buildScopeHref(s), icon: APP_ICONS[s.name] ?? <SquaresFour /> }));
  return [home, ...apps];
}
