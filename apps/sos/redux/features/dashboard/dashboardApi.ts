import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";

export interface DashboardStats {
  activeSystems: {
    value: number;
    change: number;
    changeLabel: string;
    total: number;
  };
  totalMembers: {
    value: number;
    change: number;
    changeLabel: string;
    total: number;
  };
  cmsPlatforms: {
    value: number;
    total: number;
    status: string;
  };
  systemHealth: {
    value: string;
    percentage: number;
    status: string;
  };
}

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/dashboard/stats
    getDashboardStats: builder.query<SuccessResponse<DashboardStats>, void>({
      query: () => ({
        url: "/dashboard/stats",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;

