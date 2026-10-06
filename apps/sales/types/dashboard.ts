import type {
  ZoneGrowthMetric,
  ZoneMoneyGroup,
  ZoneSalesTrendSeries,
  ZoneTopPlansGroup,
} from "@/types/money";

export type GrowthMetric = {
  total: number;
  currentPeriod: number;
  previousPeriod: number;
  growthPercent: number;
  comparisonPeriod?: string;
};

export type StatusBreakdown = {
  status: string;
  count: number;
  percentage: number;
};

export type TopPlan = {
  rank: number;
  planId: string;
  name: string;
  revenue: number;
  salesCount: number;
  percentage: number;
};

export type MonthlySalesTrend = {
  month: string;
  amount: number;
};

export type SalesGrowthLastSemester = {
  currentSixMonthsAmount: number;
  previousSixMonthsAmount: number;
  growthPercent: number;
};

export type ZoneSalesGrowthLastSemester = SalesGrowthLastSemester & {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
};

export type DashboardData = {
  userType?: string;
  period?: { month: string | null; start: string | null; end: string | null };
  totalProjects: GrowthMetric;
  totalSales: ZoneGrowthMetric[];
  totalPlanSales: GrowthMetric;
  netProfit: ZoneGrowthMetric[];
  projectStageBreakdown: StatusBreakdown[];
  topPlans: ZoneTopPlansGroup[];
  salesTrend: {
    from: string;
    to: string;
    series: ZoneSalesTrendSeries[];
    /** @deprecated Prefer series; kept if API still nests points at root for one zone */
    points?: MonthlySalesTrend[];
    growth: ZoneSalesGrowthLastSemester[];
  };
  totalSalesmen: GrowthMetric;
  totalCustomers: GrowthMetric;
  totalCommission: ZoneGrowthMetric[];
  customerStatus: {
    qualifiedCustomers: number;
    unqualifiedCustomers: number;
    qualifiedPercentage: number;
    breakdown: StatusBreakdown[];
  };
  needAttention?: {
    commissionsReadyToPay: { count: number; totalAmount: ZoneMoneyGroup[] };
    overdueInvoices: { count: number; totalAmount: ZoneMoneyGroup[] };
  };
  user?: { fullName?: string };
};

/** Customer-role `/dashboard/overview` payload (flat metrics). */
export type CustomerDashboardData = {
  totalProjects: number;
  totalSubscriptions: number;
  totalPaymentRows: number;
  totalContractAmounts: ZoneMoneyGroup[];
  pendingPaymentInvoices: number;
  pendingPaymentAmount: ZoneMoneyGroup[];
  totalPaidInvoicesAmounts: ZoneMoneyGroup[];
  installmentContracts: number;
  nextInstallmentPaymentDueDate: string | null;
  overdueInvoices: number;
  subscriptionsExpiringSoon: number;
};

export type DashboardOverviewData = DashboardData | CustomerDashboardData;

export function isCustomerDashboardData(
  data: DashboardOverviewData,
): data is CustomerDashboardData {
  return typeof data.totalProjects === "number";
}

/** A row of the dashboard's "Latest customers" (GET /customers, newest first). */
export type DashboardCustomerRow = {
  id: string;
  fullName: string;
  companyName: string | null;
  status: string;
  salesName: string | null;
  createdAt: string;
};

/** A row of the dashboard's "Latest projects" (GET /dashboard/latest-projects). */
export type DashboardProjectRow = {
  id: string;
  projectName: string;
  displayId?: string | null;
  status: string;
  customerName: string | null;
  salesmanName: string | null;
  dueDate?: string | null;
  createdAt: string;
};

/** An offer waiting for the customer's answer (GET /offers?status=pending). */
export type DashboardOfferRow = {
  id: string;
  name: string;
  status: string;
  /** A decimal string in the offer's currency. */
  total: string;
  currencyCode: string;
  submittedAt: string | null;
  customerName: string | null;
};

/** The customer's own loyalty account (GET /loyalty/me). */
export type DashboardLoyalty = {
  programActive: boolean;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiringSoon: number;
  nextExpiryAt: string | null;
};
