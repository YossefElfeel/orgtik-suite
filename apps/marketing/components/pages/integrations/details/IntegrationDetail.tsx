"use client";

// One connected account. The old page called a hook after an early return, so it crashed on first
// load (MKT-019), and it had no loading, not-found or error state. Every hook here runs on every
// render; the states come after. The tab is in the address (?tab=).
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowsClockwise, LinkBreak, Pause, Play, WarningCircle } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  NoPermissionState,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  buttonVariants,
  useFormatter,
} from "@orgtik/ui";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { isolate } from "@/lib/bidi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import {
  useDeleteIntegrationMutation,
  useGetIntegrationDetailsQuery,
  useSyncIntegrationMutation,
  useToggleIntegrationStatusMutation,
} from "@/redux/features/integrations/integrationsApi";
import { integrationState } from "../shared";
import { OverviewPanel } from "./OverviewPanel";
import { AudiencePanel } from "./AudiencePanel";
import { RecentPostsPanel } from "./RecentPostsPanel";
import { ConnectionPanel } from "./ConnectionPanel";

const TABS = ["overview", "audience", "posts", "connection"] as const;
type Tab = (typeof TABS)[number];

export function IntegrationDetail({ id }: { id: string }) {
  const t = useTranslations("IntegrationDetail");
  const ti = useTranslations("Integrations");
  const locale = useLocale();
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const can = useMarketingRoles();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, isLoading, isError, error, refetch } = useGetIntegrationDetailsQuery(id);
  const [sync, syncState] = useSyncIntegrationMutation();
  const [toggle, toggleState] = useToggleIntegrationStatusMutation();
  const [remove] = useDeleteIntegrationMutation();
  const [confirm, setConfirm] = useState<"disconnect" | "turnOff" | null>(null);

  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && TABS.includes(requested) ? requested : "overview";
  const setTab = (next: Tab) => {
    const q = new URLSearchParams(params.toString());
    if (next === "overview") q.delete("tab");
    else q.set("tab", next);
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const accountsCrumb = { label: t("crumbAccounts"), href: `/${locale}/integrations` };

  if (isLoading) return <LoadingState label={t("loading")} rows={6} />;

  if (isError || !data?.data) {
    const status = (error as { status?: number | string } | undefined)?.status;
    if (status === 404 || (!isError && !data?.data))
      return (
        <EmptyState
          size="page"
          titleAs="h1"
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          action={<ButtonLink href="/integrations">{t("backToAccounts")}</ButtonLink>}
        />
      );
    if (status === 403) return <NoPermissionState size="page" titleAs="h1" title={t("forbiddenTitle")} description={t("forbiddenBody")} />;
    return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={refetch} />;
  }

  const i = data.data;
  const profile = i.analytics?.overview?.profile;
  const name = profile?.displayName || i.name;
  const platform = platformMeta(i.platform).name;

  const actions = (
    <>
      {can.syncIntegrations ? (
        <Button variant="secondary" startIcon={<ArrowsClockwise />} loading={syncState.isLoading} onClick={() => sync({ integrationId: i.id }).unwrap().catch(() => undefined)}>
          {ti("syncNow")}
        </Button>
      ) : null}
      {can.manageIntegrations ? (
        <>
          {i.isConnected ? (
            <Button variant="secondary" startIcon={<Pause />} onClick={() => setConfirm("turnOff")}>
              {ti("turnOff")}
            </Button>
          ) : (
            <Button variant="secondary" startIcon={<Play />} loading={toggleState.isLoading} onClick={() => toggle({ integrationId: i.id }).unwrap().catch(() => undefined)}>
              {ti("turnOn")}
            </Button>
          )}
          <Button variant="danger" startIcon={<LinkBreak />} onClick={() => setConfirm("disconnect")}>
            {ti("disconnect")}
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[accountsCrumb, { label: <span dir="auto">{name}</span> }]}
        title={<span dir="auto">{name}</span>}
        status={<MarketingStatus kind="integration" value={integrationState(i)} />}
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            <bdi>{platform}</bdi>
            {profile?.handle ? (
              <bdi dir="ltr" className="text-fg-muted">
                @{profile.handle}
              </bdi>
            ) : null}
            {i.connectedAt ? <span>· {t("connectedOn", { date: f.date(i.connectedAt, { dateStyle: "medium", timeZone }) })}</span> : null}
          </span>
        }
        actions={actions}
      />

      {i.requiresReconnect ? (
        <div role="status" className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-line bg-warning-subtle p-4">
          <div className="flex min-w-0 items-start gap-3">
            <WarningCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-semibold text-body text-fg">{t("reconnectTitle", { platform })}</p>
              <p className="text-body-sm text-fg-muted">
                {i.lastSyncedAt
                  ? t("reconnectBody", { platform, date: f.date(i.lastSyncedAt, { dateStyle: "medium", timeStyle: "short", timeZone }) })
                  : t("reconnectBodyNever", { platform })}
              </p>
            </div>
          </div>
          {can.manageIntegrations ? (
            <Link href={`/integrations/wizard/${i.platform}/1`} className={buttonVariants({ variant: "primary", size: "sm" })}>
              {t("reconnect")}
            </Link>
          ) : null}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList items={TABS.map((v) => ({ value: v, label: t(`tab_${v}`) }))} />
        <TabsPanel value="overview" className="pt-5">
          <OverviewPanel data={i} />
        </TabsPanel>
        <TabsPanel value="audience" className="pt-5">
          <AudiencePanel audience={i.analytics?.audience} />
        </TabsPanel>
        <TabsPanel value="posts" className="pt-5">
          <RecentPostsPanel posts={i.analytics?.recentPosts} platform={i.platform} />
        </TabsPanel>
        <TabsPanel value="connection" className="pt-5">
          <ConnectionPanel data={i} />
        </TabsPanel>
      </Tabs>

      <ConfirmDialog
        open={confirm === "disconnect"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={ti("disconnectTitle", { name: isolate(name) })}
        impact={ti("disconnectImpact", { platform })}
        irreversible
        tone="danger"
        confirmLabel={ti("disconnectConfirm")}
        cancelLabel={ti("keepConnected")}
        onConfirm={async () => {
          await remove({ integrationId: i.id }).unwrap();
          router.replace("/integrations");
        }}
      />
      <ConfirmDialog
        open={confirm === "turnOff"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={ti("turnOffTitle", { name: isolate(name) })}
        impact={ti("turnOffImpact", { platform })}
        tone="primary"
        confirmLabel={ti("turnOffConfirm")}
        cancelLabel={ti("keepOn")}
        onConfirm={() => toggle({ integrationId: i.id }).unwrap()}
      />
    </div>
  );
}
