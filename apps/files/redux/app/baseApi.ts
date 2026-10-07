import { API_URL } from "@/constants/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import { RootState } from "./store";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { SOS_URL } from "@somion/sos-bar";
import { readClientSession, refreshClientSession, clearClientSession, SessionRequestError } from '@orgtik/ui/auth';
import { SOS_API_URL } from '@/constants/env';

const handleUserLogout = (api: any) => {
  clearClientSession(); api.dispatch(baseApi.util.resetApiState());
  api.dispatch(logoutUser());
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
  // const currentPath = window.location.pathname + window.location.search;
  // const isAuthRoute = currentPath.split("?")[0].split("/")[2] === "auth";
  // if (isAuthRoute) return;
  // window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
  window.location.href = SOS_URL;
};

// Define a custom fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const session = readClientSession(), token = session?.tokens.accessToken || (getState() as RootState).auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (session?.workspaceContext) headers.set('X-Workspace', session.workspaceContext.workspace.id);
    return headers;
  },
});

// Enhanced base query with refresh token logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const before = readClientSession()?.workspaceContext;
  const isChange = typeof args === 'object' && args.method && !['GET', 'HEAD'].includes(args.method);
  if (isChange) { const headers = new Headers(args.headers); if (!headers.has('Idempotency-Key')) headers.set('Idempotency-Key', crypto.randomUUID()); args = { ...args, headers }; }
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    // const state = api.getState() as RootState;
    // const refreshToken = state.auth.tokens?.refreshToken;
    try { await refreshClientSession(SOS_API_URL); result = await baseQuery(args, api, extraOptions); }
    catch (error) { if (error instanceof SessionRequestError && error.status >= 500) return { error: { status: 503, data: { code: 'session_unavailable' } } }; handleUserLogout(api); return result; }
    if (result.error?.status === 401) { handleUserLogout(api); return result; }
  }
  const after = readClientSession()?.workspaceContext;
  if (before?.realm !== after?.realm || before?.workspace.id !== after?.workspace.id || before?.actor.effectiveUserId !== after?.actor.effectiveUserId) return { error: { status: 409, data: { code: 'workspace_changed' } } };

  // Changes (not reads) say how they went, in the reader's language (lib/api-feedback). The API's
  // own English messages are no longer shown; a 401 has already sent the reader to sign in.
  if (isChange && result.data) {
    const message = successMessage({ endpoint: api.endpoint, args: args.body, data: result.data });
    if (message) toast.success(message);
  }
  if (isChange && result.error && result.error.status !== 401) {
    const message = errorMessage({ endpoint: api.endpoint, args: args.body, status: result.error.status, code: (result.error.data as { code?: string } | undefined)?.code });
    if (message) toast.error(message);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Folder", "File", "Users", "Archive", "Share"],
  endpoints: () => ({}),
});
