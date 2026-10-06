"use client";

/**
 * CHATS - THE SUITE RAIL (Chats wave, FS-CHT-5)
 *
 * The library's AppRail owns the look; this file owns which apps the person can open. Each other app
 * opens through SOS's /go/<app>, which hands over with a one-time code, so no token travels in an
 * address. Without the suite (the standalone prototype) the rail shows Chats alone.
 */

import { useEffect, useState, type JSX } from "react";
import { Browser, ChartLineUp, ChatsCircle, CheckSquareOffset, Folder, House, Megaphone, Newspaper, SquaresFour, UsersThree } from "@phosphor-icons/react";
import { AppRail, type RailApp } from "@orgtik/ui";
import { useT } from "@/lib/i18n";
import { msgText } from "@/lib/messages";
import { SOS_API_URL, SOS_URL, readSuiteSession } from "@/lib/suite-session";

/** Chats' own scope in the suite. */
const CURRENT_SCOPE = "hq";

type Scope = { name: string; displayName: string; isActive: boolean };

const ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder />,
  task_manager: <CheckSquareOffset />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
  website_manager_legacy: <Newspaper />,
};

/** The suite's app names, in the reader's language (the same names the other apps use). */
const NAMES: Record<string, string> = {
  global: msgText("suite.app.global", "Home"),
  file_manager: msgText("suite.app.file_manager", "Files"),
  task_manager: msgText("suite.app.task_manager", "Tasks"),
  hq: msgText("suite.app.hq", "Chats"),
  hr_system: msgText("suite.app.hr_system", "HR"),
  digital_marketing: msgText("suite.app.digital_marketing", "Marketing"),
  sales: msgText("suite.app.sales", "CRM"),
  website_manager: msgText("suite.app.website_manager", "Website"),
  website_manager_legacy: msgText("suite.app.website_manager_legacy", "Old CMS"),
};

let cache: { token: string; scopes: Scope[] } | null = null;

export function ChatsRail() {
  const t = useT();
  const [token] = useState(() => readSuiteSession()?.token ?? null);
  const [scopes, setScopes] = useState<Scope[] | null>(cache && cache.token === token ? cache.scopes : null);

  useEffect(() => {
    if (!token || !SOS_API_URL || (cache && cache.token === token)) return;
    let live = true;
    fetch(`${SOS_API_URL}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body: { data?: Scope[] }) => {
        const list = (body.data ?? []).filter((s) => s.isActive);
        cache = { token, scopes: list };
        if (live) setScopes(list);
      })
      .catch(() => {
        /* The rail then shows Chats alone; the apps are still reachable from SOS. */
      });
    return () => {
      live = false;
    };
  }, [token]);

  const label = (name: string, fallback: string) => (NAMES[name] ? t(`suite.app.${name}`, NAMES[name]) : fallback);
  const homeHref = SOS_URL ? `${SOS_URL}/` : "/hq/office";
  const self: RailApp = { id: CURRENT_SCOPE, label: label(CURRENT_SCOPE, "Chats"), href: "/hq/office", icon: ICONS.hq };
  const others: RailApp[] = (scopes ?? [])
    .filter((s) => s.name !== CURRENT_SCOPE)
    .map((s) => ({
      id: s.name,
      label: label(s.name, s.displayName),
      href: s.name === "global" ? homeHref : `${SOS_URL}/go/${encodeURIComponent(s.name)}`,
      icon: ICONS[s.name] ?? <SquaresFour />,
    }));
  // Home first, then the apps in the suite's order, Chats among them.
  const home = others.find((a) => a.id === "global");
  const rest = others.filter((a) => a.id !== "global");
  const ordered = scopes ? [...(home ? [home] : []), ...insertInOrder(rest, self, scopes)] : [self];
  return <AppRail apps={ordered} current={CURRENT_SCOPE} homeHref={homeHref} />;
}

function insertInOrder(rest: RailApp[], self: RailApp, scopes: Scope[]): RailApp[] {
  const at = scopes.filter((s) => s.name !== "global").findIndex((s) => s.name === CURRENT_SCOPE);
  if (at < 0) return [self, ...rest];
  return [...rest.slice(0, at), self, ...rest.slice(at)];
}
