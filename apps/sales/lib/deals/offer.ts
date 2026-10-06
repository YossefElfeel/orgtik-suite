import { num } from "@/lib/deals/format";
import type { OfferDetail, OfferSide } from "@/types/offers";

/**
 * The total both sides agreed: the counter once a counter was accepted, else the quote. The API
 * accepts at the counter, and the list shows it; the detail page showed the original quote (SAL-014).
 */
export const agreedTotal = (offer: Pick<OfferDetail, "status" | "counterTotal" | "summary" | "quotedTotal">) =>
  offer.status === "accepted" && offer.counterTotal != null ? num(offer.counterTotal) : num(offer.summary?.total ?? offer.quotedTotal);

/** Who answers next. Older records send a boolean: true was "the customer". */
export function awaiting(offer: Pick<OfferDetail, "awaitingResponseFrom" | "status">): OfferSide | null {
  if (offer.status !== "pending" && offer.status !== "countered") return null;
  const a = offer.awaitingResponseFrom;
  if (a === "customer" || a === true) return "customer";
  if (a === "staff" || a === false) return "staff";
  return null;
}

export const isOpen = (status: string) => status === "pending" || status === "countered";
