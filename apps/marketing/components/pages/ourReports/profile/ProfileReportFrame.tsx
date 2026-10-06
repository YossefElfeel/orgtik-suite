"use client";

// One profile's reports (/our-reports/:profileId/**). The pages ignored their :id and showed the
// same nine "hello world" posts for every profile, and "Full Report" used the post's index as a
// profile id (MKT-066). The frame finds the profile among the project's connected accounts, says
// so when it isn't one of them, and gives its pages a heading, the period and a section nav.
import { createContext, useContext, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState, ErrorState, LoadingState, PageHeader, cn } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { Link, usePathname } from "@/i18n/routing";
import { useGetInsightsIntegrationsQuery } from "@/redux/features/reports/reportsApi";
import type { IInsightsIntegration } from "@/types/reports";
import { integrationState, profileName } from "../shared/accounts";
import { PeriodControl } from "../shared/PeriodControl";
import { useProjectArg, useReportPeriod } from "../shared/period";

type Ctx = { profile: IInsightsIntegration; period: ReturnType<typeof useReportPeriod> };
const ProfileContext = createContext<Ctx | null>(null);

export function useProfileReport() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfileReport outside ProfileReportFrame");
  return ctx;
}


export function ProfileReportFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const search = useSearchParams();
  const period = useReportPeriod();
  const { ready, projectId } = useProjectArg();
  const { data, isLoading, isError, refetch } = useGetInsightsIntegrationsQuery(projectId ? { projectId } : undefined, { skip: !ready });

  if (!ready || isLoading) return <LoadingState />;
  if (isError && !data) return <ErrorState size="page" titleAs="h1" title={t("profileLoadError")} onRetry={() => refetch()} />;
  const profile = (data?.data ?? []).find((p) => p.id === id);
  if (!profile) {
    return (
      <EmptyState
        size="page"
        titleAs="h1"
        icon={<MagnifyingGlass />}
        title={t("profileNotFound")}
        description={t("profileNotFoundBody")}
        action={<ButtonLink href="/our-reports?tab=profiles">{t("backToReports")}</ButtonLink>}
      />
    );
  }

  const name = profileName(profile);
  const base = `/our-reports/${profile.id}`;
  const keep = new URLSearchParams();
  for (const k of ["from", "to"]) {
    const v = search.get(k);
    if (v) keep.set(k, v);
  }
  const qs = keep.toString() ? `?${keep}` : "";
  const sections = [
    { href: base, label: t("navPosts") },
    { href: `${base}/reports`, label: t("navPerformance") },
    { href: `${base}/reports/followers`, label: t("navFollowers") },
    { href: `${base}/reports/mentions`, label: t("navMentions") },
  ];
  const onMentions = pathname.endsWith("/mentions");

  return (
    <ProfileContext.Provider value={{ profile, period }}>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumb={[{ label: t("title"), href: `/${locale}/our-reports?tab=profiles` }, { label: <bdi>{name}</bdi> }]}
          title={<bdi>{name}</bdi>}
          status={
            <span className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={profile.platform} />
              <MarketingStatus kind="integration" value={integrationState(profile)} size="sm" />
            </span>
          }
          actions={onMentions ? undefined : <PeriodControl period={period} />}
        />
        <nav aria-label={t("profileSections")} className="-mt-2 overflow-x-auto border-b border-line">
          <ul className="flex min-w-max gap-1">
            {sections.map((s) => {
              const current = pathname === s.href;
              return (
                <li key={s.href}>
                  <Link
                    href={`${s.href}${qs}`}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "-mb-px inline-flex items-center border-b-2 px-3 py-2.5 text-body-sm font-medium outline-none focus-visible:outline-2 focus-visible:outline-focus",
                      current ? "border-action-primary text-fg" : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {children}
      </div>
    </ProfileContext.Provider>
  );
}
