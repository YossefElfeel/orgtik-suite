"use client";
// ADM-24 the service catalogue and ADM-25 service requests (permission services:*; the Service
// Team's services:edit:assigned acts only on requests assigned to them, the API checks it).
import { api, qs, type ListArgs, type Localized, type Page } from "./api";

export type ServiceStatus = "draft" | "active" | "archived";
export type Service = {
  id: string;
  family: string;
  kind: "package" | "quote";
  billing: "once" | "monthly";
  name: Localized;
  status: ServiceStatus | string;
  subscriberDiscountPct: number;
  deliveryDays: number;
  milestones: string[];
  /** Package prices per zone id (null where the zone has none); quote-only services have none. */
  prices: Record<string, number | null> | null;
  requests: number;
};
export type ServicePatch = { id: string } & Partial<Pick<Service, "name" | "status" | "deliveryDays" | "subscriberDiscountPct">>;

export type SrState = "new" | "under_review" | "quoted" | "awaiting_payment" | "in_progress" | "in_review" | "on_hold" | "completed" | "rejected" | "expired" | "cancelled";
export type QuoteLine = { label: string; amount: number };
export type Quote = { currency: string; lines: QuoteLine[]; total: number; validUntil: string; sentAt: string };
export type Milestone = { title: string; state: string; due?: string };
export type Delivery = { id: string; at: string; note: string; files: string[]; autoApproveAt: string };
export type SrMessage = { by: "staff" | "customer"; author: string; at: string; text: string };
export type ServiceRequest = {
  id: string;
  number: string;
  workspaceId: string;
  workspace?: string;
  serviceId: string;
  service?: Localized;
  title: string;
  brief: string;
  state: SrState;
  createdAt: string;
  assignee: string | null;
  assigneeName: string | null;
  quote: Quote | null;
  milestones: Milestone[];
  deliveries: Delivery[];
  messages: SrMessage[];
  budget: string | null;
  deadline: string | null;
};
export type SrAction =
  | { action: "assign"; assignee: string }
  | { action: "review" | "start" | "hold" }
  | { action: "cancel"; reason?: string }
  | { action: "quote"; lines: QuoteLine[]; validDays: number }
  | { action: "deliver"; note: string; files: string[] }
  | { action: "milestone"; index: number; state: string }
  | { action: "message"; text: string };

export type Zone = { id: string; name: string; currency: string };
export type WorkspaceBrief = { id: string; name: string; currency: string; country: string };

const list = <T,>(r: unknown): T[] => (Array.isArray(r) ? (r as T[]) : ((r as { items?: T[] } | null)?.items ?? []));

const servicesApi = api.injectEndpoints({
  endpoints: (b) => ({
    services: b.query<Service[], void>({ query: () => "/services", transformResponse: list<Service>, providesTags: ["Services"] }),
    updateService: b.mutation<Service, ServicePatch>({ query: ({ id, ...body }) => ({ url: `/services/${id}`, method: "PATCH", body }), invalidatesTags: ["Services"] }),
    serviceRequests: b.query<Page<ServiceRequest>, ListArgs>({ query: (args) => `/service-requests${qs(args)}`, providesTags: ["ServiceRequests"] }),
    serviceRequest: b.query<ServiceRequest, string>({ query: (id) => `/service-requests/${id}`, providesTags: (_r, _e, id) => [{ type: "ServiceRequests", id }] }),
    serviceRequestAction: b.mutation<ServiceRequest, { id: string; body: SrAction }>({
      query: ({ id, body }) => ({ url: `/service-requests/${id}/actions`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => ["ServiceRequests", { type: "ServiceRequests", id }, "Overview"],
    }),
    // Zone names and currencies for package prices (pricing:view), and the workspace's currency for
    // a quote (workspaces:view); both are optional extras the screens do without.
    serviceZones: b.query<Zone[], void>({ query: () => "/zones", transformResponse: list<Zone>, providesTags: ["Pricing"] }),
    requestWorkspace: b.query<WorkspaceBrief, string>({ query: (id) => `/workspaces/${id}`, providesTags: ["Workspaces"] }),
  }),
});

export const {
  useServicesQuery,
  useUpdateServiceMutation,
  useServiceRequestsQuery,
  useServiceRequestQuery,
  useServiceRequestActionMutation,
  useServiceZonesQuery,
  useRequestWorkspaceQuery,
} = servicesApi;
