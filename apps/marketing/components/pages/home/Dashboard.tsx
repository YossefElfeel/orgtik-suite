"use client";

// The project's dashboard: its last 30 days, its connected accounts, what goes out today (or
// next), and the approvals waiting for the person. Everything here was constants ("Somion
// @flowforge", "Todays Publishing 2/3/5/1") shown the same for every brand, and Add Platform, View
// Insights and Full Report did nothing (MKT-021). A project with no connected account says so and
// offers to connect one.
import { useId, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CalendarDots, ChartLineUp, CheckCircle, Plugs, Plus } from "@phosphor-icons/react";
import { Card, EmptyState, ErrorState, ListStates, PageHeader, useFormatter } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { PlatformBadge, PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { Link } from "@/i18n/routing";
import { useMarketingRoles } from "@/lib/permissions";
import { dayInZone, useProjectContext } from "@/lib/project-context";
import { useGetDashboardPostsQuery, useGetInsightsIntegrationsQuery, useGetOurReportsOverviewQuery } from "@/redux/features/reports/reportsApi";
import type { IDashboardPost, MetricKey } from "@/types/reports";
import { KpiGrid, SyncNotice } from "../ourReports/shared/metrics";
import { presetRange, useProjectArg } from "../ourReports/shared/period";
import { integrationState, profileName } from "../ourReports/shared/accounts";

const KPIS: MetricKey[] = ["impressions", "engagements", "followers", "followersGained"];
const statusOf = (q: { isLoading: boolean; isFetching: boolean; isError: boolean; data?: unknown }, count: number, ready: boolean) =>
  !ready || q.isLoading || (q.isFetching && !q.data) ? "loading" : q.isError && !q.data ? "error" : count ? "ready" : "empty";

function Panel({ title, description, actions, footer, children }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <Card padding="none" className="flex min-w-0 flex-col">
      <section aria-labelledby={id} className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={id} className="font-display text-title-sm text-fg">
              {title}
            </h2>
            {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        <div className="flex-1 px-5 py-3">{children}</div>
        {footer ? <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-5 py-3 text-body-sm">{footer}</div> : null}
      </section>
    </Card>
  );
}

const linkClass = "font-medium text-fg-brand hover:underline";

export function Dashboard() {
  const t = useTranslations("Dashboard");
  const f = useFormatter();
  const roles = useMarketingRoles();
  const project = useProjectContext();
  const { ready, projectId } = useProjectArg();
  const arg = projectId ? { projectId } : undefined;
  const today = dayInZone(Date.now(), project.timeZone);
  const range = presetRange("last30", today);

  const accounts = useGetInsightsIntegrationsQuery(arg, { skip: !ready });
  const overview = useGetOurReportsOverviewQuery({ projectId, periodStart: range.start, periodEnd: range.end }, { skip: !ready });
  const scheduled = useGetDashboardPostsQuery({ projectId, uiStatuses: "SCHEDULED,APPROVED", limit: 100 }, { skip: !ready });
  const pending = useGetDashboardPostsQuery({ projectId, uiStatuses: "PENDING_APPROVAL", limit: 100 }, { skip: !ready });

  const list = accounts.data?.data ?? [];
  const noAccounts = accounts.isSuccess && !list.length;
  const reconnect = list.filter((a) => integrationState(a) !== "CONNECTED").length;

  const { publishing, publishingToday } = useMemo(() => {
    const now = Date.now();
    const upcoming = (scheduled.data?.data.items ?? [])
      .filter((p) => p.effectiveScheduledAt && new Date(p.effectiveScheduledAt).getTime() >= now)
      .sort((a, b) => (a.effectiveScheduledAt ?? "").localeCompare(b.effectiveScheduledAt ?? ""));
    const todays = upcoming.filter((p) => dayInZone(p.effectiveScheduledAt!, project.timeZone) === today);
    return todays.length ? { publishing: todays, publishingToday: true } : { publishing: upcoming.slice(0, 3), publishingToday: false };
  }, [scheduled.data, project.timeZone, today]);

  const approvals = useMemo(() => (pending.data?.data.items ?? []).filter((p) => p.viewerReview?.canApprove), [pending.data]);

  const when = (p: IDashboardPost) =>
    publishingToday
      ? f.date(p.effectiveScheduledAt!, { timeStyle: "short", timeZone: project.timeZone })
      : f.date(p.effectiveScheduledAt!, { dateStyle: "medium", timeStyle: "short", timeZone: project.timeZone });
  const platformsOf = (p: IDashboardPost) => [...new Set(p.platforms.map((x) => x.platform))];
  const postLine = (p: IDashboardPost, meta: ReactNode) => (
    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link href={`/posts/${p.id}`} className={`truncate ${linkClass}`} dir="auto">
          {p.title || p.postTitle}
        </Link>
        <span className="text-caption text-fg-muted">{meta}</span>
      </div>
      <span className="flex shrink-0 items-center gap-1" role="img" aria-label={platformsOf(p).map((x) => platformMeta(x).name).join(", ")}>
        {platformsOf(p).map((x) => (
          <PlatformIcon key={x} platform={x} className="size-4 text-fg-muted" />
        ))}
      </span>
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={project.name ? <bdi>{project.name}</bdi> : t("title")}
        description={project.name ? t("descriptionNamed") : t("description")}
        actions={
          <>
            <ButtonLink href="/our-reports" variant="secondary">
              <ChartLineUp aria-hidden className="size-4" />
              {t("openReports")}
            </ButtonLink>
            {roles.editPosts ? (
              <ButtonLink href="/posts/create-post">
                <Plus aria-hidden className="size-4" />
                {t("createPost")}
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {noAccounts ? (
        <Card>
          <EmptyState
            icon={<Plugs />}
            title={t("noAccountsTitle")}
            description={roles.manageIntegrations ? t("noAccountsBody") : t("noAccountsAsk")}
            action={roles.manageIntegrations ? <ButtonLink href="/integrations">{t("connectAccount")}</ButtonLink> : undefined}
          />
        </Card>
      ) : (
        <section aria-labelledby="dash-kpis" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="dash-kpis" className="font-display text-title-sm text-fg">
              {t("kpiTitle")}
            </h2>
            <Link href="/our-reports" className={`text-body-sm ${linkClass}`}>
              {t("viewReports")}
            </Link>
          </div>
          {overview.isError && !overview.data ? (
            <Card>
              <ErrorState size="compact" title={t("kpiError")} onRetry={() => overview.refetch()} />
            </Card>
          ) : (
            <>
              <SyncNotice status={overview.data?.data.syncStatus} />
              <KpiGrid keys={KPIS} values={overview.data?.data.totals.withRate} days={30} loading={!ready || overview.isLoading} />
            </>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {!noAccounts ? (
          <Panel
            title={t("accountsTitle")}
            description={accounts.data ? (reconnect ? t("accountsSummaryReconnect", { count: list.length, reconnect }) : t("accountsSummary", { count: list.length })) : undefined}
            footer={
              <Link href="/integrations" className={linkClass}>
                {roles.manageIntegrations ? t("manageAccounts") : t("viewAccounts")}
              </Link>
            }
          >
            <ListStates size="compact" loadingRows={3} status={statusOf(accounts, list.length, ready)} onRetry={() => accounts.refetch()} error={{ title: t("accountsError") }} empty={{ title: t("noAccountsTitle") }}>
              <ul className="divide-y divide-line">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link href={`/our-reports/${a.id}`} className={`truncate ${linkClass}`} dir="auto">
                        {profileName(a)}
                      </Link>
                      <span className="flex flex-wrap items-center gap-x-2 text-caption text-fg-muted">
                        <PlatformBadge platform={a.platform} className="text-caption text-fg-muted" />
                        {a.metadata?.followers != null ? <span>{t("followers", { count: a.metadata.followers, value: f.number(a.metadata.followers) })}</span> : null}
                      </span>
                    </div>
                    <MarketingStatus kind="integration" value={integrationState(a)} size="sm" />
                  </li>
                ))}
              </ul>
            </ListStates>
          </Panel>
        ) : null}

        <Panel
          title={publishingToday ? t("publishingToday") : t("publishingNext")}
          description={publishingToday ? t("publishingTodayCount", { count: publishing.length }) : undefined}
          footer={
            <>
              <Link href="/posts" className={linkClass}>
                {t("allPosts")}
              </Link>
              <Link href="/calendar" className={`inline-flex items-center gap-1 ${linkClass}`}>
                <CalendarDots aria-hidden className="size-4" />
                {t("openCalendar")}
              </Link>
            </>
          }
        >
          <ListStates
            size="compact"
            loadingRows={3}
            status={statusOf(scheduled, publishing.length, ready)}
            onRetry={() => scheduled.refetch()}
            error={{ title: t("postsError") }}
            empty={{ icon: <CalendarDots />, title: t("nothingScheduled"), description: t("nothingScheduledBody"), action: roles.editPosts ? <ButtonLink href="/posts/create-post" variant="secondary">{t("createPost")}</ButtonLink> : undefined }}
          >
            <ul className="divide-y divide-line">
              {publishing.map((p) => postLine(p, <time dateTime={p.effectiveScheduledAt!}>{when(p)}</time>))}
            </ul>
          </ListStates>
        </Panel>

        <Panel title={t("approvalsTitle")} description={approvals.length ? t("approvalsCount", { count: approvals.length }) : undefined}>
          <ListStates
            size="compact"
            loadingRows={3}
            status={statusOf(pending, approvals.length, ready)}
            onRetry={() => pending.refetch()}
            error={{ title: t("approvalsError") }}
            empty={{ icon: <CheckCircle />, title: t("noApprovals"), description: t("noApprovalsBody") }}
          >
            <ul className="divide-y divide-line">
              {approvals.map((p) =>
                postLine(p, p.effectiveScheduledAt ? t("approvalFor", { when: f.date(p.effectiveScheduledAt, { dateStyle: "medium", timeStyle: "short", timeZone: project.timeZone }) }) : t("approvalNoDate")),
              )}
            </ul>
          </ListStates>
        </Panel>
      </div>
    </div>
  );
}
