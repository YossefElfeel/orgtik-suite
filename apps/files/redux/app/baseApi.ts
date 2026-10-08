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
import { fileAuthority } from "@/lib/file-references";
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
    if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
    if (session?.workspaceContext && !headers.has('X-Workspace')) headers.set('X-Workspace', session.workspaceContext.workspace.id);
    return headers;
  },
});

// Enhanced base query with refresh token logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const originalAuthority = fileAuthority();
  const originalToken = readClientSession()?.tokens.accessToken;
  const explicitAuthorization = typeof args === "object" ? new Headers(args.headers).get("authorization") : null;
  const matches = () => originalAuthority === fileAuthority();
  const changed = () => ({ error: { status: "CUSTOM_ERROR" as const, error: "workspace_changed", data: { code: "workspace_changed", uncertain: true } } });
  const pin = (value: any, refreshed = false) => {
    const session = readClientSession();
    const headers = new Headers(typeof value === "object" ? value.headers : undefined);
    if (session?.tokens.accessToken && (!headers.has("authorization") || refreshed && headers.get("authorization") === "Bearer " + originalToken)) headers.set("authorization", "Bearer " + session.tokens.accessToken);
    if (session?.workspaceContext && !headers.has("X-Workspace")) headers.set("X-Workspace", session.workspaceContext.workspace.id);
    return { ...(typeof value === "string" ? { url: value } : value), headers };
  };
  args = pin(args);
  const isChange = typeof args === 'object' && args.method && !['GET', 'HEAD'].includes(args.method);
  if (isChange) { const headers = new Headers(args.headers); if (!headers.has('Idempotency-Key')) headers.set('Idempotency-Key', crypto.randomUUID()); args = { ...args, headers }; }
  if (!matches()) return changed();
  let result = await baseQuery(args, api, extraOptions);
  if (!matches()) return changed();

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    if (explicitAuthorization && explicitAuthorization !== "Bearer " + originalToken) return result;
    // const state = api.getState() as RootState;
    // const refreshToken = state.auth.tokens?.refreshToken;
    try {
      if (!matches()) return changed();
      await refreshClientSession(SOS_API_URL);
      if (!matches()) return changed();
      args = pin(args, true);
      result = await baseQuery(args, api, extraOptions);
      if (!matches()) return changed();
    } catch (error) {
      if (!matches()) return changed();
      if (!(error instanceof SessionRequestError) || ![401, 403].includes(error.status)) return { error: { status: 503, data: { code: "session_unavailable", uncertain: isChange } } };
      handleUserLogout(api); return result;
    }
    if (result.error?.status === 401) { if (!matches()) return changed(); handleUserLogout(api); return result; }
  }
  if (!matches()) return changed();

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
