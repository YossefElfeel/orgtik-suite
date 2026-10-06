"use client";
// OrgTik's services for the workspace (USR-16..20, spec 05 USR-16..19): the catalogue with package
// prices in the workspace currency, requests, quotes, milestones, deliveries and messages.
// /v1/app/services and /v1/app/service-requests.
import { platformApi, type Localized, type Page } from "./platformApi";

export type Service = {
  id: string;
  family: string;
  /** package: a public price; quote: priced per request. */
  kind: "package" | "quote";
  billing: "once" | "monthly";
  name: Localized;
  deliveryDays: number;
  price: { amount: number; currency: string } | null;
  /** The discount this workspace gets on quotes as a subscriber; 0 when it isn't one. */
  subscriberDiscountPct: number;
};

export type ServiceRequestState = "new" | "under_review" | "quoted" | "awaiting_payment" | "in_progress" | "in_review" | "on_hold" | "completed" | "rejected" | "expired" | "cancelled";
export type Quote = { currency: string; lines: { label: string; amount: number }[]; total: number; validUntil: string; sentAt?: string };
export type Milestone = { title: string; state: "open" | "done" | "delivered"; due?: string };
export type Delivery = { id: string; at: string; note: string; files: string[]; autoApproveAt?: string };
export type RequestMessage = { by: "customer" | "staff"; author: string; at: string; text: string };
export type ServiceRequest = {
  id: string;
  number: string;
  serviceId: string;
  service?: Localized;
  title: string;
  brief: string;
  budget: number | string | null;
  deadline: string | null;
  state: ServiceRequestState;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  autoApproved?: boolean;
  declineReason?: string | null;
  invoiceId?: string;
  quote: Quote | null;
  milestones: Milestone[];
  deliveries: Delivery[];
  messages: RequestMessage[];
};
export type NewServiceRequest = { serviceId: string; title: string; brief: string; budget?: number | null; deadline?: string | null };
export type RequestAction =
  | { action: "accept" | "pay" | "approve" | "cancel" }
  | { action: "decline"; reason?: string }
  | { action: "revise" | "message"; text: string };

export const servicesApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    getServices: b.query<Service[], void>({ query: () => "/services", providesTags: ["Services"] }),
    getServiceRequests: b.query<Page<ServiceRequest>, { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 25 }) => ({ url: "/service-requests", params: { page, pageSize } }),
      providesTags: ["ServiceRequests"],
    }),
    getServiceRequest: b.query<ServiceRequest, string>({
      query: (id) => `/service-requests/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: "ServiceRequests", id }],
    }),
    createServiceRequest: b.mutation<ServiceRequest, NewServiceRequest>({
      query: (body) => ({ url: "/service-requests", method: "POST", body }),
      invalidatesTags: ["ServiceRequests"],
    }),
    serviceRequestAction: b.mutation<ServiceRequest, { id: string } & RequestAction>({
      query: ({ id, ...body }) => ({ url: `/service-requests/${encodeURIComponent(id)}/actions`, method: "POST", body }),
      // Paying makes an invoice; the list, the request and billing all move.
      invalidatesTags: (_r, _e, { id, action }) => [{ type: "ServiceRequests", id }, "ServiceRequests", ...(action === "pay" ? (["Invoices", "Me"] as const) : [])],
    }),
  }),
});

export const { useGetServicesQuery, useGetServiceRequestsQuery, useGetServiceRequestQuery, useCreateServiceRequestMutation, useServiceRequestActionMutation } = servicesApi;
