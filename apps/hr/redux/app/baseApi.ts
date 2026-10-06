import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";
import { RootState } from "./store";
import { deleteCookie } from "cookies-next";
import {
  API_URL,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/constants";
import { logoutUser } from "../features/auth/authSlice";
import { suiteSignIn } from "@/lib/suite-return";
import { errorMessage, successMessage } from "@/lib/api-feedback";

const handleUserLogout = (api: any) => {
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
    handleUserLogout(api);
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
