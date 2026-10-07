import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import type { RootState } from "./store";
import { signInAgainUrl } from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { readClientSession, clearClientSession, refreshClientSession, SessionRequestError } from "@orgtik/ui/auth";
import { SOS_API_URL } from "@/constants/env";

// Define error response type
export interface ErrorResponse {
  data?: string[];
  errors?: Record<string, string[]>;
  msg?: string;
  message?: string;
  code?: string;
  status?: number;
  statusCode?: number;
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  data: DataType;
  msg: string;
  status: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const session = readClientSession();
    const token = session?.tokens.accessToken || (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (session?.workspaceContext?.workspace.id) headers.set("x-workspace", session.workspaceContext.workspace.id);
    return headers;
  },
});

const baseQueryWithInterceptor: typeof baseQuery = async (args, api, extraOptions) => {
  // A network failure comes back as { error: { status: "FETCH_ERROR" } } and is reported like any
  // other error. The old interceptor read `error.data.msg` and threw when there was no data, so a
  // stopped API crashed the screen (MKT-007).
  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && readClientSession()?.tokens.refreshToken) {
    try { await refreshClientSession(SOS_API_URL); result = await baseQuery(args, api, extraOptions); }
    catch (error) { if (!(error instanceof SessionRequestError) || ![401, 403].includes(error.status)) return { error: { status: 503, data: { code: "session_unavailable" } } }; }
  }
  const method = typeof args === "string" ? "GET" : args.method || "GET";
  const body = typeof args === "string" ? undefined : args.body;

  // Signed out, or the session expired: sign in through the suite and come back to this page
  // (MKT-030, MKT-031).
  if (result.error?.status === 401 && typeof window !== "undefined") {
    clearClientSession();
    api.dispatch(logoutUser());
    window.location.href = signInAgainUrl(window.location.pathname + window.location.search);
    return result;
  }

  // Changes say how they went, in the reader's language (lib/api-feedback). The API's English
  // messages are no longer shown, and reads no longer toast: their screens show the error (MKT-032).
  if (method !== "GET") {
    if (result.error) {
      const code = (result.error.data as ErrorResponse | undefined)?.code;
      const message = errorMessage({ endpoint: api.endpoint, args: body, status: result.error.status, code });
      if (message) toast.error(message);
    } else if (result.data !== undefined) {
      const message = successMessage({ endpoint: api.endpoint, args: body, data: result.data });
      if (message) toast.success(message);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: [
    "Integrations",
    "Projects",
    "ActiveProject",
    "Posts",
    "Labels",
    "Comments",
    "GoalCategories",
    "CampaignTypes",
    "Campaigns",
    "AdStatuses",
    "AdPlatforms",
    "Reports",
    "Boost",
    "Gallery",
    "Messaging",
    "Audiences",
    "AudienceSegments",
  ],
  endpoints: () => ({}),
});
