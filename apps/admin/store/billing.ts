"use client";
// Billing (ADM-23; spec 06 "Invoice", R4, G-14): invoices, payments, refunds and credit notes.
// Contract: orgtik-program/phase-e/platform-api.yaml.
import { api, qs, type ListArgs, type Page } from "./api";

export type InvoiceState = "draft" | "open" | "past_due" | "paid" | "partially_refunded" | "refunded" | "void";

export type Payment = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  gateway: string | null;
  at: string;
  status: "succeeded" | "failed" | string;
  reason?: string;
  usdRate?: number;
  usdAmount?: number;
  by?: string;
  reference?: string | null;
};
export type CreditNote = { id: string; number: string; amount: number; reason: string; at: string; by: string };
export type InvoiceLine = { label: string; amount: number; lineId?: string };

export type Invoice = {
  id: string;
  number: string;
  workspaceId: string;
  workspace?: string;
  kind: "subscription" | "manual" | string;
  state: InvoiceState;
  currency: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt?: string | null;
  voidedAt?: string | null;
  voidReason?: string;
  lines: InvoiceLine[];
  subtotal: number;
  taxLabel: string | null;
  tax: number;
  total: number;
  totalUsd?: number;
  payments: Payment[];
  creditNotes: CreditNote[];
  refunded: number;
  /** Detail only: what can still be refunded, in the invoice's currency. */
  refundable?: number;
};

export type InvoiceAction =
  | { action: "issue" | "retry" }
  | { action: "void"; reason: string }
  | { action: "mark-paid"; method: string; reference?: string }
  | { action: "refund"; amount: number; reason: string };

const billingApi = api.injectEndpoints({
  endpoints: (b) => ({
    invoices: b.query<Page<Invoice>, ListArgs>({
      query: (args) => `/invoices${qs(args)}`,
      providesTags: ["Invoices"],
    }),
    invoice: b.query<Invoice, string>({
      query: (id) => `/invoices/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: "Invoices", id }],
    }),
    invoiceAction: b.mutation<Invoice, { id: string } & InvoiceAction>({
      query: ({ id, action, ...body }) => ({ url: `/invoices/${encodeURIComponent(id)}/${action}`, method: "POST", body }),
      // Paying an invoice brings its lines back, so the workspace changes too.
      invalidatesTags: (_r, e) => (e ? [] : ["Invoices", "Workspaces", "Overview", "Audit", "Reports"]),
    }),
    createInvoice: b.mutation<Invoice, { workspaceId: string; lines: InvoiceLine[] }>({
      query: (body) => ({ url: "/invoices", method: "POST", body }),
      invalidatesTags: (_r, e) => (e ? [] : ["Invoices", "Workspaces", "Overview"]),
    }),
  }),
});

export const { useInvoicesQuery, useInvoiceQuery, useInvoiceActionMutation, useCreateInvoiceMutation } = billingApi;
