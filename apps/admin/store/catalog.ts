"use client";
// Catalog (spec ADM-03…07, 29): tools and their release status, features and limits, plans, and
// the waitlist. Prices are not here: the plan editor links to the price grid (ADM-12).
import { api, qs, type ListArgs, type Localized, type Page } from "./api";

export type ToolStatus = "coming_soon" | "beta" | "live" | "retired";
export const TOOL_STATUSES: ToolStatus[] = ["coming_soon", "beta", "live", "retired"];

export type Tool = {
  key: string;
  order: number;
  status: ToolStatus;
  /** General: every workspace has it, so it can't be retired. */
  mandatory?: boolean;
  /** A tool that lives outside the suite (Hosting). */
  external?: string;
  icon: string;
  scope: string | null;
  name: Localized;
  short: Localized;
  /** The statuses the API allows from this one. */
  next: ToolStatus[];
};
export type ToolRow = Tool & { plans: number; workspaces: number; waitlist: number };
export type ToolDetail = Tool & { features: Feature[]; plans: Plan[] };
export type ToolInput = { key?: string; name: Partial<Localized>; short?: Partial<Localized>; icon?: string; order?: number };

export type FeatureKind = "flag" | "limit";
export type Feature = {
  /** "<tool>.<feature>" (G-20). */
  key: string;
  tool: string;
  kind: FeatureKind;
  unit: string | null;
  enforcement?: "hard" | "soft";
  /** How many plans set it (list only). */
  usedBy?: number;
};
export type FeatureInput = { key: string; tool: string; kind: FeatureKind; unit?: string | null; enforcement?: "hard" | "soft" };

export type PlanTier = "free" | "starter" | "pro" | "custom";
export const PLAN_TIERS: PlanTier[] = ["free", "starter", "pro", "custom"];
export type PlanVisibility = "public" | "private";
export type PlanStatus = "draft" | "active" | "archived";
export type Plan = {
  id: string;
  tool: string;
  tier: PlanTier;
  name: Localized;
  perUser: boolean;
  minSeats: number;
  guestLimit: number;
  trialDays: number;
  yearlyDiscountPct: number;
  visibility: PlanVisibility;
  status: PlanStatus;
  /** One value per limit feature; null is unlimited. */
  limits?: Record<string, number | null>;
  flags?: Record<string, boolean>;
  /** The Default zone's price (ALG-5): read here, edited in the price grid. */
  defaultUsd?: { monthly: number; yearly?: number };
  service?: boolean;
  subscribers?: number;
};
export type PlanInput = Partial<Omit<Plan, "subscribers" | "service" | "defaultUsd">>;

export type WaitlistEntry = { id: string; tool: string; email: string; name: string; country: string; createdAt: string; notified: boolean };

const catalogApi = api.injectEndpoints({
  endpoints: (b) => ({
    tools: b.query<ToolRow[], void>({ query: () => "/tools", providesTags: ["Tools"] }),
    tool: b.query<ToolDetail, string>({ query: (key) => `/tools/${encodeURIComponent(key)}`, providesTags: (_r, _e, key) => [{ type: "Tools", id: key }, "Features", "Plans"] }),
    createTool: b.mutation<Tool, ToolInput>({
      query: (body) => ({ url: "/tools", method: "POST", body }),
      invalidatesTags: ["Tools", "Overview"],
    }),
    updateTool: b.mutation<Tool, { key: string } & Partial<Omit<ToolInput, "key">> & { status?: ToolStatus }>({
      query: ({ key, ...body }) => ({ url: `/tools/${encodeURIComponent(key)}`, method: "PATCH", body }),
      // A status change to beta or live notifies the waitlist: its rows and the overview change too.
      invalidatesTags: (_r, _e, a) => ["Tools", ...(a.status ? (["Waitlist", "Overview"] as const) : [])],
    }),

    features: b.query<Feature[], { tool?: string } | void>({ query: (a) => `/features${qs({ tool: a?.tool })}`, providesTags: ["Features"] }),
    createFeature: b.mutation<Feature, FeatureInput>({
      query: (body) => ({ url: "/features", method: "POST", body }),
      invalidatesTags: ["Features"],
    }),
    deleteFeature: b.mutation<null, string>({
      query: (key) => ({ url: `/features/${encodeURIComponent(key)}`, method: "DELETE" }),
      invalidatesTags: ["Features"],
    }),

    plans: b.query<Plan[], { tool?: string } | void>({ query: (a) => `/plans${qs({ tool: a?.tool })}`, providesTags: ["Plans"] }),
    plan: b.query<Plan, string>({ query: (id) => `/plans/${encodeURIComponent(id)}`, providesTags: (_r, _e, id) => [{ type: "Plans", id }] }),
    createPlan: b.mutation<Plan, PlanInput>({
      query: (body) => ({ url: "/plans", method: "POST", body }),
      invalidatesTags: ["Plans", "Tools", "Features"],
    }),
    updatePlan: b.mutation<Plan, PlanInput & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/plans/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, a) => ["Plans", { type: "Plans", id: a.id }, "Features", "Grid"],
    }),

    waitlist: b.query<Page<WaitlistEntry>, ListArgs>({ query: (a) => `/waitlist${qs(a)}`, providesTags: ["Waitlist"] }),
  }),
});

export const {
  useToolsQuery,
  useToolQuery,
  useCreateToolMutation,
  useUpdateToolMutation,
  useFeaturesQuery,
  useCreateFeatureMutation,
  useDeleteFeatureMutation,
  usePlansQuery,
  usePlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useWaitlistQuery,
} = catalogApi;
