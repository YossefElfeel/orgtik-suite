"use client";

// HR inside the suite's frame (HR wave, FS-HR-4, HR-027): the OrgTik rail with the person's apps
// (each opens through SOS with a one-time code), HR's sections in the library sidebar (the same
// role table as the pages), and the top bar's greeting, search, notifications and the library's
// account menu (theme, language, sign-out). Under 1024px the rail and sidebar open as a sheet from
// the top bar, so every section is reachable at every width. sos-bar is gone from HR's chrome.
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AppRail, Sidebar, SuiteShell, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import useSidebarItems from "@/components/layout/Sidebar/useSidebarItems";
import { CURRENT_SCOPE, useSuiteApps } from "@/hooks/useSuiteApps";
import { NAV_ICONS } from "@/constants/nav-icons";
import WelcomeSection from "@/components/layout/DashboardHeader/WelcomeSection";
import { HeaderSearch } from "@/components/layout/DashboardHeader/HeaderSearch";
import { NotificationDropdown } from "@/components/layout/DashboardHeader/NotificationDropdown";

export function SuiteFrame({ children }: { children: ReactNode }) {
  const ts = useTranslations("suite");
  const presentationText = useTranslations("HrPresentation");
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  // The person comes from a cookie only the browser reads: what shows them waits for the client,
  // so the server HTML and the first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const token = useAppSelector((s) => s.auth.token) as string | null;
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useLogout(token ?? "");
  const apps = useSuiteApps(mounted ? token : null);
  const { sidebarItems, isActiveStartsWith } = useSidebarItems();

  const sections: SidebarSection[] = mounted
    ? sidebarItems.map((section) => ({
        label: section.title,
        items: section.items.map((item) => ({
          label: item.label ?? "",
          href: item.path,
          icon: NAV_ICONS[item.path],
          active: isActiveStartsWith({ path: item.path }),
        })),
      }))
    : [];
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1") sections.unshift({ items: [{ label: presentationText("nav"), href: "/presentation", active: pathname === "/presentation" }] });

  // Signing out of HR signs out of the suite: SOS's sign-in, not a page of HR's own.
  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(`${SOS_URL}/auth/login`);
  };

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "hr", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={`${SOS_URL}/`} />}
      sidebar={<Sidebar title={ts("appName")} sections={sections} />}
      topBar={{
        start: mounted ? <WelcomeSection /> : null,
        end: mounted ? (
          <div className="flex items-center gap-2">
            <HeaderSearch />
            <NotificationDropdown />
            {user ? (
              <UserMenu
                name={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email}
                email={user.email}
                avatarSrc={user.avatar ?? undefined}
                locales={routing.locales as readonly Locale[]}
                onLocaleChange={(next) => router.replace(pathname, { locale: next })}
                onSignOut={signOut}
              />
            ) : null}
          </div>
        ) : null,
      }}
    >
      {children}
    </SuiteShell>
  );
}
