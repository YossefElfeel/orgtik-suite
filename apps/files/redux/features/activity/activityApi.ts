import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse, PaginatedData, IDashboardActivity } from "@/types";

export type IActivityLog = IDashboardActivity;

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List Activity Logs
    getActivityLogs: builder.query<
      SuccessResponse<PaginatedData<IActivityLog>>,
      {
        page?: number;
        limit?: number;
        actorId?: string;
        from?: string;
        to?: string;
      }
    >({
      query: (params) => ({
        url: "/v1/activity-logs",
        method: "GET",
        params,
      }),
      providesTags: ["File", "Folder"],
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityApi;
