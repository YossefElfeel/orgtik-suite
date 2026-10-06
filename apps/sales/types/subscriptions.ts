import type { IPaginated, PaginationOptions } from "@/types";
import type { UseFormReturn } from "react-hook-form";
import type { SubscribePlanFormValues } from "@/schemas/subscriptions";
import type { ZoneMoneyGroup } from "@/types/money";

export const subscriptionStatuses = [
  "pending",
  "active",
  "expiring_soon",
  "expired",
  "paused",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type SubscriptionFilterTab = "all" | SubscriptionStatus;

export const customerSubscriptionListStatuses = subscriptionStatuses.filter(
  (status) => status !== "pending",
);

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  pending: "Pending",
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  paused: "Paused",
  cancelled: "Cancelled",
};

export type SubscriptionPaymentStatus =
  | "paid"
  | "unpaid"
  | "partially_paid"
  | "partial_paid"
  | "pending"
  | "overdue"
  | "refunded";

export type SubscriptionInstallmentStatus =
  | "paid"
  | "overdue"
  | "pending"
  | "upcoming";

export type SubscriptionPaymentType = "full_payment" | "installment";

export type SubscriptionRefundTo =
  | "original_payment_method"
  | "bank_transfer"
  | "credit_card"
  | "cash"
  | "other";

export type LocalizedText = string | Record<string, string> | null;

export function displayLocalizedText(value: LocalizedText | undefined) {
  if (!value) return "—";
  if (typeof value === "string") return value.trim() || "—";
  return (
    value.en?.trim() ||
    Object.values(value).find((item) => item?.trim()) ||
    "—"
  );
}

export type SubscriptionInstallmentRequest = {
  id: string;
  subscriptionId: string;
  projectName: string;
  planName: string;
  remainingBalance: number;
  requestedAmount: number;
  months: number;
  currency: string;
  currentTermEnds: string;
  paidOffBy: string;
  extendsBeyondTermMonths: number;
  noteOptions: string[];
};

export type SubscriptionsQueryParams = PaginationOptions & {
  month?: string;
  status?: SubscriptionStatus;
};

export type SubscriptionsSummaryQueryParams = {
  month?: string;
};

export type SubscriptionListItemDto = {
  id: string;
  projectName: string;
  planName: LocalizedText;
  totalPrice: string;
  endDate: string | null;
  status: string;
  paymentStatus: string;
};

export type SubscriptionInvoiceHistoryDto = {
  invoiceId?: string;
  invoiceCode: string | null;
  amount: string;
  /** Invoice denomination — any ISO currency code. */
  currencyCode?: string;
  /** @deprecated Prefer `currencyCode`. Older payloads only. */
  currency?: string;
  status: string;
  paymentMethod?: string | null;
  createdAt: string;
};

export type SubscriptionInstallmentScheduleDto = {
  number: number;
  dueDate: string;
  amount: string;
  status: string;
  paidDate?: string | null;
  invoiceId?: string | null;
};

export type SubscriptionDetailDto = {
  id: string;
  subscriptionNumber: string;
  projectName: LocalizedText;
  planName: LocalizedText;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  startDate: string;
  endDate: string | null;
  daysLeft: number | null;
  lifecycleStatus: string;
  paymentStatus: string;
  autoRenew: boolean;
  invoices: SubscriptionInvoiceHistoryDto[];
  installments: SubscriptionInstallmentScheduleDto[];
};

export type AdminSubscriptionsSummaryDto = {
  totalSubscriptions: number;
  totalValue: ZoneMoneyGroup[];
  installmentPlans: number;
  paidAmount: ZoneMoneyGroup[];
  activeSubscriptions: number;
  pendingPayments: ZoneMoneyGroup[];
  expiringSoon: number;
  expiredSubscriptions: number;
  cancelled: number;
};

export type CustomerSubscriptionsSummaryDto = {
  totalSubscriptions: number;
  totalCost: ZoneMoneyGroup[];
  pendingPayments: ZoneMoneyGroup[];
  paidSubscriptions: number;
  installmentPlans: number;
  nextInstallmentPayment: string | null;
};

export type AdminRenewalDurationOption = {
  id: string;
  type: "plan";
  months: number;
  percentage: string;
  isActive: boolean;
};

export type AdminRenewalDurationList = {
  subscriptionId: string;
  planId: string;
  planName: string;
  durations: AdminRenewalDurationOption[];
};

export type AdminRenewalRequestDto = {
  durationId: string;
  paymentType: SubscriptionPaymentType;
  installmentDurationId?: string;
};

export type AdminRenewalPreflight = {
  subscriptionId: string;
  durationId: string;
  months: number;
  newStartDate: string;
  newEndDate: string;
  baseMonthlyPrice: string;
  baseAmount: string;
  durationDiscount: string;
  durationDiscountAmount: string;
  totalAmount: string;
  paymentType: SubscriptionPaymentType;
  installmentMonths?: number | null;
  installmentAmount?: string | null;
  currency: string;
};

export type AdminPaySubscriptionDto = {
  amount: string;
  paymentMethod?: string;
};

export type AdminPaySubscriptionResult = {
  subscriptionId: string;
  invoiceCode: string;
  paidAmount: string;
  remainingAmount: string;
  status: string;
};

export type AdminCancelSubscriptionDto = {
  reason: string;
};

export type AdminCancelSubscriptionResult = {
  subscriptionId: string;
  status: string;
  cancelReason: string;
  cancelledAt: string;
};

export type AdminRefundSubscriptionDto = {
  amount: string;
  refundTo: SubscriptionRefundTo;
  note?: string;
};

export type AdminRefundSubscriptionResult = {
  subscriptionId: string;
  refundAmount: string;
  refundTo: SubscriptionRefundTo;
  refundInvoiceCode: string;
};

export type AdminPauseResumeResult = {
  subscriptionId: string;
  status: string;
  pausedAt: string | null;
};

export type AdminAutoRenewDto = {
  enabled: boolean;
};

export type AdminAutoRenewResult = {
  subscriptionId: string;
  autoRenew: boolean;
};

export type CustomerSubscriptionPaymentMode = "pay_later" | "pay_now";

export type CustomerSubscriptionPreflightDto = {
  planId: string;
  durationId: string;
  couponCode?: string;
};

export type CustomerSubscriptionPreflight = {
  planId: string;
  planName: string;
  durationId: string;
  months: number;
  monthlyPrice: string;
  baseAmount: string;
  durationDiscount: string;
  durationDiscountAmount: string;
  couponDiscount?: string;
  couponDiscountAmount?: string;
  totalAmount: string;
  currency: string;
};

export type CustomerSubscriptionCheckoutDto = {
  projectName: string;
  projectDescription: string;
  planId: string;
  durationId: string;
  installmentDurationId?: string;
  couponCode?: string;
  paymentMode: CustomerSubscriptionPaymentMode;
};

export type CustomerSubscriptionCheckoutResult = {
  subscriptionId: string;
  projectId?: string;
};

export type SubscribePlanCouponFieldProps = {
  form: UseFormReturn<SubscribePlanFormValues>;
  appliedCoupon?: string;
  couponError?: string;
  appliedCouponDiscountLabel?: string;
  isApplying?: boolean;
  applyDisabled?: boolean;
  onApply: () => void;
};

export type SubscriptionsPaginated = IPaginated<SubscriptionListItemDto>;
