"use client";
import { type ReactNode, useState } from "react";
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
  Kanban,
  EnvelopeSimple,
  ChatsCircle,
  Path,
  MagicWand,
} from "@phosphor-icons/react";
import {
  demoRuntime,
  MenuLinkItem,
  Sidebar,
  SuiteFrame as SharedSuiteFrame,
  UserMenu,
  type Locale,
  type SidebarSection,
} from "@orgtik/ui";
import {
  handoffCode,
  readClientSession,
  signOutSession,
} from "@orgtik/ui/auth";
import { API_URL, SOS_URL } from "@/constants";
import { SOS_API_URL } from "@/constants/env";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useMarketingRoles } from "@/lib/permissions";
import { ProjectSwitcher } from "./ProjectSwitcher";
import ProjectRouteGate from "./ProjectRouteGate";
import MarketingScopeGate from "@/providers/MarketingScopeGate";
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Shell"),
    tv = useTranslations("MarketingV3"),
    ts = useTranslations("Suite"),
    locale = useLocale(),
    pathname = usePathname(),
    router = useRouter(),
    dispatch = useAppDispatch(),
    user = useAppSelector((s) => s.auth.user),
    can = useMarketingRoles(),
    [error, setError] = useState<"handoff" | "logout">();
  const at = (path: string) =>
      pathname === path || pathname.startsWith(path + "/"),
    item = (path: string, label: string, icon: ReactNode) => ({
      label,
      href: `/${locale}${path}`,
      icon,
      active: at(path),
    });
  const sections: SidebarSection[] = [
    {
      items: [
        item("/dashboard", t("dashboard"), <SquaresFour />),
        item("/calendar", t("calendar"), <CalendarDots />),
      ],
    },
    {
      label: t("sectionPublish"),
      items: [
        item("/posts", t("posts"), <Notepad />),
        item("/queue", tv("queue"), <Kanban />),
        item("/campaigns", t("campaigns"), <Megaphone />),
        item("/social-inbox", tv("inbox"), <ChatsCircle />),
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
        item("/our-audience/contacts", tv("contacts"), <UsersThree />),
      ],
    },
  ];
  if (!can.isReviewerOnly)
    sections.push({
      label: t("sectionSetup"),
      items: [
        item("/email-designer", tv("emailDesigner"), <EnvelopeSimple />),
        item("/journeys", tv("journeys"), <Path />),
        item("/writing", tv("writing"), <MagicWand />),
        item("/integrations", t("integrations"), <LinkSimple />),
        item("/settings", t("settings"), <Gear />),
        ...(can.manageProjects
          ? [item("/admin", tv("administration"), <Gear />)]
          : []),
      ],
    });
  const navigate = async (href: string) => {
    const session = readClientSession();
    if (!session) {
      window.location.assign(href);
      return;
    }
    try {
      setError(undefined);
      const url = new URL(href, SOS_URL);
      await fetch(`${SOS_URL}/auth/handoff`, { mode: "no-cors" });
      const code = await handoffCode(
        SOS_API_URL,
        session.tokens.accessToken,
        "suite",
      );
      window.location.assign(
        `${SOS_URL}/auth/handoff?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(url.pathname + url.search)}`,
      );
    } catch {
      setError("handoff");
    }
  };
  const signOut = async () => {
    try {
      setError(undefined);
      const token = readClientSession()?.tokens.accessToken;
      if (token) await signOutSession(SOS_API_URL, token);
      dispatch(logoutUser());
      window.location.assign(SOS_URL);
    } catch {
      setError("logout");
    }
  };
  const name = user ? `${user.firstName} ${user.lastName}` : "";
  return (
    <SharedSuiteFrame
      apiUrl={API_URL}
      sosUrl={SOS_URL}
      currentTool="marketing"
      currentScope="digital_marketing"
      currentHref={`/${locale}/dashboard`}
      width="wide"
      onNavigate={(href) => void navigate(href)}
      sidebar={<Sidebar title={ts("appName")} sections={sections} />}
      demo={{
        runtime: demoRuntime(
          process.env.NEXT_PUBLIC_DEMO_API,
          process.env.NEXT_PUBLIC_DEMO_WEB_URLS,
          process.env.NEXT_PUBLIC_DEMO_SOS_API,
        ),
        enabled:
          process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_DEMO_PANEL === "1",
        appKey: "marketing",
        onLocaleChange: (next) => router.replace(pathname, { locale: next }),
      }}
      userMenu={
        user ? (
          <UserMenu
            name={name}
            email={user.email}
            avatarSrc={user.avatar ?? undefined}
            locales={routing.locales as readonly Locale[]}
            onLocaleChange={(next) =>
              router.replace(pathname, { locale: next })
            }
            onSignOut={() => void signOut()}
          >
            <MenuLinkItem
              href={`${SOS_URL}/profile`}
              icon={<UserCircle />}
              onClick={(event) => {
                event.preventDefault();
                void navigate(event.currentTarget.href);
              }}
            >
              {t("profile")}
            </MenuLinkItem>
          </UserMenu>
        ) : null
      }
    >
      {error ? (
        <p role="alert" className="mb-4 text-body-sm text-danger">
          {tv(error === "logout" ? "logoutError" : "handoffError")}
        </p>
      ) : null}
      <MarketingScopeGate>
        <div className="mb-5">
          <ProjectSwitcher />
        </div>
        <ProjectRouteGate>{children}</ProjectRouteGate>
      </MarketingScopeGate>
    </SharedSuiteFrame>
  );
}
