"use client";

/**
 * SOMION HQ - THREAD
 *
 * Threads are what keep channels readable, so the panel shows the parent
 * message in full - including its context card - rather than a truncated quote.
 * A thread started from a task opens with the task, which is the point.
 */

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Message } from "./Message";
import { Composer } from "./Composer";
import { Button } from "@/components/ui/Primitives";
import { useChannel, useMessage, useThreadReplies } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

export function ThreadPanel({ parentId, onClose }: { parentId: string; onClose: () => void }) {
  const parent = useMessage(parentId);
  const replies = useThreadReplies(parentId);
  const channel = useChannel(parent?.channelId ?? "");
  const sendMessage = useWorkspace((s) => s.sendMessage);
  const t = useT();
  const [following, setFollowing] = useState(true);
  const [alsoSend, setAlsoSend] = useState(false);

  if (!parent) return null;

  return (
    <div className={"flex min-h-0 w-full flex-col "+("ch-background-751d03")} >
      <header
        className={"flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 "+("ch-border-bottom-9cb2f4")}

      >
        <div className="min-w-0">
          <h2 className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
            {t("thread.title", "Thread")}
          </h2>
          {channel && (
            <p className={"truncate text-caption "+("ch-color-094083")} >
              {channel.kind === "public" || channel.kind === "private"
                ? `#${channel.name}`
                : channel.name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={() => setFollowing((f) => !f)} aria-pressed={following}>
            {following ? t("thread.following", "Following") : t("thread.follow", "Follow")}
          </Button>
          <Button variant="ghost" size="sm" iconOnly label={t("common.close", "Close")} onClick={onClose}>
            <X size={14} weight="bold" aria-hidden="true" className={"ch-color-094083"}  />
          </Button>
        </div>
      </header>

      {/* A thread reads from its root downwards, so it starts at the top;
          a short thread pinned to the bottom of an empty panel looked lost. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3">
        <Message message={parent} grouped={false} />

        <div className="flex items-center gap-3 px-4 py-2">
          <span className={"text-caption font-medium "+("ch-color-094083")} >
            {replies.length === 1
              ? t("chat.oneReply", "1 reply")
              : t("chat.nReplies", "{n} replies", { n: replies.length })}
          </span>
          <span className={"h-px flex-1 "+("ch-background-423228")}  />
        </div>

        {replies.map((r, i) => (
          <Message
            key={r.id}
            message={r}
            grouped={i > 0 && replies[i - 1]?.authorId === r.authorId}
          />
        ))}
      </div>

      {/* A reply can go to the channel too, for the people who are not in
          the thread. It is the same message sent twice, which is what the
          person asked for. */}
      <label className={"flex cursor-pointer items-center gap-2 px-4 pt-2 text-caption "+("ch-color-4a0211")} >
        <input
          type="checkbox"
          checked={alsoSend}
          onChange={(e) => setAlsoSend(e.target.checked)}
          className={"ch-width-eb53b5"+' '+"ch-height-946a99"+' '+"ch-accent-color-e56d5b"}
        />
        {t("thread.alsoSend", "Also send to {channel}", {
          channel: channel ? (channel.kind === "public" || channel.kind === "private" ? `#${channel.name}` : channel.name) : "",
        })}
      </label>
      <Composer
        channelId={parent.channelId}
        threadId={parentId}
        placeholder={t("thread.reply", "Reply in thread")}
        draftKey={`thread:${parentId}`}
        onSend={(text, attachments) => {
          return sendMessage(parent.channelId, text, parentId, attachments).then(async saved => {
            if (!saved || !alsoSend) return saved;
            return sendMessage(parent.channelId, text, undefined, attachments);
          });
        }}
      />
    </div>
  );
}
