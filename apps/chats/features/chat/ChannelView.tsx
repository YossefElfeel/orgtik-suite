"use client";

/**
 * SOMION HQ - CHANNEL
 *
 * Three-pane: sidebar (in the shell), transcript, thread. The thread pane
 * closes on narrower viewports rather than squeezing all three.
 */

import { useBackToClose, useEscape } from "@/lib/useDismiss";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hash, Lock, PushPin, UserPlus, UsersThree, ArrowLeft, VideoCamera } from "@phosphor-icons/react";
import { Message } from "./Message";
import { Composer } from "./Composer";
import { ThreadPanel } from "./ThreadPanel";
import { ChannelDetailsPane } from "./ChannelDialogs";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button, EmptyState } from "@/components/ui/Primitives";
import {
  useChannel,
  useMe,
  useMessages,
  usePinned,
  usePresenceOf,
  useUser,
  useUsers,
} from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatDay } from "@/lib/time";
import type { Message as MessageT } from "@/entities";
import { useTitle } from "@/lib/useTitle";

const GROUPING_WINDOW_MS = 5 * 60_000;

export function ChannelView({ channelId }: { channelId: string }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  useBackToClose(detailsOpen, () => setDetailsOpen(false));
  useEscape(detailsOpen, () => setDetailsOpen(false));
  const channel = useChannel(channelId);
  const meId = useWorkspace((s) => s.me);
  useTitle(channel ? (channel.kind === "public" || channel.kind === "private" ? `#${channel.name}` : channel.name) : null);
  const messages = useMessages(channelId);
  const pinned = usePinned(channelId);
  const sendMessage = useWorkspace((s) => s.sendMessage);
  const markChannelRead = useWorkspace((s) => s.markChannelRead);
  const openThread = useWorkspace((s) => s.openThread);
  const openThreadId = useWorkspace((s) => s.openThreadId);
  useBackToClose(Boolean(openThreadId), () => openThread(null));
  useEscape(Boolean(openThreadId) && !detailsOpen, () => openThread(null));
  const t = useT();
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Opening a channel clears its badge. Read state is a data fact, not a
     rendering side effect, so it goes through the store. */
  useEffect(() => {
    markChannelRead(channelId);
  }, [channelId, markChannelRead]);

  /* A link to a message lands on that message, lit for a moment, instead of
     at the bottom of the channel. Once per arrival: new messages afterwards
     must not drag the view back to it. */
  const landed = useRef<string | null>(null);
  useEffect(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target && landed.current !== hash) {
      landed.current = hash;
      target.scrollIntoView({ block: "center" });
      target.classList.add("hq-target");
      const off = setTimeout(() => target.classList.remove("hq-target"), 2400);
      return () => clearTimeout(off);
    }
    if (!hash || landed.current === hash) bottomRef.current?.scrollIntoView({ block: "end" });
    return undefined;
  }, [messages.length, channelId]);

  /* Group consecutive messages from the same person within five minutes, and
     insert a day divider when the date changes. */
  const rows = useMemo(() => {
    const out: { message: MessageT; grouped: boolean; daySeparator?: string }[] = [];
    let lastAuthor = "";
    let lastTime = 0;
    let lastDay = "";
    for (const m of messages) {
      const time = new Date(m.createdAt).getTime();
      const day = formatDay(m.createdAt);
      const newDay = day !== lastDay;
      out.push({
        message: m,
        grouped: !newDay && m.authorId === lastAuthor && time - lastTime < GROUPING_WINDOW_MS,
        ...(newDay ? { daySeparator: day } : {}),
      });
      lastAuthor = m.authorId;
      lastTime = time;
      lastDay = day;
    }
    return out;
  }, [messages]);

  if (!channel) {
    return (
      <EmptyState
        title={t("chat.noChannel", "This conversation does not exist")}
        body={t("chat.noChannelBody", "It may have been archived or you may not be a member.")}
        action={
          <Button size="sm" href="/hq/chat/catch-up">
            {t("chat.backToList", "Back to conversations")}
          </Button>
        }
      />
    );
  }

  const isDm = channel.kind === "dm" || channel.kind === "group";

  /* A private conversation is for its members: someone who left, or was never in it, sees that
     it's closed to them, not its messages and a working composer (CHT-008). */
  if ((channel.kind === "private" || isDm) && !channel.memberIds.includes(meId)) {
    return (
      <EmptyState
        icon={<Lock size={20} aria-hidden="true" />}
        title={t("chat.notMemberTitle", "You're not in this conversation")}
        body={t("chat.notMemberBody", "It's private. Ask one of its members to add you.")}
        action={
          <Button size="sm" href="/hq/chat/catch-up">
            {t("chat.backToList", "Back to conversations")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChannelHeader channelId={channelId} onOpenDetails={() => setDetailsOpen(true)} />

        {pinned.length > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-1.5"
            style={{ background: "var(--color-surface-sunken)", borderBottom: "1px solid var(--color-hairline)" }}
          >
            <PushPin size={12} weight="fill" aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
            <span className="truncate text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
              {pinned[0]?.text}
            </span>
          </div>
        )}

        {/* role=log: new messages are read out politely, without moving focus (CHT-012). */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={isDm ? channel.name : `#${channel.name}`}
          tabIndex={0}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3"
        >
          <div className="mt-auto" />
          {/* The start of the channel. Without it a short history opens on a
              field of nothing, and a new member arrives with no idea what the
              channel is for or who is in it. */}
          {rows.length > 0 && (
            <ChannelStart channelId={channelId} onAddPeople={() => setDetailsOpen(true)} />
          )}
          {rows.length === 0 ? (
            <EmptyState
              icon={<Hash size={20} aria-hidden="true" />}
              title={t("chat.emptyTitle", "Nothing here yet")}
              body={t(
                "chat.emptyBody",
                "Say something, or start the conversation from the task or invoice it is about.",
              )}
            />
          ) : (
            rows.map(({ message, grouped, daySeparator }) => (
              <div key={message.id}>
                {daySeparator && <DayDivider label={daySeparator} />}
                <Message message={message} grouped={grouped} onOpenThread={openThread} />
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <Composer
          draftKey={channelId}
          placeholder={
            isDm
              ? t("chat.messagePerson", "Message {name}", { name: channel.name })
              : t("chat.messageChannel", "Message #{name}", { name: channel.name })
          }
          disabled={channel.archived}
          onSend={(text, attachments) => sendMessage(channelId, text, undefined, attachments)}
        />
      </div>

      {/* A column beside the conversation on a wide screen; the whole screen
          on a phone, where Back and Close return to the messages. */}
      {(openThreadId || detailsOpen) && (
        <div
          className="fixed inset-0 z-[60] flex xl:static xl:inset-auto xl:z-auto xl:w-[380px] xl:shrink-0"
          style={{ borderInlineStart: "1px solid var(--color-hairline)", background: "var(--color-surface)" }}
        >
          {/* Details was asked for last, so it shows; closing it brings the
              thread back rather than losing it. */}
          {detailsOpen ? (
            <ChannelDetailsPane channelId={channelId} onClose={() => setDetailsOpen(false)} />
          ) : openThreadId ? (
            <ThreadPanel parentId={openThreadId} onClose={() => openThread(null)} />
          ) : null}
        </div>
      )}
    </div>
  );
}

/** The block every chat client puts above the first message. */
function ChannelStart({ channelId, onAddPeople }: { channelId: string; onAddPeople: () => void }) {
  const channel = useChannel(channelId);
  const users = useUsers();
  const t = useT();
  if (!channel) return null;

  const isDm = channel.kind === "dm" || channel.kind === "group";
  const members = channel.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  return (
    <div className="px-4 pb-4 pt-6">
      <h2
        className="text-[20px] font-semibold tracking-[-0.02em]"
        style={{ color: "var(--color-ink)" }}
      >
        {/* A channel name keeps its # on the right side in any direction. */}
        <bdi>{isDm ? channel.name : `#${channel.name}`}</bdi>
      </h2>
      <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
        {isDm
          ? t("chat.startDm", "This is the beginning of your conversation with {name}.", {
              name: channel.name,
            })
          : channel.topic
            ? t("chat.startTopic", "This is the beginning of #{name}. {topic}.", {
                name: channel.name,
                topic: channel.topic,
              })
            : t("chat.startPlain", "This is the beginning of #{name}.", { name: channel.name })}
      </p>

      {!isDm && (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <AvatarStack people={members} size={28} max={6} />
          <span className="text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("chat.memberCount", "{n} members", { n: members.length })}
          </span>
          <Button size="sm" onClick={onAddPeople}>
            <UserPlus size={13} weight="bold" aria-hidden="true" />
            {t("chat.addPeople", "Add people")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChannelHeader({
  channelId,
  onOpenDetails,
}: {
  channelId: string;
  onOpenDetails: () => void;
}) {
  const channel = useChannel(channelId);
  const t = useT();
  const meId = useWorkspace((s) => s.me);
  const otherId = channel?.memberIds.find((m) => m !== meId) ?? "";
  const other = useUser(otherId);
  const presence = usePresenceOf(otherId);
  const me = useMe();
  const startInstantMeeting = useWorkspace((s) => s.startInstantMeeting);
  const router = useRouter();
  /* One press, one meeting: a double click before the call opens must not
     start two, and leave two cards in the conversation. */
  const starting = useRef(false);
  const [pending, setPending] = useState(false);

  if (!channel) return null;
  const isDm = channel.kind === "dm";
  const isChannel = channel.kind === "public" || channel.kind === "private";
  const Icon = channel.kind === "private" ? Lock : channel.kind === "group" ? UsersThree : Hash;
  const firstName = (name: string) => name.split(" ")[0] ?? name;

  /* A meeting started here invites everyone in the conversation and leaves
     its way in as a message, so nobody needs a link to join a colleague. */
  const meetNow = () => {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    const id = startInstantMeeting({
      title: isChannel
        ? t("chat.meetingInChannel", "Meeting in #{name}", { name: channel.name })
        : isDm && other
          ? t("chat.dmMeetingTitle", "{a} and {b}", { a: firstName(me.name), b: firstName(other.name) })
          : t("chat.groupMeetingTitle", "{name} meeting", { name: channel.name }),
      channelId: channel.id,
      announcement: t("chat.startedMeeting", "Started a meeting"),
    });
    router.push(`/hq/meetings/${id}/call`);
  };
  const meetNowHint =
    isDm && other
      ? t("chat.meetNowWith", "Start a meeting with {name}", { name: firstName(other.name) })
      : t("chat.meetNowAll", "Start a meeting with everyone in {name}", {
          name: isChannel ? `#${channel.name}` : channel.name,
        });

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5"
      style={{ background: "transparent" }}
    >
      {/* Below lg there is no sidebar to click, so the header carries the way
          back to the list of conversations. */}
      <Link
        href="/hq/chat"
        className="hq-btn me-1 inline-flex items-center gap-1 text-[12.5px] font-medium lg:hidden"
        style={{ color: "var(--color-ink-muted)", minHeight: 32, paddingInline: 6, borderRadius: "var(--radius-control)" }}
        aria-label={t("chat.backToList", "Back to conversations")}
      >
        <ArrowLeft size={14} weight="bold" aria-hidden="true" />
        {t("common.back", "Back")}
      </Link>
      <div className="flex min-w-0 items-center gap-2.5">
        {isDm && other ? (
          <Avatar
            name={other.name}
            initials={other.initials}
            tint={other.tint}
            status={presence?.status}
            size={28}
          />
        ) : (
          <Icon size={16} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
        )}
        <div className="min-w-0">
          <h1 className="hq-title truncate" style={{ color: "var(--color-ink)" }}>
            <bdi>{channel.kind === "public" || channel.kind === "private" ? `#${channel.name}` : channel.name}</bdi>
          </h1>
        </div>
        {channel.topic && (
          <span className="hidden truncate text-[12.5px] md:inline" style={{ color: "var(--color-ink-muted)" }}>
            <bdi>{channel.topic}</bdi>
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* On a phone the count gives its room to the channel's name; the
            conversation's opening line still carries it. */}
        {!isDm && (
          <span className="tabular hidden text-[12.5px] sm:inline" style={{ color: "var(--color-ink-muted)" }}>
            {t("chat.memberCount", "{n} members", { n: channel.memberIds.length })}
          </span>
        )}
        {!channel.archived && (
          <Button size="sm" onClick={meetNow} disabled={pending} title={meetNowHint}>
            <VideoCamera size={13} weight="fill" aria-hidden="true" />
            {/* The name is "Meet now" at every width; a phone just hides the words. */}
            <span className="sr-only md:not-sr-only">{t("meetings.meetNow", "Meet now")}</span>
          </Button>
        )}
        <Button size="sm" onClick={onOpenDetails}>
          {t("chat.details", "Details")}
        </Button>
      </div>
    </header>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="h-px flex-1" style={{ background: "var(--color-hairline)" }} />
      <span className="text-[11.5px] font-medium" style={{ color: "var(--color-ink-subtle)" }}>
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--color-hairline)" }} />
    </div>
  );
}
