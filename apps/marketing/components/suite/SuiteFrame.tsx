"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDots,
  ChartLineUp,
  Gear,
  ImagesSquare,
  Lightning,
  LinkSimple,
  Megaphone,
  Notepad,
  SquaresFour,
  Tag,
  UserCircle,
  UsersThree,
  Binoculars,
} from "@phosphor-icons/react";
import { AppRail, MenuLinkItem, Sidebar, SuiteShell, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useMarketingRoles } from "@/lib/permissions";
import { CURRENT_SCOPE, useSuiteApps } from "./useSuiteApps";
import { ProjectSwitcher } from "./ProjectSwitcher";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * The suite shell for Marketing (FS-MKT-2): the library's rail, sidebar and top bar replace SoSBar,
 * the local sidebar (its iconify icons fetched at runtime, MKT-078), the header and its breadcrumb
 * of raw slugs (MKT-077). The sidebar marks the current page (MKT-026), lists only routes that
 * exist (MKT-027: the three without a page and the /demo playground are gone, MKT-028), and hides
 * what the person's role can't use. The person comes from the store, which the server filled from
 * the cookies, so both sides render the same (MKT-029).
 */
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Shell");
  const ts = useTranslations("Suite");
  const presentationText = useTranslations("Presentation");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const can = useMarketingRoles();
  const { logout } = useLogout(token ?? "");
  const apps = useSuiteApps(mounted ? token : null);

  // Every link carries the reader's language (plain links dropped it, MKT-025).
  const at = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const item = (path: string, label: string, icon: ReactNode) => ({ label, href: `/${locale}${path}`, icon, active: at(path) });

  const sections: SidebarSection[] = [
    { items: [item("/dashboard", t("dashboard"), <SquaresFour />), item("/calendar", t("calendar"), <CalendarDots />)] },
    {
      label: t("sectionPublish"),
      items: [
        item("/posts", t("posts"), <Notepad />),
        item("/campaigns", t("campaigns"), <Megaphone />),
        ...(can.boost ? [item("/boost", t("boosts"), <Lightning />)] : []),
        item("/gallery", t("gallery"), <ImagesSquare />),
        ...(can.manageAudience ? [item("/labels", t("labels"), <Tag />)] : []),
      ],
    },
    {
      label: t("sectionInsights"),
      items: [
        item("/our-reports", t("reports"), <ChartLineUp />),
        item("/competitors-reports", t("competitors"), <Binoculars />),
        item("/our-audience", t("audience"), <UsersThree />),
      ],
    },
  ];
  if (!can.isReviewerOnly) {
    sections.push({ label: t("sectionSetup"), items: [item("/integrations", t("integrations"), <LinkSimple />), item("/settings", t("settings"), <Gear />)] });
  }
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1") sections.unshift({ items: [item("/presentation", presentationText("heading"), <Megaphone />)] });

  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(SOS_URL);
  };
  const name = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "marketing", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={apps[0]?.href ?? SOS_URL} />}
      sidebar={<Sidebar title={ts("appName")} sections={sections} />}
      topBar={{
        start: user ? <ProjectSwitcher /> : null,
        end: user ? (
          <UserMenu
            name={name}
            email={user.email}
            avatarSrc={user.avatar ?? undefined}
            locales={routing.locales as readonly Locale[]}
            onLocaleChange={(next) => router.replace(pathname, { locale: next })}
            onSignOut={signOut}
          >
            <MenuLinkItem href={`${SOS_URL}/profile`} icon={<UserCircle />}>
              {t("profile")}
            </MenuLinkItem>
          </UserMenu>
        ) : null,
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
    </SuiteShell>
  );
}
