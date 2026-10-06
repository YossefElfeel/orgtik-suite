import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  ActivityFeedResponse,
  ActivityFeedQueryParams,
} from "@/types/activity-feed";

export const activityFeedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityFeed: builder.query<
      SuccessResponse<ActivityFeedResponse>,
      ActivityFeedQueryParams
    >({
      query: (params) => ({
        url: "/activity-feed",
        method: "GET",
        params,
      }),
      providesTags: ["ActivityFeed"],
    }),

    markAsRead: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/activity-feed/${id}/read`,
        method: "PATCH",
      }),
      // The row changes in place, so it doesn't toast (SAL-155). The bell counts the same items.
      extraOptions: { skipSuccessToast: true },
      invalidatesTags: ["ActivityFeed", "Notifications"],
    }),

    markAllAsRead: builder.mutation<SuccessResponse<void>, void>({
      query: () => ({
        url: "/activity-feed/read-all",
        method: "PATCH",
      }),
      extraOptions: { skipSuccessToast: true },
      invalidatesTags: ["ActivityFeed", "Notifications"],
    }),
  }),
});

export const {
  useGetActivityFeedQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = activityFeedApi;
