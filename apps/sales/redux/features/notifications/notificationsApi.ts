import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  NotificationEntity,
  NotificationResponse,
  GetNotificationsQueryParams,
  NotificationUnreadCountResponse,
  NotificationPreferenceItem,
  UpdatePreferencesPayload,
} from "@/types/notifications";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      SuccessResponse<NotificationResponse>,
      GetNotificationsQueryParams
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params,
      }),
      providesTags: ["Notifications"],
    }),

    getUnreadCount: builder.query<
      SuccessResponse<NotificationUnreadCountResponse>,
      void
    >({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    // Marking read changes the row itself, so it doesn't toast (SAL-155).
    markNotificationRead: builder.mutation<SuccessResponse<NotificationEntity>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      extraOptions: { skipSuccessToast: true },
      invalidatesTags: ["Notifications", "ActivityFeed"],
    }),

    markAllNotificationsRead: builder.mutation<SuccessResponse<null>, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      extraOptions: { skipSuccessToast: true },
      invalidatesTags: ["Notifications", "ActivityFeed"],
    }),

    getNotificationPreferences: builder.query<
      SuccessResponse<NotificationPreferenceItem[]>,
      void
    >({
      query: () => ({
        url: "/notifications/preferences",
        method: "GET",
      }),
      providesTags: ["NotificationPreferences"],
    }),

    updateNotificationPreferences: builder.mutation<
      SuccessResponse<NotificationPreferenceItem[]>,
      UpdatePreferencesPayload
    >({
      query: (body) => ({
        url: "/notifications/preferences",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["NotificationPreferences"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi;
