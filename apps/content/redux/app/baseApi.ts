import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "./store";
import { deleteCookie, getCookie } from "cookies-next";
import { NEXT_LOCALE, TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import { API_URL } from "@/constants/env";
import { Locale } from "@/i18n/routing";
import { toast } from "sonner";
import { getUnauthorizedRedirectUrl } from "@/lib/get-unauthorized-redirect-url";

// Define error response type
export interface ErrorResponse {
  data?: string[];
  errors?: Record<string, string[]>;
  msg?: string;
  message?: string;
  status?: number;
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  data: DataType;
  msg: string;
  status: string;
}

// Define a custom fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    const language = (getCookie(NEXT_LOCALE) as Locale) || "en";
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept-Language", language || "en");
    return headers;
  },
});

// Define an interceptor
const baseQueryWithInterceptor: typeof baseQuery = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseQuery(args, api, extraOptions);
  const method = typeof args === "string" ? "GET" : args.method || "GET";

  if (!!result.error && result.error.status === 401) {
    deleteCookie(USER_COOKIE);
    deleteCookie(TOKEN_COOKIE);
    toast("Unauthorized", {
      description: "This session has been expired, please login again",
    });
    const language = (getCookie(NEXT_LOCALE) as Locale) || "en";
    if (!window.location.href.includes(`/auth`))
      window.location.href = getUnauthorizedRedirectUrl(language);
  }

  if (!!result.error) {
    const err = result.error?.data as ErrorResponse;
    const errorMessage = err.msg || err.message || "Something went wrong";
    toast.error(errorMessage, {
      description:
        err.data || Object.entries(err.errors || {}).map(([k, v]) => v),
    });
  }

  if (!!result.data && method != "GET") {
    const successMsg = (result.data as SuccessResponse<any>).msg;
    toast.success(successMsg || "Successfully done");
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: [
    "Gallery",
    "Features",
    "Services",
    "SubServices",
    "Blog",
    "Control",
    "SocialMedia",
    "Timeline",
    "Testimonials",
    // New tag types can be added here
    "Contacts",
    "Project",
    "Profile",
    "SitemapCategory",
    "SitemapBlog",
    "Review",
  ],
  endpoints: () => ({}),
});
