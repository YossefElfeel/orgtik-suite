"use client";

// The post's title, text, labels and status, editable in place when the server says it can be
// changed (`actions.canEdit`, MKT-048/049). The editor used to be imported and never shown, and
// Save re-sent the unchanged text while Status offered every state ("Draft" twice) and changed
// nothing. Now Save sends what changed, and Status offers only the moves the post can make.
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardHeader, Field, Input, MultiSelect, Select, Textarea } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useMarketingStatusLabel } from "@/components/shared/MarketingStatus";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetLabelsListQuery } from "@/redux/features/labels/labelsApi";
import { useUpdatePostMutation } from "@/redux/features/posts/postsApi";
import type { IPostDetail } from "@/types/post";
import { LabelTag } from "../shared/LabelTag";
import { isFuture } from "../shared/zone";

/** The statuses a post can be moved to by hand from where it is. Publishing goes through Publish now. */
function moves(post: IPostDetail): string[] {
  const hasReviewers = (post.approvalRequest?.reviewerUser?.length ?? 0) > 0;
  const canSchedule = isFuture(post.scheduledAt);
  switch (post.status) {
    case "DRAFT":
      return ["DRAFT", ...(hasReviewers ? ["PENDING_APPROVAL"] : canSchedule ? ["SCHEDULED"] : []), "CANCELED"];
    case "SCHEDULED":
      return ["SCHEDULED", "DRAFT", "CANCELED"];
    case "PENDING":
      return ["PENDING_APPROVAL", "DRAFT", "CANCELED"];
    case "FAILED":
    case "PARTIAL":
      return [post.status, "DRAFT", "CANCELED"];
    case "CANCELED":
      return ["CANCELED", "DRAFT"];
    default:
      return [];
  }
}
const current = (post: IPostDetail) => (post.status === "PENDING" ? "PENDING_APPROVAL" : post.status);

export function PostContentCard({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const statusLabel = useMarketingStatusLabel();
  const can = useMarketingRoles();
  const { data: labels } = useGetLabelsListQuery();
  const [update, { isLoading }] = useUpdatePostMutation();
  const editable = can.editPosts && post.actions.canEdit;
  const options = can.editPosts ? moves(post) : [];
  const perPlatform = post.targets.some((x) => !x.useMasterText && x.textOverride);

  const [title, setTitle] = useState(post.title);
  const [text, setText] = useState(post.text);
  const [labelIds, setLabelIds] = useState<string[]>(post.labelIds ?? post.labels.map((l) => l.id));
  const [status, setStatus] = useState(current(post));
  const [titleError, setTitleError] = useState<string | null>(null);

  // A fresh copy from the server (after a save, an approval) replaces the fields.
  useEffect(() => {
    setTitle(post.title);
    setText(post.text);
    setLabelIds(post.labelIds ?? post.labels.map((l) => l.id));
    setStatus(current(post));
    setTitleError(null);
  }, [post]);

  const dirty = useMemo(
    () => title !== post.title || text !== post.text || labelIds.join(",") !== (post.labelIds ?? []).join(",") || status !== current(post),
    [title, text, labelIds, status, post],
  );

  const save = async () => {
    if (!title.trim()) {
      setTitleError(t("errTitle"));
      return;
    }
    try {
      await update({
        postId: post.id,
        post: {
          ...(editable && title.trim() !== post.title ? { title: title.trim() } : {}),
          ...(editable && !perPlatform && text !== post.text ? { text } : {}),
          ...(editable ? { labelIds } : {}),
          ...(status !== current(post) ? { status } : {}),
        },
      }).unwrap();
    } catch {
      // The request's toast says why; the fields keep what was typed.
    }
  };

  const shownLabels = post.labels;
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeader title={t("contentTitle")} description={editable ? t("contentEditable") : t("contentReadOnly")} />
      {editable ? (
        <>
          <Field label={t("titleLabel")} required error={titleError ?? undefined}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} dir="auto" required maxLength={200} />
          </Field>
          {perPlatform ? (
            <div className="flex flex-col gap-2 rounded-field border border-line bg-sunken p-3">
              <p className="text-body-sm text-fg-muted">
                {t("perPlatformNote")}{" "}
                <Link href={`/posts/${post.id}/edit`} className="font-semibold text-fg-brand underline">
                  {t("openComposer")}
                </Link>
              </p>
            </div>
          ) : (
            <Field label={t("textLabel")}>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} dir="auto" rows={6} maxRows={16} />
            </Field>
          )}
          <Field label={t("labelsLabel")} optional>
            <MultiSelect
              aria-label={t("labelsLabel")}
              options={(labels?.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
              value={labelIds}
              onValueChange={setLabelIds}
              placeholder={t("labelsPlaceholder")}
              emptyText={t("noLabels")}
            />
          </Field>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p dir="auto" className="whitespace-pre-wrap text-body text-fg">
            {post.text || t("noText")}
          </p>
          {perPlatform ? (
            <ul className="flex flex-col gap-2">
              {post.targets
                .filter((x) => !x.useMasterText && x.textOverride)
                .map((x) => (
                  <li key={x.id} className="rounded-field border border-line bg-sunken p-3">
                    <p className="text-caption font-semibold text-fg-muted">
                      <bdi>{platformMeta(x.platformKey).name}</bdi>
                    </p>
                    <p dir="auto" className="whitespace-pre-wrap text-body-sm text-fg">
                      {x.textOverride}
                    </p>
                  </li>
                ))}
            </ul>
          ) : null}
          {shownLabels.length ? (
            <div className="flex flex-wrap gap-1.5" aria-label={t("labelsLabel")}>
              {shownLabels.map((l) => (
                <LabelTag key={l.id} name={l.name} color={l.color} />
              ))}
            </div>
          ) : null}
        </div>
      )}
      {options.length > 1 ? (
        <Field label={t("statusLabel")} description={t("statusHint")}>
          <Select value={status} onValueChange={(v) => v && setStatus(v)} options={options.map((s) => ({ value: s, label: statusLabel("post", s) }))} />
        </Field>
      ) : null}
      {editable || options.length > 1 ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={!dirty || isLoading}
            onClick={() => {
              setTitle(post.title);
              setText(post.text);
              setLabelIds(post.labelIds ?? []);
              setStatus(current(post));
              setTitleError(null);
            }}
          >
            {t("discard")}
          </Button>
          <Button variant="primary" onClick={save} loading={isLoading} disabled={!dirty}>
            {t("save")}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
