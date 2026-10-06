"use client";

// Review, the same for every type: the saved campaign, its approvers, a note for them, then Save as
// draft or Publish (Send for approval when there are approvers).
// - Google Search went nowhere from here: Publish only navigated and dropped the note (MKT-008).
//   Every type now saves the review and publishes through the API, and the note is kept.
// - A deep link to Review lists the earlier steps that are missing, with links, and can't publish
//   until they are done (MKT-054).
// - Publishing an ad campaign spends money: it is confirmed with the budget and the account.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info, WarningCircle } from "@phosphor-icons/react";
import { Button, Card, CardHeader, ConfirmDialog, Field, Textarea, toast } from "@orgtik/ui";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { usePublishCampaignMutation, useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { missingSteps } from "@/lib/campaigns/workflow";
import { isolate } from "@/lib/bidi";
import { CampaignSummary, SummaryList, campaignCurrency, useBudgetLabel, useScheduleLabel } from "../../shared/CampaignSummary";
import { ApproversEditor } from "../../shared/Approvers";
import { StepFrame } from "../StepFrame";

export default function ReviewStep() {
  const t = useTranslations("CampaignReview");
  const tw = useTranslations("CampaignWizard");
  const labels = useCampaignLabels();
  const budget = useBudgetLabel();
  const schedule = useScheduleLabel();
  const project = useProjectContext();
  const { campaign, campaignId, objective, goToStep, leave } = useCampaignStepNavigation();
  const [note, setNote] = useState(campaign?.approvalNote ?? "");
  const [savedNote, setSavedNote] = useState(campaign?.approvalNote ?? "");
  const [confirm, setConfirm] = useState(false);
  const [update, { isLoading: saving }] = useUpdateCampaignOnboardingMutation();
  const [publish, { isLoading: publishing }] = usePublishCampaignMutation();
  const reviewerIds = (campaign?.reviewers ?? []).map((r) => r.reviewerUserId);
  const saveReview = async (saveAsDraft: boolean) => {
    if (!campaignId) throw new Error("no campaign");
    await update({ campaignId, body: { step: "REVIEW", approval: { reviewerIds, ...(note.trim() ? { note: note.trim() } : {}) }, saveAsDraft } }).unwrap();
    setSavedNote(note);
  };
  useStepGuard(note !== savedNote, async () => {
    try {
      await saveReview(true);
      return true;
    } catch {
      return false;
    }
  });
  if (!campaign || !campaignId) return null;

  const missing = missingSteps(objective, campaign);
  const reviewers = campaign.reviewers ?? [];
  const waiting = reviewers.filter((r) => String(r.status).toUpperCase() !== "APPROVED");
  const spends = campaign.type === "GOOGLE_SEARCH_ADS" || campaign.type === "PAID_SOCIAL_ADS";
  const currency = campaignCurrency(campaign, project.currency);
  const cfg = campaign.configuration ?? {};

  const saveDraft = async () => {
    try {
      await saveReview(true);
      // The review endpoint is quiet in api-feedback: say it here, once.
      toast.success(t("draftSaved", { name: isolate(campaign.name) }));
      leave(`/campaigns/${campaignId}`, true);
    } catch {
      // baseApi has said why.
    }
  };

  const doPublish = async () => {
    await saveReview(false);
    await publish(campaignId).unwrap();
    leave(`/campaigns/${campaignId}`, true);
  };

  const onPublish = () => {
    if (spends && waiting.length === 0) return setConfirm(true);
    void doPublish().catch(() => undefined);
  };

  const busy = saving || publishing;
  const primaryLabel = waiting.length ? t("sendForApproval", { count: waiting.length }) : t("publish");

  return (
    <StepFrame
      title={t("title")}
      description={t("description")}
      busy={busy}
      actions={
        <>
          <Button type="button" variant="secondary" disabled={busy} loading={saving && !publishing} onClick={() => void saveDraft()}>
            {t("saveDraft")}
          </Button>
          <Button type="button" variant="primary" disabled={busy || missing.length > 0} loading={publishing} onClick={onPublish}>
            {primaryLabel}
          </Button>
        </>
      }
    >
      {missing.length ? (
        <div role="alert" className="flex flex-col gap-2 rounded-card border border-warning bg-warning-subtle p-4">
          <p className="flex items-center gap-2 text-body font-semibold text-fg">
            <WarningCircle aria-hidden className="size-5 text-warning" />
            {t("missingTitle", { count: missing.length })}
          </p>
          <p className="text-body-sm text-fg">{t("missingBody")}</p>
          <ul className="flex flex-wrap gap-2">
            {missing.map((s) => (
              <li key={s}>
                <Button type="button" variant="secondary" size="sm" onClick={() => goToStep(s)}>
                  {t("finishStep", { step: tw(`steps.${s}`) })}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <CardHeader title={<span dir="auto">{campaign.name}</span>} description={labels.type(campaign.type)} />
        <div className="mt-4">
          <SummaryList
            rows={[
              { term: t("category"), value: campaign.categories?.[0]?.name ? labels.label("category", campaign.categories[0].name) : null },
              { term: t("descriptionLabel"), value: campaign.description ? <span dir="auto">{campaign.description}</span> : null },
            ]}
          />
        </div>
      </Card>

      <CampaignSummary campaign={campaign} />

      <ApproversEditor campaign={campaign} />

      <Field label={t("note")} optional description={t("noteHint")}>
        <Textarea value={note} dir="auto" maxLength={1000} maxRows={6} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
      </Field>

      <p className="flex items-start gap-2 text-body-sm text-fg-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {waiting.length ? t("whatHappensApproval", { count: waiting.length }) : campaign.startAt && Date.parse(campaign.startAt) > Date.now() ? t("whatHappensScheduled", { start: schedule(campaign.startAt, null) }) : t("whatHappensNow")}
      </p>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="primary"
        title={t("confirmTitle", { name: isolate(campaign.name) })}
        impact={
          <span className="flex flex-col gap-1">
            <span>{t("confirmSpend", { budget: budget(cfg.budgetAmount, cfg.budgetType, currency) })}</span>
            <span>{schedule(campaign.startAt, campaign.endAt)}</span>
          </span>
        }
        confirmLabel={t("confirmPublish")}
        cancelLabel={tw("keepEditing")}
        onConfirm={() => doPublish()}
      />
    </StepFrame>
  );
}
