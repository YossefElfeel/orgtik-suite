"use client";
import { demoRuntime } from "@orgtik/ui";

// SOS in the suite's frame (FS-SOS-1, USR-00 v1). One navigation: the rail for the apps, the
// sidebar for SOS's own pages (it was a rail plus a header pill bar labelled "Admin navigation",
// shown to everyone). One sign out, in the person's menu (it was under the rail too). Language
// changes at once from that menu. Acting as someone else is the one banner, with its way out.
import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Buildings, CreditCard, EnvelopeSimple, EyeSlash, GearSix, Globe, Headset, House, Invoice, Receipt, Briefcase, SquaresFour, Storefront, UserCircle, UsersThree, UsersFour } from "@phosphor-icons/react";
import { AppRail, BannerRegion, Button, MenuLinkItem, Sidebar, SuiteShell, UserMenu, toast, useStrings, type Banner, type Locale, type SidebarItem, type SidebarSection } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { useExitImpersonationMutation, useLogoutMutation } from "@/redux/features/auth/authApi";
import { performLogout } from "@/redux/features/auth/authThunks";
import useUser from "@/hooks/use-user";
import useImpersonation from "@/hooks/use-impersonation";
import { useMounted } from "@/hooks/use-mounted";
import { LOCALES, LOCALE_COOKIE } from "@/i18n/config";
import useWorkspace from "@/hooks/use-workspace";
import { CURRENT_SCOPE, useSuiteApps } from "./useSuiteApps";
import { useWorkspaceBanners } from "./WorkspaceBanners";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

function Greeting({ firstName }: { firstName: string }) {
  const t = useTranslations("Greetings");
  const hour = new Date().getHours();
  const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
  return (
    <p className="truncate text-body text-fg-muted">
      {t(period)},{" "}
      <span dir="auto" className="font-semibold text-fg">
        {firstName}
      </span>
    </p>
  );
}

export function SuiteFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Nav");
  const ts = useTranslations("Suite");
  const presentationText = useTranslations("AccountPresentation");
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const { user, isAdmin, isWebsiteManager, accessToken } = useUser();
  const { isImpersonating, adminDisplayName, targetDisplayName } = useImpersonation();
  const [logout] = useLogoutMutation();
  const signOutBusy = useRef(false);
  const uiText = useStrings();
  const [exitImpersonation, { isLoading: exiting }] = useExitImpersonationMutation();
  const apps = useSuiteApps(mounted ? (accessToken ?? null) : null);

  const at = (path: string) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));
  const item = (href: string, label: string, icon: ReactNode): SidebarItem => ({ href, label, icon, active: at(href) });
  // Who sees what is decided in the browser (the person lives in a cookie only it reads), so the
  // server renders the common items and the rest appear after mount, without a mismatch.
  const items: SidebarItem[] = [item("/", t("home"), <House />)];
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1") items.push(item("/presentation", presentationText("nav"), <SquaresFour />));
  // The customer dashboard (USR, Phase E): what the person's role in the workspace allows. Billing
  // is the owner's (spec 05 §1); the team is the owner's and admins'.
  const tw = useTranslations("Workspace.nav");
  const workspaceText = useTranslations("Workspace");
  const ws = useWorkspace();
  const mailboxText = useTranslations('Mailbox');
  const sections: SidebarSection[] = [{ items }];
  if (mounted && ws.me) {
    const unread = ws.me.unread || undefined;
    items.push(item("/tools", tw("tools"), <Storefront />));
    if (ws.role !== "guest") items.push(item("/team", tw("team"), <UsersFour />), item("/services", tw("services"), <Briefcase />), item("/support", tw("support"), <Headset />));
    items.push({ ...item("/notifications", tw("notifications"), <Bell />), count: unread });
    if (ws.isOwner) {
      sections.push({
        label: tw("billingSection"),
        items: [
          item("/billing", tw("subscriptions"), <Receipt />),
          item("/billing/invoices", tw("invoices"), <Invoice />),
          item("/billing/payment-methods", tw("paymentMethods"), <CreditCard />),
          item("/billing/details", tw("billingDetails"), <Buildings />),
        ],
      });
      sections.push({ label: tw("settingsSection"), items: [item("/workspace", tw("workspaceSettings"), <GearSix />)] });
    }
  }
  // SOS's own administration (people, apps, the website): OrgTik's admins.
  const adminItems: SidebarItem[] = [];
  if (mounted && isAdmin) adminItems.push(item("/people", t("people"), <UsersThree />), item("/systems", t("systems"), <SquaresFour />));
  if (mounted && (isWebsiteManager || isAdmin)) adminItems.push(item("/content", t("content"), <Globe />));
  if (adminItems.length) sections.push({ label: tw("adminSection"), items: adminItems });
  if (mounted && user) items.push(item('/mailbox', mailboxText('nav'), <EnvelopeSimple />));
  // Only the most specific item is current: on /billing/invoices that's Invoices, not Subscriptions.
  const hrefs = sections.flatMap((x) => x.items.map((i) => i.href)).filter(at).sort((a, b) => b.length - a.length);
  for (const sec of sections) for (const i of sec.items) i.active = i.href === hrefs[0];
  const workspaceBanners = useWorkspaceBanners(ws.me);

  const signOut = async () => {
    if (signOutBusy.current) return;
    signOutBusy.current = true;
    try {
      await logout().unwrap();
    } catch (error) {
      if (![401, 403].includes((error as { status?: number }).status || 0)) {
        signOutBusy.current = false;
        toast.error(workspaceText("signOutFailed"), { id: "suite-sign-out-failed", action: { label: uiText("retry"), onClick: () => { toast.dismiss("suite-sign-out-failed"); void signOut(); } } });
        return;
      }
    }
    toast.dismiss("suite-sign-out-failed");
    dispatch(performLogout());
    router.push("/auth/login");
  };

  // The language lives in a cookie (D-033): set it, then re-render on the server in the new one.
  const changeLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  // Acting as someone else is always shown (D-017); the workspace's banners compete for the one slot.
  const banners: Banner[] = [
    ...(mounted && isImpersonating
      ? [
          {
            kind: "staff_viewing" as const,
            title: t("actingAs", { name: targetDisplayName ?? "" }),
            description: adminDisplayName ? t("actingAsBy", { name: adminDisplayName }) : undefined,
            action: (
              <Button size="sm" variant="secondary" loading={exiting} startIcon={<EyeSlash />} onClick={() => exitImpersonation()}>
                {t("exitActingAs")}
              </Button>
            ),
          },
        ]
      : []),
    ...workspaceBanners,
  ];

  return (
    <SuiteShell
      demo={{ runtime: demoRuntime(process.env.NEXT_PUBLIC_DEMO_API, process.env.NEXT_PUBLIC_DEMO_WEB_URLS, process.env.NEXT_PUBLIC_DEMO_SOS_API), enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "sos", onLocaleChange: changeLocale }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref="/" />}
      sidebar={<Sidebar title={<span dir="ltr">{ts("appName")}</span>} sections={sections} />}
      banner={banners.length ? <BannerRegion banners={banners} /> : undefined}
      topBar={{
        start: mounted && user ? ws.me ? <WorkspaceSwitcher me={ws.me} onSwitch={ws.switchTo} switching={ws.switching} failed={ws.switchError} /> : <Greeting firstName={user.firstName || user.username} /> : null,
        end:
          mounted && user ? (
            <UserMenu
              name={[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}
              email={user.email}
              avatarSrc={user.avatar ?? undefined}
              locales={LOCALES as readonly Locale[]}
              onLocaleChange={changeLocale}
              onSignOut={signOut}
            >
              <MenuLinkItem href="/profile" icon={<UserCircle />}>
                {t("profile")}
              </MenuLinkItem>
            </UserMenu>
          ) : null,
      }}
    >
      <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</div>
    </SuiteShell>
  );
}

