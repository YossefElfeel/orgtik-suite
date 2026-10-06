"use client";

// What state the post is in and the one next step, from the server's own flags (MKT-049). The old
// banner always showed a button, two of which only logged to the console; a published post always
// claimed "You have unpublished edits"; a missing post fell back to "Pending approval" (MKT-050).
// Publishing now and going back to the approved version both ask first.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, CalendarCheck, CheckCircle, HourglassMedium, PaperPlaneTilt, PencilSimple, Prohibit, WarningCircle, XCircle } from "@phosphor-icons/react";
import { Button, ConfirmDialog, buttonVariants, useFormatter, cn } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { isolate } from "@/lib/bidi";
import { usePublishNowMutation, useRollbackLastApprovedMutation } from "@/redux/features/posts/postsApi";
import type { IPostDetail } from "@/types/post";
import { useListFormat } from "../shared/useList";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const BOX: Record<Tone, string> = {
  neutral: "border-line bg-sunken",
  info: "border-line bg-info-subtle",
  success: "border-line bg-success-subtle",
  warning: "border-line bg-warning-subtle",
  danger: "border-line bg-danger-subtle",
};
const ICON: Record<Tone, string> = { neutral: "text-fg-muted", info: "text-info", success: "text-success", warning: "text-warning", danger: "text-danger" };

export function PublishNowButton({ post, label, variant = "primary" }: { post: IPostDetail; label?: string; variant?: "primary" | "secondary" }) {
  const t = useTranslations("PostDetails");
  const list = useListFormat();
  const [publish] = usePublishNowMutation();
  const names = post.targets.map((x) => platformMeta(x.platformKey).name);
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant={variant} startIcon={<PaperPlaneTilt />}>
          {label ?? t("publishNow")}
        </Button>
      }
      tone="primary"
      title={t("publishTitle", { name: isolate(post.title) })}
      impact={t("publishImpact", { platforms: list(names), count: names.length })}
      confirmLabel={t("publishNow")}
      cancelLabel={t("notNow")}
      onConfirm={() => publish(post.id).unwrap()}
    />
  );
}

export function RollbackButton({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const [rollback] = useRollbackLastApprovedMutation();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="secondary" startIcon={<ArrowCounterClockwise />}>
          {t("rollback")}
        </Button>
      }
      tone="primary"
      title={t("rollbackTitle")}
      impact={t("rollbackImpact")}
      confirmLabel={t("rollbackConfirm")}
      cancelLabel={t("keepChanges")}
      onConfirm={() => rollback(post.id).unwrap()}
    />
  );
}

export function PostStatusBanner({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const can = useMarketingRoles();
  const { timeZone } = useProjectContext();
  const a = post.actions;
  const when = (iso: string) => f.date(iso, { dateStyle: "full", timeStyle: "short", timeZone });
  const reviewers = post.approvalRequest?.reviewerUser ?? [];
  const approved = reviewers.filter((r) => (r.status ?? (r.isApproved ? "APPROVED" : "PENDING")) === "APPROVED").length;
  const mine = reviewers.find((r) => r.isMine);
  const failed = post.targets.filter((x) => x.status === "FAILED" || x.errorMessage);
  const editLink =
    can.editPosts && a.canEdit ? (
      <Link href={`/posts/${post.id}/edit`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <PencilSimple aria-hidden className="size-4" />
        {t("edit")}
      </Link>
    ) : null;

  let tone: Tone = "neutral";
  let icon: ReactNode = <CheckCircle weight="fill" />;
  let title = "";
  let body: ReactNode = null;
  let action: ReactNode = null;

  if (post.reApproveRequired || post.workflowState === "REAPPROVAL_REQUIRED") {
    tone = "warning";
    icon = <ArrowCounterClockwise weight="bold" />;
    title = t("bannerReapproval");
    body = t("bannerReapprovalBody");
  } else if (post.approvalStatus === "REJECTED") {
    tone = "danger";
    icon = <XCircle weight="fill" />;
    title = t("bannerRejected");
    body = t("bannerRejectedBody");
    action = editLink;
  } else if (post.status === "PENDING") {
    tone = "warning";
    icon = <HourglassMedium weight="fill" />;
    title = t("bannerPending");
    body = a.canApprove && mine ? t("bannerPendingYou") : t("bannerPendingBody", { approved, total: reviewers.length });
  } else if (post.status === "SCHEDULED") {
    tone = "info";
    icon = <CalendarCheck weight="fill" />;
    title = post.scheduledAt ? t("bannerScheduled", { when: when(post.scheduledAt) }) : t("bannerScheduledNoTime");
    body = t("bannerScheduledBody");
    action = can.editPosts && a.canPublishNow ? <PublishNowButton post={post} variant="secondary" /> : null;
  } else if (post.status === "DRAFT") {
    tone = "neutral";
    icon = <PencilSimple weight="bold" />;
    title = t("bannerDraft");
    body = t("bannerDraftBody");
    action = can.editPosts && a.canPublishNow ? <PublishNowButton post={post} variant="secondary" /> : editLink;
  } else if (post.status === "FAILED" || post.status === "PARTIAL") {
    tone = "danger";
    icon = <WarningCircle weight="fill" />;
    title = post.status === "PARTIAL" ? t("bannerPartial") : t("bannerFailed");
    body = (
      <ul className="flex flex-col gap-1">
        {failed.map((x) => (
          <li key={x.id}>
            <bdi className="font-semibold">{platformMeta(x.platformKey).name}</bdi>
            {": "}
            <span dir="auto">{x.errorMessage ?? t("noReason")}</span>
          </li>
        ))}
      </ul>
    );
    action = can.editPosts && a.canPublishNow ? <PublishNowButton post={post} variant="secondary" label={t("tryAgain")} /> : null;
  } else if (post.status === "PUBLISHED") {
    tone = "success";
    icon = <CheckCircle weight="fill" />;
    title = post.publishedAt ? t("bannerPublished", { when: when(post.publishedAt) }) : t("bannerPublishedNoTime");
    body = t("bannerPublishedBody");
  } else if (post.status === "CANCELED") {
    tone = "neutral";
    icon = <Prohibit weight="bold" />;
    title = t("bannerCanceled");
    body = t("bannerCanceledBody");
  }

  return (
    <div className={cn("flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-start", BOX[tone])}>
      <span aria-hidden className={cn("mt-0.5 shrink-0 [&>svg]:size-6", ICON[tone])}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body font-semibold text-fg">{title}</p>
        {body ? <div className="text-body-sm text-fg-muted">{body}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
