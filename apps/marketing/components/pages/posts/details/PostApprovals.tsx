"use client";

// Who approves the post, where each of them stands, and, for the person whose review is waiting,
// Approve and Reject (FS-MKT-7). A rejection needs a reason, which the author reads here; an
// approval can carry a note. Both follow the server's `actions` (MKT-049): the old card showed the
// buttons only after a click on your own row and rejected with no reason.
import { useTranslations } from "next-intl";
import { Check, UserPlus, X } from "@phosphor-icons/react";
import { Avatar, Button, Card, CardHeader, ConfirmDialog, useFormatter } from "@orgtik/ui";
import AddApproversDialog from "@/components/dialogs/AddApproversDialog";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useMarketingRoles } from "@/lib/permissions";
import { isolate } from "@/lib/bidi";
import { useAddReviewerMutation, useApproveReviewerMutation, useRejectReviewerMutation } from "@/redux/features/posts/postsApi";
import type { IPostDetail } from "@/types/post";
import { RollbackButton } from "./PostStatusBanner";

export function PostApprovals({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const can = useMarketingRoles();
  const [approve] = useApproveReviewerMutation();
  const [reject] = useRejectReviewerMutation();
  const [setReviewers, { isLoading: saving }] = useAddReviewerMutation();
  const reviewers = post.approvalRequest?.reviewerUser ?? [];
  const statusOf = (r: (typeof reviewers)[number]) => r.status ?? (r.isApproved ? "APPROVED" : "PENDING");
  const approved = reviewers.filter((r) => statusOf(r) === "APPROVED").length;
  const canManage = can.editPosts && post.actions.canEdit;
  const mine = reviewers.find((r) => r.isMine);
  const name = isolate(post.title);

  const manage = canManage ? (
    <AddApproversDialog
      selectedApprovers={reviewers.map((r) => ({ id: Number(r.id), name: r.name, email: r.email, avatar: r.avatar ?? undefined }))}
      onApply={(people) => {
        void setReviewers({ postId: post.id, approverUserIds: people.map((p) => Number(p.id)) })
          .unwrap()
          .catch(() => undefined);
      }}
    >
      <Button size="sm" variant="secondary" startIcon={<UserPlus />} loading={saving}>
        {reviewers.length ? t("changeApprovers") : t("addApprovers")}
      </Button>
    </AddApproversDialog>
  ) : null;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader
        title={t("approvalsTitle")}
        description={reviewers.length ? t("approvalsProgress", { approved, total: reviewers.length }) : t("approvalsNone")}
        actions={manage}
      />

      {!can.readOnlySession && (post.actions.canApprove || post.actions.canReject) ? (
        <div className="flex flex-col gap-3 rounded-field border border-line bg-warning-subtle p-3">
          <p className="text-body-sm text-fg">{t("yourReview")}</p>
          <div className="flex flex-wrap gap-2">
            {post.actions.canApprove ? (
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="primary" startIcon={<Check />}>
                    {t("approve")}
                  </Button>
                }
                tone="primary"
                title={t("approveTitle", { name })}
                impact={post.publishMode === "INSTANT" ? t("approveImpactNow") : t("approveImpact")}
                reason={{ label: t("approveNote"), placeholder: t("approveNotePlaceholder") }}
                confirmLabel={t("approve")}
                cancelLabel={t("notNow")}
                onConfirm={({ reason }) => approve({ postId: post.id, note: reason || undefined }).unwrap()}
              />
            ) : null}
            {post.actions.canReject ? (
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="secondary" startIcon={<X />}>
                    {t("reject")}
                  </Button>
                }
                title={t("rejectTitle", { name })}
                impact={t("rejectImpact")}
                reason={{ label: t("rejectReason"), required: true, placeholder: t("rejectReasonPlaceholder") }}
                confirmLabel={t("reject")}
                cancelLabel={t("notNow")}
                onConfirm={({ reason }) => reject({ postId: post.id, note: reason }).unwrap()}
              />
            ) : null}
          </div>
        </div>
      ) : mine && statusOf(mine) !== "PENDING" ? (
        <p className="text-body-sm text-fg-muted">{statusOf(mine) === "APPROVED" ? t("youApproved") : t("youRejected")}</p>
      ) : null}

      {reviewers.length ? (
        <ul className="flex flex-col gap-3">
          {reviewers.map((r) => (
            <li key={r.id} className="flex items-start gap-3">
              <Avatar name={r.name} src={r.avatar ?? undefined} size="sm" decorative />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="auto" className="truncate text-body font-semibold text-fg">
                    {r.name}
                    {r.isMine ? <span className="ms-1 font-normal text-fg-muted">{t("youSuffix")}</span> : null}
                  </span>
                  <MarketingStatus kind="approval" value={statusOf(r)} size="sm" />
                </div>
                {r.decidedAt ? <span className="text-caption text-fg-muted">{f.date(r.decidedAt, { dateStyle: "medium", timeStyle: "short" })}</span> : null}
                {r.note ? (
                  <blockquote dir="auto" className="border-s-2 border-line-strong ps-3 text-body-sm text-fg">
                    {r.note}
                  </blockquote>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {post.approvalRequest?.note ? (
        <div className="flex flex-col gap-1 rounded-field bg-sunken p-3">
          <span className="text-caption font-semibold text-fg-muted">{t("requestNote")}</span>
          <p dir="auto" className="whitespace-pre-wrap text-body-sm text-fg">
            {post.approvalRequest.note}
          </p>
        </div>
      ) : null}

      {can.editPosts && post.actions.canRollbackToLastApproved ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-body-sm text-fg-muted">{t("rollbackHint")}</p>
          <div>
            <RollbackButton post={post} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
