"use client";

/**
 * SOMION HQ - MOBILE NAVIGATION
 *
 * Four tabs, which is the ceiling before a bottom bar stops being scannable:
 * Chat, Meetings, Office and Me. The floor plan is not among them - it is a
 * desktop view, and the Office tab shows the presence list instead.
 *
 * Targets are 44px minimum and the bar respects the home-indicator safe area.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatsCircle, MapTrifold, User, VideoCamera } from "@phosphor-icons/react";
import { Count } from "@/components/ui/Primitives";
import { useUnreadTotal } from "@/store/hooks";
import { useT } from "@/lib/i18n";

export function MobileTabs() {
  const pathname = usePathname();
  const { unread, mentions } = useUnreadTotal();
  const t = useT();

  const tabs = [
    { href: "/hq/chat/catch-up", match: "/hq/chat", label: t("nav.chat", "Chat"), Icon: ChatsCircle, count: unread, mention: mentions > 0 },
    { href: "/hq/meetings", match: "/hq/meetings", label: t("nav.meetings", "Meetings"), Icon: VideoCamera, count: 0, mention: false },
    { href: "/hq/office", match: "/hq/office", label: t("nav.office", "Office"), Icon: MapTrifold, count: 0, mention: false },
    { href: "/hq/me", match: "/hq/me", label: t("nav.me", "Me"), Icon: User, count: 0, mention: false },
  ];

  return (
    <nav
      aria-label={t("nav.label", "Chats sections")}
      className={"flex shrink-0 md:hidden "+("ch-background-751d03"+' '+"ch-border-top-c9ce2a"+' '+"ch-padding-bottom-e22ead")}

    >
      {tabs.map(({ href, match, label, Icon, count, mention }) => {
        const active = pathname.startsWith(match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={"relative flex flex-1 flex-col items-center justify-center gap-0.5 "+("ch-min-height-5d0881"+' '+(active?"ch-color-55f463":"ch-color-4a0211"))}

          >
            <span className="relative">
              <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -end-2.5 -top-1.5">
                  <Count value={count} mention={mention} />
                </span>
              )}
            </span>
            <span className="text-micro font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
