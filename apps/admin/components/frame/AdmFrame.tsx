"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Buildings,
  ChartBar,
  ClockCounterClockwise,
  Coins,
  CurrencyCircleDollar,
  EnvelopeSimple,
  GearSix,
  GlobeHemisphereEast,
  Handshake,
  Headset,
  Invoice,
  Lightbulb,
  ListChecks,
  Package,
  Percent,
  Receipt,
  SquaresFour,
  Stack,
  Swap,
  Table,
  Toolbox,
  UserList,
  Article,
  Bank,
  Ticket,
} from "@phosphor-icons/react";
import { AppRail, Badge, Button, ErrorState, NoPermissionState, Sidebar, Spinner, SuiteShell, Toaster, UserMenu, type Locale, type SidebarSection } from "@orgtik/ui";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { SOS_URL } from "@/lib/env";
import { clearToken, getToken, signOutStaff } from "@/lib/session";
import { useClientSession } from "@orgtik/ui/auth";
import { statusOf, useMeQuery } from "@/store/api";
import { CURRENT_SCOPE, useSuiteApps } from "@/components/suite/useSuiteApps";
import { CenteredState } from "./CenteredState";

type NavItem = { key: string; href: string; icon: ReactNode; permission: string; external?: boolean };
type NavSection = { label?: string; items: NavItem[] };

/** Spec 02's areas, each shown only to roles that can view its module (the API checks again). */
export function useNav(): NavSection[] {
  const t = useTranslations("Nav");
  return [
    { items: [{ key: t("overview"), href: "/", icon: <SquaresFour />, permission: "overview:view" }] },
    {
      label: t("sections.catalog"),
      items: [
        { key: t("tools"), href: "/tools", icon: <Toolbox />, permission: "tools:view" },
        { key: t("plans"), href: "/plans", icon: <Stack />, permission: "plans:view" },
        { key: t("waitlist"), href: "/waitlist", icon: <ListChecks />, permission: "waitlist:view" },
      ],
    },
    {
      label: t("sections.pricing"),
      items: [
        { key: t("grid"), href: "/pricing", icon: <Table />, permission: "pricing:view" },
        { key: t("zones"), href: "/pricing/zones", icon: <GlobeHemisphereEast />, permission: "pricing:view" },
        { key: t("currencies"), href: "/pricing/currencies", icon: <CurrencyCircleDollar />, permission: "pricing:view" },
        { key: t("pricingLog"), href: "/pricing/log", icon: <ClockCounterClockwise />, permission: "pricing:view" },
      ],
    },
    {
      label: t("sections.commerce"),
      items: [
        { key: t("bundles"), href: "/bundles", icon: <Package />, permission: "bundles:view" },
        { key: t("coupons"), href: "/coupons", icon: <Percent />, permission: "bundles:view" },
        { key: t("tax"), href: "/tax", icon: <Bank />, permission: "tax:view" },
      ],
    },
    {
      label: t("sections.customers"),
      items: [
        { key: t("workspaces"), href: "/workspaces", icon: <Buildings />, permission: "workspaces:view" },
        { key: t("migrations"), href: "/migrations", icon: <Swap />, permission: "workspaces:view" },
        { key: t("customPlans"), href: "/custom-plans", icon: <Handshake />, permission: "workspaces:view" },
        { key: t("invoices"), href: "/invoices", icon: <Invoice />, permission: "billing:view" },
      ],
    },
    {
      label: t("sections.delivery"),
      items: [
        { key: t("services"), href: "/services", icon: <Coins />, permission: "services:view" },
        { key: t("serviceRequests"), href: "/service-requests", icon: <Receipt />, permission: "services:view" },
        { key: t("tickets"), href: "/tickets", icon: <Headset />, permission: "tickets:view" },
      ],
    },
    {
      label: t("sections.website"),
      items: [
        // ADM-27 and ADM-28 are the Website Manager's (D-019, D-029): through SOS, which signs the person in there.
        { key: t("content"), href: `${SOS_URL}/go/website_manager?redirect=${encodeURIComponent("/content/pages")}`, icon: <Article />, permission: "content:view", external: true },
        { key: t("suggestions"), href: `${SOS_URL}/go/website_manager?redirect=${encodeURIComponent("/marketing/ideas")}`, icon: <Lightbulb />, permission: "suggestions:view", external: true },
      ],
    },
    {
      label: t("sections.system"),
      items: [
        { key: t("reports"), href: "/reports", icon: <ChartBar />, permission: "reports:view" },
        { key: t("staff"), href: "/staff", icon: <UserList />, permission: "staff:view" },
        { key: t("templates"), href: "/templates", icon: <EnvelopeSimple />, permission: "templates:view" },
        { key: t("settings"), href: "/settings", icon: <GearSix />, permission: "settings:view" },
        { key: t("audit"), href: "/audit", icon: <Ticket />, permission: "settings:view" },
      ],
    },
  ];
}

/**
 * OrgTik Admin's frame. It asks the API who the person is on every load (/v1/admin/me) and shows the
 * state that answer calls for: signing in, signed out, no access, offline, or the shell with the
 * areas that person's staff roles may see.
 */
export function AdmFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("App");
  const ta = useTranslations("Auth");
  const tn = useTranslations("NoAccess");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const session = useClientSession();
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [token, setTokenState] = useState<string | null | undefined>(undefined);
  useEffect(() => setTokenState(getToken()), [session]);
  useEffect(() => {
    if (token === null) router.replace("/signed-out");
  }, [token, router]);

  const me = useMeQuery(undefined, { skip: !token });
  const apps = useSuiteApps(token ?? null);
  const nav = useNav();

  useEffect(() => {
    if (statusOf(me.error) === 401) {
      clearToken();
      router.replace("/signed-out");
    }
  }, [me.error, router]);

  if (token === undefined || token === null || me.isLoading || statusOf(me.error) === 401) {
    return (
      <CenteredState>
        <div className="flex justify-center py-6">
          <Spinner label={ta("checking")} />
        </div>
      </CenteredState>
    );
  }
  if (statusOf(me.error) === 403) {
    return (
      <CenteredState>
        <NoPermissionState size="compact" title={tn("title")} description={tn("body")} action={<Button variant="secondary" onClick={() => window.location.assign(SOS_URL)}>{tn("back")}</Button>} />
      </CenteredState>
    );
  }
  if (me.error || !me.data) {
    return (
      <CenteredState>
        <ErrorState size="compact" title={ta("offlineTitle")} description={ta("offlineBody")} onRetry={() => me.refetch()} />
      </CenteredState>
    );
  }

  const { user, permissions, roles } = me.data;
  const staffPermissions = session?.workspaceContext ? [] : session?.staffAccess?.permissions.admin || [];
  const allowed = new Set(permissions.filter(permission => staffPermissions.includes(permission)));
  const matches = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  // Only the most specific item is current: on /pricing/zones that's Zones, not the grid.
  const best = nav.flatMap((x) => x.items.filter((i) => !i.external).map((i) => i.href)).filter(matches).sort((x, y) => y.length - x.length)[0];
  const sections: SidebarSection[] = nav
    .map((s) => ({
      label: s.label,
      items: s.items
        .filter((i) => allowed.has(i.permission))
        .map((i) =>
          i.external
            ? { label: i.key, href: i.href, icon: i.icon }
            : { label: i.key, href: `/${locale}${i.href === "/" ? "" : i.href}`, icon: i.icon, active: i.href === best },
        ),
    }))
    .filter((s) => s.items.length);

  return (
    <SuiteShell
      demo={{ enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1", appKey: "admin", onLocaleChange: (next) => router.replace(pathname, { locale: next }) }}
      rail={<AppRail apps={apps} current={CURRENT_SCOPE} homeHref={SOS_URL} />}
      sidebar={<Sidebar title={t("name")} sections={sections} />}
      topBar={{
        start: (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="sr-only">{t("rolesLabel")}</span>
            {roles.filter(r => session?.staffAccess?.roles.admin?.includes(r.key)).map((r) => (
              <Badge key={r.key} size="sm" tone="brand">
                {t(`roles.${r.key}`)}
              </Badge>
            ))}
          </span>
        ),
        end: (
          <UserMenu
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            locales={routing.locales as readonly Locale[]}
            onLocaleChange={(next) => router.replace(pathname, { locale: next })}
            onSignOut={() => {
              void signOutStaff().then(() => window.location.assign(SOS_URL)).catch(() => setSignOutFailed(true));
            }}
          />
        ),
      }}
    >
      <div className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</div>
      {signOutFailed && <ErrorState size="compact" title={ta("offlineTitle")} description={ta("offlineBody")} onRetry={() => { setSignOutFailed(false); void signOutStaff().then(() => window.location.assign(SOS_URL)).catch(() => setSignOutFailed(true)); }} />}
      <Toaster />
    </SuiteShell>
  );
}

