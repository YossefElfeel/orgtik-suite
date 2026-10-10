"use client";

/**
 * SOMION HQ - CATCH UP
 *
 * The answer to a day off. Mentions, direct messages and threads you are in,
 * in one place, with a single action to clear them.
 *
 * The target the product sets itself is under ten minutes to be current again,
 * which is why this is a list of things that need you rather than a replay of
 * everything that happened.
 */

import Link from "next/link";
import { ChatCircle, CheckCircle, At } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, EmptyState, SectionHead } from "@/components/ui/Primitives";
import { ContextCard } from "./ContextCard";
import { useCatchUp, useChannel, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatRelative } from "@/lib/time";
import type { Message } from "@/entities";

export function CatchUpView() {
  const { mentions, dms, threads } = useCatchUp();
  const markAllRead = useWorkspace((s) => s.markAllRead);
  const t = useT();

  const total = mentions.length + dms.length + threads.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={"flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 "+("ch-background-a8869d")}

      >
        <div className="flex items-baseline gap-2.5">
          <h1 className={"hq-title "+("ch-color-7f7330")} >
            {t("catchup.title", "Catch up")}
          </h1>
          <span className={"tabular text-body-sm "+("ch-color-4a0211")} >
            {t("catchup.count", "{n} things need you", { n: total })}
          </span>
        </div>
        {total > 0 && (
          <Button size="sm" onClick={markAllRead}>
            <CheckCircle size={13} weight="bold" aria-hidden="true" />
            {t("catchup.markAll", "Mark all read")}
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {total === 0 ? (
          <EmptyState
            icon={<CheckCircle size={20} aria-hidden="true" />}
            title={t("catchup.clearTitle", "You are up to date")}
            body={t("catchup.clearBody", "Nothing is waiting on you. Anything new will show up here.")}
          />
        ) : (
          <div className="mx-auto w-full max-w-[720px] px-4 py-4">
            {mentions.length > 0 && (
              <section className="pb-5">
                <SectionHead title={t("catchup.mentions", "Mentions")} meta={`${mentions.length}`} />
                <ul className="flex flex-col gap-2">
                  {mentions.map((m) => (
                    <MentionRow key={m.id} message={m} />
                  ))}
                </ul>
              </section>
            )}

            {dms.length > 0 && (
              <section className="pb-5">
                <SectionHead title={t("catchup.dms", "Direct messages")} meta={`${dms.length}`} />
                <ul className="flex flex-col gap-2">
                  {dms.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/hq/chat/${c.id}`}
                        className={"hq-row flex items-center gap-2.5 px-3 py-2.5 "+("ch-background-751d03"+' '+"ch-border-5065d4"+' '+"ch-border-radius-8d459a")}

                      >
                        <ChatCircle size={16} aria-hidden="true" className={"ch-color-4a0211"}  />
                        <span className={"flex-1 text-body-sm font-medium "+("ch-color-7f7330")} >
                          <bdi>{c.name}</bdi>
                        </span>
                        <span className={"tabular text-caption "+("ch-color-4a0211")} >
                          {t("catchup.unreadCount", "{n} unread", { n: c.unread })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {threads.length > 0 && (
              <section className="pb-5">
                <SectionHead title={t("catchup.threads", "Threads you are in")} meta={`${threads.length}`} />
                <ul className="flex flex-col gap-2">
                  {threads.map((m) => (
                    <MentionRow key={m.id} message={m} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MentionRow({ message }: { message: Message }) {
  const author = useUser(message.authorId);
  const channel = useChannel(message.channelId);
  const t = useT();
  if (!author) return null;

  return (
    <li>
      <Link
        href={`/hq/chat/${message.channelId}`}
        className={"hq-row flex flex-col gap-2 px-3 py-2.5 "+("ch-background-751d03"+' '+"ch-border-5065d4"+' '+"ch-border-radius-8d459a")}

      >
        <div className="flex items-center gap-2">
          <At size={13} weight="bold" aria-hidden="true" className={"ch-color-55f463"}  />
          <span className={"text-caption font-medium "+("ch-color-4a0211")} >
            <bdi>
              {channel
                ? channel.kind === "public" || channel.kind === "private"
                  ? `#${channel.name}`
                  : channel.name
                : ""}
            </bdi>
          </span>
          <span className={"tabular ms-auto text-caption "+("ch-color-094083")} >
            {formatRelative(message.createdAt)}
          </span>
        </div>

        {message.contextRef && <ContextCard object={message.contextRef} compact />}

        <div className="flex items-start gap-2.5">
          <Avatar name={author.name} initials={author.initials} tint={author.tint} size={28} hideStatus />
          <p className={"min-w-0 flex-1 text-body-sm leading-snug "+("ch-color-7f7330")} >
            <span className="font-semibold"><bdi>{author.name.split(" ")[0]}</bdi>: </span>
            <bdi>{message.text}</bdi>
          </p>
        </div>
      </Link>
    </li>
  );
}
