"use client";

// Every team page's frame (FS-TASKS-11): the team's name and description, the way back to Teams,
// and its four pages as tabs. A team that doesn't exist, or that the person can't see, says so
// with the way back; an unknown id used to render an empty shell (TASKS-024).
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LockKey, MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState, ErrorState, NoPermissionState, PageHeader, Skeleton } from "@orgtik/ui";
import { PageTabs } from "@/components/shared/PageTabs";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useGetTeamDetailsQuery } from "@/redux/features/teams/teamsApi";

const TABS = ["overview", "priority", "feed", "team"] as const;

export function useTeamId() {
  const { teamId } = useParams<{ teamId: string }>();
  const id = Number(teamId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function TeamFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("TeamPage");
  const id = useTeamId();
  const { data, isLoading, isError, error, refetch } = useGetTeamDetailsQuery(id ?? 0, { skip: id == null });
  const status = (error as { status?: number } | undefined)?.status;
  const back = <ButtonLink href="/teams">{t("toTeams")}</ButtonLink>;

  if (id == null || status === 404) {
    return <EmptyState size="page" titleAs="h1" icon={<MagnifyingGlass weight="duotone" />} title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  }
  if (status === 403) {
    return <NoPermissionState size="page" titleAs="h1" icon={<LockKey weight="duotone" />} title={t("noAccessTitle")} description={t("noAccessBody")} action={back} />;
  }
  if (isError) return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} action={back} />;

  const team = data?.data;
  return (
    <section className="flex flex-col gap-6">
      {isLoading || !team ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      ) : (
        <PageHeader
          breadcrumb={[{ label: t("teams"), href: "/teams" }, { label: <bdi>{team.name}</bdi> }]}
          title={<span dir="auto">{team.name}</span>}
          description={team.description ? <span dir="auto">{team.description}</span> : undefined}
        />
      )}
      <PageTabs label={t("sections")} tabs={TABS.map((tab) => ({ href: `/teams/${id}/${tab}`, label: t(`tabs.${tab}`) }))} />
      {children}
    </section>
  );
}
