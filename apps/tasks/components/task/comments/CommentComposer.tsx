"use client";

// Writing a comment, a reply, or an edit. @ mentions people in the project, files go in through
// the library's FileField (not for edits: the API changes only the text), Ctrl/⌘+Enter sends.
import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Paperclip, PaperPlaneRight } from "@phosphor-icons/react";
import { Button, FileField, IconButton, cn, toast, useFormatter } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { useAddCommentMutation, useUpdateCommentMutation } from "@/redux/features/comments/commentsApi";
import type { IComment } from "@/types/comments";
import type { IProjectMember } from "@/types/projects";
import { MentionTextarea, type MentionTextareaHandle } from "./MentionTextarea";
import { MAX_FILE_SIZE, isBlocked, toEditable, toPayload, type PickedMention } from "./text";

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
  const f = useFormatter();
  const hintId = useId();
  const editor = useRef<MentionTextareaHandle>(null);
  const initial = mode === "edit" && comment ? toEditable(comment.content, members) : { text: "", mentions: [] };
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState<PickedMention[]>(initial.mentions);
  const [files, setFiles] = useState<File[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mac, setMac] = useState(false);
  const [addComment, addState] = useAddCommentMutation();
  const [updateComment, updateState] = useUpdateCommentMutation();
  const sending = addState.isLoading || updateState.isLoading;
  const allowFiles = mode !== "edit";

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMac(true);
  }, []);

  const payload = toPayload(text, mentions);
  const unchanged = mode === "edit" && comment && payload === (comment.content ?? "").trim();
  const canSend = !sending && (mode === "edit" ? !!payload && !unchanged : !!payload || files.length > 0);

  // The spec's rules (25 MB, no executables) for every way in: FileField checks size and type,
  // this adds the blocklist and covers files dropped on the composer itself.
  const takeFiles = (incoming: File[]) => {
    const ok = incoming.filter((file) => {
      if (isBlocked(file)) {
        toast.error(t("fileBlocked", { name: isolate(file.name) }));
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("fileTooLarge", { name: isolate(file.name), max: f.bytes(MAX_FILE_SIZE) }));
        return false;
      }
      return true;
    });
    setFiles(ok);
  };

  const send = async () => {
    if (!canSend) return;
    try {
      if (mode === "edit" && comment) {
        await updateComment({ commentId: comment.id, content: payload }).unwrap();
      } else {
        const body = new FormData();
        body.append("id", String(taskId));
        body.append("content", payload);
        if (mode === "reply" && comment) body.append("parentCommentId", String(comment.id));
        files.forEach((file) => body.append("attachments", file));
        await addComment(body).unwrap();
        setText("");
        setMentions([]);
        setFiles([]);
        setShowFiles(false);
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

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    // A drop on the FileField inside is the field's own (it already took the files).
    if (!allowFiles || e.defaultPrevented || !e.dataTransfer.files.length) return setDragging(false);
    e.preventDefault();
    setDragging(false);
    setShowFiles(true);
    takeFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  const label = mode === "edit" ? t("editLabel") : mode === "reply" ? t("replyLabel") : t("newLabel");
  const placeholder = mode === "reply" ? t("replyPlaceholder") : mode === "edit" ? undefined : t("placeholder");

  return (
    <div
      className={cn("flex flex-col gap-2 rounded-card", dragging && "outline-2 outline-offset-2 outline-dashed outline-focus")}
      onDragOver={(e) => {
        if (!allowFiles || e.defaultPrevented || !Array.from(e.dataTransfer.types).includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
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

      {allowFiles && showFiles ? (
        <FileField
          label={t("attachLabel")}
          description={t("attachHint", { max: f.bytes(MAX_FILE_SIZE) })}
          value={files}
          onChange={takeFiles}
          maxSize={MAX_FILE_SIZE}
          disabled={sending}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <p id={hintId} className="me-auto text-caption text-fg-subtle">
          {t("hint", { mac: mac ? "yes" : "no" })}
        </p>
        {allowFiles ? (
          <IconButton
            variant="ghost"
            size="sm"
            label={files.length ? t("attachWithCount", { count: files.length }) : t("attach")}
            icon={<Paperclip aria-hidden="true" />}
            aria-expanded={showFiles}
            onClick={() => setShowFiles((v) => !v)}
            disabled={sending}
          />
        ) : null}
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
