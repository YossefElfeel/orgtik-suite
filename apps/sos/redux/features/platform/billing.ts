"use client";
// Billing, the workspace owner's (spec 05: USR-09 subscriptions, USR-10 invoices, USR-11 payment
// methods, USR-12 billing details; spec 06 state tables), on the customer API (/v1/app, contract
// orgtik-program/phase-e/platform-api.yaml). Amounts come from the platform in the workspace's
// currency; the screens format them, they never compute prices.
import { platformApi, type Localized, type Page } from "./platformApi";

export type LineState = "trialing" | "active" | "past_due" | "read_only" | "cancelling" | "free" | "ended" | "deleted";
export type LineAction = "cancel" | "resume" | "downgrade" | "cancel-downgrade" | "retry";

/** The price fixed when the line was bought or renewed (spec 03 snapshot): unit × quantity = amount. */
export type PriceSnapshot = { amount: number; unit: number; quantity: number; currency: string; source: string; priceVersion?: number };

export type ScheduledChange =
  | { kind: "price_change"; effectiveAt: string; from?: number | null; note?: string }
  | { kind: "downgrade"; planId: string; effectiveAt: string };

export type SubscriptionLine = {
  id: string;
  tool: string;
  planId: string;
  cycle: "monthly" | "yearly";
  state: LineState;
  snapshot: PriceSnapshot;
  startedAt: string;
  periodEnd: string;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  readOnlySince?: string | null;
  cancelAt?: string | null;
  endedAt?: string | null;
  lastFailure?: { at: string; reason: string } | null;
  scheduled?: ScheduledChange;
  toolName?: Localized;
  planName?: Localized;
  tier?: string;
  perUser: boolean;
};

export type Subscriptions = { currency: string; currencyLocked: boolean; seats: number; monthlyTotal: number; lines: SubscriptionLine[] };

export type InvoiceState = "draft" | "open" | "past_due" | "paid" | "partially_refunded" | "refunded" | "void";
export type InvoiceSummary = { id: string; number: string; state: InvoiceState; total: number; currency: string; issuedAt: string | null; dueAt: string | null; paidAt?: string | null; refunded: number };

export type InvoicePayment = { id: string; amount: number; currency: string; method: string; gateway?: string; at: string; status: "succeeded" | "failed" | string; reason?: string };
export type CreditNote = { id: string; number: string; amount: number; reason?: string; at: string };
export type Refund = { id?: string; amount: number; at?: string; reason?: string };
export type BuyerDetails = { legalName: string; email: string; address: string; taxId: string; country: string };

export type Invoice = InvoiceSummary & {
  kind: string;
  lines: { label: string; amount: number; lineId?: string }[];
  subtotal: number;
  taxLabel: string | null;
  tax: number;
  payments: InvoicePayment[];
  creditNotes: CreditNote[];
  refunds?: Refund[];
  voidedAt?: string;
  seller: { name: string };
  buyer: BuyerDetails | null;
};

export type PaymentMethod = { id: string; kind: string; brand: string; last4: string; expires: string; country: string; gateway: string; isDefault: boolean; expired?: boolean };
export type NewCard = { brand: string; last4: string; expires: string; makeDefault: boolean };

export type TaxRule = { country: string; name: string; rate: number; inclusive: boolean | null; b2bReverseCharge: boolean; active: boolean };
export type BillingDetails = BuyerDetails & { currency: string; currencyLocked: boolean; tax: TaxRule | null };
export type BillingSaved = BuyerDetails & { currency?: string; migrationQueued?: boolean };

/** A plan of one tool, as the tool's page lists it: enough to offer a lower one. */
export type BillingPlan = { id: string; name: Localized; tier: string; perUser: boolean; monthly: { amount: number; currency: string } | null; yearly: { amount: number; currency: string } | null; current: boolean };

const billingApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    billingSubscriptions: b.query<Subscriptions, void>({ query: () => "/subscriptions", providesTags: ["Subscriptions"] }),
    // One action on one line. Retrying a payment also changes the invoice, the banner and the tool's state.
    billingLineAction: b.mutation<SubscriptionLine, { id: string; action: LineAction; planId?: string; reason?: string }>({
      query: ({ id, action, planId, reason }) => ({ url: `/subscriptions/${encodeURIComponent(id)}/${action}`, method: "POST", body: { planId, reason: reason || undefined } }),
      invalidatesTags: ["Subscriptions", "Me", "Tools", "Invoices"],
    }),
    billingToolPlans: b.query<BillingPlan[], string>({
      query: (key) => `/tools/${encodeURIComponent(key)}`,
      transformResponse: (r: { plans?: BillingPlan[] } | null) => r?.plans ?? [],
      providesTags: ["Tools"],
    }),
    billingInvoices: b.query<Page<InvoiceSummary>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => ({ url: "/invoices", params: { page, pageSize } }),
      providesTags: ["Invoices"],
    }),
    billingInvoice: b.query<Invoice, string>({ query: (id) => `/invoices/${encodeURIComponent(id)}`, providesTags: ["Invoices"] }),
    billingPaymentMethods: b.query<PaymentMethod[], void>({ query: () => "/payment-methods", providesTags: ["PaymentMethods"] }),
    billingAddCard: b.mutation<PaymentMethod, NewCard>({
      query: (card) => ({ url: "/payment-methods", method: "POST", body: { kind: "card", ...card } }),
      invalidatesTags: ["PaymentMethods"],
    }),
    billingMakeDefault: b.mutation<PaymentMethod, string>({
      query: (id) => ({ url: `/payment-methods/${encodeURIComponent(id)}`, method: "PATCH", body: { isDefault: true } }),
      invalidatesTags: ["PaymentMethods"],
    }),
    billingRemoveCard: b.mutation<null, string>({
      query: (id) => ({ url: `/payment-methods/${encodeURIComponent(id)}`, method: "DELETE" }),
      invalidatesTags: ["PaymentMethods"],
    }),
    billingDetails: b.query<BillingDetails, void>({ query: () => "/billing", providesTags: ["Billing"] }),
    billingSaveDetails: b.mutation<BillingSaved, BuyerDetails>({
      query: (body) => ({ url: "/billing", method: "PUT", body }),
      invalidatesTags: ["Billing", "Me", "Subscriptions"],
    }),
  }),
});

export const {
  useBillingSubscriptionsQuery,
  useBillingLineActionMutation,
  useBillingToolPlansQuery,
  useBillingInvoicesQuery,
  useBillingInvoiceQuery,
  useBillingPaymentMethodsQuery,
  useBillingAddCardMutation,
  useBillingMakeDefaultMutation,
  useBillingRemoveCardMutation,
  useBillingDetailsQuery,
  useBillingSaveDetailsMutation,
} = billingApi;
