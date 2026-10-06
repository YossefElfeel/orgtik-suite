import { API_URL } from "@/constants/env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "@orgtik/ui";
import { RootState } from "./store";
import { successMessage, errorMessage } from "@/lib/api-feedback";
import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { SOS_URL } from "@somion/sos-bar";

const handleUserLogout = (api: any) => {
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
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

// Enhanced base query with refresh token logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    // const state = api.getState() as RootState;
    // const refreshToken = state.auth.tokens?.refreshToken;
    handleUserLogout(api);
  }

  // Changes (not reads) say how they went, in the reader's language (lib/api-feedback). The API's
  // own English messages are no longer shown; a 401 has already sent the reader to sign in.
  const isChange = typeof args === "object" && args.method && args.method !== "GET";
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
