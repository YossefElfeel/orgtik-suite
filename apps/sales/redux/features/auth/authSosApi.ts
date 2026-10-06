import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "@/redux/app/store";
import { deleteCookie, getCookie } from "cookies-next";
import {
  TOKEN_COOKIE,
  USER_COOKIE,
  signInAgainUrl,
  AUTH_API_URL,
} from "@/constants";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { toast } from "@orgtik/ui";
import { errorMessage, successMessage } from "@/lib/api-feedback";
import { ErrorResponse, SuccessResponse } from "@/types";
import { ProfileResponse, UpdateProfileDTO } from "@/types/profile";
import { updateUser } from "./authSlice";

type ApiExtraOptions = {
  skipSuccessToast?: boolean;
};

const baseQuery = fetchBaseQuery({
  baseUrl: AUTH_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    const language = getRequestLocale();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Accept-Language", language);
    return headers;
  },
});

const baseQueryWithInterceptor: typeof baseQuery = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);
  const error = result.error as ErrorResponse;
  const method = typeof args === "string" ? "GET" : args.method || "GET";
  const options = extraOptions as ApiExtraOptions | undefined;

  if ((error?.status as number) === 401 && typeof window !== "undefined") {
    deleteCookie(USER_COOKIE);
    deleteCookie(TOKEN_COOKIE);
    window.location.href = signInAgainUrl(window.location.pathname + window.location.search);
  }

  // Same feedback as baseApi: the reader's language, never the SOS API's own English messages.
  const body = typeof args === "string" ? undefined : args.body;
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

export const authSosApi = createApi({
  reducerPath: "authSosApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    getAuthProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: "/auth/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<ProfileResponse, UpdateProfileDTO>({
      query: (body) => ({
        url: "/auth/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const profileData = (data as any).data || data;
          dispatch(
            updateUser({
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              avatar: profileData.avatar,
            }),
          );
        } catch (error) {
          console.error("Update profile cache error:", error);
        }
      },
    }),

    changePassword: builder.mutation<
      void,
      { oldPassword?: string; newPassword?: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    uploadAvatar: builder.mutation<ProfileResponse, FormData>({
      query: (body) => ({
        url: "/auth/avatar",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const profileData = (data as any).data || data;
          dispatch(
            updateUser({
              avatar: profileData.avatar,
            }),
          );
        } catch (error) {
          console.error("Upload avatar cache error:", error);
        }
      },
    }),

    deleteAvatar: builder.mutation<ProfileResponse, void>({
      query: () => ({
        url: "/auth/avatar",
        method: "DELETE",
      }),
      invalidatesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const profileData = (data as any).data || data;
          dispatch(
            updateUser({
              avatar: profileData.avatar,
            }),
          );
        } catch (error) {
          console.error("Delete avatar cache error:", error);
        }
      },
    }),
  }),
});

export const {
  useGetAuthProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = authSosApi;
