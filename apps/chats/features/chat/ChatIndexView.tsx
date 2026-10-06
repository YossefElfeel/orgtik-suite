"use client";

/**
 * SOMION HQ - CONVERSATIONS (the chat index)
 *
 * On a wide screen the sidebar is the list of conversations, so landing on
 * Chat goes straight to Catch up. Below the sidebar's breakpoint there is no
 * sidebar, and until now the index redirected anyway - a phone had no list of
 * conversations at all, and "Back" from a channel led straight back into it.
 *
 * This is that list. It is the sidebar's content as a page, plus the two
 * entries a phone needs most: Catch up and Search.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hash, Lock, MagnifyingGlass, Plus, Tray, UsersThree } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Count } from "@/components/ui/Primitives";
import { useCan, useChannels, useDirectMessages, useNeedsYou, useUsers } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { CreateChannelModal, NewMessageModal } from "./ChannelDialogs";

const SIDEBAR_BREAKPOINT = "(min-width: 1024px)";

export function ChatIndexView() {
  const router = useRouter();
  const channels = useChannels();
  const dms = useDirectMessages();
  const users = useUsers();
  const needsYou = useNeedsYou();
  const can = useCan();
  const t = useT();
  const [creating, setCreating] = useState(false);
  const [messaging, setMessaging] = useState(false);

  /* Where the sidebar exists, this page is redundant: go to Catch up. */
  useEffect(() => {
    const mq = window.matchMedia(SIDEBAR_BREAKPOINT);
    const go = () => {
      if (mq.matches) router.replace("/hq/chat/catch-up");
    };
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, [router]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <CreateChannelModal open={creating} onClose={() => setCreating(false)} />
      <NewMessageModal open={messaging} onClose={() => setMessaging(false)} />

      <div className="mx-auto w-full max-w-[640px] px-4 py-4">
        <h1 className="hq-title" style={{ color: "var(--color-ink)" }}>
          {t("chat.conversations", "Conversations")}
        </h1>

        <ul className="mt-3 flex flex-col gap-1">
          <li>
            <Link
              href="/hq/chat/catch-up"
              className="hq-row flex items-center gap-3 px-3"
              style={{ borderRadius: "var(--radius-control)", minHeight: 48 }}
            >
              <Tray size={18} aria-hidden="true" style={{ color: "var(--color-ink-brand)" }} />
              <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--color-ink)" }}>
                {t("chat.catchUp", "Catch up")}
              </span>
              <Count value={needsYou} mention />
            </Link>
          </li>
          <li>
            <Link
              href="/hq/chat/search?q="
              className="hq-row flex items-center gap-3 px-3"
              style={{ borderRadius: "var(--radius-control)", minHeight: 48 }}
            >
              <MagnifyingGlass size={18} aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
              <span className="flex-1 text-[14px]" style={{ color: "var(--color-ink)" }}>
                {t("chat.search", "Search")}
              </span>
            </Link>
          </li>
        </ul>

        <Heading label={t("chat.channels", "Channels")}>
          {can.manageChannels && (
            <Button variant="ghost" size="sm" iconOnly label={t("chat.newChannel", "New channel")} onClick={() => setCreating(true)}>
              <Plus size={14} weight="bold" aria-hidden="true" />
            </Button>
          )}
        </Heading>
        <ul className="flex flex-col gap-0.5">
          {channels.map((c) => (
            <li key={c.id}>
              <Link
                href={`/hq/chat/${c.id}`}
                className="hq-row flex items-center gap-3 px-3"
                style={{ borderRadius: "var(--radius-control)", minHeight: 46 }}
              >
                {c.kind === "private" ? (
                  <Lock size={16} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
                ) : (
                  <Hash size={16} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[14px] ${c.unread > 0 ? "font-semibold" : ""}`}
                    style={{ color: "var(--color-ink)" }}
                  >
                    <bdi>{c.name}</bdi>
                  </span>
                  {c.topic && (
                    <span className="block truncate text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                      <bdi>{c.topic}</bdi>
                    </span>
                  )}
                </span>
                {c.mentions > 0 ? <Count value={c.mentions} mention /> : <Count value={c.unread} />}
              </Link>
            </li>
          ))}
        </ul>

        <Heading label={t("chat.direct", "Direct messages")}>
          <Button variant="ghost" size="sm" iconOnly label={t("chat.newMessage", "New message")} onClick={() => setMessaging(true)}>
            <Plus size={14} weight="bold" aria-hidden="true" />
          </Button>
        </Heading>
        <ul className="flex flex-col gap-0.5">
          {dms.map((c) => {
            const other = c.kind === "dm" ? users.find((u) => c.memberIds.includes(u.id) && u.name === c.name) : undefined;
            return (
              <li key={c.id}>
                <Link
                  href={`/hq/chat/${c.id}`}
                  className="hq-row flex items-center gap-3 px-3"
                  style={{ borderRadius: "var(--radius-control)", minHeight: 46 }}
                >
                  {other ? (
                    <Avatar name={other.name} initials={other.initials} tint={other.tint} size={28} hideStatus />
                  ) : (
                    <UsersThree size={16} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-[14px] ${c.unread > 0 ? "font-semibold" : ""}`}
                    style={{ color: "var(--color-ink)" }}
                  >
                    <bdi>{c.name}</bdi>
                  </span>
                  {c.mentions > 0 ? <Count value={c.mentions} mention /> : <Count value={c.unread} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Heading({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-1 pt-5 ps-3 pe-1">
      <span className="text-[11.5px] font-semibold uppercase" style={{ color: "var(--color-ink-subtle)", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {children}
    </div>
  );
}
