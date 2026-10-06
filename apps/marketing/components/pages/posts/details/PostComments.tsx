"use client";

// Comments on the post, newest first, with their time in the reader's language. Sending one is
// quiet: it appears in the list.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorState, Field, LoadingState, Textarea, useFormatter } from "@orgtik/ui";
import { useMarketingRoles } from "@/lib/permissions";
import { useAppSelector } from "@/redux/app/hooks";
import { useCreateCommentMutation, useGetCommentsQuery } from "@/redux/features/posts/postsApi";

export function PostComments({ postId }: { postId: string }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const me = useAppSelector((s) => s.auth.user);
  const { readOnlySession } = useMarketingRoles();
  const { data, isLoading, isError, refetch } = useGetCommentsQuery(postId);
  const [send, { isLoading: sending }] = useCreateCommentMutation();
  const [text, setText] = useState("");
  const comments = data?.data ?? [];
  const nameOf = (u: { firstName?: string; lastName?: string } | null | undefined) => `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || t("someone");

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await send({ postId, comment: { text: text.trim() } }).unwrap();
      setText("");
    } catch {
      // The request's toast says why; the text stays.
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("commentsTitle")} />
      {readOnlySession ? null : (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={t("commentLabel")}>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="auto"
            rows={2}
            maxRows={8}
            placeholder={t("commentPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="secondary" startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />} loading={sending} disabled={!text.trim()}>
            {t("addComment")}
          </Button>
        </div>
      </form>
      )}
      {isLoading ? (
        <LoadingState rows={2} label={t("loadingComments")} />
      ) : isError ? (
        <ErrorState size="compact" title={t("commentsErrorTitle")} description={t("commentsErrorBody")} onRetry={() => refetch()} />
      ) : !comments.length ? (
        <EmptyState size="compact" title={t("noComments")} description={t("noCommentsBody")} />
      ) : (
        <ol className="flex flex-col gap-4">
          {comments.map((c) => {
            const mine = me && c.user && c.user.id === me.id;
            const name = mine ? t("you") : nameOf(c.user);
            return (
              <li key={c.id} className="flex items-start gap-3">
                <Avatar name={nameOf(c.user)} src={c.user?.avatar ?? undefined} size="sm" decorative />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-caption text-fg-muted">
                    <span dir="auto" className="font-semibold text-fg">
                      {name}
                    </span>
                    {" · "}
                    <time dateTime={c.createdAt}>{f.date(c.createdAt, { dateStyle: "medium", timeStyle: "short" })}</time>
                  </p>
                  <p dir="auto" className="whitespace-pre-wrap text-body text-fg">
                    {c.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
