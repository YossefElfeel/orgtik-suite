import { API_URL } from "@/constants/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import { RootState } from "./store";
import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE, signInAgainUrl } from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { readClientSession, refreshClientSession, clearClientSession, SessionRequestError } from '@orgtik/ui/auth';
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
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (session?.workspaceContext) headers.set('X-Workspace', session.workspaceContext.workspace.id);
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  // A network failure comes back as { error: { status: "FETCH_ERROR" } } and is reported like any
  // other error; nothing here throws, so a stopped API never crashes a screen (TASKS-005).
  const before = readClientSession()?.workspaceContext;
  const isChange = typeof args === 'object' && args.method && !['GET', 'HEAD'].includes(args.method);
  if (isChange) { const headers = new Headers(args.headers); if (!headers.has('Idempotency-Key')) headers.set('Idempotency-Key', crypto.randomUUID()); args = { ...args, headers }; }
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    try { await refreshClientSession(SOS_API_URL); result = await baseQuery(args, api, extraOptions); }
    catch (error) { if (error instanceof SessionRequestError && error.status >= 500) return { error: { status: 503, data: { code: 'session_unavailable' } } }; handleUserLogout(api); return result; }
    if (result.error?.status === 401) { handleUserLogout(api); return result; }
  }
  const after = readClientSession()?.workspaceContext;
  if (before?.realm !== after?.realm || before?.workspace.id !== after?.workspace.id || before?.actor.effectiveUserId !== after?.actor.effectiveUserId) return { error: { status: 409, data: { code: 'workspace_changed' } } };

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
