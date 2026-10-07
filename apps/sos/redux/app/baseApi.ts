import { API_URL } from "@/constants/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { RootState } from "./store";
import { SuccessResponse } from "@/types";
import { deleteCookie, getCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import { setUser, logoutUser, setTokens } from "../features/auth/authSlice";

const handleUserLogout = (api: any) => {
  api.dispatch(logoutUser());
  api.dispatch(baseApi.util.resetApiState());
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
  const currentPath = window.location.pathname + window.location.search;
  const isAuthRoute = currentPath.split("?")[0].split("/")[1] === "auth";
  if (isAuthRoute) return;
  window.location.href = `/auth/login?redirect=${encodeURIComponent(
    currentPath
  )}`;
};

// Define a custom fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const tokens = (getState() as RootState).auth.tokens;
    if (tokens?.accessToken)
      headers.set("authorization", `Bearer ${tokens.accessToken}`);
    return headers;
  },
});

const getRequestUrl = (args: any) =>
  typeof args === "string" ? args : args.url;

// Enhanced base query with refresh token logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  const requestUrl = getRequestUrl(args);
  const isLoginRequest = requestUrl?.includes("/auth/login");

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401 && !isLoginRequest) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.tokens?.refreshToken;

    if (refreshToken) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );
      if (refreshResult.data) {
        const refreshData = refreshResult.data as SuccessResponse<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>;

        api.dispatch(
          setTokens({
            accessToken: refreshData.data.accessToken,
            refreshToken: refreshData.data.refreshToken,
            expiresIn: refreshData.data.expiresIn,
          })
        );

        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else if (refreshResult.error?.status === 401 || refreshResult.error?.status === 403) handleUserLogout(api);
      else return refreshResult; // A temporary outage must not erase the valid refresh session.
    } else handleUserLogout(api);
  }

  // Changes (not reads) say how they went, in the reader's language (lib/api-feedback): the API's
  // English messages are no longer shown, and a network error no longer throws here (it read
  // error.data.message when there was no data). A 401 has already been handled above.
  const isChange = typeof args === "object" && args.method && args.method !== "GET";
  if (isChange && result.data) {
    const message = successMessage({ endpoint: api.endpoint, args: args.body, data: result.data });
    if (message) toast.success(message);
  }
  if (isChange && result.error && result.error.status !== 401 && !isLoginRequest) {
    const message = errorMessage({ endpoint: api.endpoint, args: args.body, status: result.error.status, code: (result.error.data as { code?: string } | undefined)?.code });
    if (message) toast.error(message);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "UserScopes",
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
    "Scopes",
    "CMS",
    "CMSAccounts",

  ],
  endpoints: () => ({}),
});
