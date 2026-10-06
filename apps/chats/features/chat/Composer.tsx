"use client";

/**
 * SOMION HQ - COMPOSER
 *
 * States the design plan requires: empty, typing, mention autocomplete,
 * attachment picked, editing, and disabled in an archived channel.
 *
 * Attachments come from the File Manager rather than a private upload store,
 * because the suite has one place where documents live and a second one would
 * be the beginning of the mess the product exists to remove.
 */

import { useEffect, useRef, useState, useId } from "react";
import { At, Paperclip, PaperPlaneRight, Smiley, X, UploadSimple } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useUsers } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import type { FileRef } from "@/entities";

/** Files the File Manager would offer. Replaced by its picker endpoint. */
/** A small, deliberate set. A full emoji index is a search problem, not a
    picker problem, and it is not what this prototype is demonstrating. */
const EMOJI = [
  "\u{1F44D}", "\u{1F389}", "\u{1F440}", "\u{1F64F}", "\u{2705}", "\u{1F525}",
  "\u{1F604}", "\u{1F615}", "\u{1F622}", "\u{2764}\u{FE0F}", "\u{1F680}", "\u{1F41B}",
];

const FILE_MANAGER_SAMPLE: FileRef[] = [
  { id: "f-10", name: "Baumgartner-retainer-2026.pdf", size: "212 KB", kind: "pdf" },
  { id: "f-11", name: "invoice-template-v2.fig", size: "4.2 MB", kind: "doc" },
  { id: "f-12", name: "Q3-forecast.xlsx", size: "88 KB", kind: "sheet" },
];

/* Drafts live here, keyed by conversation, so a half-written message is
   still there after a trip to another channel. In the product they sync;
   in the prototype they last the session. */
const drafts = new Map<string, string>();

interface ComposerProps {
  placeholder: string;
  /** Where the draft is kept while the person is elsewhere. */
  draftKey?: string;
  disabled?: boolean;
  disabledReason?: string;
  onSend: (text: string, attachments: FileRef[]) => void;
  autoFocus?: boolean;
}

export function Composer({ placeholder, draftKey, disabled, disabledReason, onSend, autoFocus }: ComposerProps) {
  const users = useUsers();
  const t = useT();
  const [text, setText] = useState(() => (draftKey ? drafts.get(draftKey) ?? "" : ""));
  useEffect(() => {
    if (!draftKey) return;
    if (text) drafts.set(draftKey, text);
    else drafts.delete(draftKey);
  }, [draftKey, text]);
  const [attachments, setAttachments] = useState<FileRef[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeMention, setActiveMention] = useState(0);
  const listId = useId();
  const [showFiles, setShowFiles] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* The pickers close the way every popover in the product closes: a click
     anywhere else, or Escape. Before this they stayed open until a choice. */
  useEffect(() => {
    if (!showFiles && !showEmoji) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowFiles(false);
        setShowEmoji(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFiles(false);
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showFiles, showEmoji]);

  /* Grow with the content, up to a ceiling. A composer that scrolls internally
     at three lines is the most common small cruelty in chat UI. */
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
    setMentionQuery(null);
  };

  const onChange = (value: string) => {
    setText(value);
    /* Mention autocomplete reads the token being typed, not the whole field. */
    const match = /(?:^|\s)@([\p{L}\p{N}_]*)$/u.exec(value);
    setMentionQuery(match ? (match[1] ?? "") : null);
    setActiveMention(0);
  };

  const applyMention = (name: string) => {
    setText((v) => v.replace(/(?:^|\s)@([\p{L}\p{N}_]*)$/u, (m) => `${/^\s/.test(m) ? m[0] : ""}@${name} `));
    setMentionQuery(null);
    areaRef.current?.focus();
  };

  const matches: typeof users =
    mentionQuery === null
      ? []
      : users
          .filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 5);
  const listOpen = mentionQuery !== null && matches.length > 0;

  if (disabled) {
    return (
      <div
        className="mx-4 mb-4 flex items-center justify-center px-4 py-3 text-[12.5px]"
        style={{
          background: "var(--color-surface-sunken)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--radius-card)",
          color: "var(--color-ink-muted)",
        }}
      >
        {disabledReason ?? t("chat.archived", "This channel is archived. It stays searchable.")}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative mx-4 mb-4">
      {mentionQuery !== null && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("chat.mentionList", "People to mention")}
          className="absolute bottom-full z-30 mb-1.5 w-[260px] overflow-hidden p-1"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          {matches.map((u, i) => (
            <li key={u.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeMention}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(u.name)}
                data-active={i === activeMention ? "true" : undefined}
                className="hq-row flex w-full items-center gap-2 px-2 py-1.5 text-start"
                style={{ borderRadius: "var(--radius-control)" }}
              >
                <Avatar name={u.name} initials={u.initials} tint={u.tint} size={20} hideStatus />
                <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                  <bdi>{u.name}</bdi>
                </span>
                <span className="ms-auto truncate text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                  <bdi>{u.title}</bdi>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showFiles && (
        <div
          className="absolute bottom-full z-30 mb-1.5 w-[320px] p-2"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <p className="px-1 pb-1.5 text-[11.5px] font-semibold" style={{ color: "var(--color-ink-subtle)" }}>
            {t("chat.fromFileManager", "From Files")}
          </p>
          {/* An upload lands in the File Manager too; the channel is only
              where it is mentioned. */}
          <label
            className="hq-row mb-1 flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12.5px] font-medium"
            style={{ borderRadius: "var(--radius-control)", color: "var(--color-ink-brand)" }}
          >
            <UploadSimple size={14} weight="bold" aria-hidden="true" />
            {t("chat.uploadDevice", "Upload from this device")}
            <input
              type="file"
              className="sr-only"
              aria-label={t("chat.uploadDevice", "Upload from this device")}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length === 0) return;
                const kindOf = (name: string): FileRef["kind"] => {
                  const ext = name.split(".").pop()?.toLowerCase() ?? "";
                  if (ext === "pdf") return "pdf";
                  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
                  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
                  if (["mp4", "mov", "webm"].includes(ext)) return "video";
                  if (["doc", "docx", "txt", "md", "fig"].includes(ext)) return "doc";
                  return "other";
                };
                const fmt = (n: number) => (n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
                const refs: FileRef[] = picked.map((f, i) => ({ id: `up-${Date.now()}-${i}`, name: f.name, size: fmt(f.size), kind: kindOf(f.name) }));
                setAttachments((a) => [...a, ...refs.filter((r) => !a.some((x) => x.name === r.name))]);
                setShowFiles(false);
                e.target.value = "";
              }}
            />
          </label>
          <ul>
            {FILE_MANAGER_SAMPLE.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => {
                    setAttachments((a) => (a.some((x) => x.id === f.id) ? a : [...a, f]));
                    setShowFiles(false);
                  }}
                  className="hq-row flex w-full items-center gap-2 px-2 py-1.5 text-start"
                  style={{ borderRadius: "var(--radius-control)" }}
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--color-ink)" }}>
                    <bdi>{f.name}</bdi>
                  </span>
                  <span className="tabular shrink-0 text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                    {f.size}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showEmoji && (
        <div
          className="hq-floating hq-rise absolute bottom-full z-30 mb-1.5 w-[228px] p-2"
          style={{ borderRadius: "var(--radius-card)" }}
          role="dialog"
          aria-label={t("chat.emoji", "Add emoji")}
        >
          <div className="grid grid-cols-6 gap-1">
            {EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onChange(text + e);
                  setShowEmoji(false);
                  areaRef.current?.focus();
                }}
                className="hq-btn flex items-center justify-center text-[18px]"
                style={{ height: 32, borderRadius: "var(--radius-control)" }}
                aria-label={t("chat.insertEmoji", "Insert {emoji}", { emoji: e })}
              >
                <span aria-hidden="true">{e}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex flex-col"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-hairline-strong)",
          borderRadius: "var(--radius-card)",
        }}
      >
        {attachments.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 border-b p-2" style={{ borderColor: "var(--color-hairline)" }}>
            {attachments.map((f) => (
              <li key={f.id}>
                <span
                  className="flex items-center gap-1.5 px-2 py-1 text-[12px]"
                  style={{ background: "var(--color-surface-sunken)", borderRadius: "var(--radius-control)" }}
                >
                  <bdi>{f.name}</bdi>
                  <button
                    onClick={() => setAttachments((a) => a.filter((x) => x.id !== f.id))}
                    aria-label={t("chat.removeAttachment", "Remove {name}", { name: f.name })}
                    className="hq-btn"
                  >
                    <X size={11} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <textarea
          ref={areaRef}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-activedescendant={listOpen ? `${listId}-${activeMention}` : undefined}
          onKeyDown={(e) => {
            /* Never act in the middle of composing a character (Arabic, CJK and other IMEs). */
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (listOpen) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setActiveMention((i) => (i + step + matches.length) % matches.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const u = matches[activeMention];
                if (u) applyMention(u.name);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setMentionQuery(null);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full resize-none bg-transparent px-3 pt-2.5 text-[13.5px] leading-[1.55] outline-none"
          style={{ color: "var(--color-ink)", minHeight: 40 }}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("chat.attach", "Attach from Files")}
              onClick={() => {
                setShowFiles((v) => !v);
                setShowEmoji(false);
              }}
              style={{ color: "var(--color-ink-subtle)" }}
            >
              <Paperclip size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("chat.mention", "Mention someone")}
              onClick={() => onChange(`${text}${text.endsWith(" ") || !text ? "" : " "}@`)}
              style={{ color: "var(--color-ink-subtle)" }}
            >
              <At size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("chat.emoji", "Add emoji")}
              aria-expanded={showEmoji}
              onClick={() => {
                setShowEmoji((v) => !v);
                setShowFiles(false);
              }}
              style={{ color: "var(--color-ink-subtle)" }}
            >
              <Smiley size={16} aria-hidden="true" />
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={send}
            disabled={!text.trim() && attachments.length === 0}
          >
            <PaperPlaneRight size={13} weight="fill" aria-hidden="true" />
            {t("chat.send", "Send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
