"use client";
// The customer dashboard's API (Phase E, USR): /v1/app on the platform, contract
// orgtik-program/phase-e/platform-api.yaml. Its own RTK Query slice, apart from SOS's baseApi:
// envelope { data, meta } / { error: { code, message, fieldErrors?, required? } }, the person's SOS
// token, and the workspace they're working in (X-Workspace, from the verified tab context). No
// toast here: a screen says what failed where it failed. Each area adds its endpoints in its own
// file (redux/features/platform/<area>.ts, platformApi.injectEndpoints).
import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_URL, PLATFORM_URL } from "@/constants/env";
import type { RootState } from "@/redux/app/store";
import type { IUser } from "@/types/user";
import { readClientSession, refreshClientSession, SessionRequestError, setClientSession } from "@orgtik/ui/auth";
import type { WorkspaceContext } from "@orgtik/ui/auth";
import { logoutUser, setUser } from "../auth/authSlice";
import { baseApi } from "@/redux/app/baseApi";

export const WORKSPACE_COOKIE = "ot-workspace";

export type PlatformError = {
  status: number | "offline";
  code: string;
  message: string;
  required?: string;
  fieldErrors?: Record<string, string>;
  /** Extra fields some errors carry (an invoice id on a failed payment, a refund's `max`). */
  extra?: Record<string, unknown>;
};

const raw = fetchBaseQuery({
  baseUrl: PLATFORM_URL,
  prepareHeaders: (headers, { getState }) => {
    const auth = (getState() as RootState).auth;
    if (!readClientSession() && auth.user && auth.tokens) setClientSession({ user: auth.user, tokens: auth.tokens, scopes: auth.scopes || [], workspaceContext: auth.workspaceContext, staffAccess: auth.staffAccess });
    const session = readClientSession();
    const token = session?.tokens.accessToken ?? auth.tokens?.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    const ws = session?.workspaceContext?.workspace.id ?? auth.workspaceContext?.workspace.id;
    if (ws) headers.set("x-workspace", ws);
    return headers;
  },
});

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, PlatformError> = async (args, api, extra) => {
  let result = await raw(args, api, extra);
  if (result.error?.status === 401) {
    try {
      const fresh = await refreshClientSession<IUser>(API_URL);
      api.dispatch(setUser({ ...fresh, scopes: fresh.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
      result = await raw(args, api, extra);
    } catch (error) {
      if (error instanceof SessionRequestError && [401, 403].includes(error.status)) {
        api.dispatch(logoutUser());
        api.dispatch(baseApi.util.resetApiState());
        api.dispatch(platformApi.util.resetApiState());
      } else return { error: { status: 503, code: "session_unavailable", message: "" } };
    }
  }
  if (result.error) {
    const e = result.error as FetchBaseQueryError;
    if (typeof e.status !== "number") return { error: { status: "offline", code: "offline", message: "" } };
    const errorBody = e.data as { error?: Record<string, unknown> } | undefined;
    const { code, message, required, fieldErrors, requestId: _r, ...rest } = (errorBody?.error ?? errorBody ?? {}) as Record<string, unknown>;
    return { error: { status: e.status, code: (code as string) ?? "error", message: (message as string) ?? "", required: required as string | undefined, fieldErrors: fieldErrors as Record<string, string> | undefined, extra: rest } };
  }
  const body = result.data as { data: unknown; meta?: Record<string, unknown> } | null;
  // A list answer carries paging in meta; the screen gets it next to the rows.
  if (body?.meta && typeof body.meta.total === "number") {
    const { page, pageSize, total, ...rest } = body.meta as { page?: number; pageSize?: number; total: number };
    return { data: { items: body.data, page: page ?? 1, pageSize: pageSize ?? 10, total, meta: rest }, meta: result.meta };
  }
  // Other answers with meta: an object gets it as `meta`; an array becomes { items, meta }.
  if (body?.meta && Object.keys(body.meta).length && body.data && typeof body.data === "object") {
    return { data: Array.isArray(body.data) ? { items: body.data, meta: body.meta } : { ...(body.data as object), meta: body.meta }, meta: result.meta };
  }
  return { data: body?.data ?? null, meta: result.meta };
};

export type Locale = "en" | "ar" | "de" | "fr" | "it";
export type Localized = Partial<Record<Locale, string>> & { en: string };
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; meta?: Record<string, unknown> };
export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export type ToolState = "active" | "trial" | "beta" | "read_only" | "not_subscribed" | "no_access" | "coming_soon";
export type BannerKind = "suspended" | "read_only" | "payment_failed" | "trial_ending" | "beta_billing" | "price_change" | "downgrade_scheduled";

export type AppBanner = { kind: BannerKind; tone: string; audience: string; action: string | null; tool?: string; endsAt?: string; graceEndsAt?: string; effectiveAt?: string; reason?: string | null; coupon?: string };
export type AppTool = {
  key: string;
  name: Localized;
  short: Localized;
  icon: string;
  status: "coming_soon" | "beta" | "live" | "retired";
  mandatory: boolean;
  state: ToolState;
  /** The suite app that opens this tool (an SOS scope), when it has one. */
  scope: string | null;
  line: { id: string; planId: string; state: string; trialEndsAt: string | null } | null;
};
export type AppMe = {
  user: { key: string; id: number; firstName: string; lastName: string; email: string };
  workspaceContext: WorkspaceContext | null;
  workspace: { id: string; name: string; slug: string; country: string; currency: string; state: "active" | "past_due" | "suspended" | "cancelled" | "deleted"; role: WorkspaceRole };
  workspaces: { id: string; name: string; role: WorkspaceRole; state: string }[];
  tools: AppTool[];
  banner: AppBanner | null;
  banners: AppBanner[];
  unread: number;
  can: { billing: boolean; team: boolean; buy: boolean };
};

export const platformApi = createApi({
  reducerPath: "platform",
  baseQuery,
  tagTypes: ["Me", "Tools", "Subscriptions", "Invoices", "PaymentMethods", "Billing", "Team", "Services", "ServiceRequests", "Tickets", "Notifications", "CustomPlans"],
  endpoints: (b) => ({
    appMe: b.query<AppMe, void>({ query: () => "/me", providesTags: ["Me"] }),
  }),
});

export const { useAppMeQuery } = platformApi;

export const statusOf = (e: unknown): PlatformError["status"] | undefined => (e && typeof e === "object" && "status" in e ? (e as PlatformError).status : undefined);
