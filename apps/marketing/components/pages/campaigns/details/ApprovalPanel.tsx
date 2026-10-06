"use client";

// Approval on the campaign page (MKT-053).
// - An approver whose decision is waiting sees Approve (confirmed first, with an optional note) and
//   Reject (a reason is required, and the author sees it). They fired at once, with no reason.
// - Editors can change the approvers, ask again for approval, and roll back to the last approved
//   version, after a confirmation that says what is overwritten.
// - A View as session sees the approvals and changes nothing.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, Check, PaperPlaneTilt, UserPlus, X } from "@phosphor-icons/react";
import { Avatar, Button, Card, ConfirmDialog, Progress, useFormatter } from "@orgtik/ui";
import AddApproversDialog from "@/components/dialogs/AddApproversDialog";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useAppSelector } from "@/redux/app/hooks";
import { useApproveCampaignMutation, useRejectCampaignMutation, useRequestCampaignApprovalMutation, useRollbackCampaignLastApprovedMutation } from "@/redux/features/campaigns/campaignsApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { isolate } from "@/lib/bidi";
import type { ICreatedCampaign } from "@/types/campaigns";
import { reviewerName, toApproverOption, useApproverSync } from "../shared/Approvers";

const upper = (s: string | null | undefined) => String(s ?? "").toUpperCase();

export function ApprovalPanel({ campaign }: { campaign: ICreatedCampaign }) {
  const t = useTranslations("CampaignApproval");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const { editCampaigns, readOnlySession } = useMarketingRoles();
  const meId = useAppSelector((s) => (s.auth.user as { id?: number } | null)?.id);
  const [approve] = useApproveCampaignMutation();
  const [reject] = useRejectCampaignMutation();
  const [requestApproval, { isLoading: requesting }] = useRequestCampaignApprovalMutation();
  const [rollback] = useRollbackCampaignLastApprovedMutation();
  const { apply, busy } = useApproverSync(campaign);
  const [dialog, setDialog] = useState<null | "approve" | "reject" | "rollback" | "approvers">(null);

  const reviewers = campaign.reviewers ?? [];
  const approved = reviewers.filter((r) => upper(r.status) === "APPROVED").length;
  const mine = reviewers.find((r) => Number(r.reviewerUserId) === Number(meId));
  const awaiting = ["AWAITING_REVIEW", "REAPPROVAL_REQUIRED"].includes(upper(campaign.workflowState)) || upper(campaign.approvalStatus) === "PENDING_APPROVAL";
  const canDecide = !readOnlySession && Boolean(mine) && upper(mine?.status) === "PENDING" && awaiting;
  const waiting = reviewers.filter((r) => upper(r.status) !== "APPROVED");
  const canRequest = editCampaigns && reviewers.length > 0 && waiting.length > 0 && Boolean(campaign.isComplete) && !awaiting;
  const canRollback = editCampaigns && (upper(campaign.workflowState) === "REAPPROVAL_REQUIRED" || upper(campaign.approvalStatus) === "REJECTED");
  const name = isolate(campaign.name);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-title-sm text-fg">{t("title")}</h2>
          <MarketingStatus kind="approval" value={campaign.approvalStatus} size="sm" />
        </div>
        {editCampaigns ? (
          <Button variant="secondary" size="sm" startIcon={<UserPlus />} loading={busy} onClick={() => setDialog("approvers")}>
            {reviewers.length ? t("changeApprovers") : t("addApprovers")}
          </Button>
        ) : null}
      </div>

      {reviewers.length ? <Progress value={approved} max={reviewers.length} label={t("progress", { approved, total: reviewers.length })} /> : <p className="text-body-sm text-fg-muted">{t("noApprovers")}</p>}

      {campaign.approvalNote ? (
        <div className="flex flex-col gap-1 rounded-field bg-sunken p-3">
          <p className="text-caption text-fg-muted">{t("noteLabel")}</p>
          <p dir="auto" className="whitespace-pre-wrap text-body-sm text-fg">
            {campaign.approvalNote}
          </p>
        </div>
      ) : null}

      {reviewers.length ? (
        <ul className="flex flex-col gap-2">
          {reviewers.map((r) => {
            const who = reviewerName(r);
            return (
              <li key={r.id} className="flex flex-col gap-2 rounded-field border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={who || "?"} src={r.reviewerUser?.avatar} size="sm" decorative />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="truncate text-body font-semibold text-fg">
                      {who}
                      {Number(r.reviewerUserId) === Number(meId) ? <span className="text-fg-muted"> {t("you")}</span> : null}
                    </span>
                    {r.reviewerUser?.profile?.jobTitle ? (
                      <span dir="auto" className="truncate text-caption text-fg-muted">
                        {r.reviewerUser.profile.jobTitle}
                      </span>
                    ) : null}
                  </span>
                  <MarketingStatus kind="approval" value={r.status} size="sm" />
                </div>
                {r.note ? (
                  <p className="text-body-sm text-fg">
                    <span className="text-fg-muted">{upper(r.status) === "REJECTED" ? t("reason") : t("noteFrom")} </span>
                    <span dir="auto">{r.note}</span>
                  </p>
                ) : null}
                {r.decidedAt ? <p className="text-caption text-fg-muted">{f.date(r.decidedAt, { dateStyle: "medium", timeStyle: "short", timeZone })}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {canDecide ? (
        <div className="flex flex-col gap-2 rounded-field border border-action-primary bg-brand-subtle p-3">
          <p className="text-body-sm text-fg">{t("yourDecision")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" startIcon={<Check />} onClick={() => setDialog("approve")}>
              {t("approve")}
            </Button>
            <Button variant="secondary" startIcon={<X />} onClick={() => setDialog("reject")}>
              {t("reject")}
            </Button>
          </div>
        </div>
      ) : null}

      {canRequest || canRollback ? (
        <div className="flex flex-wrap gap-2">
          {canRequest ? (
            <Button variant="secondary" startIcon={<PaperPlaneTilt />} loading={requesting} onClick={() => void requestApproval({ campaignId: campaign.id }).unwrap().catch(() => undefined)}>
              {t("requestApproval", { count: waiting.length })}
            </Button>
          ) : null}
          {canRollback ? (
            <Button variant="ghost" startIcon={<ArrowCounterClockwise />} onClick={() => setDialog("rollback")}>
              {t("rollback")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        tone="primary"
        title={t("approveTitle", { name })}
        impact={approved + 1 >= reviewers.length ? t("approveImpactLast") : t("approveImpact", { count: reviewers.length - approved - 1 })}
        reason={{ label: t("approveNote"), required: false, placeholder: t("approveNotePlaceholder") }}
        confirmLabel={t("approveConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={({ reason }) => approve({ campaignId: campaign.id, note: reason }).unwrap()}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        tone="danger"
        title={t("rejectTitle", { name })}
        impact={t("rejectImpact")}
        reason={{ label: t("rejectReason"), required: true, placeholder: t("rejectReasonPlaceholder") }}
        confirmLabel={t("rejectConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={({ reason }) => reject({ campaignId: campaign.id, note: reason }).unwrap()}
      />
      <ConfirmDialog
        open={dialog === "rollback"}
        onOpenChange={(o) => !o && setDialog(null)}
        tone="danger"
        title={t("rollbackTitle", { name })}
        impact={t("rollbackImpact")}
        confirmLabel={t("rollbackConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={() => rollback(campaign.id).unwrap()}
      />
      {editCampaigns ? (
        <AddApproversDialog
          open={dialog === "approvers"}
          onOpenChange={(o) => setDialog(o ? "approvers" : null)}
          selectedApprovers={reviewers.map(toApproverOption)}
          onApply={(selected) => {
            setDialog(null);
            void apply(selected);
          }}
        />
      ) : null}
    </Card>
  );
}
