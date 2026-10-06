"use client";

// The campaign's approvers, as the server has them. Choosing approvers saves at once (the add and
// remove endpoints), so the list on screen is always the saved one.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, X } from "@phosphor-icons/react";
import { Avatar, Button, IconButton } from "@orgtik/ui";
import AddApproversDialog, { type ApproverOption } from "@/components/dialogs/AddApproversDialog";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useAddCampaignReviewersMutation, useRemoveCampaignReviewerMutation } from "@/redux/features/campaigns/campaignsApi";
import { isolate } from "@/lib/bidi";
import type { ICampaignReviewer, ICreatedCampaign } from "@/types/campaigns";

export function reviewerName(r: ICampaignReviewer): string {
  const u = r.reviewerUser;
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "";
}

export function toApproverOption(r: ICampaignReviewer): ApproverOption {
  return { id: r.reviewerUserId, name: reviewerName(r), email: r.reviewerUser?.email ?? "", avatar: r.reviewerUser?.avatar ?? undefined, role: r.reviewerUser?.profile?.jobTitle };
}

/** Adds and removes reviewers so the campaign has exactly the chosen people. */
export function useApproverSync(campaign: ICreatedCampaign | undefined) {
  const [add, { isLoading: adding }] = useAddCampaignReviewersMutation();
  const [remove, { isLoading: removing }] = useRemoveCampaignReviewerMutation();
  const apply = async (selected: ApproverOption[]) => {
    if (!campaign) return;
    const current = campaign.reviewers ?? [];
    const chosen = new Set(selected.map((s) => Number(s.id)));
    const toAdd = selected.map((s) => Number(s.id)).filter((id) => !current.some((r) => r.reviewerUserId === id));
    const toRemove = current.filter((r) => !chosen.has(r.reviewerUserId));
    try {
      for (const r of toRemove) await remove({ campaignId: campaign.id, reviewerId: r.id }).unwrap();
      if (toAdd.length) await add({ campaignId: campaign.id, reviewerIds: toAdd }).unwrap();
    } catch {
      // baseApi has said why; the list shows what was saved.
    }
  };
  return { apply, busy: adding || removing };
}

/** The approvers block of the review step: who will be asked, with add and remove. */
export function ApproversEditor({ campaign, disabled }: { campaign: ICreatedCampaign; disabled?: boolean }) {
  const t = useTranslations("CampaignApproval");
  const [open, setOpen] = useState(false);
  const { apply, busy } = useApproverSync(campaign);
  const reviewers = campaign.reviewers ?? [];
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line p-4" aria-labelledby="approvers-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 id="approvers-heading" className="font-display text-title-sm text-fg">
            {t("approvers")}
          </h3>
          <p className="text-body-sm text-fg-muted">{reviewers.length ? t("approversHint", { count: reviewers.length }) : t("noApproversHint")}</p>
        </div>
        {!disabled ? (
          <Button type="button" variant="secondary" size="sm" startIcon={<UserPlus />} loading={busy} onClick={() => setOpen(true)}>
            {reviewers.length ? t("changeApprovers") : t("addApprovers")}
          </Button>
        ) : null}
      </div>
      {reviewers.length ? (
        <ul className="flex flex-col gap-2">
          {reviewers.map((r) => {
            const name = reviewerName(r);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-field border border-line p-2.5">
                <Avatar name={name || "?"} src={r.reviewerUser?.avatar} size="sm" decorative />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span dir="auto" className="truncate text-body font-semibold text-fg">
                    {name}
                  </span>
                  {r.reviewerUser?.email ? (
                    <bdi dir="ltr" className="truncate text-caption text-fg-muted">
                      {r.reviewerUser.email}
                    </bdi>
                  ) : null}
                </span>
                <MarketingStatus kind="approval" value={r.status} size="sm" />
                {!disabled ? (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    label={t("removeApprover", { name: isolate(name) })}
                    icon={<X />}
                    disabled={busy}
                    onClick={() => void apply(reviewers.filter((x) => x.id !== r.id).map(toApproverOption))}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <AddApproversDialog
        open={open}
        onOpenChange={setOpen}
        selectedApprovers={reviewers.map(toApproverOption)}
        onApply={(selected) => {
          setOpen(false);
          void apply(selected);
        }}
      />
    </section>
  );
}
