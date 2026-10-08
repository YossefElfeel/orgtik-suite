"use client";

/**
 * SOMION HQ - MODULE NAVIGATION
 *
 * The five areas of HQ. Office is the default landing surface, because the
 * first question the product answers is "who is around", not "what did I miss".
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, ChatsCircle, Gear, MapTrifold, VideoCamera, PencilSimple } from "@phosphor-icons/react";
import { Count } from "@/components/ui/Primitives";
import { useCan, useNeedsYou, useOnlineCount, useUnreadTotal } from "@/store/hooks";
import { useT } from "@/lib/i18n";

export function ModuleNav() {
  const pathname = usePathname();
  const { unread } = useUnreadTotal();
  const needsYou = useNeedsYou();
  const can = useCan();
  const online = useOnlineCount();
  const t = useT();

  const items = [
    ...(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1" ? [{ href: "/presentation", label: t("presentation.title", "Chats walkthrough"), Icon: ChatsCircle, meta: "", mention: false, count: undefined }] : []),
    { href: "/hq/office", label: t("nav.office", "Office"), Icon: MapTrifold, meta: `${online}`, mention: false },
    {
      href: "/hq/chat",
      label: t("nav.chat", "Chat"),
      Icon: ChatsCircle,
      /* Remaining unread is carried as row weight, not as a red count. */
      meta: unread > needsYou ? `${unread}` : "",
      count: needsYou,
      mention: needsYou > 0,
    },
    { href: "/hq/meetings", label: t("nav.meetings", "Meetings"), Icon: VideoCamera, meta: "", mention: false },
    { href: "/hq/whiteboard", label: t("nav.boards", "Whiteboard"), Icon: PencilSimple, meta: "", mention: false },
    { href: "/hq/insights", label: t("nav.insights", "Insights"), Icon: ChartBar, meta: "", mention: false },
    { href: "/hq/settings", label: t("nav.settings", "Settings"), Icon: Gear, meta: "", mention: false },
  ] as const;

  return (
    <nav aria-label={t("nav.label", "Chats sections")} className="px-2 pt-2">
      <ul className="flex flex-col gap-0.5">
        {items.filter((i) => i.href !== "/hq/insights" || can.viewInsights).map(({ href, label, Icon, meta, mention, ...rest }) => {
          const count = "count" in rest ? (rest.count as number) : 0;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="hq-row flex items-center gap-2.5 px-2.5"
                style={{
                  borderRadius: "var(--radius-control)",
                  minHeight: 34,
                  color: active ? "var(--color-ink-brand)" : "var(--color-ink)",
                  background: active ? "var(--color-accent-soft)" : "transparent",
                  fontWeight: active ? 600 : 500,
                  fontSize: "13.5px",
                }}
              >
                <Icon size={17} weight={active ? "fill" : "regular"} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {meta && (
                  <span className="tabular text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                    {meta}
                  </span>
                )}
                <Count value={count} mention={mention} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
