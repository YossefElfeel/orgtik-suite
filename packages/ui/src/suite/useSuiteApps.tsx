"use client";
import { House, CheckSquareOffset, Folder, UsersThree, ChartLineUp, Megaphone, ChatsCircle, Plus, GearSix, Browser } from "@phosphor-icons/react";
import { useOrgtik } from "../provider/OrgtikProvider.js";
import { useSuite } from "./useSuite.js";
import { SUITE_TOOLS } from "./registry.js";
import { suiteText } from "./strings.js";
import type { ToolKey } from "./types.js";
import type { RailApp } from "../shell/SuiteShell.js";
import { staffToolLaunch } from "../auth/access.js";
export const SUITE_ICONS = { tasks: <CheckSquareOffset />, files: <Folder />, hr: <UsersThree />, crm: <ChartLineUp />, marketing: <Megaphone />, chat: <ChatsCircle /> };
export function useSuiteApps({ currentScope, currentHref, sosUrl, onNavigate }: { currentScope: string; currentHref: string; sosUrl: string; onNavigate?: (href: string) => void }): RailApp[] {
  const suite = useSuite(), { locale } = useOrgtik();
  const launch = staffToolLaunch(suite.session);
  const tools = launch?.tools.filter(tool => tool in SUITE_TOOLS) || suite.accessibleTools;
  const workspaceId = suite.session?.workspaceContext?.workspace.id || launch?.workspaceId;
  const root = sosUrl.replace(/\/$/, ""), apps: RailApp[] = [];
  const item = (id: string, label: string, href: string, icon: RailApp["icon"]) => ({ id, label, href, icon, ...(onNavigate && id !== currentScope ? { onNavigate: () => onNavigate(href) } : {}) });
  apps.push(item("global", suiteText(locale, "home"), root || "/", <House />));
  for (const tool of tools) { const definition = SUITE_TOOLS[tool]; const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""; apps.push(item(definition.scope, definition.labels[locale], definition.scope === currentScope ? currentHref : `${root}/go/${definition.scope}${query}`, SUITE_ICONS[tool as ToolKey])); }
  for (const staff of suite.session?.staffAccess?.apps || []) {
    const scope = staff === "admin" ? "platform_admin" : "website_manager";
    apps.push(item(scope, staff === "admin" ? "OrgTik Console" : "Website Manager", scope === currentScope ? currentHref : `${root}/go/${scope}`, staff === "admin" ? <GearSix /> : <Browser />));
  }
  if (suite.isOwner) apps.push(item("add_tool", suiteText(locale, "addTool"), `${root}/tools`, <Plus />));
  return apps;
}
