import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import { IDashboardData } from "@/types/home";

const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query<SuccessResponse<IDashboardData>, void>(
      {
        query: (params) => ({
          url: "/analytics/dashboard",
          method: "GET",
        }), // Disable cache
        keepUnusedDataFor: 0,
      }
    ),
  }),
});

export const { useGetDashboardAnalyticsQuery } = homeApi;
