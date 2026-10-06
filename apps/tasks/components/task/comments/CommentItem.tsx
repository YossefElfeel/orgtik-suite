"use client";

// One comment and its replies: who, when, what, the files, reactions, and the author's own
// Edit and Delete. Read-only viewers get the thread without any of the buttons.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowBendUpLeft, DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { Avatar, Button, ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, cn } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { timeAgo } from "@/lib/relative";
import { useAppSelector } from "@/redux/app/hooks";
import { useDeleteCommentMutation } from "@/redux/features/comments/commentsApi";
import type { IComment } from "@/types/comments";
import type { IProjectMember } from "@/types/projects";
import { AttachmentCard } from "./AttachmentCard";
import { CommentBody } from "./CommentBody";
import { CommentComposer } from "./CommentComposer";
import { Reactions } from "./Reactions";
import { fullName } from "./text";

// Replies of replies keep their thread line but stop stepping in after this.
const MAX_INDENT = 2;

type Props = {
  comment: IComment;
  taskId: number;
  members: IProjectMember[];
  readOnly: boolean;
  depth?: number;
};

const countAll = (c: IComment): number => (c.replies ?? []).reduce((n, r) => n + 1 + countAll(r), 0);

export function CommentItem({ comment, taskId, members, readOnly, depth = 0 }: Props) {
  const t = useTranslations("TaskComments");
  const locale = useLocale();
  const me = useAppSelector((s) => s.auth.user);
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteComment] = useDeleteCommentMutation();

  const author = fullName(comment.author ?? {}) || t("formerMember");
  const created = String(comment.createdAt);
  const edited = new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000;
  const mine = !!me && me.id === comment.author?.id;
  const replies = comment.replies ?? [];
  const nested = countAll(comment);
  const attachments = comment.attachments ?? [];
  const images = attachments.filter((a) => (a.mimetype || "").startsWith("image/"));
  const files = attachments.filter((a) => !(a.mimetype || "").startsWith("image/"));

  const impact =
    nested > 0
      ? t("deleteImpactReplies", { count: nested })
      : attachments.length > 0
        ? t("deleteImpactFiles", { count: attachments.length })
        : t("deleteImpact");

  return (
    <li className={cn("flex flex-col gap-3", depth > 0 && "border-s border-line ps-3")}>
      <article className="flex gap-3" aria-label={t("commentBy", { name: isolate(author) })}>
        <Avatar name={author} src={comment.author?.avatar} size={depth ? "xs" : "sm"} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <header className="flex items-start gap-2">
            <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <span dir="auto" className="truncate text-label text-fg">
                {author}
              </span>
              <time dateTime={created} title={new Date(created).toLocaleString(locale)} className="text-caption text-fg-muted">
                {timeAgo(created, locale)}
              </time>
              {edited ? <span className="text-caption text-fg-subtle">{t("edited")}</span> : null}
            </p>
            {!readOnly && mine && mode !== "edit" ? (
              <Menu>
                <MenuTrigger
                  render={
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label={t("actionsFor", { name: isolate(author) })}
                      icon={<DotsThreeVertical weight="bold" aria-hidden="true" />}
                    />
                  }
                />
                <MenuContent align="end">
                  <MenuItem icon={<PencilSimple aria-hidden="true" />} onClick={() => setMode("edit")}>
                    {t("edit")}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem tone="danger" icon={<Trash aria-hidden="true" />} onClick={() => setConfirmOpen(true)}>
                    {t("delete")}
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : null}
          </header>

          {mode === "edit" ? (
            <CommentComposer
              taskId={taskId}
              members={members}
              mode="edit"
              comment={comment}
              autoFocus
              onDone={() => setMode("view")}
              onCancel={() => setMode("view")}
            />
          ) : (
            <CommentBody content={comment.content} members={members} />
          )}

          {images.length ? (
            <ul className="flex flex-wrap gap-2" aria-label={t("imagesLabel")}>
              {images.map((a) => (
                <li key={a.id}>
                  <AttachmentCard attachment={a} />
                </li>
              ))}
            </ul>
          ) : null}
          {files.length ? (
            <ul className="flex flex-col gap-2" aria-label={t("filesLabel")}>
              {files.map((a) => (
                <li key={a.id}>
                  <AttachmentCard attachment={a} />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Reactions commentId={comment.id} reactions={comment.reactions ?? []} readOnly={readOnly} />
            {!readOnly && mode !== "edit" ? (
              <Button
                variant="ghost"
                size="sm"
                startIcon={<ArrowBendUpLeft aria-hidden="true" className="rtl:-scale-x-100" />}
                aria-expanded={mode === "reply"}
                onClick={() => setMode(mode === "reply" ? "view" : "reply")}
              >
                {t("reply")}
              </Button>
            ) : null}
          </div>

          {mode === "reply" ? (
            <CommentComposer
              taskId={taskId}
              members={members}
              mode="reply"
              comment={comment}
              autoFocus
              onDone={() => setMode("view")}
              onCancel={() => setMode("view")}
            />
          ) : null}
        </div>
      </article>

      {replies.length ? (
        <ul
          className={cn("flex flex-col gap-3", depth === 0 ? "ps-11" : depth < MAX_INDENT && "ps-3")}
          aria-label={t("repliesLabel", { count: replies.length, name: isolate(author) })}>
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} taskId={taskId} members={members} readOnly={readOnly} depth={depth + 1} />
          ))}
        </ul>
      ) : null}

      {!readOnly && mine ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("deleteTitle")}
          impact={impact}
          irreversible
          tone="danger"
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={() => deleteComment(comment.id).unwrap()}
        />
      ) : null}
    </li>
  );
}
