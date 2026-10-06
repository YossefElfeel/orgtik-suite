import type { CustomerFinancialsByZone } from "@/types/money";

export type CustomerAccess = "no_account" | "invited" | "active";

/**
 * A lead's stage in the one pipeline (D-028). "Scheduled" is no longer a stage: a meeting is an
 * activity on the lead. A lost lead carries the reason it was lost.
 */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quoted"
  | "won"
  | "lost"
  | "unqualified"
  | "spam"
  | "duplicate";

/** A customer is a lead that went on; both live on the same record and pipeline. */
export type CustomerStatus = LeadStatus;

/** Where the lead came from: the website's forms, typed in by staff, or another channel. */
export type LeadSource = "website" | "manual" | "referral" | "partner" | "event" | "import" | (string & {});

/** What the website sent with a lead (the page, the bundle asked about, the campaign). */
export type LeadSourceContext = {
  page?: string | null;
  bundle?: string | null;
  utm?: Record<string, string | null | undefined> | null;
  message?: string | null;
  locale?: string | null;
  receivedAt?: string | null;
};

/** The five languages Sales and its emails speak. */
export type CustomerLanguage = "en" | "ar" | "de" | "fr" | "it";

export interface CustomerSummary {
  projects: {
    total: number;
    pending: number;
    currentMonthPending: number;
    previousMonthPending: number;
    growthPercent: number;
  };
  financials: CustomerFinancialsByZone[];
  lastActivity: {
    at: string;
    daysSince: number;
  };
  contactAttention: {
    needsCheckIn: boolean;
    daysSinceLastActivity: number;
    thresholdDays: number;
  };
}

export type CustomerDocument = {
  name: string;
  size: number | string;
  url: string;
};

export type CustomerNote = {
  id: string;
  note?: string;
  content?: string;
  createdAt: string;
  createdBy?: string | null;
};

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  /** ISO 3166-1 alpha-2; drives zone / currency for quotes. */
  countryCode?: string | null;
  preferredLanguage: CustomerLanguage;
  commercialRegistrationNumber?: string | null;
  status: LeadStatus;
  /** Why a lost lead was lost (required for lost). */
  lostReason?: string | null;
  source?: LeadSource | null;
  sourceContext?: LeadSourceContext | null;
  createdAt: string;
  updatedAt?: string;
  companyName?: string | null;
  website?: string | null;
  assignedSalesmanId?: string | null;
  salesName?: string | null;
  /** The customer's suite login, when they have one (for View as). */
  authUserId?: string | null;
  access?: CustomerAccess;
  summary?: CustomerSummary;
  // Older field names the API still sends.
  name?: string;
  phone?: string;
  createdDate?: string;
};

export type CustomersPaginated<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type CustomerContractStatus = "pending" | "confirmed" | "rejected" | "approved" | "in_progress" | "testing" | "completed";

export interface CustomerContract {
  id: string;
  status: CustomerContractStatus;
  createdAt: string;
  pdfPath?: CustomerDocument;
  /** Spelled as the API sends it. */
  isSigntuerd: boolean;
}

export interface CustomerProjectPlan {
  id: string;
  name: string;
  dateRange?: string;
  price?: string;
}

export interface CustomerProject {
  id: string;
  projectName?: string;
  status?: string;
  priority?: string;
  createdAt: string;
  plansCount?: number;
  plans?: CustomerProjectPlan[];
  contracts?: CustomerContract[];
}

export type CustomerMeeting = {
  createdAt: string;
  createdBy: string;
  scheduledAt: string;
  notes?: string | null;
};

export type CustomerDetail = Customer & {
  idDocument: CustomerDocument | null;
  businessDocument: CustomerDocument | null;
  notes: CustomerNote[];
  createdByUser?: { id: string; fullName: string } | null;
  updatedByUser?: { id: string; fullName: string } | null;
  updatedAt: string;
  projects?: CustomerProject[];
  inviteLink?: string | null;
  invitationSent?: boolean;
  invite?: {
    inviteUrl: string;
    expiresAt: string;
  } | null;
  meetingAppointment?: CustomerMeeting | null;
};

export type CreateCustomerDTO = {
  fullName: string;
  address: string;
  countryCode?: string;
  companyName?: string;
  commercialRegistrationNumber?: string;
  website?: string;
  assignedSalesmanId?: string | null;
  email: string;
  phoneNumber: string;
  sendInvite?: boolean;
  preferredLanguage?: CustomerLanguage;
};

export type UpdateCustomerDTO = {
  fullName?: string;
  address?: string;
  countryCode?: string;
  companyName?: string;
  commercialRegistrationNumber?: string | null;
  website?: string | null;
  assignedSalesmanId?: string | null;
  email?: string;
  phoneNumber?: string;
  preferredLanguage?: CustomerLanguage;
};

export type UpdateLeadStatusDTO = {
  id: string;
  status: LeadStatus;
  /** Required when the status is lost. */
  lostReason?: string;
};

export type ScheduleMeetingDTO = {
  scheduledAt: string;
  notes?: string;
};

/** A salesperson a lead can be assigned to. */
export type LeadOwner = {
  id: string;
  fullName: string;
  email?: string;
};
