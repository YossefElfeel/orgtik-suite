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
    { href: "/hq/admin", label: t("nav.admin", "Administration"), Icon: Gear, meta: "", mention: false },
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
                className={"hq-row flex items-center gap-2.5 px-2.5 "+("ch-border-radius-332348"+' '+"ch-min-height-87483b"+' '+(active?"ch-color-55f463":"ch-color-7f7330")+' '+(active?"ch-background-1416a8":"ch-background-a8869d")+' '+(active?"ch-font-weight-eed0f8":"ch-font-weight-02a2d3")+' '+"ch-font-size-ba0694")}

              >
                <Icon size={17} weight={active ? "fill" : "regular"} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {meta && (
                  <span className={"tabular text-caption "+("ch-color-094083")} >
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
