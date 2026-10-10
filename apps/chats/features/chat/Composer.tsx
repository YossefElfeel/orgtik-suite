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
import { At, Paperclip, PaperPlaneRight, Smiley, X } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { recoverableMessage } from "@/store/platform";
import { useT } from "@/lib/i18n";
import type { FileRef } from "@/entities";
import { FilesPicker } from "./FilesPicker";
import { fileScope, fileAuthority as currentAuthority, useFileAuthority, type FilePickerItem } from "@/lib/file-references";
import { useFormatter } from "@orgtik/ui";

/** Files the File Manager would offer. Replaced by its picker endpoint. */
/** A small, deliberate set. A full emoji index is a search problem, not a
    picker problem, and it is not what this prototype is demonstrating. */
const EMOJI = [
  "\u{1F44D}", "\u{1F389}", "\u{1F440}", "\u{1F64F}", "\u{2705}", "\u{1F525}",
  "\u{1F604}", "\u{1F615}", "\u{1F622}", "\u{2764}\u{FE0F}", "\u{1F680}", "\u{1F41B}",
];


/* Drafts live here, keyed by conversation, so a half-written message is
   still there after a trip to another channel. In the product they sync;
   in the prototype they last the session. */
const drafts = new Map<string, string>();

interface ComposerProps {
  channelId: string;
  threadId?: string;
  placeholder: string;
  /** Where the draft is kept while the person is elsewhere. */
  draftKey?: string;
  disabled?: boolean;
  disabledReason?: string;
  onSend: (text: string, attachments: FileRef[]) => Promise<boolean>;
  autoFocus?: boolean;
}

export function Composer({ channelId, threadId, placeholder, draftKey, disabled, disabledReason, onSend, autoFocus }: ComposerProps) {
  const directory = useUsers();
  const users=[...directory,{id:"channel",name:"channel",role:"member" as const,title:"",initials:"#",tint:0,timezone:"UTC"},{id:"here",name:"here",role:"member" as const,title:"",initials:"@",tint:0,timezone:"UTC"}];
  const f = useFormatter(), authority = useFileAuthority();
  const scopedDraftKey = fileScope() + ":" + (draftKey || channelId);
  const [draftScope, setDraftScope] = useState(scopedDraftKey);
  const [sending, setSending] = useState(false), [unconfirmed, setUnconfirmed] = useState(false);
  const [sendError, setSendError] = useState(false);
  const t = useT();
  const [text, setText] = useState(() => (scopedDraftKey ? drafts.get(scopedDraftKey) ?? "" : ""));
  useEffect(() => {
    if (!scopedDraftKey || draftScope !== scopedDraftKey) return;
    if (text) drafts.set(scopedDraftKey, text);
    else drafts.delete(scopedDraftKey);
  }, [scopedDraftKey, draftScope, text]);
  const [attachments, setAttachments] = useState<FileRef[]>([]);
  useEffect(() => { const pending = recoverableMessage(channelId, threadId); setText(pending?.text || drafts.get(scopedDraftKey) || ""); setAttachments(pending?.attachments || []); setUnconfirmed(Boolean(pending)); setSendError(Boolean(pending)); setDraftScope(scopedDraftKey); }, [scopedDraftKey, channelId, threadId]);
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
    if (!showEmoji) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showEmoji]);

  const send = async () => {
    const trimmed = text.trim();
    if (sending || (!trimmed && attachments.length === 0)) return;
    setSending(true);
    const original = authority;
    try {
      const saved = await onSend(trimmed, attachments);
      if (original !== currentAuthority()) return;
      if (!saved) { setUnconfirmed(Boolean(useWorkspace.getState().workspaceSync.uncertain)); setSendError(true); return; }
      void useWorkspace.getState().applyEvent({type:"channel.typing",channelId,active:false});setText(""); setAttachments([]); setMentionQuery(null); setUnconfirmed(false); setSendError(false);
    } finally { setSending(false); }
  };
  const pickFile = (item: FilePickerItem) => {
    const file: FileRef = { id: item.fileId + ":" + item.versionId, reference: { workspaceId: item.workspaceId, fileId: item.fileId, versionId: item.versionId }, state: "available", name: item.name, size: f.bytes(item.size), kind: item.mimetype.startsWith("image/") ? "image" : item.mimetype === "application/pdf" ? "pdf" : "other", mimetype: item.mimetype };
    setAttachments(a => a.some(existing => existing.id === file.id) ? a : [...a, file]); setShowFiles(false);
  };

  const lastTyping=useRef(false);useEffect(()=>{const scope=fileScope();return()=>{if(scope===fileScope()&&lastTyping.current)void useWorkspace.getState().applyEvent({type:"channel.typing",channelId,active:false});};},[channelId]);useEffect(()=>{const active=Boolean(text);if(active===lastTyping.current)return;const timer=setTimeout(()=>{lastTyping.current=active;void useWorkspace.getState().applyEvent({type:'channel.typing',channelId,active});},400);return()=>clearTimeout(timer);},[text,channelId]);
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
        className={"mx-4 mb-4 flex items-center justify-center px-4 py-3 text-body-sm "+("ch-background-314b28"+' '+"ch-border-5065d4"+' '+"ch-border-radius-8d459a"+' '+"ch-color-4a0211")}

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
          className={"absolute bottom-full z-30 mb-1.5 w-[260px] overflow-hidden p-1 "+("ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-8d459a"+' '+"ch-box-shadow-3d74b9")}

        >
          {matches.map((u, i) => (
            <li key={u.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeMention}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(u.id)}
                data-active={i === activeMention ? "true" : undefined}
                className={"hq-row flex w-full items-center gap-2 px-2 py-1.5 text-start "+("ch-border-radius-332348")}

              >
                <Avatar name={u.name} initials={u.initials} tint={u.tint} size={20} hideStatus />
                <span className={"text-body-sm "+("ch-color-7f7330")} >
                  <bdi>{u.name}</bdi>
                </span>
                <span className={"ms-auto truncate text-caption "+("ch-color-094083")} >
                  <bdi>{u.title}</bdi>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <FilesPicker channelId={channelId} open={showFiles} onOpenChange={setShowFiles} onPick={pickFile} disabled={sending || unconfirmed} />

      {showEmoji && (
        <div
          className={"hq-floating hq-rise absolute bottom-full z-30 mb-1.5 w-[228px] p-2 "+("ch-border-radius-8d459a")}

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
                className={"hq-btn flex items-center justify-center text-title-sm "+("ch-height-268b76"+' '+"ch-border-radius-332348")}

                aria-label={t("chat.insertEmoji", "Insert {emoji}", { emoji: e })}
              >
                <span aria-hidden="true">{e}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sendError ? <p role="alert" className="mb-2 text-body-sm text-danger">{unconfirmed ? t("fileReferences.messageUnconfirmed", "Message delivery is unconfirmed. Retry to recover the same message before editing.") : t("fileReferences.messageRefused", "The message was not saved. Review your file access and try again.")}</p> : null}
      <div
        className={"flex flex-col "+("ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-8d459a")}

      >
        {draftScope === scopedDraftKey && attachments.length > 0 && (
          <ul className={"flex flex-wrap gap-1.5 border-b p-2 "+("ch-border-color-407eb5")} >
            {attachments.map((f) => (
              <li key={f.id}>
                <span
                  className={"flex items-center gap-1.5 px-2 py-1 text-caption "+("ch-background-314b28"+' '+"ch-border-radius-332348")}

                >
                  <bdi>{f.name || t("fileReferences.selected", "Selected file")}</bdi>
                  <button
                    disabled={sending || unconfirmed}
                    onClick={() => setAttachments((a) => a.filter((x) => x.id !== f.id))}
                    aria-label={t("chat.removeAttachment", "Remove {name}", { name: f.name })}
                    className="hq-btn"
                  >
                    <X size={11} weight="bold" aria-hidden="true" className={"ch-color-094083"}  />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <textarea
          ref={areaRef}
          value={draftScope === scopedDraftKey ? text : ""}
          disabled={sending || unconfirmed || draftScope !== scopedDraftKey}
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
              void send();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          className={"w-full resize-none bg-transparent px-3 pt-2.5 text-body-sm leading-[1.55] outline-none "+("ch-color-7f7330"+' '+"ch-min-height-fd2692")}

        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              disabled={sending || unconfirmed}
              label={t("chat.attach", "Attach from Files")}
              onClick={() => {
                setShowFiles((v) => !v);
                setShowEmoji(false);
              }}
              className={"ch-color-094083"}
            >
              <Paperclip size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              disabled={sending || unconfirmed}
              label={t("chat.mention", "Mention someone")}
              onClick={() => onChange(`${text}${text.endsWith(" ") || !text ? "" : " "}@`)}
              className={"ch-color-094083"}
            >
              <At size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              disabled={sending || unconfirmed}
              label={t("chat.emoji", "Add emoji")}
              aria-expanded={showEmoji}
              onClick={() => {
                setShowEmoji((v) => !v);
                setShowFiles(false);
              }}
              className={"ch-color-094083"}
            >
              <Smiley size={16} aria-hidden="true" />
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => void send()}
            disabled={sending || (!text.trim() && attachments.length === 0)}
          >
            <PaperPlaneRight size={13} weight="fill" aria-hidden="true" />
            {unconfirmed ? t("fileReferences.recoverMessage", "Recover message") : t("chat.send", "Send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
