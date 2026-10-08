"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Archive,
  Kanban,
  Briefcase,
  ChartBar,
  CrownSimple,
  FileText,
  Gift,
  Package,
  Pulse,
  Receipt,
  Repeat,
  SquaresFour,
  Ticket,
  Tag,
  UserCircle,
  UserGear,
  UsersThree,
  Wallet,
  IdentificationBadge,
} from "@phosphor-icons/react";
import { AppRail, BannerRegion, MenuLinkItem, NoPermissionState, Sidebar, SuiteShell, UserMenu, buttonVariants, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useRole } from "@/hooks/useRole";
import { NAV_ITEMS } from "@/lib/navigation";
import { canAccessRoute, getNavLabel } from "@/lib/role-access";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { NotificationPopover } from "@/components/layout/DashboardHeader/NotificationPopover";
import { CURRENT_SCOPE, useSuiteApps } from "./useSuiteApps";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// D-008: Phosphor everywhere. The nav table still carries the old iconify ids; the shell ignores them.
const ICONS: Record<string, ReactNode> = {
  "/": <SquaresFour />,
  "/customers": <UsersThree />,
  "/customers/pipeline": <Kanban />,
  "/offers": <FileText />,
  "/projects": <Briefcase />,
  "/salesman": <IdentificationBadge />,
  "/commissions": <Wallet />,
  "/loyalty": <CrownSimple />,
  "/activity-feed": <Pulse />,
  "/archive": <Archive />,
  "/user-management": <UserGear />,
  "/plan-management": <ChartBar />,
  "/packages": <Package />,
  "/subscriptions": <Repeat />,
  "/coupons": <Tag />,
  "/invoices": <Receipt />,
  "/tickets": <Ticket />,
};
const SELL = ["/", "/customers", "/customers/pipeline", "/offers", "/projects"];

/**
 * The suite shell for Sales (FS-SAL-2): the library's rail, sidebar and top bar replace SoSBar, the
 * local sidebar (iconify icons fetched at runtime), the header and its breadcrumb. The sidebar shows
 * the role's CRM items with the current page marked, then the SaaS-admin modules that move to the
 * Admin app (frozen, D-011) in their own group. A page the role can't open shows a no-permission
 * state in place; it used to bounce to the dashboard without a word. The person comes from the
 * store, which the server filled from the cookies, so both sides render the same.
 */
export function SuiteFrame({ children }: { children: ReactNode }) {
  useNotificationSocket();
  const t = useTranslations("Shell");
  const tn = useTranslations("nav");
  const ts = useTranslations("Suite");
  const presentationText = useTranslations("Presentation");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const token = useAppSelector((s) => s.auth.token);
  const { role, user, fullName, readOnlySession } = useRole();
  const { logout } = useLogout(token ?? "");
  const apps = useSuiteApps(mounted ? token : null);

  const at = (path: string) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));
  const visible = NAV_ITEMS.filter((i) => i.roles.includes(role));
  // Only the most specific item is current: on /customers/pipeline that's the pipeline, not Customers.
  const current = visible.filter((i) => at(i.path)).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const items = visible.map((i) => ({
    path: i.path,
    frozen: Boolean(i.frozen),
    label: tn(getNavLabel(i, role)),
    href: `/${locale}${i.path === "/" ? "" : i.path}`,
    icon: ICONS[i.path] ?? <Gift />,
    active: i.path === current,
  }));
  const strip = ({ label, href, icon, active }: (typeof items)[number]) => ({ label, href, icon, active });
  const sections: SidebarSection[] = [
    { items: items.filter((i) => !i.frozen && SELL.includes(i.path)).map(strip) },
    { label: t("sectionTeam"), items: items.filter((i) => !i.frozen && !SELL.includes(i.path)).map(strip) },
    { label: t("sectionMoving"), items: items.filter((i) => i.frozen).map(strip) },
  ].filter((s) => s.items.length);
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1") sections.unshift({ items: [{ label: presentationText("title"), href: `/${locale}/presentation`, icon: <ChartBar />, active: pathname === "/presentation" }] });

  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(SOS_URL);
  };
  const allowed = canAccessRoute(role, pathname);
  // A View as session (D-017, started in SOS): say so on every page; ending it happens in SOS.
  const banner = readOnlySession ? (
    <BannerRegion
      banners={[
        {
          kind: "staff_viewing",
          title: t("viewingAs", { name: fullName ?? "" }),
          description: t("viewingAsBody"),
          action: (
            <a href={SOS_URL} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {t("viewingAsExit")}
            </a>
          ),
        },
      ]}
    />
  ) : undefined;
  const onFrozen = items.some((i) => i.frozen && i.active);

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "sales", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      banner={banner}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={apps[0]?.href ?? SOS_URL} />}
      sidebar={<Sidebar title={ts("appName")} sections={sections} footer={sections.some((s) => s.label === t("sectionMoving")) ? <p className="px-2 text-caption text-fg-subtle">{t("movingNote")}</p> : undefined} />}
      topBar={{
        end: user ? (
          <>
            <NotificationPopover />
            <UserMenu
              name={fullName ?? ""}
              email={String(user.email ?? "")}
              avatarSrc={(user.avatar as string | undefined) ?? undefined}
              locales={routing.locales as readonly Locale[]}
              onLocaleChange={(next) => router.replace(pathname, { locale: next })}
              onSignOut={signOut}
            >
              <MenuLinkItem href={`/${locale}/profile`} icon={<UserCircle />}>
                {t("profile")}
              </MenuLinkItem>
            </UserMenu>
          </>
        ) : null,
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
        {onFrozen ? <p className="mb-4 rounded-field bg-sunken px-3 py-2 text-body-sm text-fg-muted">{t("movingBanner")}</p> : null}
        {allowed ? children : <NoPermissionState titleAs="h1" title={te("noAccessTitle")} description={te("noAccessBody")} />}
      </div>
    </SuiteShell>
  );
}
