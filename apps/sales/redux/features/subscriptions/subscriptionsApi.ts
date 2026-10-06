import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  AdminCancelSubscriptionDto,
  AdminCancelSubscriptionResult,
  AdminAutoRenewDto,
  AdminAutoRenewResult,
  AdminPauseResumeResult,
  AdminPaySubscriptionDto,
  AdminPaySubscriptionResult,
  AdminRefundSubscriptionDto,
  AdminRefundSubscriptionResult,
  AdminRenewalDurationList,
  AdminRenewalPreflight,
  AdminRenewalRequestDto,
  AdminSubscriptionsSummaryDto,
  CustomerSubscriptionCheckoutDto,
  CustomerSubscriptionCheckoutResult,
  CustomerSubscriptionPreflight,
  CustomerSubscriptionPreflightDto,
  CustomerSubscriptionsSummaryDto,
  SubscriptionDetailDto,
  SubscriptionsPaginated,
  SubscriptionsQueryParams,
  SubscriptionsSummaryQueryParams,
} from "@/types/subscriptions";

export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSubscriptions: builder.query<
      SuccessResponse<SubscriptionsPaginated>,
      SubscriptionsQueryParams
    >({
      query: (params) => ({
        url: "/subscriptions/admin",
        method: "GET",
        params,
      }),
      providesTags: ["Subscriptions"],
    }),
    getCustomerSubscriptions: builder.query<
      SuccessResponse<SubscriptionsPaginated>,
      SubscriptionsQueryParams
    >({
      query: (params) => ({
        url: "/subscriptions/customer",
        method: "GET",
        params,
      }),
      providesTags: ["Subscriptions"],
    }),
    getAdminSubscriptionsSummary: builder.query<
      SuccessResponse<AdminSubscriptionsSummaryDto>,
      SubscriptionsSummaryQueryParams | void
    >({
      query: (params) => ({
        url: "/subscriptions/summary/admin",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Subscriptions"],
    }),
    getCustomerSubscriptionsSummary: builder.query<
      SuccessResponse<CustomerSubscriptionsSummaryDto>,
      SubscriptionsSummaryQueryParams | void
    >({
      query: (params) => ({
        url: "/subscriptions/summary/customer",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Subscriptions"],
    }),
    getAdminSubscription: builder.query<
      SuccessResponse<SubscriptionDetailDto>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/admin`,
        method: "GET",
      }),
      providesTags: ["Subscriptions"],
    }),
    getCustomerSubscription: builder.query<
      SuccessResponse<SubscriptionDetailDto>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}`,
        method: "GET",
      }),
      providesTags: ["Subscriptions"],
    }),
    previewCustomerSubscription: builder.mutation<
      SuccessResponse<CustomerSubscriptionPreflight>,
      CustomerSubscriptionPreflightDto
    >({
      query: (body) => ({
        url: "/subscriptions/preflight",
        method: "POST",
        body,
      }),
      extraOptions: { skipSuccessToast: true },
    }),
    createCustomerSubscription: builder.mutation<
      SuccessResponse<CustomerSubscriptionCheckoutResult>,
      CustomerSubscriptionCheckoutDto
    >({
      query: (body) => ({
        url: "/subscriptions/customer",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions", "Projects"],
    }),
    getSubscriptionRenewalDurations: builder.query<
      SuccessResponse<AdminRenewalDurationList>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/durations`,
        method: "GET",
      }),
      providesTags: ["Subscriptions"],
    }),
    previewSubscriptionRenewal: builder.mutation<
      SuccessResponse<AdminRenewalPreflight>,
      { id: string; body: AdminRenewalRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/renew/preflight`,
        method: "POST",
        body,
      }),
      extraOptions: { skipSuccessToast: true },
    }),
    previewCustomerSubscriptionRenewal: builder.mutation<
      SuccessResponse<AdminRenewalPreflight>,
      { id: string; body: AdminRenewalRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/renew/preflight`,
        method: "POST",
        body,
      }),
      extraOptions: { skipSuccessToast: true },
    }),
    renewSubscription: builder.mutation<
      SuccessResponse<AdminRenewalPreflight>,
      { id: string; body: AdminRenewalRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/renew`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    renewCustomerSubscription: builder.mutation<
      SuccessResponse<AdminRenewalPreflight>,
      { id: string; body: AdminRenewalRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/renew`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    payCustomerSubscription: builder.mutation<
      SuccessResponse<AdminPaySubscriptionResult>,
      { id: string; body: AdminPaySubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    paySubscription: builder.mutation<
      SuccessResponse<AdminPaySubscriptionResult>,
      { id: string; body: AdminPaySubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    cancelSubscription: builder.mutation<
      SuccessResponse<AdminCancelSubscriptionResult>,
      { id: string; body: AdminCancelSubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    cancelCustomerSubscription: builder.mutation<
      SuccessResponse<AdminCancelSubscriptionResult>,
      { id: string; body: AdminCancelSubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    refundSubscription: builder.mutation<
      SuccessResponse<AdminRefundSubscriptionResult>,
      { id: string; body: AdminRefundSubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/refund`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    refundCustomerSubscription: builder.mutation<
      SuccessResponse<AdminRefundSubscriptionResult>,
      { id: string; body: AdminRefundSubscriptionDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/refund`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    pauseSubscription: builder.mutation<
      SuccessResponse<AdminPauseResumeResult>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/admin/pause`,
        method: "POST",
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    pauseCustomerSubscription: builder.mutation<
      SuccessResponse<AdminPauseResumeResult>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/pause`,
        method: "POST",
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    resumeSubscription: builder.mutation<
      SuccessResponse<AdminPauseResumeResult>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/admin/resume`,
        method: "POST",
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    resumeCustomerSubscription: builder.mutation<
      SuccessResponse<AdminPauseResumeResult>,
      string
    >({
      query: (id) => ({
        url: `/subscriptions/${id}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    updateSubscriptionAutoRenew: builder.mutation<
      SuccessResponse<AdminAutoRenewResult>,
      { id: string; body: AdminAutoRenewDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscriptions/${id}/admin/auto-renew`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
  }),
});

export const {
  useGetAdminSubscriptionsQuery,
  useGetCustomerSubscriptionsQuery,
  useGetAdminSubscriptionsSummaryQuery,
  useGetCustomerSubscriptionsSummaryQuery,
  useGetAdminSubscriptionQuery,
  useGetCustomerSubscriptionQuery,
  usePreviewCustomerSubscriptionMutation,
  useCreateCustomerSubscriptionMutation,
  useGetSubscriptionRenewalDurationsQuery,
  usePreviewSubscriptionRenewalMutation,
  usePreviewCustomerSubscriptionRenewalMutation,
  useRenewSubscriptionMutation,
  useRenewCustomerSubscriptionMutation,
  usePayCustomerSubscriptionMutation,
  usePaySubscriptionMutation,
  useCancelSubscriptionMutation,
  useCancelCustomerSubscriptionMutation,
  useRefundSubscriptionMutation,
  useRefundCustomerSubscriptionMutation,
  usePauseSubscriptionMutation,
  usePauseCustomerSubscriptionMutation,
  useResumeSubscriptionMutation,
  useResumeCustomerSubscriptionMutation,
  useUpdateSubscriptionAutoRenewMutation,
} = subscriptionsApi;
