import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IDashboardData } from "@/types/dashboard";
// import { IDashboardStats } from "@/types/stats";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<SuccessResponse<IDashboardData>, void>({
      query: () => ({
        url: "/analytics/dashboard",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
