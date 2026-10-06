"use client";
// Customers (ADM-20, 21, 22; R03-C4 migrations): workspaces, their actions, migrations and
// custom plan requests. Contract: orgtik-program/phase-e/platform-api.yaml.
import { api, qs, type ListArgs, type Localized, type Page } from "./api";

export type WorkspaceState = "active" | "past_due" | "suspended" | "cancelled" | "deleted";
export type LineState = "trialing" | "active" | "past_due" | "read_only" | "cancelling" | "free" | "ended" | "deleted";

export type WorkspaceSummary = {
  id: string;
  name: string;
  country: string;
  currency: string;
  state: WorkspaceState;
  owner: { key: string | null; name: string; email: string } | null;
  seats: number;
  tools: { tool: string; state: LineState }[];
  mrr: number;
  mrrUsd: number;
  createdAt: string;
};

export type Line = {
  id: string;
  tool: string;
  planId: string;
  cycle: "monthly" | "yearly" | string;
  state: LineState;
  snapshot: { amount: number; unit: number; quantity: number; currency: string; source: string; priceVersion: number };
  startedAt: string;
  periodEnd?: string | null;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  readOnlySince?: string | null;
  cancelAt?: string | null;
  endedAt?: string | null;
  lastFailure?: { at: string; reason: string } | null;
  scheduled?: { kind: string; effectiveAt: string; note?: string; from?: unknown } | null;
  toolName?: Localized;
  planName?: Localized;
};

export type Member = { userKey: string | null; name: string; email: string; role: "owner" | "admin" | "member" | "guest" | string; status: "active" | "invited" | string; tools: string[] | null; joinedAt: string | null };
export type PaymentMethod = { id: string; kind: string; brand?: string; last4?: string; expires?: string; isDefault: boolean; expired: boolean };
export type AuditEntry = { at: string; by: string; byName?: string; action: string; target: string; reason?: string; line?: string; days?: number; invoice?: string };

export type Migration = {
  id: string;
  workspaceId: string;
  workspace?: string;
  from: { country: string; currency: string };
  to: { country: string; currency: string };
  requestedAt: string;
  effectiveAt?: string;
  state: "queued" | "scheduled" | "rejected" | string;
  requestedBy: string;
  reason?: string;
  decidedBy?: string;
  decidedAt?: string;
};

export type WorkspaceDetail = WorkspaceSummary & {
  zone: string | null;
  currencyLocked: boolean;
  flags: { suspendedReason?: string } & Record<string, unknown>;
  billing: { legalName: string; email: string; address: string; taxId: string; country: string } | null;
  notes: { at: string; by: string; text: string }[];
  paymentMethods: PaymentMethod[];
  members: Member[];
  lines: Line[];
  invoices: { id: string; number: string; state: string; total: number; currency: string; issuedAt: string | null }[];
  tickets: { id: string; number: string; subject: string; state: string }[];
  serviceRequests: { id: string; number: string; title: string; state: string }[];
  migration: Migration | null;
  audit: AuditEntry[];
};

export type WorkspaceAction =
  | { action: "suspend" | "reactivate" | "cancel" | "view_as"; reason: string }
  | { action: "extend_trial"; reason: string; lineId: string; days: number }
  | { action: "note"; text: string };

export type ViewAsResult = { readOnly: true; workspaceId: string; as: string | null; url: string | null; note: string | null };

export type CustomPlanRequest = {
  id: string;
  workspaceId: string;
  workspace?: string;
  tools: string[];
  seats: number;
  cycle: string;
  notes: string;
  state: "new" | "quoted" | string;
  createdAt: string;
  quote?: { amount: number; currency: string; validUntil: string };
};

const customersApi = api.injectEndpoints({
  endpoints: (b) => ({
    workspaces: b.query<Page<WorkspaceSummary>, ListArgs>({
      query: (args) => `/workspaces${qs(args)}`,
      providesTags: ["Workspaces"],
    }),
    workspace: b.query<WorkspaceDetail, string>({
      query: (id) => `/workspaces/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: "Workspaces", id }],
    }),
    workspaceAction: b.mutation<{ state: WorkspaceState; line: Line | null } | ViewAsResult, { id: string } & WorkspaceAction>({
      query: ({ id, ...body }) => ({ url: `/workspaces/${encodeURIComponent(id)}/actions`, method: "POST", body }),
      invalidatesTags: (_r, e) => (e ? [] : ["Workspaces", "Overview", "Audit"]),
    }),
    migrations: b.query<Migration[], void>({
      query: () => "/migrations",
      providesTags: ["Migrations"],
    }),
    decideMigration: b.mutation<Migration, { id: string; decision: "approve" | "reject"; reason?: string }>({
      query: ({ id, decision, reason }) => ({ url: `/migrations/${encodeURIComponent(id)}/${decision}`, method: "POST", body: { reason } }),
      invalidatesTags: (_r, e) => (e ? [] : ["Migrations", "Workspaces", "Overview", "Audit"]),
    }),
    customPlans: b.query<CustomPlanRequest[], void>({
      query: () => "/custom-plans",
      providesTags: ["CustomPlans"],
    }),
    quoteCustomPlan: b.mutation<CustomPlanRequest, { id: string; amount: number; validDays: number }>({
      query: ({ id, ...body }) => ({ url: `/custom-plans/${encodeURIComponent(id)}/quote`, method: "POST", body }),
      invalidatesTags: (_r, e) => (e ? [] : ["CustomPlans", "Overview"]),
    }),
  }),
});

export const {
  useWorkspacesQuery,
  useWorkspaceQuery,
  useWorkspaceActionMutation,
  useMigrationsQuery,
  useDecideMigrationMutation,
  useCustomPlansQuery,
  useQuoteCustomPlanMutation,
} = customersApi;
