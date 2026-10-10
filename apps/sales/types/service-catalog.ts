export const SERVICE_LOCALES = ["en", "ar", "de", "fr", "it"] as const;
export type ServiceLocale = (typeof SERVICE_LOCALES)[number];
export type ServiceText = Record<ServiceLocale, string>;
export type ServiceCapabilities = Record<ServiceLocale, string[]>;
export type ServiceOfferDraft = {
  name?: ServiceText;
  description?: ServiceText;
  capabilities?: ServiceCapabilities;
  department?: string;
  departmentName?: ServiceText;
  icon?: string;
  monthlyCHF?: number;
  regionalPrices?: Record<string, number | null>;
  countryPrices?: Record<string, number | null>;
  status?: "active" | "archived";
  updatedAt?: string;
};
export type ServiceOffer = ServiceOfferDraft & {
  id: string;
  serviceId: string;
  kind: "service";
  name: ServiceText;
  monthlyCHF: number;
  draft?: ServiceOfferDraft;
  publishedAt?: string;
};
export type ServiceBundle = {
  id: string;
  kind: "service";
  name: string | ServiceText;
  ids: string[];
  why?: ServiceText;
  recommended?: boolean;
  draft?: {
    name?: ServiceText;
    ids?: string[];
    why?: ServiceText;
    recommended?: boolean;
  };
};
export type ServiceCatalog = {
  managedIn: "crm";
  priceVersion: number;
  services: {
    id: string;
    name: string | ServiceText;
    status: "active" | "archived";
  }[];
  offers: ServiceOffer[];
  bundles: ServiceBundle[];
  zones: { id: string; name: string | ServiceText; currency: string }[];
  countries: { code: string; name: string; currency: string; zone: string }[];
  currencies: Record<string, { decimals: number }>;
  canPublish: boolean;
};
export type ServiceRequestState =
  | "new"
  | "under_review"
  | "quoted"
  | "awaiting_payment"
  | "in_progress"
  | "on_hold"
  | "in_review"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired";
export type ServiceRequest = {
  id: string;
  number: string;
  workspaceId: string;
  workspaceName: string;
  currency: string;
  title: string;
  brief: string;
  budget: string | number | null;
  deadline: string | null;
  state: ServiceRequestState;
  assignee: string | null;
  capabilities: {
    canEdit: boolean;
    canAssign: boolean;
    canDeliver: boolean;
    canStart: boolean;
  };
  crmLeadId?: string;
  crmProjectId?: string;
  prepaid: boolean;
  paidSource: {
    reference?: string;
    currency: string;
    decimals?: number;
    amountMinor?: number;
    amount?: number;
    paidAt: string;
    months?: number;
    invoiceId?: string;
  } | null;
  termMonths?: number;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  updatedAt?: string;
  quote: {
    currency: string;
    lines: { label: string; amount: number }[];
    total: number;
    validUntil: string;
  } | null;
  milestones: { title: string; state: string; due?: string }[];
  messages: { by: string; author: string; at: string; text: string }[];
  deliveries: {
    id: string;
    at: string;
    note: string;
    files: (string | ServiceFile)[];
    autoApproveAt?: string;
  }[];
};
export type ServiceFileReference = {
  workspaceId: string;
  fileId: string;
  versionId: string;
};
export type ServiceFile = ServiceFileReference & {
  name: string;
  mimetype: string;
  size: number;
  version: number;
  contentPath?: string;
};
export type ServiceFilesPage = {
  items: ServiceFile[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
export type ServiceRequestAction =
  | { action: "review" | "start" | "hold" | "resume" | "cancel" }
  | { action: "assign"; assignee: string }
  | { action: "message"; text: string }
  | { action: "deliver"; note: string; files?: ServiceFileReference[] }
  | {
      action: "quote";
      lines: { label: string; amount: number }[];
      validDays: number;
    }
  | { action: "milestone"; index: number; state: string };
export type ServiceOfferForm = {
  name: ServiceText;
  description: ServiceText;
  capabilities: ServiceText;
  department: "design" | "development" | "marketing" | "it-support";
  departmentName: ServiceText;
  icon: string;
  monthlyCHF: number;
  status: "active" | "archived";
};
export type ServiceBundleForm = {
  name: ServiceText;
  why: ServiceText;
  ids: string[];
  recommended: boolean;
};
export type ServiceActionForm = {
  text: string;
  amount: number;
  validDays: number;
  assignee: string;
};
export type ServiceStaff = { key: string; id: number; name: string };
export type ServicePriceForm = {
  regionalPrices: Record<string, number | null>;
  countryPrices: Record<string, number | null>;
};
export type ServiceDiscountPolicy = {
  durationSavings: Record<string, number>;
  countBands: { min: number; saving: number }[];
};
export type ServicePricePolicy = ServiceDiscountPolicy & {
  terms: number[];
  serviceDurationSavings?: Record<string, number>;
  serviceCountBands?: { min: number; saving: number }[];
  tieWinner: string;
  countScope: string;
  rounding: string;
  priceVersion: number;
};
export type ServicePublicationDrafts = {
  offers: { id: string; draft: ServiceOfferDraft }[];
  bundles: { id: string; draft: NonNullable<ServiceBundle["draft"]> }[];
  policy: ServiceDiscountPolicy | null;
};
export type ServicePublication = {
  drafts: ServicePublicationDrafts;
  policy: ServiceDiscountPolicy;
  history: {
    managedIn: "crm";
    changed: string[];
    priceVersion: number;
    at: string;
    by: string;
    drafts: ServicePublicationDrafts;
    applyMode: string;
  }[];
  scheduled: {
    id: string;
    state: "scheduled" | "cancelled" | "published";
    effectiveAt: string;
    by: string;
    createdAt: string;
  }[];
};
export type ServicePublishResult = {
  priceVersion: number;
  changed: string[];
  state?: "scheduled";
  id?: string;
  effectiveAt?: string;
};
export type ServicePublicPreview = {
  currency: string;
  decimals: number;
  region: { country: string };
  policy: ServicePricePolicy;
  items: {
    id: string;
    kind: "service" | "software";
    names: ServiceText;
    descriptions?: ServiceText;
    capabilities?: ServiceCapabilities;
    monthlyMinor: number;
    currency: string;
    decimals: number;
    prices: Record<
      string,
      Record<string, { total: number; saving: number; discount: number }>
    >;
  }[];
};
export type ServiceScheduleForm = { effectiveAt: string };
