"use client";

import { StatusBadge, useStatusLabel, type StatusState } from "@orgtik/ui";
import type { SrState } from "@/store/services";

export const SR_STATES: SrState[] = ["new", "under_review", "quoted", "awaiting_payment", "in_progress", "in_review", "on_hold", "completed", "rejected", "expired", "cancelled"];

// The API's "in_review" (a delivery waiting for the customer) is the status matrix's "customer_review".
const matrixState = (s: SrState) => (s === "in_review" ? "customer_review" : s) as StatusState<"service_request">;

export function SrStatus({ state }: { state: SrState }) {
  return <StatusBadge size="sm" entity="service_request" state={matrixState(state)} />;
}

export function useSrStateLabel() {
  const label = useStatusLabel();
  return (s: SrState) => label("service_request", matrixState(s));
}
