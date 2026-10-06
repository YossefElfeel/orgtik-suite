import { IPagination } from "@/types";

export type CommissionPayoutStatus = "unpaid" | "partially_paid" | "paid";
export type CommissionStatus = CommissionPayoutStatus;
export type CommissionApprovalStatus = "pending" | "approved" | "rejected";

export type CommissionMode = "percentage" | "flat_rate" | "recurring" | "one_time";
export type CommissionType = CommissionMode;

export type Commission = {
  id: string;
  reference: string;
  salesmanId: string;
  salesmanName: string;
  salesmanAvatarUrl?: string;
  projectId?: string | null;
  projectName?: string | null;
  contractId?: string | null;
  /** The commission in money, in `currency`, also for a percentage commission. */
  amount: string | number;
  paidAmount: string | number;
  dueAmount: string | number;
  currency: string;
  commissionMode: CommissionMode;
  commissionValue: number;
  /** The rate in points for a percentage commission ("8.00" is 8%); the money value otherwise. */
  commissionRate: string;
  payoutStatus: CommissionPayoutStatus;
  approvalStatus: CommissionApprovalStatus;
  createdAt: string;
  earnedAt?: string | null;
  paidAt?: string | null;
  receiptUrl?: string | null;
  zoneId?: string | null;
};

/** The list filter: "due" is unpaid or partly paid. */
export type CommissionFilter = "all" | "due" | CommissionPayoutStatus;

export interface CommissionsQueryParams {
  page?: number;
  limit?: number;
  payoutStatus?: string;
  search?: string;
  salesmanId?: string;
}

export interface CommissionsPaginated {
  items: Commission[];
  meta: IPagination;
}

export interface CommissionTrend {
  total: number;
  currentPeriod: number;
  previousPeriod: number;
  growthPercent: number;
}

export interface CommissionZoneSummary {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  pendingPayoutCount: number;
  pendingPayoutAmount: number;
  totalPaid: number;
  totalEarned: number;
  collectedPercent: number;
  paidTrend: CommissionTrend;
  earnedTrend: CommissionTrend;
}

export interface CommissionSummaryStats {
  pendingPayoutCount: number;
  paidCount: number;
  pendingPayoutTrend: CommissionTrend;
  zones: CommissionZoneSummary[];
}

/** One amount in one currency, for figures summed per zone. */
export type CurrencyAmount = { currency: string; amount: number; label?: string };

/** A payout: part or all of one commission, with the bank's payment reference. */
export type PayCommissionDTO = {
  commissionId: string;
  amount: number;
  reference: string;
  receipt?: File | null;
};

/** Settles a salesperson's wallet: the oldest unpaid commissions first. */
export type WithdrawWalletDTO = {
  salesmanId: string;
  /** In the wallet's currency. */
  amount: number;
  reference: string;
};
