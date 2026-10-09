"use client";
import { House, CheckSquareOffset, Folder, UsersThree, ChartLineUp, Megaphone, ChatsCircle, Plus, GearSix, Browser } from "@phosphor-icons/react";
import { useOrgtik } from "../provider/OrgtikProvider.js";
import { useSuite } from "./useSuite.js";
import { SUITE_TOOLS } from "./registry.js";
import { suiteText } from "./strings.js";
import type { ToolKey } from "./types.js";
import type { RailApp } from "../shell/SuiteShell.js";
export const SUITE_ICONS = { tasks: <CheckSquareOffset />, files: <Folder />, hr: <UsersThree />, crm: <ChartLineUp />, marketing: <Megaphone />, chat: <ChatsCircle /> };
export function useSuiteApps({ currentScope, currentHref, sosUrl, onNavigate }: { currentScope: string; currentHref: string; sosUrl: string; onNavigate?: (href: string) => void }): RailApp[] {
  const suite = useSuite(), { locale } = useOrgtik();
  const root = sosUrl.replace(/\/$/, ""), apps: RailApp[] = [];
  const item = (id: string, label: string, href: string, icon: RailApp["icon"]) => ({ id, label, href, icon, ...(onNavigate && id !== currentScope ? { onNavigate: () => onNavigate(href) } : {}) });
  if (suite.accessibleTools.length >= 2) apps.push(item("global", suiteText(locale, "home"), root || "/", <House />));
  for (const tool of suite.accessibleTools) { const definition = SUITE_TOOLS[tool]; apps.push(item(definition.scope, definition.labels[locale], definition.scope === currentScope ? currentHref : `${root}/go/${definition.scope}`, SUITE_ICONS[tool as ToolKey])); }
  for (const staff of suite.session?.staffAccess?.apps || []) apps.push(item(staff === "admin" ? "platform_admin" : "website_manager", staff === "admin" ? "OrgTik Console" : "Website Manager", `${root}/go/${staff === "admin" ? "platform_admin" : "website_manager"}`, staff === "admin" ? <GearSix /> : <Browser />));
  if (suite.isOwner) apps.push(item("add_tool", suiteText(locale, "addTool"), `${root}/tools`, <Plus />));
  return apps;
}
