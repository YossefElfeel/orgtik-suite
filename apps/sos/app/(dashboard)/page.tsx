"use client";

// Home (FS-SOS-11, USR-00). The workspace's tools from /v1/app/me, each with its state and one way
// forward (open, start a trial or choose a plan, pay, join the waitlist). Apps the person can open
// that aren't workspace tools (the Website Manager, the old CMS) stay as cards that open them; a
// person with no workspace (OrgTik staff) sees all their apps as before. OrgTik's admins also see
// three real figures with what moved this month. Who the person is decides what shows, so it
// renders after mount (the old page's admin tiles caused a hydration error).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe, SquaresFour, UsersThree } from "@phosphor-icons/react";
import { EmptyState, ErrorState, LoadingState, PageHeader, Skeleton, Stat } from "@orgtik/ui";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { useGetDashboardStatsQuery } from "@/redux/features/dashboard/dashboardApi";
import { APP_ICONS, CURRENT_SCOPE, buildScopeHref, useAppLabel, useMyScopes } from "@/components/suite/useSuiteApps";
import useWorkspace from "@/hooks/use-workspace";
import { AccountHome } from "@/components/account/AccountHome";
import { IdentityLanding } from "@/components/account/IdentityLanding";
import { useSuite } from "@orgtik/ui";
import { MyTools } from "@/components/workspace/tools/MyTools";

function AdminFigures() {
  const t = useTranslations("Home");
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery();
  if (isError) return <ErrorState size="compact" title={t("figuresFailed")} onRetry={refetch} />;
  const s = data?.data;
  const month = t("thisMonth");
  return (
    <section aria-labelledby="figures" className="flex flex-col gap-3">
      <h2 id="figures" className="font-display text-title-sm text-fg">{t("figures")}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(14rem,100%),1fr))] gap-4">
          <Stat loading={isLoading} icon={<UsersThree />} label={t("people")} value={s?.totalMembers.value ?? 0} hint={s ? t("peopleHint", { total: s.totalMembers.total }) : undefined} change={s ? { value: s.totalMembers.change, format: "number", against: month } : undefined} />
          <Stat loading={isLoading} icon={<SquaresFour />} label={t("apps")} value={s?.activeSystems.value ?? 0} hint={s ? t("appsHint", { total: s.activeSystems.total }) : undefined} change={s ? { value: s.activeSystems.change, format: "number", against: month } : undefined} />
          <Stat loading={isLoading} icon={<Globe />} label={t("cms")} value={s?.cmsPlatforms.value ?? 0} hint={s ? t("cmsHint", { total: s.cmsPlatforms.total }) : undefined} />
      </div>
    </section>
  );
}

function LegacyHome() {
  const t = useTranslations("Home");
  const mounted = useMounted();
  const appLabel = useAppLabel();
  const { user, isAdmin, accessToken } = useUser();
  const { scopes, failed } = useMyScopes(mounted ? (accessToken ?? null) : null);
  const ws = useWorkspace();
  const tt = useTranslations("Tools.home");

  if (!mounted || !user || ws.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72" />
        <LoadingState rows={3} />
      </div>
    );
  }

  // With a workspace, its tools come first; the apps below are the ones no tool already opens.
  const me = ws.me;
  const toolScopes = new Set((me?.tools ?? []).map((x) => x.scope).filter(Boolean));
  const apps = (scopes ?? []).filter((s) => s.name !== CURRENT_SCOPE && !toolScopes.has(s.name));
  const showApps = !me || failed || scopes === null || apps.length > 0;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={me?.workspace.name ?? t("title", { name: user.firstName || user.username })} description={t("description")} meta={me ? <span>{tt("title")} · {me.tools.length}</span> : undefined} />

      {me ? <MyTools me={me} /> : null}

      {showApps ? (
        <section aria-labelledby="apps" className="flex flex-col gap-3">
          <h2 id="apps" className="font-display text-title-sm text-fg">{t("yourApps")}</h2>
          {me ? <p className="-mt-2 text-body-sm text-fg-muted">{tt("otherApps")}</p> : null}
          {failed ? (
            <ErrorState size="compact" title={t("appsFailed")} onRetry={() => location.reload()} />
          ) : scopes === null ? (
            <LoadingState rows={2} />
          ) : apps.length === 0 ? (
            <EmptyState size="compact" title={t("noApps")} description={t("noAppsBody")} />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))] gap-4">
              {apps.map((s) => (
                <li key={s.id}>
                  <Link
                    href={buildScopeHref(s)}
                    className="group flex h-full items-center gap-4 rounded-card border border-line bg-raised p-5 transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand [&>svg]:size-6">
                      {APP_ICONS[s.name] ?? <SquaresFour />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-display text-title-sm text-fg">{tt.has(`apps.${s.name}`) ? tt(`apps.${s.name}`) : appLabel(s.name, s.displayName)}</span>
                      <span className="text-body-sm text-fg-muted">{t.has(`about.${s.name}`) ? t(`about.${s.name}`) : t("openApp")}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {isAdmin ? <AdminFigures /> : null}
    </div>
  );
}

export default function HomePage() { const suite = useSuite(), { workspaceContext, staffAccess } = useUser(), mounted = useMounted(); if (!mounted) return <LoadingState rows={4} />; if (workspaceContext) return <AccountHome />; if (staffAccess) return <LegacyHome />; return <IdentityLanding />; }
