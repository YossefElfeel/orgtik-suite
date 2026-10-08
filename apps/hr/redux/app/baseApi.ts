import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";
import { RootState } from "./store";
import { deleteCookie } from "cookies-next";
import {
  API_URL,
  TOKEN_COOKIE,
  USER_COOKIE,
  SOS_API_URL,
} from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { suiteSignIn } from "@/lib/suite-return";
import { errorMessage, successMessage } from "@/lib/api-feedback";
import { readClientSession, clearClientSession, refreshClientSession, SessionRequestError } from "@orgtik/ui/auth";
import { timeOffContextSignature } from '@/lib/time-off-attempt';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const handleUserLogout = (api: any) => {
  clearClientSession();
  api.dispatch(logoutUser());
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
  // Back through SOS, and back to this page afterwards (FS-HR-2, HR-024).
  const path = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") + window.location.search;
  window.location.href = suiteSignIn(path);
};

// Define a custom fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const session = readClientSession();
    const token = session?.tokens.accessToken || (getState() as RootState).auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (!headers.has("x-workspace") && session?.workspaceContext?.workspace.id) headers.set("x-workspace", session.workspaceContext.workspace.id);
    return headers;
  },
});

// Enhanced base query with refresh token logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const signature = timeOffContextSignature();
  const changedContext = (): FetchBaseQueryError | null => signature !== timeOffContextSignature()
    ? { status: 'CUSTOM_ERROR', error: 'The current HR context changed.', data: { code: 'context_changed' } } : null;
  let result = await baseQuery(args, api, extraOptions);
  let stale = changedContext(); if (stale) return { error: stale };

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    if (readClientSession()?.tokens.refreshToken) {
      try {
        stale = changedContext(); if (stale) return { error: stale };
        await refreshClientSession(SOS_API_URL);
        stale = changedContext(); if (stale) return { error: stale };
        result = await baseQuery(args, api, extraOptions);
        stale = changedContext(); if (stale) return { error: stale };
      } catch (error) {
        stale = changedContext(); if (stale) return { error: stale };
        if (error instanceof SessionRequestError && [401, 403].includes(error.status)) handleUserLogout(api);
        else return { error: { status: 503, data: { code: "session_unavailable" } } };
      }
    } else { stale = changedContext(); if (stale) return { error: stale }; handleUserLogout(api); }
  }

  // What a change says, in the reader's language (FS-HR-3, lib/api-feedback): one message, once,
  // never the API's English. Reads never toast; a 401 has already been handled above.
  const method = typeof args === "object" ? args?.method : undefined;
  const isChange = Boolean(method && method !== "GET");
  if (isChange && result.data) {
    const message = successMessage({ endpoint: api.endpoint, args: args?.body, data: result.data });
    if (message) toast.success(message);
  }
  if (isChange && result.error && result.error.status !== 401) {
    const code = (result.error.data as { code?: string } | undefined)?.code;
    const message = errorMessage({ endpoint: api.endpoint, args: args?.body, status: result.error.status, code });
    if (message) toast.error(message);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Department",
    "Employee",
    "EmployeeNotes",
    "Attendance",
    "TimeOff",
    "Ticket",
    "TicketMessage",
    "Job",
    "Project",
    "Settings",
    "Payroll",
    "Notification",
    "Loans",
  ],
  endpoints: () => ({}),
});
