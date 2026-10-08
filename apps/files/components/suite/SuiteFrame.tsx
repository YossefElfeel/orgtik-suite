"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Archive, ClockCounterClockwise, FolderSimple, PushPin, SquaresFour } from "@phosphor-icons/react";
import { AppRail, Sidebar, SuiteShell, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { SOS_URL, useLogout } from "@somion/sos-bar";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useGetPinnedFoldersQuery } from "@/redux/features/folder/folderApi";
import { CURRENT_SCOPE, useSuiteApps } from "./useSuiteApps";

// The signed-in user comes from a cookie that only the browser can read, so anything that shows
// them waits for the first client render. That keeps the server HTML and the first client render
// identical (the audit's hydration error came from rendering the user on one side only).
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Greeting() {
  const t = useTranslations("Greetings");
  const user = useAppSelector((s) => s.auth.user);
  const hour = new Date().getHours();
  if (!user) return null;
  // FS-FILES-8: three parts of the day (it said "Good evening" from noon on).
  const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
  return (
    <p className="truncate text-body text-fg-muted">
      {t(period)},{" "}
      <span dir="auto" className="font-semibold text-fg">
        {user.firstName} {user.lastName}
      </span>
    </p>
  );
}

export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Sidebar");
  const ts = useTranslations("Suite");
  const tp = useTranslations("FilesPresentation");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const token = useAppSelector((s) => s.auth.token) as string | null;
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useLogout(token ?? "");
  const apps = useSuiteApps(mounted ? token : null);
  const { data: pinned } = useGetPinnedFoldersQuery(undefined, { skip: !mounted });

  const href = (path: string) => `/${locale}${path === "/" ? "" : path}`;
  const at = (path: string) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));

  const sections: SidebarSection[] = [
    {
      items: [
        { label: t("dashboard"), href: href("/"), icon: <SquaresFour />, active: at("/") },
        { label: t("myFiles"), href: href("/my-files"), icon: <FolderSimple />, active: at("/my-files") },
        { label: t("archived"), href: href("/archived-files"), icon: <Archive />, active: at("/archived-files") },
        { label: t("activity"), href: href("/activity-logs"), icon: <ClockCounterClockwise />, active: at("/activity-logs") },
        ...(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1" ? [{ label: tp("presentationNav"), href: href("/presentation"), icon: <FolderSimple />, active: at("/presentation") }] : []),
      ],
    },
  ];
  const folders = pinned?.data ?? [];
  if (folders.length) {
    sections.push({
      label: t("pinned"),
      items: folders.map((f) => ({ label: f.name, href: href(`/my-files/${f.id}`), icon: <PushPin />, active: pathname === `/my-files/${f.id}` })),
    });
  }

  const signOut = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.assign(SOS_URL);
  };

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "files", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={apps[0]?.href ?? SOS_URL} />}
      sidebar={<Sidebar title={ts("appName")} sections={sections} />}
      topBar={{
        start: mounted ? <Greeting /> : null,
        end:
          mounted && user ? (
            <UserMenu
              name={`${user.firstName} ${user.lastName}`}
              email={user.email}
              avatarSrc={user.avatar ?? undefined}
              locales={routing.locales as readonly Locale[]}
              onLocaleChange={(next) => router.replace(pathname, { locale: next })}
              onSignOut={signOut}
            />
          ) : null,
      }}
    >
      <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</div>
    </SuiteShell>
  );
}
