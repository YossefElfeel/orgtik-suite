"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CheckSquare, FolderSimple, GearSix, Kanban, SquaresFour, UserCircle, UsersThree } from "@phosphor-icons/react";
import { MenuLinkItem, Sidebar, SuiteFrame as SharedSuiteFrame, UserMenu, demoRuntime, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useGetMostImportantProjectsQuery } from "@/redux/features/projects/projectsApi";
import { useTaskRoles } from "@/lib/permissions";
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Sidebar"), ts = useTranslations("Suite"), tv = useTranslations("TasksV3"), locale = useLocale(), pathname = usePathname(), router = useRouter(), dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token), user = useAppSelector(state => state.auth.user), roles = useTaskRoles(), { logout } = useLogout(token || "");
  const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);
  const { data: important } = useGetMostImportantProjectsQuery(undefined, { skip: !user });
  const href = (path: string) => `/${locale}${path === "/" ? "" : path}`, at = (path: string) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const sections: SidebarSection[] = [{ items: [
    { label: t("Dashboard"), href: href("/"), icon: <SquaresFour />, active: at("/") },
    ...(roles.isViewerOnly ? [] : [{ label: t("My Tasks"), href: href("/my-tasks/lists"), icon: <CheckSquare />, active: at("/my-tasks") }]),
    { label: t("Notifications"), href: href("/notifications"), icon: <Bell />, active: at("/notifications") },
    { label: t("All Projects"), href: href("/projects"), icon: <FolderSimple />, active: pathname === "/projects" },
    { label: t("All Teams"), href: href("/teams"), icon: <UsersThree />, active: at("/teams") },
    ...(roles.isAdmin || roles.isManager ? [{ label: tv("admin"), href: href("/admin"), icon: <GearSix />, active: at("/admin") }] : []),
  ] }];
  if (important?.data.length) sections.push({ label: t("Projects"), items: important.data.map(project => ({ label: project.title, href: href(`/projects/${project.id}/lists`), icon: <Kanban />, active: pathname.startsWith(`/projects/${project.id}/`) })) });
  const name = user ? `${user.firstName} ${user.lastName}` : "";
  const signOut = async () => { await logout(); dispatch(logoutUser()); window.location.assign(SOS_URL); };
  return <SharedSuiteFrame currentTool="tasks" currentScope="task_manager" currentHref={href("/")} apiUrl={process.env.NEXT_PUBLIC_API_URL} sosUrl={SOS_URL} width="wide" sidebar={<Sidebar title={ts("appName")} sections={sections} />} demo={{ runtime: demoRuntime(process.env.NEXT_PUBLIC_DEMO_API, process.env.NEXT_PUBLIC_DEMO_WEB_URLS, process.env.NEXT_PUBLIC_DEMO_SOS_API), enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "tasks", onLocaleChange: next => router.replace(pathname, { locale: next }) }} userMenu={mounted && user ? <UserMenu name={name} email={user.email} avatarSrc={user.avatar || undefined} locales={routing.locales as readonly Locale[]} onLocaleChange={next => router.replace(pathname, { locale: next })} onSignOut={signOut}><MenuLinkItem href={`${SOS_URL}/profile`} icon={<UserCircle />}>{t("profile")}</MenuLinkItem></UserMenu> : null}>{children}</SharedSuiteFrame>;
}
