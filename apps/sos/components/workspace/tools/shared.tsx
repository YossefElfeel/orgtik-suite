"use client";
// Small pieces the tools, plans and checkout screens share (USR-00, 04…08, 25): a tool's icon, its
// name in the reader's language, an inline notice, and the API's error codes said in words.
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Browser,
  ChartLineUp,
  Chats,
  CheckCircle,
  CheckSquare,
  EnvelopeSimple,
  Folder,
  HardDrives,
  Info,
  Megaphone,
  SquaresFour,
  UsersThree,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@orgtik/ui";
import type { Localized, PlatformError } from "@/redux/features/platform/platformApi";

// The platform names icons by Phosphor id (D-008); the components are mapped here.
const ICONS: Record<string, ReactNode> = {
  "ph-squares-four": <SquaresFour />,
  "ph-check-square": <CheckSquare />,
  "ph-folder": <Folder />,
  "ph-chats": <Chats />,
  "ph-users-three": <UsersThree />,
  "ph-chart-line-up": <ChartLineUp />,
  "ph-megaphone": <Megaphone />,
  "ph-envelope-simple": <EnvelopeSimple />,
  "ph-browser": <Browser />,
  "ph-hard-drives": <HardDrives />,
};

export function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand [&>svg]:size-6", className)}>
      {ICONS[icon] ?? <SquaresFour />}
    </span>
  );
}

/** A platform text in the reader's language, else English. */
export function useLocalized() {
  const locale = useLocale() as keyof Localized;
  return (l: Localized | null | undefined) => (l ? (l[locale] ?? l.en) : "");
}

/** Whole days from now until a date, at least 0. */
export const daysUntil = (iso: string | null | undefined) => (iso ? Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86400000)) : 0);

const NOTICE = {
  info: { box: "bg-info-subtle text-fg", icon: <Info className="text-info" /> },
  success: { box: "bg-success-subtle text-fg", icon: <CheckCircle className="text-success" /> },
  warning: { box: "bg-warning-subtle text-fg", icon: <Warning className="text-warning" /> },
  danger: { box: "bg-danger-subtle text-fg", icon: <WarningCircle className="text-danger" /> },
} as const;

/** A short message in the flow of the page. Danger and success announce themselves. */
export function Notice({ tone = "info", title, children, action, className }: { tone?: keyof typeof NOTICE; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const n = NOTICE[tone];
  return (
    <div role={tone === "danger" ? "alert" : tone === "success" ? "status" : undefined} className={cn("flex items-start gap-3 rounded-field px-4 py-3 text-body-sm", n.box, className)}>
      <span aria-hidden="true" className="mt-0.5 shrink-0 [&>svg]:size-5">
        {n.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-fg-muted">{children}</div> : null}
        {action ? <div className="mt-1 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

const KNOWN = new Set([
  "offline",
  "forbidden",
  "suspended",
  "trial_used",
  "wrong_state",
  "payment_failed",
  "expired",
  "not_found",
  "coupon_invalid",
  "coupon_expired",
  "coupon_used_up",
  "coupon_not_applicable",
  "coupon_currency",
  "no_trial",
  "no_price",
  "mismatch",
]);

/** The API's answer in words. Field errors name what to fix; unknown codes get the general line. */
export function useToolsError() {
  const t = useTranslations("Tools.errors");
  return (e: PlatformError | null | undefined): string => {
    if (!e) return "";
    const field = e.fieldErrors ? Object.values(e.fieldErrors)[0] : undefined;
    if (field && KNOWN.has(field)) return t(field);
    if (KNOWN.has(e.code)) return t(e.code);
    return t("general");
  };
}
