"use client";

// A campaign's page (MKT-052).
// - The header offers the next thing to do for its status: Continue setup where the wizard stopped,
//   Request approval, or Publish. It had only badges, so a draft could be finished only through the
//   list's row menu and Next on every step.
// - A campaign that doesn't exist, one the person can't see, and a failed load are three different
//   states; they were one sentence with no way out.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, PaperPlaneTilt, PencilSimple, RocketLaunch } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog, ErrorState, NoPermissionState, PageHeader, Skeleton, useFormatter } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useGetCampaignQuery, usePublishCampaignMutation, useRequestCampaignApprovalMutation } from "@/redux/features/campaigns/campaignsApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { nextSetupStep } from "@/lib/campaigns/workflow";
import { wizardPath } from "@/lib/campaigns/routing";
import { isolate } from "@/lib/bidi";
import type { ICreatedCampaign } from "@/types/campaigns";
import { CampaignSummary, SummaryList, campaignCurrency, useBudgetLabel, useScheduleLabel } from "../shared/CampaignSummary";
import { ApprovalPanel } from "./ApprovalPanel";
import { CommentsPanel } from "./CommentsPanel";

const upper = (s: string | null | undefined) => String(s ?? "").toUpperCase();

type NextAction = { kind: "setup"; href: string } | { kind: "request"; count: number } | { kind: "publish" } | null;

function nextAction(c: ICreatedCampaign): NextAction {
  const state = upper(c.workflowState);
  const step = nextSetupStep(c);
  const waiting = (c.reviewers ?? []).filter((r) => upper(r.status) !== "APPROVED");
  if (["RUNNING", "READY", "COMPLETED", "STOPPED", "PAUSED", "AWAITING_REVIEW", "FAILED"].includes(state)) return null;
  if (step !== "review" || (!c.isComplete && state === "DRAFT")) return { kind: "setup", href: wizardPath(c.type, step, c.id) };
  if (state === "REJECTED") return { kind: "setup", href: wizardPath(c.type, "review", c.id) };
  if (waiting.length && (state === "DRAFT" || state === "REAPPROVAL_REQUIRED")) return { kind: "request", count: waiting.length };
  if (state === "DRAFT" || state === "APPROVED") return { kind: "publish" };
  return null;
}

export default function CampaignDetailsView({ campaignId }: { campaignId: string }) {
  const t = useTranslations("CampaignDetails");
  const locale = useLocale();
  const f = useFormatter();
  const labels = useCampaignLabels();
  const budget = useBudgetLabel();
  const schedule = useScheduleLabel();
  const project = useProjectContext();
  const { editCampaigns } = useMarketingRoles();
  const { data, isLoading, isError, error, refetch } = useGetCampaignQuery(campaignId, { refetchOnMountOrArgChange: true });
  const [publish, { isLoading: publishing }] = usePublishCampaignMutation();
  const [requestApproval, { isLoading: requesting }] = useRequestCampaignApprovalMutation();
  const [confirmPublish, setConfirmPublish] = useState(false);
  const crumbs = [{ label: t("crumbCampaigns"), href: `/${locale}/campaigns` }];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only">{t("loading")}</span>
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    );
  }

  const status = (error as { status?: number } | undefined)?.status;
  if (isError || !data?.data) {
    if (status === 404)
      return (
        <ErrorState
          size="page"
          titleAs="h1"
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          action={
            <ButtonLink href="/campaigns" variant="secondary">
              {t("backToCampaigns")}
            </ButtonLink>
          }
        />
      );
    if (status === 403) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} />;
    return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => void refetch()} />;
  }

  const c = data.data;
  const action = editCampaigns ? nextAction(c) : null;
  const spends = c.type === "GOOGLE_SEARCH_ADS" || c.type === "PAID_SOCIAL_ADS";
  const cfg = c.configuration ?? {};
  const currency = campaignCurrency(c, project.currency);

  const doPublish = () => publish(c.id).unwrap();

  const primary =
    action?.kind === "setup" ? (
      <ButtonLink href={action.href} variant="primary">
        {upper(c.workflowState) === "REJECTED" ? t("editAndResubmit") : t("continueSetup")}
        <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
      </ButtonLink>
    ) : action?.kind === "request" ? (
      <Button variant="primary" startIcon={<PaperPlaneTilt />} loading={requesting} onClick={() => void requestApproval({ campaignId: c.id }).unwrap().catch(() => undefined)}>
        {t("requestApproval", { count: action.count })}
      </Button>
    ) : action?.kind === "publish" ? (
      <Button variant="primary" startIcon={<RocketLaunch />} loading={publishing} onClick={() => (spends ? setConfirmPublish(true) : void doPublish().catch(() => undefined))}>
        {t("publish")}
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: <span dir="auto">{c.name}</span> }]}
        title={<span dir="auto">{c.name}</span>}
        description={labels.type(c.type)}
        status={<MarketingStatus kind="campaign" value={c.workflowState} />}
        actions={
          <>
            {editCampaigns && action?.kind !== "setup" ? (
              <ButtonLink href={wizardPath(c.type, "details", c.id)} variant="secondary">
                <PencilSimple aria-hidden className="size-4" />
                {t("edit")}
              </ButtonLink>
            ) : null}
            {primary}
          </>
        }
      />

      {upper(c.workflowState) === "AWAITING_REVIEW" ? <p className="rounded-field bg-warning-subtle p-3 text-body-sm text-fg">{t("awaitingNote")}</p> : null}
      {upper(c.workflowState) === "REJECTED" ? <p className="rounded-field bg-danger-subtle p-3 text-body-sm text-fg">{t("rejectedNote")}</p> : null}
      {(cfg as { providerError?: string }).providerError ? (
        <p className="rounded-field bg-danger-subtle p-3 text-body-sm text-fg">
          {t("providerError")} <bdi dir="ltr">{(cfg as { providerError?: string }).providerError}</bdi>
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="campaign-setup">
          <h2 id="campaign-setup" className="font-display text-title text-fg">
            {t("setup")}
          </h2>
          <Card>
            <SummaryList
              rows={[
                { term: t("type"), value: labels.type(c.type) },
                { term: t("category"), value: c.categories?.[0]?.name ? labels.label("category", c.categories[0].name) : null },
                ...(spends ? [{ term: t("budget"), value: budget(cfg.budgetAmount, cfg.budgetType, currency) }] : []),
                { term: t("schedule"), value: schedule(c.startAt, c.endAt) },
                { term: t("created"), value: c.createdAt ? f.date(c.createdAt, { dateStyle: "medium", timeZone: project.timeZone }) : null },
                { term: t("updated"), value: c.updatedAt ? f.date(c.updatedAt, { dateStyle: "medium", timeStyle: "short", timeZone: project.timeZone }) : null },
              ]}
            />
            {c.description ? (
              <p dir="auto" className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-body text-fg">
                {c.description}
              </p>
            ) : null}
          </Card>
          <CampaignSummary campaign={c} />
        </section>
        <aside className="flex min-w-0 flex-col gap-4" aria-label={t("sideLabel")}>
          <ApprovalPanel campaign={c} />
          <CommentsPanel campaignId={c.id} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        tone="primary"
        title={t("publishTitle", { name: isolate(c.name) })}
        impact={t("publishImpact", { budget: budget(cfg.budgetAmount, cfg.budgetType, currency), schedule: schedule(c.startAt, c.endAt) })}
        confirmLabel={t("publishConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={doPublish}
      />
    </div>
  );
}
