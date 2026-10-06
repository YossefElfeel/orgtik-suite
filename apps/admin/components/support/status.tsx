"use client";

import { useTranslations } from "next-intl";
import { Badge, StatusBadge, useStatusLabel, type StatusState, type Tone } from "@orgtik/ui";
import type { TicketState } from "@/store/support";

export const TICKET_STATES: TicketState[] = ["open", "in_progress", "waiting_for_you", "resolved", "closed"];
export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const PRIORITY_TONE: Record<string, Tone> = { low: "neutral", normal: "neutral", high: "warning", urgent: "danger" };

// The API's "waiting_for_you" (waiting for the customer's answer) is the status matrix's "awaiting_reply".
const matrixState = (s: TicketState) => (s === "waiting_for_you" ? "awaiting_reply" : s) as StatusState<"support_ticket">;

export function TicketStatus({ state }: { state: TicketState }) {
  return <StatusBadge size="sm" entity="support_ticket" state={matrixState(state)} />;
}

export function useTicketStateLabel() {
  const label = useStatusLabel();
  return (s: TicketState) => label("support_ticket", matrixState(s));
}

export function PriorityBadge({ priority }: { priority: string }) {
  const t = useTranslations("Support");
  return (
    <Badge size="sm" tone={PRIORITY_TONE[priority] ?? "neutral"} emphasis={priority === "normal" || priority === "low" ? "outline" : "subtle"}>
      {(PRIORITIES as readonly string[]).includes(priority) ? t(`priorities.${priority}`) : priority}
    </Badge>
  );
}
