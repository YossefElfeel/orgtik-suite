"use client";

// When the post goes out, platform by platform, in the project's time zone. A post with no date
// says "Not scheduled" (it showed NaN/NaN/NaN, MKT-050), and the three competing schedule widgets
// are one: a date and time that applies to every platform.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Button, Card, CardHeader, Field, useFormatter } from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { useUpdatePostMutation, useUpdateTargetMediaMutation } from "@/redux/features/posts/postsApi";
import type { IPostDetail } from "@/types/post";
import { PostStatusBadge } from "../shared/PostStatusBadge";
import { isFuture } from "../shared/zone";

export function PostScheduleCard({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const can = useMarketingRoles();
  const { timeZone } = useProjectContext();
  const [updatePost] = useUpdatePostMutation();
  const [updateTarget] = useUpdateTargetMediaMutation();
  const [when, setWhen] = useState<string | null>(post.scheduledAt);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setWhen(post.scheduledAt), [post.scheduledAt]);

  const a = post.actions;
  const canChange = can.editPosts && a.canEdit && (a.canSchedule || a.canReschedule || post.status === "DRAFT");
  const show = (iso: string) => f.date(iso, { dateStyle: "medium", timeStyle: "short", timeZone });
  const hasReviewers = (post.approvalRequest?.reviewerUser?.length ?? 0) > 0;

  const save = async () => {
    if (!when) return setError(t("errWhen"));
    if (!isFuture(when)) return setError(t("errPast"));
    setError(null);
    setBusy(true);
    try {
      // One time for every platform: a platform's own time would otherwise win over it.
      for (const x of post.targets) if (x.scheduledAt && x.scheduledAt !== when && !x.publishedAt) await updateTarget({ postId: post.id, targetId: x.id, body: { scheduledAt: when } }).unwrap();
      await updatePost({
        postId: post.id,
        post: { scheduledAt: when, ...(post.status === "DRAFT" ? { status: hasReviewers ? "PENDING_APPROVAL" : "SCHEDULED" } : {}) },
      }).unwrap();
    } catch {
      // The request's toast says why.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeader
        title={t("scheduleTitle")}
        description={post.publishedAt ? t("publishedAt", { when: show(post.publishedAt) }) : post.scheduledAt ? t("scheduledFor", { when: show(post.scheduledAt) }) : t("notScheduled")}
      />
      <ul className="flex flex-col divide-y divide-line">
        {post.targets.map((x) => {
          const at = x.publishedAt ?? x.scheduledAt ?? post.scheduledAt;
          return (
            <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <PlatformBadge platform={x.platformKey} className="min-w-28" />
              <PostStatusBadge value={x.isDeletedOnPlatform ? "DRAFT" : x.status} />
              <span className="text-body-sm text-fg-muted">{at ? <time dateTime={at}>{show(at)}</time> : t("notScheduled")}</span>
              {x.postUrl ? (
                <a href={x.postUrl} target="_blank" rel="noopener noreferrer" className="ms-auto inline-flex items-center gap-1 text-body-sm font-semibold text-fg-brand underline">
                  {t("openOn", { platform: platformMeta(x.platformKey).name })}
                  <ArrowSquareOut aria-hidden className="size-4 rtl:-scale-x-100" />
                </a>
              ) : null}
              {x.errorMessage ? (
                <p className="basis-full text-body-sm text-danger" dir="auto">
                  {x.errorMessage}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {canChange ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <Field label={post.scheduledAt ? t("reschedule") : t("schedule")} error={error ?? undefined}>
            <DateTimePicker value={when} onChange={(v) => setWhen(v)} timeZone={timeZone} min={new Date().toISOString()} defaultTime="10:00" dateLabel={t("date")} timeLabel={t("time")} />
          </Field>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={save} loading={busy} disabled={!when || when === post.scheduledAt}>
              {post.status === "DRAFT" ? (hasReviewers ? t("scheduleAndSend") : t("scheduleSave")) : t("rescheduleSave")}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
