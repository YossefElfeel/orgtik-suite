"use client";
import { type ReactNode, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Archive, Kanban, Briefcase, CrownSimple, FileText, Pulse, SquaresFour, UserCircle, UserGear, UsersThree, Wallet, IdentificationBadge, Storefront, Truck, GearSix } from "@phosphor-icons/react";
import { demoRuntime, MenuLinkItem, NoPermissionState, Sidebar, SuiteFrame as SharedSuiteFrame, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { handoffCode, readClientSession, signOutSession, useClientSession } from "@orgtik/ui/auth";
import { SOS_URL } from "@/constants";
import { API_URL, AUTH_API_URL } from "@/constants";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useRole } from "@/hooks/useRole";
import { NAV_ITEMS } from "@/lib/navigation";
import { canAccessRoute, getNavLabel } from "@/lib/role-access";
import CrmScopeGate from "@/providers/CrmScopeGate";

const ICONS: Record<string, ReactNode> = { "/companies": <Briefcase />, "/reports": <Pulse />, "/projects/pipeline": <Kanban />, "/": <SquaresFour />, "/customers": <UsersThree />, "/customers/pipeline": <Kanban />, "/offers": <FileText />, "/projects": <Briefcase />, "/salesman": <IdentificationBadge />, "/commissions": <Wallet />, "/loyalty": <CrownSimple />, "/activity-feed": <Pulse />, "/archive": <Archive />, "/user-management": <UserGear />, "/service-catalog": <Storefront />, "/service-requests": <Truck />, "/admin": <GearSix /> };
const SELL = ["/", "/customers", "/customers/pipeline", "/offers", "/projects", "/projects/pipeline", "/companies", "/reports"];
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Shell"), tn = useTranslations("nav"), ts = useTranslations("Suite"), te = useTranslations("Errors"), locale = useLocale(), pathname = usePathname(), router = useRouter(), dispatch = useAppDispatch(), token = useAppSelector(state => state.auth.token), { role, user, fullName } = useRole(), [navigationError, setNavigationError] = useState(false), [logoutError, setLogoutError] = useState(false);
  const session = useClientSession();
  const internal = session?.workspaceContext?.workspace.kind === "orgtik_internal";
  const context = session?.workspaceContext;
  const canAdmin = Boolean(context?.tools.crm?.canWrite && !context.actor.readOnly && (["owner", "admin"].includes(context.member.role) || context.tools.crm.roles.some(value => ["admin", "manager"].includes(value))));
  const visible = NAV_ITEMS.filter(item => !item.frozen && item.roles.includes(role) && (!item.path.startsWith("/service-") || internal) && (item.path !== "/admin" || canAdmin));
  const at = (path: string) => path === "/" ? pathname === "/" : path === "/service-catalog" ? pathname === "/catalog" || pathname.startsWith("/catalog/") || pathname === path || pathname.startsWith(path + "/") : pathname === path || pathname.startsWith(path + "/");
  const current = visible.filter(item => at(item.path)).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const items = visible.map(item => ({ label: tn(getNavLabel(item, role)), href: `/${locale}${item.path === "/" ? "" : item.path === "/service-catalog" ? "/catalog" : item.path}`, icon: ICONS[item.path], active: item.path === current }));
  const sections: SidebarSection[] = [{ items: items.filter((_, index) => SELL.includes(visible[index].path)) }, { label: t("sectionServices"), items: items.filter((_, index) => visible[index].path.startsWith("/service-")) }, { label: t("sectionTeam"), items: items.filter((_, index) => !SELL.includes(visible[index].path) && !visible[index].path.startsWith("/service-")) }].filter(section => section.items.length);
  const navigate = async (href: string) => {
    const session = readClientSession();
    if (!session) { window.location.assign(href); return; }
    try {
      setNavigationError(false);
      const url = new URL(href, SOS_URL), destination = url.pathname + url.search;
      const code = await handoffCode(AUTH_API_URL, session.tokens.accessToken, "suite");
      window.location.assign(`${SOS_URL}/auth/handoff?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(destination)}`);
    } catch { setNavigationError(true); }
  };
  const signOut = async () => { setLogoutError(false); try { const currentToken = readClientSession()?.tokens.accessToken || token; if (currentToken) await signOutSession(AUTH_API_URL, currentToken); dispatch(logoutUser()); window.location.assign(SOS_URL); } catch { setLogoutError(true); } };
  return <SharedSuiteFrame apiUrl={API_URL} sosUrl={SOS_URL} currentTool="crm" currentScope="sales" currentHref={`/${locale}`} width="wide" onNavigate={href => void navigate(href)}
    demo={{ runtime: demoRuntime(process.env.NEXT_PUBLIC_DEMO_API, process.env.NEXT_PUBLIC_DEMO_WEB_URLS, process.env.NEXT_PUBLIC_DEMO_SOS_API), enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "sales", onLocaleChange: next => router.replace(pathname, { locale: next }) }}
    sidebar={<Sidebar title={ts("appName")} sections={sections} />}
    userMenu={user ? <UserMenu name={fullName || ""} email={String(user.email || "")} avatarSrc={typeof user.avatar === "string" ? user.avatar : undefined} locales={routing.locales as readonly Locale[]} onLocaleChange={next => router.replace(pathname, { locale: next })} onSignOut={signOut}><MenuLinkItem href={`/${locale}/profile`} icon={<UserCircle />}>{t("profile")}</MenuLinkItem></UserMenu> : null}>
    {logoutError ? <p role="alert" className="mb-4 text-body-sm text-danger">{te("logoutUnavailable")}</p> : null}{navigationError ? <p role="alert" className="mb-4 text-body-sm text-danger">{te("handoffUnavailable")}</p> : null}<CrmScopeGate>{canAccessRoute(role, pathname) ? children : <NoPermissionState titleAs="h1" title={te("noAccessTitle")} description={te("noAccessBody")} />}</CrmScopeGate>
  </SharedSuiteFrame>;
}
