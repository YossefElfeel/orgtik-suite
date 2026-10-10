"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Archive,
  ClockCounterClockwise,
  FolderSimple,
  GearSix,
  PushPin,
  SquaresFour,
  Star,
  UsersThree,
  UserCircle,
} from "@phosphor-icons/react";
import {
  MenuLinkItem,
  Sidebar,
  SuiteFrame as SharedSuiteFrame,
  UserMenu,
  demoRuntime,
  type Locale,
  type SidebarSection,
} from "@orgtik/ui";
import { useClientSession } from "@orgtik/ui/auth";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useGetPinnedFoldersQuery } from "@/redux/features/folder/folderApi";
export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Sidebar"),
    tv = useTranslations("FilesV3"),
    ts = useTranslations("Suite"),
    locale = useLocale(),
    pathname = usePathname(),
    router = useRouter(),
    dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token),
    user = useAppSelector((state) => state.auth.user),
    session = useClientSession(),
    { logout } = useLogout(token || "");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: pinned } = useGetPinnedFoldersQuery(undefined, {
    skip: !mounted || !user,
  });
  const href = (path: string) => `/${locale}${path === "/" ? "" : path}`,
    at = (path: string) =>
      path === "/"
        ? pathname === "/"
        : pathname === path || pathname.startsWith(path + "/");
  const c = session?.workspaceContext,
    admin =
      c &&
      (["owner", "admin"].includes(c.member.role) ||
        c.tools.files?.roles.includes("super_admin"));
  const sections: SidebarSection[] = [
    {
      items: [
        {
          label: t("dashboard"),
          href: href("/"),
          icon: <SquaresFour />,
          active: at("/"),
        },
        {
          label: t("myFiles"),
          href: href("/my-files"),
          icon: <FolderSimple />,
          active: at("/my-files"),
        },
        {
          label: tv("shared"),
          href: href("/shared-with-me"),
          icon: <UsersThree />,
          active: at("/shared-with-me"),
        },
        {
          label: tv("starred"),
          href: href("/starred"),
          icon: <Star />,
          active: at("/starred"),
        },
        {
          label: tv("recent"),
          href: href("/recent"),
          icon: <ClockCounterClockwise />,
          active: at("/recent"),
        },
        {
          label: t("archived"),
          href: href("/archived-files"),
          icon: <Archive />,
          active: at("/archived-files"),
        },
        {
          label: t("activity"),
          href: href("/activity-logs"),
          icon: <ClockCounterClockwise />,
          active: at("/activity-logs"),
        },
        ...(admin
          ? [
              {
                label: tv("admin"),
                href: href("/admin"),
                icon: <GearSix />,
                active: at("/admin"),
              },
            ]
          : []),
      ],
    },
  ];
  if (pinned?.data.length)
    sections.push({
      label: t("pinned"),
      items: pinned.data.map((folder) => ({
        label: folder.name,
        href: href(`/my-files/${folder.id}`),
        icon: <PushPin />,
        active: pathname === `/my-files/${folder.id}`,
      })),
    });
  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(SOS_URL);
  };
  return (
    <SharedSuiteFrame
      currentTool="files"
      currentScope="file_manager"
      currentHref={href("/")}
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
      sosUrl={SOS_URL}
      width="wide"
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
        appKey: "files",
        onLocaleChange: (next) => router.replace(pathname, { locale: next }),
      }}
      userMenu={
        mounted && user ? (
          <UserMenu
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            avatarSrc={user.avatar || undefined}
            locales={routing.locales as readonly Locale[]}
            onLocaleChange={(next) =>
              router.replace(pathname, { locale: next })
            }
            onSignOut={signOut}
          >
            <MenuLinkItem href={`${SOS_URL}/profile`} icon={<UserCircle />}>
              {tv("profile")}
            </MenuLinkItem>
          </UserMenu>
        ) : null
      }
    >
      {children}
    </SharedSuiteFrame>
  );
}
