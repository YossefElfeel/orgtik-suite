import type { DealCustomPlanDTO, DealPlanSelectionDTO } from "@/types/projects";

export type OfferStatus = "pending" | "countered" | "accepted" | "rejected";
export const OFFER_STATUSES: OfferStatus[] = ["pending", "countered", "accepted", "rejected"];

export type OfferStatusFilter = "all" | OfferStatus;

export type OfferPaymentMethod = "cash" | "installments";

/** A list row. `total` is the agreed total: the counter once one was accepted, else the quote. */
export type Offer = {
  id: string;
  name: string;
  composition: "custom" | "standard";
  planCount: number;
  customerId: string | null;
  customerName: string | null;
  total: number | string;
  currencyCode: string;
  status: OfferStatus;
  submittedAt: string;
  contractId: string | null;
  projectId: string | null;
  createdAt?: string;
};

export type OfferListParams = {
  page?: number;
  limit?: number;
  status?: OfferStatus;
  search?: string;
};

export type OfferCustomer = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  address: string;
};

export type OfferDealLine = {
  planId: string;
  planName: string;
  isCustom: boolean;
  durationMonths: number;
  paymentMethod: OfferPaymentMethod;
  installmentMonths: number | null;
  total: string;
  listTotal: string | null;
};

export type OfferSummaryLine = {
  planId: string;
  planName: string;
  isCustom: boolean;
  customGroupId: string | null;
  customLabel: string | null;
  customPortion: "cash" | "installment";
  monthlyPrice: string;
  listMonthlyPrice: string;
  priceSource: string;
  durationMonths: number;
  discountPercentage: string;
  discountAmount: string;
  total: string;
  paymentMethod: OfferPaymentMethod;
  installmentMonths: number | null;
  installmentMarkupPercentage: string | null;
  installmentMarkupAmount: string;
  payableTotal: string;
  installmentMonthlyAmount: string | null;
  /** Not sent by the API yet (see the wave report); used when present so edits can resend custom plans. */
  featureIds?: string[];
  durationId?: string;
  installmentDurationId?: string | null;
};

export type OfferSummary = {
  currencyCode: string;
  lines: OfferSummaryLine[];
  subtotal: string;
  installmentMarkupTotal: string;
  discountAmount: string;
  netAmount: string;
  /** Percent points: "14.00" is 14%. */
  vatRate: string;
  vatAmount: string;
  total: string;
  cashDueTotal: string;
  installmentTotal: string;
  installmentMonthlyTotal: string;
  totalUsd: string;
};

export type OfferEventType = "quote_created" | "quote_updated" | "counter_offer" | "accepted" | "rejected";

export type OfferNegotiationEvent = {
  id: string;
  type: OfferEventType | string;
  amount: string;
  currencyCode: string;
  note: string | null;
  actorId: string;
  actorType: "staff" | "customer" | string;
  createdAt: string;
};

export type OfferSide = "staff" | "customer";

export type OfferDetail = {
  id: string;
  name: string;
  composition: "custom" | "standard";
  status: OfferStatus;
  contractId: string | null;
  projectId: string | null;
  customer: OfferCustomer;
  noteToCustomer: string | null;
  deal: OfferDealLine[];
  dealTotal: string;
  currencyCode: string;
  quotedTotal: string;
  counterTotal: string | null;
  counterNote: string | null;
  summary: OfferSummary;
  events: OfferNegotiationEvent[];
  lastTermsBy: OfferSide;
  awaitingResponseFrom: OfferSide | boolean | null;
  canRespond: boolean;
  canAccept: boolean;
  canCounter: boolean;
  canReject: boolean;
  canEdit: boolean;
  canDelete: boolean;
  submittedAt: string;
  respondedAt: string | null;
  createdBy: string;
  createdByType: string;
  createdAt: string;
  updatedAt: string;
  vatCountryCode?: string | null;
  zoneId?: string | null;
};

export type CreateOfferDTO = {
  customerId?: string;
  planSelections?: DealPlanSelectionDTO[];
  customPlans?: DealCustomPlanDTO[];
  zoneId?: string;
  countryCode?: string;
  vatCountryCode?: string | null;
  noteToCustomer?: string;
};

export type CounterOfferDTO = { total: number; note?: string };
export type AcceptOfferDTO = { note?: string };
export type RejectOfferDTO = { note?: string };
