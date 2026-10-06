import { baseApi } from "@/redux/app/baseApi";
import type { IPaginated, SuccessResponse } from "@/types";
import type {
  LoyaltyAdjustDTO,
  LoyaltyCustomerRow,
  LoyaltyManagerOverview,
  LoyaltyMeCoupon,
  LoyaltyMeOverview,
  LoyaltyMeRedeemResponse,
  LoyaltyMeReward,
  LoyaltyPageParams,
  LoyaltyProgramSettings,
  LoyaltyProgramSettingsPatchDTO,
  LoyaltyReward,
  LoyaltyRewardPostDTO,
  LoyaltyTransaction,
} from "@/types/loyalty";

export const loyaltyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The programme (admins change it).
    getLoyaltySettings: builder.query<SuccessResponse<LoyaltyProgramSettings>, void>({
      query: () => ({ url: "/loyalty/settings", method: "GET" }),
      providesTags: ["LoyaltySettings"],
    }),
    updateLoyaltySettings: builder.mutation<SuccessResponse<LoyaltyProgramSettings>, LoyaltyProgramSettingsPatchDTO>({
      query: (body) => ({ url: "/loyalty/settings", method: "PATCH", body }),
      invalidatesTags: ["LoyaltySettings"],
    }),
    deleteLoyaltyRate: builder.mutation<SuccessResponse<void>, string>({
      query: (currencyCode) => ({ url: `/loyalty/settings/rates/${currencyCode}`, method: "DELETE" }),
      invalidatesTags: ["LoyaltySettings"],
    }),

    // Rewards (admins).
    getLoyaltyRewards: builder.query<SuccessResponse<IPaginated<LoyaltyReward>>, LoyaltyPageParams>({
      query: (params) => ({ url: "/loyalty/rewards", method: "GET", params }),
      providesTags: ["LoyaltyRewards"],
    }),
    getLoyaltyRewardById: builder.query<SuccessResponse<LoyaltyReward>, string>({
      query: (id) => ({ url: `/loyalty/rewards/${id}`, method: "GET" }),
      providesTags: ["LoyaltyRewards"],
    }),
    createLoyaltyReward: builder.mutation<SuccessResponse<LoyaltyReward>, LoyaltyRewardPostDTO>({
      query: (body) => ({ url: "/loyalty/rewards", method: "POST", body }),
      invalidatesTags: ["LoyaltyRewards"],
    }),
    updateLoyaltyReward: builder.mutation<SuccessResponse<LoyaltyReward>, { id: string; body: Partial<LoyaltyRewardPostDTO> }>({
      query: ({ id, body }) => ({ url: `/loyalty/rewards/${id}`, method: "PATCH", body }),
      invalidatesTags: ["LoyaltyRewards"],
    }),
    deleteLoyaltyReward: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({ url: `/loyalty/rewards/${id}`, method: "DELETE" }),
      invalidatesTags: ["LoyaltyRewards"],
    }),

    // Customers and their points (admins in full; managers read).
    getLoyaltyOverview: builder.query<SuccessResponse<LoyaltyManagerOverview>, void>({
      query: () => ({ url: "/loyalty/manager/overview", method: "GET" }),
      providesTags: ["LoyaltyCustomers"],
    }),
    getLoyaltyCustomers: builder.query<SuccessResponse<IPaginated<LoyaltyCustomerRow>>, LoyaltyPageParams & { manager?: boolean }>({
      query: ({ manager, ...params }) => ({ url: manager ? "/loyalty/manager/customers" : "/loyalty/customers", method: "GET", params }),
      providesTags: ["LoyaltyCustomers"],
    }),
    getCustomerTransactions: builder.query<SuccessResponse<IPaginated<LoyaltyTransaction>>, LoyaltyPageParams & { customerId: string; manager?: boolean }>({
      query: ({ customerId, manager, ...params }) => ({
        url: manager ? `/loyalty/manager/customers/${customerId}/transactions` : `/loyalty/customers/${customerId}/transactions`,
        method: "GET",
        params,
      }),
      providesTags: ["LoyaltyTransactions"],
    }),
    adjustCustomerPoints: builder.mutation<SuccessResponse<void>, { customerId: string; body: LoyaltyAdjustDTO }>({
      query: ({ customerId, body }) => ({ url: `/loyalty/customers/${customerId}/adjust`, method: "POST", body }),
      invalidatesTags: ["LoyaltyCustomers", "LoyaltyTransactions"],
    }),

    // The customer's own portal.
    getMeLoyaltyOverview: builder.query<SuccessResponse<LoyaltyMeOverview>, void>({
      query: () => ({ url: "/loyalty/me", method: "GET" }),
      providesTags: ["LoyaltySettings", "LoyaltyTransactions"],
    }),
    getMeTransactions: builder.query<SuccessResponse<IPaginated<LoyaltyTransaction>>, LoyaltyPageParams>({
      query: (params) => ({ url: "/loyalty/me/transactions", method: "GET", params }),
      providesTags: ["LoyaltyTransactions"],
    }),
    getMeRewards: builder.query<SuccessResponse<IPaginated<LoyaltyMeReward>>, LoyaltyPageParams>({
      query: (params) => ({ url: "/loyalty/me/rewards", method: "GET", params }),
      providesTags: ["LoyaltyRewards", "LoyaltyTransactions"],
    }),
    redeemMeReward: builder.mutation<SuccessResponse<LoyaltyMeRedeemResponse>, string>({
      query: (rewardId) => ({ url: `/loyalty/me/rewards/${rewardId}/redeem`, method: "POST" }),
      // The screen shows the coupon code itself.
      extraOptions: { skipSuccessToast: true },
      invalidatesTags: ["LoyaltyTransactions", "LoyaltyCoupons", "LoyaltyRewards"],
    }),
    getMeCoupons: builder.query<SuccessResponse<IPaginated<LoyaltyMeCoupon>>, LoyaltyPageParams>({
      query: (params) => ({ url: "/loyalty/me/coupons", method: "GET", params }),
      providesTags: ["LoyaltyCoupons"],
    }),
  }),
});

export const {
  useGetLoyaltySettingsQuery,
  useUpdateLoyaltySettingsMutation,
  useDeleteLoyaltyRateMutation,
  useGetLoyaltyRewardsQuery,
  useGetLoyaltyRewardByIdQuery,
  useCreateLoyaltyRewardMutation,
  useUpdateLoyaltyRewardMutation,
  useDeleteLoyaltyRewardMutation,
  useGetLoyaltyOverviewQuery,
  useGetLoyaltyCustomersQuery,
  useGetCustomerTransactionsQuery,
  useAdjustCustomerPointsMutation,
  useGetMeLoyaltyOverviewQuery,
  useGetMeTransactionsQuery,
  useGetMeRewardsQuery,
  useRedeemMeRewardMutation,
  useGetMeCouponsQuery,
} = loyaltyApi;
