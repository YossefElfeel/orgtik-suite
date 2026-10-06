"use client";
// The platform's banners for this workspace (USR-00, D-026), as the library's banner slot shows
// them: one at a time, the most urgent first. The text is ours, with the dates and tools filled in;
// the one action goes where it can be done.
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants, useFormatter, type Banner } from "@orgtik/ui";
import type { AppBanner, AppMe } from "@/redux/features/platform/platformApi";

const ACTION_HREF: Record<string, string> = {
  pay_now: "/billing",
  choose_plan: "/tools",
  view_plans: "/tools",
  details: "/billing",
  cancel_downgrade: "/billing",
  contact_support: "/support/new",
};

export function useWorkspaceBanners(me: AppMe | undefined): Banner[] {
  const t = useTranslations("Workspace.banner");
  const f = useFormatter();
  const locale = useLocale() as keyof AppMe["tools"][number]["name"];
  if (!me) return [];
  const toolName = (key?: string) => {
    const tool = me.tools.find((x) => x.key === key);
    return tool ? (tool.name[locale] ?? tool.name.en) : (key ?? "");
  };
  const day = (iso?: string) => (iso ? f.date(iso, { dateStyle: "medium" }) : "");
  const one = (b: AppBanner): Banner => {
    const vars = { tool: toolName(b.tool), date: day(b.endsAt ?? b.graceEndsAt ?? b.effectiveAt), coupon: b.coupon ?? "" };
    // Guests can't open tickets (support is for members), so a suspended workspace tells them only.
    const href = b.action && !(b.action === "contact_support" && me.workspace.role === "guest") ? ACTION_HREF[b.action] : undefined;
    return {
      kind: b.kind,
      title: t(`${b.kind}.title`, vars),
      description: t(`${b.kind}.body`, vars),
      action:
        href && b.action ? (
          <Link href={href} className={buttonVariants({ size: "sm", variant: b.tone === "danger" ? "primary" : "secondary" })}>
            {t(`actions.${b.action}`)}
          </Link>
        ) : undefined,
    };
  };
  return me.banners.map(one);
}
