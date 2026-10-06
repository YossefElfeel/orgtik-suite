import { baseApi } from "@/redux/app/baseApi";
import type {
  DashboardCustomerRow,
  DashboardLoyalty,
  DashboardOfferRow,
  DashboardOverviewData,
  DashboardProjectRow,
} from "@/types/dashboard";
import type { IPaginated, SuccessResponse } from "@/types";

// The dashboard's reads (FS-SAL-10). The overview is refreshed by any change to the records it
// counts: no mutation invalidated "Dashboard" before, so its numbers went stale until a reload.
// The short lists are the dashboard's own reads (five rows each), so the list screens' queries
// and their arguments stay theirs.
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<SuccessResponse<DashboardOverviewData>, void>({
      query: () => "/dashboard/overview",
      providesTags: ["Dashboard", "Projects", "Customers", "Offers", "Contracts", "Commissions", "Invoices", "Subscriptions"],
    }),
    getDashboardCustomers: builder.query<SuccessResponse<IPaginated<DashboardCustomerRow>>, { limit: number }>({
      query: ({ limit }) => ({ url: "/customers", params: { page: 1, limit } }),
      providesTags: ["Customers"],
    }),
    getDashboardProjects: builder.query<SuccessResponse<IPaginated<DashboardProjectRow>>, { limit: number }>({
      query: ({ limit }) => ({ url: "/dashboard/latest-projects", params: { page: 1, limit } }),
      providesTags: ["Projects", "Contracts"],
    }),
    getDashboardOffersAwaiting: builder.query<SuccessResponse<IPaginated<DashboardOfferRow>>, { limit: number }>({
      query: ({ limit }) => ({ url: "/offers", params: { status: "pending", page: 1, limit } }),
      providesTags: ["Offers"],
    }),
    getDashboardLoyalty: builder.query<SuccessResponse<DashboardLoyalty>, void>({
      query: () => "/loyalty/me",
      providesTags: ["LoyaltyCustomers", "LoyaltyTransactions"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardCustomersQuery,
  useGetDashboardProjectsQuery,
  useGetDashboardOffersAwaitingQuery,
  useGetDashboardLoyaltyQuery,
} = dashboardApi;
