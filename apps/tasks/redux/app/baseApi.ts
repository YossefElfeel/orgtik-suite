import { API_URL } from "@/constants/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import { RootState } from "./store";
import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE, signInAgainUrl } from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { readClientSession, refreshClientSession, clearClientSession, SessionRequestError } from '@orgtik/ui/auth';
import { fileAuthority } from "@/lib/file-references";
import { SOS_API_URL } from '@/constants/env';

const handleUserLogout = (api: any) => {
  clearClientSession(); api.dispatch(baseApi.util.resetApiState());
  api.dispatch(logoutUser());
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
  // Back to this page after signing in again (TASKS-021).
  window.location.href = signInAgainUrl(window.location.pathname + window.location.search);
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const session = readClientSession(), token = session?.tokens.accessToken || (getState() as RootState).auth.token;
    if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
    if (session?.workspaceContext && !headers.has('X-Workspace')) headers.set('X-Workspace', session.workspaceContext.workspace.id);
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  // A network failure comes back as { error: { status: "FETCH_ERROR" } } and is reported like any
  // other error; nothing here throws, so a stopped API never crashes a screen (TASKS-005).
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

  if (result.error && result.error.status === 401) {
    if (explicitAuthorization && explicitAuthorization !== "Bearer " + originalToken) return result;
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
  // own English messages are no longer shown (TASKS-030), and errors no longer depend on which
  // field the API filled in: they're told by status, network failures included (TASKS-005).
  if (isChange && "data" in result && result.data !== undefined && !result.error) {
    const message = successMessage({ endpoint: api.endpoint, args: args.body, data: result.data });
    if (message) toast.success(message);
  }
  if (isChange && result.error) {
    const code = (result.error.data as { code?: string } | undefined)?.code;
    const message = errorMessage({ endpoint: api.endpoint, args: args.body, status: result.error.status, code });
    if (message) toast.error(message);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Teams",
    "Profile",
    "Project",
    "Users",
    "Roles",
    "Bookmark",
    "Task",
    "Subtasks",
    "Comment",
    "Conversations",
    "Messages",
    "Notifications",
  ],
  endpoints: () => ({}),
});
