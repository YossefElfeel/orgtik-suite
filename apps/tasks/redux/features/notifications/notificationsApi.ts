import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  IClearNotifications,
  IMarkReadNotifications,
  INotificationGroup,
  INotifications,
  INotificationsLatestResponse,
  INotificationsResponse,
} from "@/types/notifications";

const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get notifications latest
    getNotifications: builder.query<
      SuccessResponse<INotificationsLatestResponse>,
      void
    >({
      query: () => ({
        url: "/notifications/latest",
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    // get all notifications
    getAllNotifications: builder.query<
      SuccessResponse<INotificationsResponse>,
      {
        group?: "all" | "mentions" | "assigned";
        status?: "unread" | "read" | "cleared";
        startDate?: string;
        endDate?: string;
        // sort?: "DESC" | "ASC";
      }
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: { ...params },
      }),
      providesTags: ["Notifications"],
    }),

    // mark-read
    markReadnotifications: builder.mutation<
      SuccessResponse<IMarkReadNotifications>,
      {
        notificationIds: number[];
      }
    >({
      query: (notificationIds) => ({
        url: "notifications/mark-read",
        method: "POST",
        body: notificationIds,
      }),
      invalidatesTags: ["Notifications"],
    }),

    //  clear Notifications
    clearNotifications: builder.mutation<
      SuccessResponse<IClearNotifications>,
      {
        notificationIds: number[];
      }
    >({
      query: (notificationIds) => ({
        url: "/notifications/clear",
        method: "POST",
        body: notificationIds,
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetAllNotificationsQuery,
  useMarkReadnotificationsMutation,
  useClearNotificationsMutation,
} = notificationsApi;
