"use client";
import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, CreditCard, EnvelopeSimple, EyeSlash, GearSix, Globe, Headset, House, Invoice, Receipt, Briefcase, SquaresFour, Storefront, UserCircle, UsersThree, UsersFour } from "@phosphor-icons/react";
import { BannerRegion, MenuGroup, MenuItem, MenuLinkItem, Sidebar, SuiteFrame as SharedSuiteFrame, UserMenu, demoRuntime, suiteRequest, toast, useStrings, type Locale, type SidebarItem, type SidebarSection } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { useExitImpersonationMutation, useLogoutMutation } from "@/redux/features/auth/authApi";
import { performLogout } from "@/redux/features/auth/authThunks";
import useUser from "@/hooks/use-user";
import useImpersonation from "@/hooks/use-impersonation";
import { useMounted } from "@/hooks/use-mounted";
import { LOCALES, LOCALE_COOKIE } from "@/i18n/config";
import useWorkspace from "@/hooks/use-workspace";
import { API_URL } from "@/constants/env";
import { useWorkspaceBanners } from "./WorkspaceBanners";
export function SuiteFrame({ children }: { children: ReactNode }) {
  const roadmap = useTranslations("Roadmap"), t = useTranslations("Nav"), ts = useTranslations("Suite"), tv = useTranslations("AccountV3"), tw = useTranslations("Workspace.nav"), workspaceText = useTranslations("Workspace"), mailboxText = useTranslations("Mailbox"), uiText = useStrings();
  const pathname = usePathname(), router = useRouter(), dispatch = useAppDispatch(), mounted = useMounted(), { user, isAdmin, isWebsiteManager, workspaceContext, staffAccess } = useUser(), ws = useWorkspace(), { isImpersonating } = useImpersonation();
  const [logout] = useLogoutMutation(), [exitImpersonation, { isLoading: exiting }] = useExitImpersonationMutation(), signOutBusy = useRef(false);
  const identityOnly = mounted && !workspaceContext && !staffAccess;
  const at = (path: string) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const item = (href: string, label: string, icon: ReactNode): SidebarItem => ({ href, label, icon, active: at(href) });
  const items: SidebarItem[] = identityOnly ? [item("/account/identity", tv("chooseWorkspace"), <House />)] : [item("/", t("home"), <House />), item(mounted && workspaceContext ? "/account/security" : "/account/identity", tv("account"), <UserCircle />)];
  const sections: SidebarSection[] = [{ items }];
  if (mounted && ws.me) {
    items.push(item("/approvals", roadmap("approvals"), <Check />), item("/tools", tw("tools"), <Storefront />), item("/usage", tv("usage"), <SquaresFour />), { ...item("/notifications", tw("notifications"), <Bell />), count: ws.me.unread || undefined });
    if (ws.role !== "guest") items.push(item("/team", tw("team"), <UsersFour />), item("/services", tw("services"), <Briefcase />), item("/support", tw("support"), <Headset />));
    items.push(item("/product/help", tv("help"), <Headset />));
    if (ws.isOwner) sections.push({ label: tw("billingSection"), items: [item("/billing", tw("subscriptions"), <Receipt />), item("/billing/invoices", tw("invoices"), <Invoice />), item("/billing/payment-methods", tw("paymentMethods"), <CreditCard />), item("/billing/details", tw("billingDetails"), <GearSix />), item("/billing/contacts", tv("billingContacts"), <EnvelopeSimple />)] }, { label: tw("settingsSection"), items: [item("/workspace", tw("workspaceSettings"), <GearSix />)] });
  }
  const admins: SidebarItem[] = [];
  if (mounted && isAdmin) admins.push(item("/people", t("people"), <UsersThree />), item("/systems", t("systems"), <SquaresFour />));
  if (mounted && (isWebsiteManager || isAdmin)) admins.push(item("/content", t("content"), <Globe />));
  if (admins.length) sections.push({ label: tw("adminSection"), items: admins });
  if (mounted && user && !identityOnly) items.push(item("/mailbox", mailboxText("nav"), <EnvelopeSimple />));
  const active = sections.flatMap(section => section.items).filter(row => at(row.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  for (const section of sections) for (const row of section.items) row.active = row.href === active;
  const banners = useWorkspaceBanners(ws.me).filter(banner => !["read_only", "suspended", "staff_viewing", "view_as"].includes(banner.kind));
  const signOut = async () => { if (signOutBusy.current) return; signOutBusy.current = true; try { await logout().unwrap(); } catch (failure) { if (![401, 403].includes((failure as { status?: number }).status || 0)) { signOutBusy.current = false; toast.error(workspaceText("signOutFailed"), { action: { label: uiText("retry"), onClick: () => void signOut() } }); return; } } dispatch(performLogout()); router.push("/auth/login"); };
  const changeLocale = async (next: Locale) => { if (workspaceContext && !workspaceContext.actor.readOnly) { try { await suiteRequest(API_URL, "/preferences", { method: "PATCH", body: { language: next } }); } catch { toast.error(tv("saveFailed")); return; } } document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`; router.refresh(); };
  return <SharedSuiteFrame currentScope="global" currentHref="/" apiUrl={API_URL} sosUrl="" width="wide" sidebar={<Sidebar title={tv("account")} sections={sections} />} banner={banners.length ? <BannerRegion banners={banners} /> : undefined} demo={{ runtime: demoRuntime(process.env.NEXT_PUBLIC_DEMO_API, process.env.NEXT_PUBLIC_DEMO_WEB_URLS, process.env.NEXT_PUBLIC_DEMO_SOS_API), enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "sos", onLocaleChange: next => void changeLocale(next) }} userMenu={mounted && user ? <UserMenu name={[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username} email={user.email} avatarSrc={user.avatar || undefined} locales={LOCALES as readonly Locale[]} onLocaleChange={next => void changeLocale(next)} onSignOut={signOut}><MenuLinkItem href="/profile" icon={<UserCircle />}>{t("profile")}</MenuLinkItem><MenuLinkItem href={!workspaceContext ? "/account/identity" : "/account/preferences"} icon={<GearSix />}>{tv("preferences")}</MenuLinkItem>{ws.me ? <MenuGroup label={workspaceText("yourWorkspaces")}>{ws.me.workspaces.map(workspace => <MenuItem key={workspace.id} icon={workspace.id === ws.me?.workspace.id ? <Check /> : undefined} disabled={ws.switching || workspace.id === ws.me?.workspace.id} onClick={() => void ws.switchTo(workspace.id)}><bdi>{workspace.name}</bdi></MenuItem>)}</MenuGroup> : null}{isImpersonating ? <MenuItem icon={<EyeSlash />} disabled={exiting} onClick={() => void exitImpersonation()}>{t("exitActingAs")}</MenuItem> : null}</UserMenu> : null}>{children}</SharedSuiteFrame>;
}
