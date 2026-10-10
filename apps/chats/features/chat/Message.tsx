"use client";

/**
 * SOMION HQ - MESSAGE
 *
 * All the states the design plan names: normal, mention, system, edited,
 * deleted (tombstone), pinned, with reactions, attachments, a context card and
 * a thread summary. Hover actions stay hidden until the row is hovered or
 * focused, so a dense transcript is not a wall of buttons.
 */

import {MessageTools,RichMessage} from "./ChatFeatures";
import { memo, useEffect, useRef, useState } from "react";
import { useFormatter } from "@orgtik/ui";
import {
  DotsThree,
  PushPin,
  PushPinSlash,
  Smiley,
  ChatTeardropText,
  FileText,
  PencilSimple,
  LinkSimple,
  Trash,
} from "@phosphor-icons/react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { ConfirmModal, Menu } from "@/components/ui/Overlays";
import { FilePreview } from "./FilePreview";
import { ContextCard } from "./ContextCard";
import { LinkPreview, URL_PATTERN } from "./LinkPreview";
import { MeetingMessageCard } from "@/features/meetings/ShareMeeting";
import { useRouter } from "next/navigation";
import { useCan, useMe, usePresenceOf, useUser, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatTime } from "@/lib/time";
import type { Message as MessageT } from "@/entities";

const QUICK_REACTIONS = ["👍", "🎉", "👀", "🙏"];

interface MessageProps {
  message: MessageT;
  /** Consecutive messages from one person collapse the avatar and name. */
  grouped: boolean;
  onOpenThread?: (id: string) => void;
}

function MessageBase({ message, grouped, onOpenThread }: MessageProps) {
  const author = useUser(message.authorId);
  const presence = usePresenceOf(message.authorId);
  const me = useMe();
  const users = useUsers();
  const toggleReaction = useWorkspace((s) => s.toggleReaction);
  const togglePin = useWorkspace((s) => s.togglePin);
  const notify = useWorkspace((s) => s.notify);
  const editMessage = useWorkspace((s) => s.editMessage);
  const deleteMessage = useWorkspace((s) => s.deleteMessage);
  const can = useCan();
  const editWindow = useWorkspace((s) => s.settings.editWindowMinutes);
  const t = useT();
  const format = useFormatter();
  const [showPicker, setShowPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState<import("@/entities").FileRef | null>(null);
  const openDm = useWorkspace((s) => s.openOrCreateDm);
  const router = useRouter();

  /* A mention opens the conversation with that person, creating it if the two
     have never spoken. Your own name has no conversation to open, so it goes
     to your own page instead of swallowing the click. */
  const openPerson = (userId: string) => {
    if (userId === me.id) {
      router.push("/hq/me");
      return;
    }
    router.push(`/hq/chat/${openDm(userId)}`);
  };
  const editRef = useRef<HTMLTextAreaElement>(null);

  /* Editing happens where the message already is, so the surrounding
     conversation stays readable while you change it. */
  useEffect(() => {
    if (!editing) return;
    const el = editRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);

  }, [editing]);

  if (!author) return null;

  /* Deleted messages leave a tombstone for 24 hours rather than a hole in the
     conversation. */
  if (message.deletedAt) {
    return (
      <div className="px-4 py-1.5 ps-[52px]">
        <span
          className={"inline-block px-2 py-1 text-caption italic "+("ch-background-314b28"+' '+"ch-color-094083"+' '+"ch-border-radius-332348")}
          
        >
          {t("chat.deleted", "This message was deleted.")}
        </span>
      </div>
    );
  }

  const mentionsMe = message.text.includes(me.name);
  const mine = message.authorId === me.id;
  /* A message may be edited for as long as the workspace allows. Past that,
     the menu simply stops offering it. */
  const canEditNow =
    editWindow === null || Date.now() - new Date(message.createdAt).getTime() <= editWindow * 60_000;
  const replyPeople = message.replyUserIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  return (
    <article
      id={message.id}
      className={"hq-msg group relative px-4 py-1 "+((mentionsMe?"ch-background-1416a8"+' '+"ch-border-radius-332348":""))}
      
    >
      <div className="flex gap-3">
        <div className="w-[36px] shrink-0 pt-0.5">
          {!grouped ? (
            <Avatar
              name={author.name}
              initials={author.initials}
              tint={author.tint}
              status={presence?.status}
              size={40}
            />
          ) : (
            <span
              className={"tabular block pt-0.5 text-end text-micro opacity-0 transition-opacity group-hover:opacity-100 "+("ch-color-094083")}
              
            >
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!grouped && (
            <div className="flex items-baseline gap-2">
              <span className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
                <bdi>{author.name}</bdi>
              </span>
              <span className={"tabular text-caption "+("ch-color-094083")} >
                {formatTime(message.createdAt)}
              </span>
              {message.pinned && (
                <span className={"flex items-center gap-1 text-micro "+("ch-color-4a0211")} >
                  <PushPin size={10} weight="fill" aria-hidden="true" />
                  {t("chat.pinned", "Pinned")}
                </span>
              )}
            </div>
          )}

          {message.contextRef && (
            <div className="mb-1.5 mt-1 max-w-[520px]">
              <ContextCard object={message.contextRef} />
            </div>
          )}

          {editing ? (
            <div className="mt-1 flex flex-col gap-2">
              <textarea
                ref={editRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);

                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditing(false);
                    setDraft(message.text);
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.trim()) editMessage(message.id, draft.trim());
                    setEditing(false);
                  }
                }}
                rows={1}
                aria-label={t("chat.editing", "Edit your message")}
                className={"w-full resize-none "+("ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-14f075"+' '+"ch-font-size-ba0694"+' '+"ch-line-height-afef7d"+' '+"ch-color-7f7330")}
                
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!draft.trim()}
                  onClick={() => {
                    if (draft.trim()) editMessage(message.id, draft.trim());
                    setEditing(false);
                  }}
                >
                  {t("common.save", "Save")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.text);
                  }}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <span className={"text-caption "+("ch-color-094083")} >
                  {t("chat.escapeToCancel", "Escape to cancel")}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* What people wrote reads in its own direction: an English message stays LTR in Arabic. */}
              <div dir="auto" className={"whitespace-pre-wrap text-body-sm leading-[1.55] "+("ch-color-7f7330")} >
                {message.format==="rich"?<RichMessage text={message.text}/>:renderText(message.text, users, openPerson)}
                {message.editedAt && (
                  <span className={"ms-1.5 text-micro "+("ch-color-094083")} >
                    {t("chat.edited", "(edited)")}
                  </span>
                )}
              </div>
              {(() => {
                const found = message.text.match(URL_PATTERN);
                return found?.[0] ? <LinkPreview url={found[0]} /> : null;
              })()}
            </>
          )}

          <MessageTools message={message}/>
          {message.meetingId && <MeetingMessageCard meetingId={message.meetingId} />}

          {message.attachments.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {message.attachments.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setPreview(f)}
                    className={"hq-btn inline-flex items-center gap-2 px-2.5 py-1.5 text-start "+("ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-background-751d03"+' '+"ch-min-height-87483b")}
                    
                  >
                    <FileText size={15} aria-hidden="true" className={"ch-color-4a0211"}  />
                    <span className={"text-body-sm font-medium "+("ch-color-7f7330")} >
                      <bdi>{f.state === "unavailable" ? t("fileReferences.unavailable", "File unavailable") : f.name}</bdi>
                    </span>
                    <span className={"tabular text-caption "+("ch-color-094083")} >
                      {f.state === "unavailable" ? "" : typeof f.bytes === "number" ? format.bytes(f.bytes) : f.size}
                    </span>
                    {/* Attachments live in the File Manager. HQ owns no second
                        store, which is why this says where the file actually is. */}
                    <span className={"text-micro "+("ch-color-094083")} >
                      {t("chat.inFileManager", "in Files")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {message.reactions.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {message.reactions.map((r) => {
                const mine = r.userIds.includes(me.id);
                return (
                  <li key={r.emoji}>
                    <button
                      onClick={() => toggleReaction(message.id, r.emoji)}
                      className={"hq-btn flex items-center gap-1 px-1.5 py-0.5 text-caption "+((mine?"ch-background-1416a8":"ch-background-314b28")+' '+(mine?"ch-border-c98846":"ch-border-52e799")+' '+"ch-border-radius-189003"+' '+"ch-color-7f7330")}
                      
                      aria-pressed={mine}
                      aria-label={t("chat.reactionCount", "{emoji}, {n} people", {
                        emoji: r.emoji,
                        n: r.userIds.length,
                      })}
                    >
                      <span aria-hidden="true">{r.emoji}</span>
                      <span className={"tabular "+("ch-color-4a0211")} >
                        {r.userIds.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Thread summary. Replies collapse by default so the channel stays
              readable - the reason threads exist at all. */}
          {message.replyCount > 0 && onOpenThread && (
            <button
              onClick={() => onOpenThread(message.id)}
              className={"hq-btn mt-1.5 flex items-center gap-2 px-1.5 py-1 text-body-sm font-medium "+("ch-color-55f463"+' '+"ch-border-radius-332348")}
              
            >
              <AvatarStack people={replyPeople} size={20} max={3} />
              <span>
                {message.replyCount === 1
                  ? t("chat.oneReply", "1 reply")
                  : t("chat.nReplies", "{n} replies", { n: message.replyCount })}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={"hq-msg-actions absolute end-3 top-0 flex items-center gap-0.5 p-0.5 "+("ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-box-shadow-03c10c")}
        
      >
        {showPicker ? (
          <div className="flex items-center gap-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction(message.id, emoji);
                  setShowPicker(false);
                }}
                className={"hq-btn px-1.5 py-0.5 text-body-sm "+("ch-border-radius-332348")}
                
                aria-label={t("chat.reactWith", "React with {emoji}", { emoji })}
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("chat.react", "Add reaction")}
              onClick={() => setShowPicker(true)}
              className={"ch-color-4a0211"} 
            >
              <Smiley size={15} aria-hidden="true" />
            </Button>
            {onOpenThread && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                label={t("chat.replyInThread", "Reply in thread")}
                onClick={() => onOpenThread(message.id)}
                className={"ch-color-4a0211"} 
              >
                <ChatTeardropText size={15} aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={message.pinned ? t("chat.unpin", "Unpin") : t("chat.pin", "Pin to channel")}
              onClick={() => togglePin(message.id)}
              className={(message.pinned?"ch-color-55f463":"ch-color-4a0211")} 
            >
              <PushPin size={15} weight={message.pinned ? "fill" : "regular"} aria-hidden="true" />
            </Button>
            <span className="relative">

              <Menu
                trigger={<Button
                variant="ghost"
                size="sm"
                iconOnly
                label={t("chat.more", "More actions")}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((v) => !v)}
                className={"ch-color-4a0211"} 
              >
                <DotsThree size={15} weight="bold" aria-hidden="true" />
              </Button>}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                label={t("chat.messageActions", "Message actions")}
                items={[
                  ...(mine && canEditNow
                    ? [
                        {
                          id: "edit",
                          label: t("chat.edit", "Edit message"),
                          icon: <PencilSimple size={14} aria-hidden="true" />,
                          onSelect: () => {
                            setDraft(message.text);
                            setEditing(true);
                          },
                        },
                      ]
                    : []),
                  {
                    id: "copy",
                    label: t("chat.copyLink", "Copy link"),
                    icon: <LinkSimple size={14} aria-hidden="true" />,
                    onSelect: () => {
                      const url = `${window.location.origin}/hq/chat/${message.channelId}#${message.id}`;
                      /* The menu closes on select, so the confirmation is a toast (CHT-033). */
                      void navigator.clipboard?.writeText(url).then(
                        () => notify(t("chat.linkCopied", "Link copied"), t("chat.linkCopiedBody", "Anyone who can open this conversation can follow it.")),
                        () => notify(t("chat.copyFailed", "Couldn't copy the link"), url),
                      );
                    },
                  },
                  {
                    id: "pin",
                    label: message.pinned ? t("chat.unpin", "Unpin") : t("chat.pin", "Pin to channel"),
                    icon: message.pinned ? (
                      <PushPinSlash size={14} aria-hidden="true" />
                    ) : (
                      <PushPin size={14} aria-hidden="true" />
                    ),
                    onSelect: () => togglePin(message.id),
                  },
                  ...(mine || can.moderate
                    ? [
                        {
                          id: "delete",
                          /* Deleting someone else's message is a moderation
                             act, and the label says so. */
                          label: mine ? t("chat.delete", "Delete message") : t("chat.deleteAsAdmin", "Delete as admin"),
                          icon: <Trash size={14} aria-hidden="true" />,
                          danger: true,
                          separated: true,
                          onSelect: () => setConfirmDelete(true),
                        },
                      ]
                    : []),
                ]}
              />
            </span>
          </>
        )}
      </div>

      <FilePreview
        messageId={message.id}
        file={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        context={author.name}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMessage(message.id)}
        title={t("chat.deleteTitle", "Delete this message?")}
        body={t(
          "chat.deleteBody",
          "Everyone in the conversation sees a note that a message was removed, for a day. After that it disappears completely, including from search.",
        )}
        confirmLabel={t("chat.delete", "Delete message")}
      />
    </article>
  );
}

/** Mentions of the signed-in person are marked inline as well as on the row. */
/**
 * Renders a message body, turning any colleague's name into a control that
 * opens the conversation with them. A mention used to be a coloured `mark`:
 * it looked like a link and did nothing, which is the most common small lie in
 * a chat interface.
 *
 * Matching is on the full names the workspace actually knows, longest first,
 * so "Sara Lindqvist" is never half-matched by a shorter name inside it.
 */
function renderText(
  text: string,
  users: { id: string; name: string }[],
  onOpen: (userId: string) => void,
): React.ReactNode {
  const names = [...users].sort((a, b) => b.name.length - a.name.length);
  const hit = names.find((u) => text.includes("@"+u.id)||text.includes(u.name));
  if (!hit) return linkify(text);

  /* The @ belongs to the chip, not to the text before it: "@ Name" with a
     gap reads as a typo. */
  const parts = text.split(text.includes("@"+hit.id)?"@"+hit.id:hit.name).map((part, i, all) => (i < all.length - 1 && part.endsWith("@") ? part.slice(0, -1) : part));
  return parts.flatMap<React.ReactNode>((part, i) =>
    i === 0
      ? [renderText(part, users.filter((u) => u.id !== hit.id), onOpen)]
      : [
          <button
            key={`${hit.id}-${i}`}
            type="button"
            onClick={() => onOpen(hit.id)}
            className={"hq-btn "+("ch-background-1416a8"+' '+"ch-color-55f463"+' '+"ch-font-weight-eed0f8"+' '+"ch-padding-d5b924"+' '+"ch-margin-be0044"+' '+"ch-line-height-013d00"+' '+"ch-border-radius-a360d0")}
            
          >
            @{hit.name}
          </button>,
          part,
        ],
  );
}

export const Message = memo(MessageBase);

/** URLs in plain text become links; everything else stays text. */
function linkify(text: string): React.ReactNode {
  const parts = text.split(URL_PATTERN);
  const urls = text.match(URL_PATTERN) ?? [];
  if (urls.length === 0) return text;
  return parts.flatMap((part, i) =>
    i < urls.length
      ? [
          part,
          <a key={`u-${i}`} href={urls[i]} target="_blank" rel="noreferrer noopener" className={"ch-color-55f463"+' '+"ch-text-decoration-36ec74"} >
            {urls[i]}
          </a>,
        ]
      : [part],
  );
}
