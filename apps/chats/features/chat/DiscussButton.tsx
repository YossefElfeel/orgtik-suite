"use client";

/**
 * SOMION HQ - DISCUSS
 *
 * The component the other six modules embed. It is the ONLY HQ code that ships
 * into another module, alongside the presence dot - everything else stays here.
 *
 * The behaviour that matters: pressing Discuss a second time, a week later,
 * opens the SAME thread rather than starting a new one. A record accumulates
 * one conversation, not a scatter of them, which is the entire claim the
 * product is making.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatTeardropText } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useUser } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { formatRelative } from "@/lib/time";
import type { ObjectRef } from "@/entities";

/** Where a conversation about an object goes if it does not have one yet. */
const CHANNEL_FOR: Record<string, string> = {
  task: "c-clients",
  client: "c-clients",
  deal: "c-clients",
  invoice: "c-clients",
  employee: "c-hiring",
  file: "c-general",
};

export function DiscussButton({
  object,
  suggestedParticipants = [],
}: {
  object: ObjectRef;
  suggestedParticipants?: string[];
}) {
  const router = useRouter();
  const messages = useWorkspace((s) => s.messages);
  const applyEvent = useWorkspace((s) => s.applyEvent);
  const me = useWorkspace((s) => s.me);
  const openThread = useWorkspace((s) => s.openThread);
  const t = useT();

  /* Find the thread this object already owns, if any. */
  const existing = messages.find(
    (m) => m.contextRef?.type === object.type && m.contextRef.id === object.id,
  );

  /* The route change can take a moment; the button says so at once rather
     than sitting still until the chat arrives. */
  const [opening, setOpening] = useState(false);

  const discuss = () => {
    setOpening(true);
    if (existing) {
      openThread(existing.id);
      router.push(`/hq/chat/${existing.channelId}`);
      return;
    }

    const channelId = CHANNEL_FOR[object.type] ?? "c-general";
    const id = `m-ctx-${object.type}-${object.id}`;
    applyEvent({
      type: "message.created",
      message: {
        id,
        channelId,
        authorId: me,
        text: t("discuss.opening", "Starting a thread on this."),
        createdAt: new Date().toISOString(),
        replyCount: 0,
        replyUserIds: [],
        reactions: [],
        attachments: [],
        pinned: false,
        contextRef: object,
      },
    });
    openThread(id);
    router.push(`/hq/chat/${channelId}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="primary" onClick={discuss} disabled={opening} aria-live="polite">
        <ChatTeardropText size={14} weight="bold" aria-hidden="true" />
        {opening ? t("discuss.openingShort", "Opening…") : existing ? t("discuss.open", "Open discussion") : t("discuss.start", "Discuss")}
      </Button>

      {/* Participants are proposed from the record itself, so starting a
          conversation does not begin with choosing an audience. */}
      {!existing && suggestedParticipants.length > 0 && (
        <p className={"flex items-center gap-1.5 text-caption "+("ch-color-094083")} >
          {t("discuss.willInclude", "Will include")}
          {suggestedParticipants.map((id) => (
            <SuggestedPerson key={id} userId={id} />
          ))}
        </p>
      )}
    </div>
  );
}

function SuggestedPerson({ userId }: { userId: string }) {
  const user = useUser(userId);
  if (!user) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Avatar name={user.name} initials={user.initials} tint={user.tint} size={20} hideStatus />
      <span className={"ch-color-4a0211"} ><bdi>{user.name.split(" ")[0]}</bdi></span>
    </span>
  );
}

/**
 * The other half of the promise: the object's page lists the conversations
 * attached to it, so a decision made in chat is findable from the record a
 * month later.
 */
export function ObjectConversations({ object }: { object: ObjectRef }) {
  const router = useRouter();
  const messages = useWorkspace((s) => s.messages);
  const openThread = useWorkspace((s) => s.openThread);
  const t = useT();

  const threads = messages.filter(
    (m) => m.contextRef?.type === object.type && m.contextRef.id === object.id,
  );

  if (threads.length === 0) {
    return (
      <p className={"text-body-sm "+("ch-color-4a0211")} >
        {t("discuss.none", "No conversations yet.")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {threads.map((m) => (
        <li key={m.id}>
          <button
            onClick={() => {
              openThread(m.id);
              router.push(`/hq/chat/${m.channelId}`);
            }}
            className={"hq-row flex w-full items-center gap-2 px-2.5 py-2 text-start "+("ch-border-5065d4"+' '+"ch-border-radius-332348"+' '+"ch-background-751d03")}
            
          >
            <ChatTeardropText size={14} aria-hidden="true" className={"ch-color-4a0211"}  />
            <span className={"min-w-0 flex-1 truncate text-body-sm "+("ch-color-7f7330")} >
              <bdi>{m.text}</bdi>
            </span>
            <span className={"tabular shrink-0 text-caption "+("ch-color-094083")} >
              {m.replyCount > 0
                ? t("chat.nReplies", "{n} replies", { n: m.replyCount })
                : formatRelative(m.createdAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
