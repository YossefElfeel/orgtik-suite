"use client";
// Tools, plans, trials and checkout (USR-04…08) and custom plans (USR-25), on the customer API
// (/v1/app, contract orgtik-program/phase-e/platform-api.yaml). Prices come from the platform's
// resolver in the workspace's currency; the screens format them, they never compute them.
import { platformApi, type Localized, type PlatformError, type ToolState } from "./platformApi";

export type Cycle = "monthly" | "yearly";

/** A tool in the catalogue (USR-04): its state here, the lowest monthly unit price, trial days. */
export type CatalogTool = {
  key: string;
  name: Localized;
  short: Localized;
  icon: string;
  status: "coming_soon" | "beta" | "live" | "retired";
  mandatory: boolean;
  state: ToolState;
  hasFree: boolean;
  trialDays: number;
  fromUnit: { amount: number; currency: string; perUser: boolean } | null;
  onWaitlist: boolean;
};

export type Price = { amount: number; unit: number; currency: string; source: string; quantity: number };

export type ToolPlan = {
  id: string;
  name: Localized;
  tier: string;
  perUser: boolean;
  minSeats: number;
  /** 0 when the plan has none, or when this workspace already used the tool's trial (G-17). */
  trialDays: number;
  recommended: boolean;
  limits: { key: string; value: number | null; unit: string | null }[];
  flags: string[];
  monthly: Price | null;
  yearly: Price | null;
  yearlyDiscountPct: number;
  current: boolean;
};

export type ToolLine = { id: string; tool: string; planId: string; cycle: Cycle; state: string; trialEndsAt?: string | null; periodEnd?: string; graceEndsAt?: string | null };

export type ToolDetail = Omit<CatalogTool, "hasFree" | "trialDays" | "fromUnit" | "onWaitlist"> & {
  line: ToolLine | null;
  plans: ToolPlan[];
  seats: number;
  seatModel: string;
};

export type CheckoutItem = { planId: string; cycle: Cycle; seats?: number };
export type CheckoutBody = { items: CheckoutItem[]; coupon?: string };

export type PaymentMethod = { id: string; kind: string; brand: string; last4: string; expires: string; country: string; gateway: string; isDefault: boolean; expired?: boolean };

export type CheckoutPreview = {
  currency: string;
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  couponError: string | null;
  prorated: number;
  net: number;
  tax: number;
  total: number;
  lines: { planId: string; tool: string; name: Localized; cycle: Cycle; unit: number; quantity: number; amount: number; source: string; prorationFactor: number; credit: number; replaces: string | null }[];
  bundle: { id: string; name: Localized; pct: number } | null;
  coupon: { code: string; kind: string } | null;
  taxLabel: string | null;
  /** G-12: whether prices show tax-inclusive isn't decided. */
  taxDecided: boolean;
  /** Expired cards are left out by the API. */
  paymentMethods: PaymentMethod[];
  gateways: { id: string; name: string; methods: string[]; recurring: boolean }[];
};

export type CheckoutDone = { invoice: { id: string; number: string; total: number; currency: string }; lines: ToolLine[] };

/** The billing details as checkout needs them: the name on the invoice, and whether the currency is locked (R03-C2). */
export type CheckoutBilling = { legalName?: string; email?: string; country?: string; currency: string; currencyLocked: boolean };

export type CustomPlanRequest = {
  id: string;
  tools: string[];
  seats: number;
  cycle: Cycle;
  notes: string;
  state: "new" | "quoted" | "accepted" | "declined" | "expired" | string;
  createdAt: string;
  acceptedAt?: string;
  quote?: { amount: number; currency: string; validUntil: string };
};

const toolsApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    toolCatalog: b.query<CatalogTool[], void>({ query: () => "/tools", providesTags: ["Tools"] }),
    toolDetail: b.query<ToolDetail, string>({ query: (key) => `/tools/${encodeURIComponent(key)}`, providesTags: ["Tools"] }),
    joinWaitlist: b.mutation<{ tool: string; onWaitlist: boolean }, string>({
      query: (key) => ({ url: `/tools/${encodeURIComponent(key)}/waitlist`, method: "POST", body: {} }),
      invalidatesTags: ["Tools"],
    }),
    startTrial: b.mutation<ToolLine, { key: string; planId: string }>({
      query: ({ key, planId }) => ({ url: `/tools/${encodeURIComponent(key)}/trial`, method: "POST", body: { planId } }),
      invalidatesTags: ["Tools", "Me", "Subscriptions"],
    }),
    // A price, not a change: POST because the basket is a body. Not cached across baskets.
    checkoutPreview: b.query<CheckoutPreview, CheckoutBody>({
      query: (body) => ({ url: "/checkout/preview", method: "POST", body }),
      keepUnusedDataFor: 0,
    }),
    checkoutBilling: b.query<CheckoutBilling, void>({ query: () => "/billing", providesTags: ["Billing"] }),
    confirmCheckout: b.mutation<CheckoutDone, CheckoutBody & { paymentMethodId: string; billing?: { legalName: string } }>({
      query: (body) => ({ url: "/checkout/confirm", method: "POST", body }),
      // A failed payment still leaves an unpaid invoice behind, so invoices refresh either way.
      invalidatesTags: (_r, error) => (error ? ["Invoices"] : ["Me", "Tools", "Subscriptions", "Invoices", "Billing"]),
    }),
    customPlans: b.query<CustomPlanRequest[], void>({ query: () => "/custom-plans", providesTags: ["CustomPlans"] }),
    requestCustomPlan: b.mutation<CustomPlanRequest, { tools: string[]; seats: number; cycle: Cycle; notes: string }>({
      query: (body) => ({ url: "/custom-plans", method: "POST", body }),
      invalidatesTags: ["CustomPlans"],
    }),
    acceptCustomPlan: b.mutation<CustomPlanRequest, string>({
      query: (id) => ({ url: `/custom-plans/${encodeURIComponent(id)}/accept`, method: "POST", body: {} }),
      invalidatesTags: ["CustomPlans", "Subscriptions"],
    }),
  }),
});

export const {
  useToolCatalogQuery,
  useToolDetailQuery,
  useJoinWaitlistMutation,
  useStartTrialMutation,
  useCheckoutPreviewQuery,
  useCheckoutBillingQuery,
  useConfirmCheckoutMutation,
  useCustomPlansQuery,
  useRequestCustomPlanMutation,
  useAcceptCustomPlanMutation,
} = toolsApi;

/** The API's error, typed, from an RTK Query error or a rejected unwrap(). */
export const platformError = (e: unknown): PlatformError | null => (e && typeof e === "object" && "code" in e ? (e as PlatformError) : null);
