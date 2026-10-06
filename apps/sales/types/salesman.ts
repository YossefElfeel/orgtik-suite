import type { IPaginated, PaginationOptions } from "@/types";
import type { CustomerAccess, CustomerStatus } from "@/types/customers";
import type { GrowthMetric, StatusBreakdown, ZoneSalesGrowthLastSemester } from "@/types/dashboard";
import type { ZoneGrowthMetric, ZoneMoneyGroup, ZoneSalesTrendSeries, ZoneTopPlansGroup } from "@/types/money";
import type { ReactElement } from "react";

/** How a salesperson is doing, set by admins and managers. */
export type SalesmanPerformanceLabel = "top_performance" | "on_track" | "under_performance" | "inactive";
export const SALESMAN_PERFORMANCE: readonly SalesmanPerformanceLabel[] = ["top_performance", "on_track", "under_performance", "inactive"];

export type SalesmanPerformanceData = {
  userType?: string;
  totalProjects: GrowthMetric;
  totalSales: ZoneGrowthMetric[];
  totalPlanSales: GrowthMetric;
  totalCustomers: GrowthMetric;
  totalCommission: ZoneGrowthMetric[];
  projectStatusBreakdown: StatusBreakdown[];
  dealStageBreakdown: StatusBreakdown[];
  customerStatusBreakdown?: StatusBreakdown[];
  customerStatus: {
    qualifiedCustomers: number;
    unqualifiedCustomers: number;
    qualifiedPercentage: number;
    breakdown?: StatusBreakdown[];
  };
  salesTrend12Months: ZoneSalesTrendSeries[];
  salesGrowthLastSemester: ZoneSalesGrowthLastSemester[];
  topPlans: ZoneTopPlansGroup[];
  topPlansByRevenue?: ZoneTopPlansGroup[];
};

export type SalesmanNote = {
  id: string;
  content: string;
  createdBy?: string;
  createdByType?: string;
  createdAt: string;
  updatedAt?: string;
};

export type SalesmanCustomer = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  commercialRegistrationNumber?: string | null;
  companyName?: string | null;
  website?: string | null;
  assignedSalesmanId?: string | null;
  address?: string | null;
  status: CustomerStatus;
  createdAt: string;
};

export type SalesmanContractStatus = "pending" | "confirmed" | "rejected" | "approved" | "in_progress" | "testing" | "completed";
export const SALESMAN_CONTRACT_STATUSES: readonly SalesmanContractStatus[] = ["pending", "confirmed", "approved", "in_progress", "testing", "completed", "rejected"];

export type SalesmanContractPlan = {
  id: string;
  name?: { en?: string; [locale: string]: string | undefined };
  planName: string;
  durationMonths: number;
  price: string;
  isCustom: boolean;
  paymentMethod: string;
  installmentMonths: number | null;
  installmentMonthlyAmount: string | null;
};

export type SalesmanContract = {
  id: string;
  projectId: string;
  projectName?: string;
  status: SalesmanContractStatus;
  createdBy: string;
  createdByType: string;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  /** The rate in points for a percentage commission. */
  commissionPercentage: string;
  commissionMode: "percentage" | "fixed" | string;
  /** A fixed commission comes written out ("EGP 1,250.00"); read it with amountFromText. */
  commissionValue: string;
  isSigntuerd: boolean;
  plans: SalesmanContractPlan[];
  /** Written out ("EGP 12,345.00"); read it with amountFromText. */
  grandTotal: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalesmanRelation = { id: string; name: string };

export type Salesman = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  contractCount: number;
  /** In US dollars. */
  totalSalesAmount: number;
  /** In US dollars. */
  totalCommission: number;
  status?: string;
  performance?: SalesmanPerformanceLabel | null;
};

export type SalesmanBankDetails = {
  accountName: string | null;
  bankName: string | null;
  swiftBic?: string | null;
  iban: string | null;
};

export type SalesmanFinanceSummary = {
  contractCount: number;
  /** The wallet figures are in the wallet's currency (`currencyCode`). */
  totalSalesAmount: number;
  totalCommission: number;
  totalWithdrawAmount: number;
  walletBalance: number;
  currencyCode?: string;
  salesByZone?: ZoneMoneyGroup[];
  commissionByZone?: ZoneMoneyGroup[];
};

export type SalesmanStats = {
  totalProjects: number;
  totalCustomers: number;
  dealStage: { approved: number; pending: number; rejected: number };
  salesTrends: { month: string; amount: number }[];
  salesGrowth: number;
};

export type SalesmanDetail = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  departmentId: string | null;
  zoneId: string | null;
  performance?: SalesmanPerformanceData;
  createdAt: string;
  updatedAt: string;
  hasAccount: boolean;
  /** The person's SOS account, for View as. */
  authUserId?: number | null;
  department: SalesmanRelation | null;
  zone: SalesmanRelation | null;
  bankDetails: SalesmanBankDetails | null;
  finance: SalesmanFinanceSummary;
  stats: SalesmanStats;
  access?: CustomerAccess;
  notes?: SalesmanNote[];
  status?: string;
  performanceLabel?: SalesmanPerformanceLabel | null;
};

export type SalesmanBankDetailsInput = {
  accountName?: string | null;
  bankName?: string | null;
  swiftBic?: string | null;
  iban?: string | null;
};

export type CreateSalesmanDTO = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  departmentId?: string;
  zoneId?: string;
  bankDetails?: SalesmanBankDetailsInput;
  password: string;
};

export type UpdateSalesmanDTO = {
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
  address?: string | null;
  departmentId?: string | null;
  zoneId?: string | null;
  bankDetails?: SalesmanBankDetailsInput | null;
};

export type CreateSalesmanNoteDTO = { content: string };

export type SalesmenQueryParams = PaginationOptions;
export type SalesmenPaginated = IPaginated<Salesman>;

export type SalesmanCustomersQueryParams = PaginationOptions & { id: string; status?: CustomerStatus };
export type SalesmanCustomersPaginated = IPaginated<SalesmanCustomer>;

export type SalesmanContractsQueryParams = PaginationOptions & { id: string; status?: SalesmanContractStatus };
export type SalesmanContractsPaginated = IPaginated<SalesmanContract>;

export type SalesmanDialogProps = {
  /** Edit this salesperson; without it the dialog creates one. */
  id?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
