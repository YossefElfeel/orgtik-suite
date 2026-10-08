"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CheckSquare, Kanban, SquaresFour, UserCircle, UsersThree, FolderSimple } from "@phosphor-icons/react";
import { AppRail, MenuLinkItem, Sidebar, SuiteShell, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useGetMostImportantProjectsQuery } from "@/redux/features/projects/projectsApi";
import { NotificationBell } from "./NotificationBell";
import { useTaskRoles } from "@/lib/permissions";
import { CURRENT_SCOPE, useSuiteApps } from "./useSuiteApps";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// The part of the day depends on the reader's clock, which the server doesn't know, so it waits
// for the browser (the server and the first client render stay identical).
function Greeting({ name }: { name: string }) {
  const t = useTranslations("Greetings");
  const mounted = useMounted();
  if (!mounted) return null;
  const hour = new Date().getHours();
  const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
  return (
    <p className="truncate text-body text-fg-muted">
      {t(period)},{" "}
      <span dir="auto" className="font-semibold text-fg">
        {name}
      </span>
    </p>
  );
}

/**
 * The suite shell for Tasks (FS-TASKS-2): the library's rail, sidebar and top bar replace SoSBar,
 * the two local sidebars, the header and its English breadcrumb. The person comes from the store,
 * which the server filled from the cookies, so nothing here renders differently on the two sides
 * (TASKS-016).
 */
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Sidebar");
  const ts = useTranslations("Suite");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const roles = useTaskRoles();
  const { logout } = useLogout(token ?? "");
  const apps = useSuiteApps(mounted ? token : null);
  const { data: important } = useGetMostImportantProjectsQuery(undefined, { skip: !user });

  const href = (path: string) => `/${locale}${path === "/" ? "" : path}`;
  const at = (path: string) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));

  const main = [
    { label: t("Dashboard"), href: href("/"), icon: <SquaresFour />, active: at("/") },
    ...(roles.isViewerOnly ? [] : [{ label: t("My Tasks"), href: href("/my-tasks/overview"), icon: <CheckSquare />, active: at("/my-tasks") }]),
    { label: t("Notifications"), href: href("/notifications"), icon: <Bell />, active: at("/notifications") },
    { label: t("All Projects"), href: href("/projects"), icon: <FolderSimple />, active: pathname === "/projects" },
    { label: t("All Teams"), href: href("/teams"), icon: <UsersThree />, active: at("/teams") },
  ];
  const sections: SidebarSection[] = [{ items: main }];
  const projects = important?.data ?? [];
  if (projects.length) {
    sections.push({
      label: t("Projects"),
      items: projects.map((p) => ({
        label: p.title,
        href: href(`/projects/${p.id}/board`),
        icon: <Kanban />,
        active: pathname.startsWith(`/projects/${p.id}/`),
      })),
    });
  }

  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(SOS_URL);
  };
  const name = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "tasks", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={apps[0]?.href ?? SOS_URL} />}
      sidebar={<Sidebar title={ts("appName")} sections={sections} />}
      topBar={{
        start: user ? <Greeting name={name} /> : null,
        end: user ? (
          <>
            <NotificationBell />
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
          </>
        ) : null,
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
    </SuiteShell>
  );
}
