"use client";
// The platform API (/v1/admin, contract: orgtik-program/phase-e/platform-api.yaml). This file has
// the base query, the shared types and "me"; each area adds its endpoints in its own file
// (store/<area>.ts, api.injectEndpoints), so areas grow without editing one shared file.
import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { ADMIN_API } from "@/lib/env";
import { clearToken, getToken } from "@/lib/session";
import { refreshClientSession, SessionRequestError } from "@orgtik/ui/auth";
import { SOS_API } from "@/lib/env";

/** Every failure the UI handles, from the envelope: { error: { code, message, required?, fieldErrors? } }. */
export type ApiError = {
  status: number | "offline";
  code: string;
  message: string;
  required?: string;
  fieldErrors?: Record<string, string>;
  /** Extra fields some errors carry (a refund's `max`, a 409's `plans`). */
  extra?: Record<string, unknown>;
};

const raw = fetchBaseQuery({
  baseUrl: ADMIN_API,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

// Unwraps { data } and turns every error into an ApiError, so screens branch on `status`/`code`
// and never parse bodies themselves. No toast here: a screen says what failed where it failed.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extra) => {
  const originalToken = getToken();
  let result = await raw(args, api, extra);
  if (getToken() !== originalToken) return { error: { status: 503, code: "session_changed", message: "" } };
  if (result.error?.status === 401 && originalToken) {
    try {
      await refreshClientSession(SOS_API);
      const retryToken = getToken();
      if (!retryToken) return { error: { status: 403, code: "staff_access_required", message: "" } };
      result = await raw(args, api, extra);
      if (getToken() !== retryToken) return { error: { status: 503, code: "session_changed", message: "" } };
    } catch (reason) {
      if (reason instanceof SessionRequestError && [401, 403].includes(reason.status)) {
        if (getToken() === originalToken) clearToken();
        return { error: { status: reason.status, code: reason.code, message: "" } };
      }
      return { error: { status: 503, code: "session_unavailable", message: "" } };
    }
  }
  if (result.error) {
    const e = result.error as FetchBaseQueryError;
    if (typeof e.status !== "number") return { error: { status: "offline", code: "offline", message: "" } };
    const { code, message, required, fieldErrors, requestId: _r, ...rest } = ((e.data as { error?: Record<string, unknown> } | undefined)?.error ?? {}) as Record<string, unknown>;
    return { error: { status: e.status, code: (code as string) ?? "error", message: (message as string) ?? "", required: required as string | undefined, fieldErrors: fieldErrors as Record<string, string> | undefined, extra: rest } };
  }
  const body = result.data as { data: unknown; meta?: Record<string, unknown> } | null;
  // A list answer carries paging in meta; the screen gets it next to the rows.
  if (body?.meta && typeof body.meta.total === "number") {
    const { page, pageSize, total, ...rest } = body.meta as { page?: number; pageSize?: number; total: number };
    return { data: { items: body.data, page: page ?? 1, pageSize: pageSize ?? 25, total, meta: rest }, meta: result.meta };
  }
  // Other answers with meta (the staff matrix, the tax decision, a report's currency): an object
  // gets it as `meta`; an array becomes { items, meta }.
  if (body?.meta && Object.keys(body.meta).length && body.data && typeof body.data === "object") {
    return { data: Array.isArray(body.data) ? { items: body.data, meta: body.meta } : { ...(body.data as object), meta: body.meta }, meta: result.meta };
  }
  // A 204 (a delete) has no body: RTK Query needs data to be something, so it's null.
  return { data: body?.data ?? null, meta: result.meta };
};

export type Locale = "en" | "ar" | "de" | "fr" | "it";
export type Localized = Partial<Record<Locale, string>> & { en: string };
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; meta?: Record<string, unknown> };
export type ListArgs = { page?: number; pageSize?: number } & Record<string, string | number | boolean | undefined>;

export type RoleKey = "super_admin" | "finance" | "sales" | "support" | "service_mgr" | "service_team" | "content" | "product_mgr";
export type Me = {
  user: { key: string; id: number; firstName: string; lastName: string; email: string };
  roles: { key: RoleKey; label: string }[];
  permissions: string[];
  links: { content: string; suggestions: string };
  twoFactor: { required: boolean; verified: boolean };
};

/** Query-string from list args, without empty values. */
export const qs = (args: ListArgs = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) if (v !== undefined && v !== "" && v !== false) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = createApi({
  reducerPath: "adm",
  baseQuery,
  tagTypes: ["Me", "Overview", "Tools", "Features", "Plans", "Pricing", "Grid", "PricingLog", "Bundles", "Coupons", "Tax", "Gateways", "Workspaces", "Migrations", "CustomPlans", "Invoices", "Services", "ServiceRequests", "Tickets", "Waitlist", "Staff", "Templates", "Reports", "Settings", "Audit"],
  endpoints: (b) => ({
    me: b.query<Me, void>({ query: () => "/me", providesTags: ["Me"] }),
  }),
});

export const { useMeQuery } = api;

export const statusOf = (e: unknown): ApiError["status"] | undefined => (e && typeof e === "object" && "status" in e ? (e as ApiError).status : undefined);
