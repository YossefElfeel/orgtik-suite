"use client";

// One status badge for the CRM's objects: offers, projects (and their contracts), commissions, and
// staff access. Leads use the library's own `lead` matrix (D-028) through <LeadStatus>. Hard-coded
// English status maps and colour-only pills were spread over the screens; each badge now has
// words (Status.<kind>.<state> in the catalog), an icon and a tone.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowsLeftRight,
  CheckCircle,
  Circle,
  ClockCountdown,
  Flask,
  HourglassMedium,
  PaperPlaneTilt,
  Play,
  Prohibit,
  SealCheck,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Badge, StatusBadge, type Tone } from "@orgtik/ui";

type Entry = [Tone, ReactNode];

const OFFER: Record<string, Entry> = {
  pending: ["info", <PaperPlaneTilt key="i" />],
  countered: ["warning", <ArrowsLeftRight key="i" />],
  accepted: ["success", <CheckCircle key="i" />],
  rejected: ["danger", <XCircle key="i" />],
};

const PROJECT: Record<string, Entry> = {
  pending: ["warning", <HourglassMedium key="i" />],
  confirmed: ["info", <SealCheck key="i" />],
  approved: ["success", <CheckCircle key="i" />],
  rejected: ["danger", <XCircle key="i" />],
  in_progress: ["brand", <Play key="i" />],
  inProgress: ["brand", <Play key="i" />],
  testing: ["info", <Flask key="i" />],
  completed: ["success", <CheckCircle key="i" />],
};

const CONTRACT: Record<string, Entry> = {
  pending: ["warning", <HourglassMedium key="i" />],
  approved: ["success", <CheckCircle key="i" />],
  rejected: ["danger", <XCircle key="i" />],
};

const COMMISSION: Record<string, Entry> = {
  unpaid: ["warning", <ClockCountdown key="i" />],
  partially_paid: ["info", <ClockCountdown key="i" />],
  paid: ["success", <CheckCircle key="i" />],
  pending: ["warning", <HourglassMedium key="i" />],
  approved: ["success", <CheckCircle key="i" />],
  rejected: ["danger", <XCircle key="i" />],
};

const ACCESS: Record<string, Entry> = {
  active: ["success", <CheckCircle key="i" />],
  invited: ["info", <PaperPlaneTilt key="i" />],
  disabled: ["neutral", <Prohibit key="i" />],
  no_account: ["neutral", <Circle key="i" />],
  none: ["neutral", <Circle key="i" />],
};

const KINDS = { offer: OFFER, project: PROJECT, contract: CONTRACT, commission: COMMISSION, access: ACCESS };
export type SalesStatusKind = keyof typeof KINDS;

const normal = (v: string | null | undefined) => (String(v ?? "") === "inProgress" ? "in_progress" : String(v ?? ""));

/** The words for a state, for filters and sentences. */
export function useSalesStatusLabel() {
  const t = useTranslations("Status");
  return (kind: SalesStatusKind, value: string | null | undefined) => {
    const key = `${kind}.${normal(value)}`;
    return t.has(key) ? t(key) : t("unknown");
  };
}

export function SalesStatus({ kind, value, size = "md", className }: { kind: SalesStatusKind; value: string | null | undefined; size?: "sm" | "md"; className?: string }) {
  const label = useSalesStatusLabel();
  const [tone, icon] = KINDS[kind][normal(value)] ?? (["neutral", <WarningCircle key="i" />] as Entry);
  return (
    <Badge tone={tone} icon={icon} size={size} className={className}>
      {label(kind, value)}
    </Badge>
  );
}

const LEAD_STATES = ["new", "contacted", "qualified", "quoted", "won", "lost", "unqualified", "spam", "duplicate"] as const;
export type LeadState = (typeof LEAD_STATES)[number];
export const leadStates = LEAD_STATES;

/** A lead's stage (D-028), from the library's status matrix, in the reader's language. */
export function LeadStatus({ value, size = "md", className }: { value: string | null | undefined; size?: "sm" | "md"; className?: string }) {
  const v = String(value ?? "") === "scheduled" ? "contacted" : String(value ?? "");
  if (!(LEAD_STATES as readonly string[]).includes(v)) return <Badge tone="neutral" size={size} className={className}>{v}</Badge>;
  return <StatusBadge entity="lead" state={v as LeadState} size={size} className={className} />;
}
