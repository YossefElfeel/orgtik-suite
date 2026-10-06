import type { IPagination, PaginationOptions } from "@/types";
import type { ZoneMoneyGroup } from "@/types/money";

export const invoicePaymentMethods = [
  "bank_transfer",
  "credit_card",
  "cash",
  "other",
] as const;

export type InvoicePaymentMethod = (typeof invoicePaymentMethods)[number];

export type InvoiceStatus = "paid" | "partial" | "pending" | "overdue" | "void";

export type InvoiceType = "subscription" | "salesman";

export type AdminInvoiceTab = InvoiceType | "custom";

export type CustomInvoiceStatus = "pending" | "paid" | "overdue";

export type InvoiceStats = {
  totalInvoices: number;
  paidSubscriptions: number;
  pendingSubscriptions: number;
  overdueSubscriptions: number;
  voidSubscriptions: number;
  totalRevenue: ZoneMoneyGroup[];
  totalCommissions: ZoneMoneyGroup[];
};

export type CustomerInvoiceStats = {
  totalInvoices: number;
  totalAmount: number;
  paid: number;
  installmentPlans: number;
};

export type InvoicePlanTag = "installment" | "cash_only";

export type InvoicePaymentType = "subscription" | "custom";

export type InvoiceBillTo = {
  name: string;
  email: string;
  address: string;
};

export type InvoiceLineItem = {
  id?: string;
  description: string;
  quantity: number;
  amount: number;
};

export type InvoiceListItemBase = {
  invoiceId: string;
  type: InvoiceType;
  totalPrice: string;
  status: InvoiceStatus;
  projectName: string;
  dueDate: string;
  createdAt: string;
  /** Invoice denomination — any ISO currency code. */
  currencyCode?: string;
  /** @deprecated Prefer `currencyCode`. Limited to a fixed enum of codes. Older payloads only. */
  currency?: string;
  /**
   * Settlement currency recorded after payment (response-only).
   * Do not send on checkout/bulk-pay — always settle in the invoice's `currencyCode`.
   */
  paymentCurrency?: string;
};

export type SubscriptionInvoice = InvoiceListItemBase & {
  type: "subscription";
  plan: string;
  planTag?: InvoicePlanTag;
  paymentType?: InvoicePaymentType;
};

export type SalesInvoice = InvoiceListItemBase & {
  type: "salesman";
  salesmanName: string;
  salesmanAvatarUrl?: string;
};

export type Invoice = SubscriptionInvoice | SalesInvoice;

export type InvoicePaymentInfo = {
  paidAt: string;
  method: string;
  reference?: string;
};

export type InvoiceDetail = {
  invoiceId: string;
  type: InvoiceType;
  status: InvoiceStatus;
  projectName: string;
  plan?: string;
  salesmanName?: string;
  totalPrice: string;
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  issuedAt?: string;
  paidAt?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  voidReason?: string;
  voidAt?: string;
  /** Invoice denomination — any ISO currency code. */
  currencyCode?: string;
  /** @deprecated Prefer `currencyCode`. Older payloads only. */
  currency?: string;
  /**
   * Settlement currency recorded after payment (response-only).
   * Do not send on checkout/bulk-pay — always settle in the invoice's `currencyCode`.
   */
  paymentCurrency?: string;
  billTo?: InvoiceBillTo;
  customer?: Partial<InvoiceBillTo>;
  lineItems: InvoiceLineItem[];
  subtotalAmount: number;
  taxRate: number;
  taxAmount: number;
  method?: string;
  details?: string;
  payment?: InvoicePaymentInfo;
};

export type InvoicesListMeta = IPagination & {
  subscriptionTotal: number;
  salesmanTotal: number;
};

export type InvoicesPaginated = {
  items: Invoice[];
  meta: InvoicesListMeta;
};

export type InvoicesQueryParams = PaginationOptions & {
  type: InvoiceType;
  q?: string;
  subscriptionId?: string;
};

export type MarkInvoicePaidDTO = {
  paymentMethod: InvoicePaymentMethod;
  transferReference?: string;
  paidAt?: string;
};

export type VoidInvoiceDTO = {
  reason: string;
};

export type GenerateInvoicePdfDTO = {
  invoiceIds?: string[];
  subscriptionId?: string;
  disposition?: "inline" | "attachment";
};

export type CustomInvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number | string;
  amount?: number | string;
};

export type CustomInvoiceMetadata = {
  projectReference?: string;
  notes?: string;
  [key: string]: unknown;
};

export type CustomInvoiceListItem = {
  invoiceId: string;
  invoiceNumber?: string;
  invoiceType?: string;
  type?: string;
  paymentType?: string;
  status: CustomInvoiceStatus;
  customerId?: string;
  clientName?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  billingName?: string;
  billingContactPerson?: string;
  billingAddress?: string;
  billingEmail?: string;
  billingPhone?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Invoice denomination — any ISO currency code. */
  currencyCode?: string;
  /** @deprecated Prefer `currencyCode`. Older payloads only. */
  currency?: string;
  /**
   * Settlement currency recorded after payment (response-only).
   * Do not send on checkout/bulk-pay — always settle in the invoice's `currencyCode`.
   */
  paymentCurrency?: string;
  amount?: string;
  totalAmount?: number | string;
  totalPrice?: number | string;
  subtotalAmount?: number | string;
  taxRate?: number | string;
  taxAmount?: number | string;
  description?: string;
  closingText?: string;
  lineItems?: CustomInvoiceLineItem[];
  dueDate?: string;
  issuedAt?: string;
  createdAt: string;
  updatedAt?: string;
  canMarkPaidManually?: boolean;
  isCouponApplicable?: boolean;
  invoicePdfUrl?: string;
  metadata?: CustomInvoiceMetadata;
};

export type CustomInvoicesPaginated = {
  items: CustomInvoiceListItem[];
  meta: IPagination;
};

export type CustomInvoicesQueryParams = PaginationOptions & {
  search?: string;
};

export type InvoiceTableCounts = {
  subscriptions: number;
  salesMan: number;
  customInvoices: number;
};

export type ICreateCustomInvoiceDTO = {
  customerId?: string;
  invoiceNumber?: string;
  billingName?: string;
  billingContactPerson?: string;
  billingAddress?: string;
  billingEmail?: string;
  billingPhone?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  closingText?: string;
  description?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  taxRate?: number;
  currency?: string;
  dueDate?: string;
  metadata?: CustomInvoiceMetadata;
};

export type ICustomInvoiceResponse = CustomInvoiceListItem;

export type MarkCustomInvoicePaidDTO = {
  paidAt?: string;
  paymentReference?: string;
  notes?: string;
  paymentProof?: File;
};

export type SendCustomInvoiceDTO = {
  emails: string[];
};
