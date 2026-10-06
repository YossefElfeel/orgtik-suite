import { baseApi } from "@/redux/app/baseApi";
import type {
  MarkAllReadResponse,
  NotificationDto,
  NotificationListQuery,
  PaginatedNotificationsData,
  UnreadCountData,
} from "@/types/notifications";
import type { SuccessResponse } from "@/types";

const notificationEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      SuccessResponse<PaginatedNotificationsData>,
      NotificationListQuery | void
    >({
      query: (params) => ({
        url: "/notifications",
        params: params ?? {},
      }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadNotificationCount: builder.query<
      SuccessResponse<UnreadCountData>,
      void
    >({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "COUNT" }],
    }),
    markNotificationRead: builder.mutation<
      SuccessResponse<NotificationDto>,
      number
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
    markAllNotificationsRead: builder.mutation<
      SuccessResponse<MarkAllReadResponse>,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationEndpoints;
