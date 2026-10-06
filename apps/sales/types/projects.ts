import type { PlanDuration } from "@/types/plans";
import type { ContractTotalsByZone, ZoneMoneyGroup } from "@/types/money";

// ---------------------------------------------------------------- projects (deals)

export type ProjectStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "inProgress"
  | "in_progress"
  | "confirmed"
  | "testing"
  | "completed";

/** The delivery statuses an approved project moves through, in order. */
export const DELIVERY_STATUSES = ["approved", "in_progress", "testing", "completed"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const PROJECT_STATUSES = ["pending", "confirmed", "approved", "rejected", "in_progress", "testing", "completed"] as const;

export type ProjectPriority = "low" | "medium" | "high";
export const PROJECT_PRIORITIES: ProjectPriority[] = ["low", "medium", "high"];

export type ProjectType = "client_project" | "internal_project";

/** Offers say "installments", projects "installment"; the API takes both. The app uses one word. */
export type DealPayment = "cash" | "installment";
export const isInstallment = (v: string | null | undefined) => v === "installment" || v === "installments";

export type ProjectQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: ProjectPriority;
};

export type ContractFile = {
  name: string;
  size: number;
  url: string;
};
/** @deprecated The old name; lib/documents still imports it. */
export type ContractPdfFile = ContractFile;

/** One plan on a contract, as the API prices it. Money is a decimal string in the contract currency. */
export type ContractPlanLine = {
  id: string;
  planId: string | null;
  planName: string;
  isCustom: boolean;
  features: { id: string; name: string }[];
  durationId: string;
  durationMonths: number;
  discountPercentage: string;
  monthlyPrice: string;
  listMonthlyPrice: string;
  price: string;
  listTotal: string;
  paymentMethod: string;
  installmentDurationId: string | null;
  installmentMonths: number | null;
  installmentMarkupPercentage: string | null;
  installmentMarkupAmount: string;
  payableTotal: string;
  installmentMonthlyAmount: string | null;
  planBundleName?: string | null;
  paymentStatus?: "paid" | "unpaid";
  installmentProgress?: number;
  subscriptionId?: string | null;
  currency: string;
};

export type ContractDetail = {
  id: string;
  projectId: string;
  status: "pending" | "approved" | "rejected" | string;
  commissionPercentage: string | null;
  commissionMode: "percentage" | "fixed" | null;
  commissionValue: string | null;
  commissionAmount?: string | null;
  grandTotal: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  installmentMarkupTotal?: string;
  cashDueTotal?: string;
  installmentTotal?: string;
  couponCode?: string | null;
  couponDiscountType?: string | null;
  couponDiscountValue?: string | null;
  couponDiscountAmount?: string | null;
  vatCountryCode?: string | null;
  vatRate?: string | null;
  vatAmount?: string | null;
  signedPdfPath?: ContractFile | null;
  unsignedPdfPath?: ContractFile | null;
  /** The API's spelling: true once the customer uploaded the signed contract. */
  isSigntuerd?: boolean;
  rejectionReason?: string | null;
  confirmedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  plans?: ContractPlanLine[];
  zoneId?: string | null;
  zoneName?: string | null;
  createdBy?: string;
  createdByType?: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
};

export type ProjectDetail = {
  id: string;
  referenceNumber?: number;
  displayId?: string;
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  priority: ProjectPriority;
  status: ProjectStatus;
  customerId: string | null;
  customerName: string | null;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    address?: string | null;
    companyName?: string | null;
  } | null;
  assignedSalesmanId: string | null;
  salesmanName: string | null;
  assignedSalesman?: {
    id: string;
    fullName: string;
    email: string;
    authUserId?: number;
  } | null;
  departmentId: string | null;
  departmentName: string | null;
  department?: { id: string; name: string } | null;
  totalCommission?: ZoneMoneyGroup[];
  totalPlansCount?: number;
  contractTotalsByZone?: ContractTotalsByZone[];
  /** @deprecated Use contractTotalsByZone */
  totalContractsCost?: number;
  latestContract?: ContractDetail | null;
  dueDate?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  createdAt: string;
  updatedAt: string;
  salesCommission: number;
  vatCountryCode?: string;
};

/** What was paid against a project's subscriptions (created when its contract is approved). */
export type ProjectPayments = {
  currency: string | null;
  total: number;
  paid: number;
  remaining: number;
  /** Lines whose subscription couldn't be read. */
  unknown: number;
};

export type CreateProjectDTO = {
  projectName: string;
  projectDescription: string;
  projectType?: ProjectType;
  customerId?: string;
  assignedSalesmanId?: string;
  departmentId?: string;
  priority?: ProjectPriority;
  planSelections?: DealPlanSelectionDTO[];
  customPlans?: DealCustomPlanDTO[];
  couponCode?: string;
  zoneId?: string;
  countryCode?: string;
  vatCountryCode?: string;
};

export type UpdateProjectDTO = Partial<{
  projectName: string;
  projectDescription: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  departmentId: string | null;
  assignedSalesmanId: string | null;
}>;

export type UpdateProjectDueDateDTO = { dueDate: string };
export type UpdateProjectPriorityDTO = { priority: ProjectPriority };
export type UpdateProjectStatusDTO = { status: DeliveryStatus };

export type SetProjectPlansDTO = {
  planSelections?: DealPlanSelectionDTO[];
  customPlans?: DealCustomPlanDTO[];
  zoneId?: string;
  countryCode?: string;
  vatCountryCode?: string;
  couponCode?: string;
};

export type SetProjectPlansResult = {
  projectId: string;
  contract: ContractDetail | null;
  items: ContractPlanLine[];
};

export type AddProjectContactNoteDTO = { content: string };

export type ProjectContactNote = {
  id: string;
  content: string;
  createdBy: string;
  createdByType: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------- deal builder (offers and projects)

/** A standard plan as the deal builder sends it. Ids win; months are the fallback the API also reads. */
export type DealPlanSelectionDTO = {
  planId: string;
  durationId?: string;
  durationMonths?: number;
  paymentMethod: DealPayment;
  installmentDurationId?: string | null;
  installmentMonths?: number | null;
  /** Keeps a line's agreed price on edit, so saving never re-prices it. */
  priceOverride?: number;
};

export type DealCustomPlanDTO = {
  label: string;
  featureIds: string[];
  durationId?: string;
  durationMonths?: number;
  paymentMethod: DealPayment;
  installmentDurationId?: string | null;
  installmentMonths?: number | null;
  priceOverride?: number;
};

/** Localised catalog text: admins and managers get the stored map, others a resolved string. */
export type CatalogText = string | Record<string, string>;

export type CatalogInstallmentPrice = {
  durationId: string;
  months: number;
  markupPercentage: string;
  isMarkupApplied: boolean;
  monthlyPayment: string;
};

/** One duration of a plan, priced by the API in the zone of the requested country. */
export type CatalogDurationPrice = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  priceSource: string;
  countryCode: string | null;
  baseMonthlyPrice: string;
  undiscountedTotal: string;
  discountPercentage: string;
  discountAmount: string;
  discountedTotal: string;
  effectiveMonthlyPrice: string;
  duration: { durationId: string; months: number; discountPercentage: string };
  installments: CatalogInstallmentPrice[];
};

export type DealCatalogPlan = {
  id: string;
  name: CatalogText;
  isActive: boolean;
  isPrivate: boolean;
  categories: { id: string; name: CatalogText }[];
  features: { id: string; name: string }[];
  featureCount: number;
  paymentMode: "installment" | "cash_only";
  /** Present when the list was asked for a country; [] when the plan isn't sold there. */
  resolvedPrice?: CatalogDurationPrice[];
};

export type DealCatalogFeature = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  paymentType: string;
  isActive: boolean;
  resolvedPrice: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    priceSource: string;
    price: string;
  } | null;
};

export type DealDuration = {
  id: string;
  type: "plan" | "installment";
  months: number;
  /** A discount (plan) or a markup (installment), in percent points. */
  percentage: string;
  isActive: boolean;
};

export type DealVatCountry = { code: string; name: string; vatRate: number };

export type DealCountry = { code: string; name: string; nativeName?: string };

export type DealCustomer = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  countryCode: string | null;
  assignedSalesmanId: string | null;
  salesName: string | null;
  phoneNumber?: string;
  address?: string;
};

// ---------------------------------------------------------------- legacy shapes
// Still imported outside this area (lib/project-plans, mock/*, hooks/useProjectActions,
// types/deal-plans). The screens here no longer use them.

export type ProjectPlanPaymentMethod = "cash" | "installments";

export type ProjectPlanSelection = {
  planId: string;
  durationId: string;
  paymentMethod: ProjectPlanPaymentMethod;
  installmentDurationId?: string;
};

export type CustomProjectPlan = {
  id: string;
  label: string;
  featureIds: string[];
  duration: PlanDuration;
  installmentPaymentMethod: ProjectPlanPaymentMethod;
  installmentPlanId?: string;
  addedToProject: boolean;
};

export type ProjectPlanDurationOption = {
  id: PlanDuration;
  months: number;
  discountPercent: number;
};

export type ProjectInstallmentOption = {
  id: string;
  months: number;
  label: string;
};

export type LatestProject = {
  id: string;
  displayId?: string;
  projectName: string;
  projectDescription: string;
  customerName: string;
  salesmanName: string;
  salesCommission: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdAt: string;
};

export type Project = LatestProject;

export type ProjectPlanPaymentStatus = "paid" | "unpaid";

export type ProjectSubscriptionRow = {
  id: string;
  title: string;
  planTag?: "cash_only" | "installment";
  partOfBundle?: string;
  dateRange: string;
  paymentLabel: string;
  amount: number;
  amountLeft?: number;
  currency: string;
  paymentStatus: ProjectPlanPaymentStatus;
  installmentProgress?: number;
  monthlyAmount?: number;
};

export type ProjectDetailsPlans = {
  planCount: number;
  subscriptionCount: number;
  items: ProjectSubscriptionRow[];
};

export type ProjectActivityItem = {
  id: string;
  status: ProjectStatus;
  relativeTime: string;
};

export type ProjectContractStatus = "pending" | "approved" | "rejected";

export type ProjectContractDocument = ContractFile;

export type ProjectContract = {
  id?: string;
  status: ProjectContractStatus;
  createdAt: string;
  commissionLabel: string;
  document: ProjectContractDocument | null;
  awaitingReview: boolean;
  requiresCommissionOnApproval?: boolean;
};

export type ProjectPersonalInfo = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  assignedSalesman: string;
};

export type ProjectDetailStats = {
  planCount: number;
  subscriptionRowCount: number;
  costByZone: ZoneMoneyGroup[];
  commissionByZone: ZoneMoneyGroup[];
  paidPercent: number;
  lastActivityDays: number;
  lastActivityLabel: string;
  expectedCompletion: string | null;
};

export type ProjectDetailView = {
  id: string;
  displayId: string;
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  planType: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  personal: ProjectPersonalInfo;
  stats: ProjectDetailStats;
  showInactivityWarning: boolean;
  inactivityDays: number;
  inactivityLabel: string;
  plans: ProjectDetailsPlans;
  activity: ProjectActivityItem[];
  contract: ProjectContract;
};
