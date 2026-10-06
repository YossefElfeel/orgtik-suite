"use client";

// One status badge for every Marketing object (posts, campaigns, approvals, boosts, connected
// accounts, reviewers). The library's status matrix has no Marketing entities yet, so the tone and
// icon for each state live here, and the words in the catalog (Status.<kind>.<STATE>). Raw enums
// such as "PENDING_APPROVAL" were shown as they came (MKT-058), and some states only by colour
// (MKT-044): each badge has words and an icon.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowsClockwise,
  CalendarCheck,
  CheckCircle,
  Circle,
  ClockCountdown,
  HourglassMedium,
  LinkBreak,
  Pause,
  PencilSimple,
  Play,
  Prohibit,
  Stop,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Badge, type Tone } from "@orgtik/ui";

type Entry = [Tone, ReactNode];

const POST: Record<string, Entry> = {
  DRAFT: ["neutral", <PencilSimple key="i" />],
  PENDING: ["warning", <HourglassMedium key="i" />],
  PENDING_APPROVAL: ["warning", <HourglassMedium key="i" />],
  APPROVED: ["info", <CheckCircle key="i" />],
  REJECTED: ["danger", <XCircle key="i" />],
  SCHEDULED: ["info", <CalendarCheck key="i" />],
  PUBLISHED: ["success", <CheckCircle key="i" />],
  PARTIAL: ["warning", <WarningCircle key="i" />],
  FAILED: ["danger", <WarningCircle key="i" />],
  CANCELED: ["neutral", <Prohibit key="i" />],
  SYNCED: ["neutral", <ArrowsClockwise key="i" />],
};

const CAMPAIGN: Record<string, Entry> = {
  DRAFT: ["neutral", <PencilSimple key="i" />],
  AWAITING_REVIEW: ["warning", <HourglassMedium key="i" />],
  REAPPROVAL_REQUIRED: ["warning", <ArrowsClockwise key="i" />],
  APPROVED: ["info", <CheckCircle key="i" />],
  REJECTED: ["danger", <XCircle key="i" />],
  READY: ["info", <ClockCountdown key="i" />],
  RUNNING: ["success", <Play key="i" />],
  PAUSED: ["neutral", <Pause key="i" />],
  STOPPED: ["neutral", <Stop key="i" />],
  COMPLETED: ["success", <CheckCircle key="i" />],
  FAILED: ["danger", <WarningCircle key="i" />],
};

const APPROVAL: Record<string, Entry> = {
  NOT_REQUIRED: ["neutral", <Circle key="i" />],
  PENDING_APPROVAL: ["warning", <HourglassMedium key="i" />],
  PENDING: ["warning", <HourglassMedium key="i" />],
  APPROVED: ["success", <CheckCircle key="i" />],
  REJECTED: ["danger", <XCircle key="i" />],
};

const BOOST: Record<string, Entry> = {
  QUEUED: ["info", <ClockCountdown key="i" />],
  ACTIVE: ["success", <Play key="i" />],
  RUNNING: ["success", <Play key="i" />],
  PAUSED: ["neutral", <Pause key="i" />],
  STOPPED: ["neutral", <Stop key="i" />],
  COMPLETED: ["success", <CheckCircle key="i" />],
  FAILED: ["danger", <WarningCircle key="i" />],
};

const INTEGRATION: Record<string, Entry> = {
  CONNECTED: ["success", <CheckCircle key="i" />],
  NEEDS_RECONNECT: ["warning", <WarningCircle key="i" />],
  DISABLED: ["neutral", <Pause key="i" />],
  DISCONNECTED: ["neutral", <LinkBreak key="i" />],
};

const KINDS = { post: POST, campaign: CAMPAIGN, approval: APPROVAL, boost: BOOST, integration: INTEGRATION };
export type StatusKind = keyof typeof KINDS;

/** The words for a state, for places that need text without a badge (filters, sentences). */
export function useMarketingStatusLabel() {
  const t = useTranslations("Status");
  return (kind: StatusKind, value: string | null | undefined) => {
    const v = String(value ?? "").toUpperCase();
    const key = `${kind}.${v}`;
    return t.has(key) ? t(key) : t("unknown");
  };
}

export function MarketingStatus({ kind, value, size = "md", className }: { kind: StatusKind; value: string | null | undefined; size?: "sm" | "md"; className?: string }) {
  const label = useMarketingStatusLabel();
  const v = String(value ?? "").toUpperCase();
  const [tone, icon] = KINDS[kind][v] ?? (["neutral", <Circle key="i" />] as Entry);
  return (
    <Badge tone={tone} icon={icon} size={size} className={className}>
      {label(kind, v)}
    </Badge>
  );
}
