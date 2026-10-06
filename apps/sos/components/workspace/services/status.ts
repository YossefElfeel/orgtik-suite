// The platform's request states, as the status matrix names them (the API says in_review where the
// matrix says customer_review), and what the customer does next in each.
import type { StatusState } from "@orgtik/ui";
import type { ServiceRequest, ServiceRequestState } from "@/redux/features/platform/services";

export const requestBadge = (s: ServiceRequestState): StatusState<"service_request"> => (s === "in_review" ? "customer_review" : s) as StatusState<"service_request">;

/** A quote past its date is expired even before the platform says so. */
export const quoteExpired = (r: ServiceRequest, now = Date.now()) => r.state === "expired" || (r.state === "quoted" && !!r.quote && Date.parse(r.quote.validUntil) < now);

export type NextStep = "review" | "quote" | "pay" | "working" | "delivery" | "hold" | "expired" | "none";
export function nextStep(r: ServiceRequest): NextStep {
  if (quoteExpired(r)) return "expired";
  switch (r.state) {
    case "new":
    case "under_review":
      return "review";
    case "quoted":
      return "quote";
    case "awaiting_payment":
      return "pay";
    case "in_progress":
      return "working";
    case "in_review":
      return "delivery";
    case "on_hold":
      return "hold";
    default:
      return "none";
  }
}

/** Work hasn't started: the request can still be cancelled. */
export const cancellable = (r: ServiceRequest) => ["new", "under_review", "quoted"].includes(r.state);
