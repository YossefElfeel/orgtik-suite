"use client";

// The suite rail's data (HR wave, FS-HR-4). The library's AppRail owns the look; this hook owns
// which apps the person can open. Each other app opens through SOS's /go/<app>, which hands over
// with a one-time code: no token in any address (D-017). sos-bar is no longer needed for this.
import { useEffect, useState, type JSX } from "react";
import { SquaresFour, UsersThree } from "@phosphor-icons/react";
import { SUITE_APP_ICONS } from "@/constants/suite-icons";
import { useLocale, useTranslations } from "next-intl";
import { SOS_URL } from "@somion/sos-bar";
import type { RailApp } from "@orgtik/ui";
import { SOS_API_URL } from "@/constants";
import type { SuiteScope } from "@/types/suite";

/** HR's scope, so the rail marks it current. */
export const CURRENT_SCOPE = "hr_system";

// HR is filled in its own rail (the current app); the others come from the shared map.
const ICONS: Record<string, JSX.Element> = { ...SUITE_APP_ICONS, hr_system: <UsersThree weight="fill" /> };

let cache: { token: string; scopes: SuiteScope[] } | null = null;

/** The suite apps this person can open, as rail entries: Home first, then the apps. */
export function useSuiteApps(token: string | null): RailApp[] {
  const t = useTranslations("suite");
  const locale = useLocale();
  const [scopes, setScopes] = useState<SuiteScope[]>(cache && cache.token === token ? cache.scopes : []);

  useEffect(() => {
    if (!token || (cache && cache.token === token)) return;
    let live = true;
    fetch(`${SOS_API_URL}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body: { data?: SuiteScope[] }) => {
        const list = (body.data ?? []).filter((s) => s.isActive);
        cache = { token, scopes: list };
        if (live) setScopes(list);
      })
      // Without the list the rail still shows Home and HR; the rest appear on the next load.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [token]);

  const label = (name: string, fallback: string) => (t.has(`apps.${name}`) ? t(`apps.${name}`) : fallback);
  const home: RailApp = { id: "global", label: label("global", "Home"), href: `${SOS_URL}/`, icon: ICONS.global };
  const apps: RailApp[] = scopes
    .filter((s) => s.name !== "global")
    .map((s) => ({
      id: s.name,
      label: label(s.name, s.displayName),
      href: s.name === CURRENT_SCOPE ? `/${locale}` : `${SOS_URL}/go/${encodeURIComponent(s.name)}`,
      icon: ICONS[s.name] ?? <SquaresFour />,
    }));
  if (!apps.some((a) => a.id === CURRENT_SCOPE)) {
    apps.unshift({ id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "HR"), href: `/${locale}`, icon: <UsersThree weight="fill" /> });
  }
  return [home, ...apps];
}
