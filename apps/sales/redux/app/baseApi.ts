import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "./store";
import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE, USER_COOKIE, signInAgainUrl } from "@/constants";
import { API_URL } from "@/constants";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { toast } from "@orgtik/ui";
import { ErrorResponse } from "@/types";
import { errorMessage, successMessage } from "@/lib/api-feedback";

type ApiExtraOptions = {
  skipSuccessToast?: boolean;
};

export const API_TAG_TYPES = [
  "Coupons",
  "Tickets",
  "Zones",
  "Departments",
  "Durations",
  "Customers",
  "Staff",
  "Salesmen",
  "SalesmanNotes",
  "ActivityFeed",
  "Commissions",
  "Categories",
  "Features",
  "Plans",
  "Projects",
  "Subscriptions",
  "Packages",
  "Invoices",
  "VatCountries",
  "Contracts",
  "Dashboard",
  "LoyaltySettings",
  "LoyaltyRewards",
  "LoyaltyCustomers",
  "LoyaltyTransactions",
  "LoyaltyCoupons",
  "Notifications",
  "NotificationPreferences",
  "Currencies",
  "Offers",
  "Archive",
] as const;

// Define a custom fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    const language = getRequestLocale();

    if (token) headers.set("Authorization", `Bearer ${token}`);

    headers.set("Accept-Language", language || "en");
    return headers;
  },
});

// The interceptor. A network failure comes back as { error: { status: "FETCH_ERROR" } } and is
// reported like any other error, so a stopped API never crashes a screen. Changes say how they
// went in the reader's language (lib/api-feedback): the API's English messages and a generic
// "Successfully done" are no longer shown. Reads don't toast: their screens show the error.
const baseQueryWithInterceptor: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  const method = typeof args === "string" ? "GET" : args.method || "GET";
  const body = typeof args === "string" ? undefined : args.body;
  const options = extraOptions as ApiExtraOptions | undefined;

  // Signed out, or the session expired: sign in through the suite and come back to this page.
  if (result.error?.status === 401 && typeof window !== "undefined") {
    deleteCookie(USER_COOKIE);
    deleteCookie(TOKEN_COOKIE);
    window.location.href = signInAgainUrl(window.location.pathname + window.location.search);
    return result;
  }

  if (method !== "GET") {
    if (result.error) {
      const code = (result.error.data as (ErrorResponse & { code?: string }) | undefined)?.code;
      const message = errorMessage({ endpoint: api.endpoint, args: body, status: result.error.status, code });
      if (message) toast.error(message);
    } else if (result.data !== undefined && !options?.skipSuccessToast) {
      const message = successMessage({ endpoint: api.endpoint, args: body, data: result.data });
      if (message) toast.success(message);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: [...API_TAG_TYPES],
  endpoints: () => ({}),
});
