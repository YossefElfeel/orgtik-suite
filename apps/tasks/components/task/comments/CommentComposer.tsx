"use client";

// Text comments and replies use JSON. Files are referenced from the task's Files section.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import { useAddCommentMutation, useUpdateCommentMutation } from "@/redux/features/comments/commentsApi";
import type { IComment } from "@/types/comments";
import type { IProjectMember } from "@/types/projects";
import { MentionTextarea, type MentionTextareaHandle } from "./MentionTextarea";
import { toEditable, toPayload, type PickedMention } from "./text";

type Props = {
  taskId: number;
  members: IProjectMember[];
  mode: "new" | "reply" | "edit";
  /** The comment answered (reply) or changed (edit). */
  comment?: IComment;
  autoFocus?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
};

export function CommentComposer({ taskId, members, mode, comment, autoFocus, onDone, onCancel }: Props) {
  const t = useTranslations("TaskComments");
  const tf = useTranslations("FileReferences");
  const hintId = useId();
  const editor = useRef<MentionTextareaHandle>(null);
  const initial = mode === "edit" && comment ? toEditable(comment.content, members) : { text: "", mentions: [] };
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState<PickedMention[]>(initial.mentions);
  const [mac, setMac] = useState(false);
  const [addComment, addState] = useAddCommentMutation();
  const [updateComment, updateState] = useUpdateCommentMutation();
  const sending = addState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMac(true);
  }, []);

  const payload = toPayload(text, mentions);
  const unchanged = mode === "edit" && comment && payload === (comment.content ?? "").trim();
  const canSend = !sending && (mode === "edit" ? !!payload && !unchanged : !!payload);

  const send = async () => {
    if (!canSend) return;
    try {
      if (mode === "edit" && comment) {
        await updateComment({ commentId: comment.id, content: payload }).unwrap();
      } else {
        await addComment({ taskId, content: payload, ...(mode === "reply" && comment ? { parentCommentId: comment.id } : {}) }).unwrap();
        setText("");
        setMentions([]);
      }
      onDone?.();
    } catch {
      // Kept as typed; the api-feedback registry already toasted the reason.
      editor.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void send();
      return;
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  const label = mode === "edit" ? t("editLabel") : mode === "reply" ? t("replyLabel") : t("newLabel");
  const placeholder = mode === "reply" ? t("replyPlaceholder") : mode === "edit" ? undefined : t("placeholder");

  return (
    <div className="flex flex-col gap-2 rounded-card">
      <MentionTextarea
        ref={editor}
        value={text}
        onChange={setText}
        mentions={mentions}
        onMentionsChange={setMentions}
        members={members}
        label={label}
        placeholder={placeholder}
        describedBy={hintId}
        autoFocus={autoFocus}
        rows={mode === "new" ? 3 : 2}
        onKeyDown={onKeyDown}
      />

      {mode !== "edit" ? <p className="text-caption text-fg-muted">{tf("commentsDeferred")}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <p id={hintId} className="me-auto text-caption text-fg-subtle">
          {t("hint", { mac: mac ? "yes" : "no" })}
        </p>
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={sending}>
            {t("cancel")}
          </Button>
        ) : null}
        <Button
          variant="primary"
          size="sm"
          loading={sending}
          disabled={!canSend && !sending}
          onClick={() => void send()}
          endIcon={mode === "edit" ? undefined : <PaperPlaneRight aria-hidden="true" className="rtl:-scale-x-100" />}
        >
          {mode === "edit" ? t("save") : mode === "reply" ? t("sendReply") : t("send")}
        </Button>
      </div>
    </div>
  );
}
