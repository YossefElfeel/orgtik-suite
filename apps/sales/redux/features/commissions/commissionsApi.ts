import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  Commission,
  CommissionsPaginated,
  CommissionsQueryParams,
  CommissionSummaryStats,
  PayCommissionDTO,
  WithdrawWalletDTO,
} from "@/types/commissions";

export const commissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Admins and managers: every commission. */
    getCommissions: builder.query<SuccessResponse<CommissionsPaginated>, CommissionsQueryParams>({
      query: (params) => ({ url: "/commissions", method: "GET", params }),
      providesTags: ["Commissions"],
    }),
    /** A salesperson: their own. */
    getMyCommissions: builder.query<SuccessResponse<CommissionsPaginated>, CommissionsQueryParams>({
      query: (params) => ({ url: "/commissions/me", method: "GET", params }),
      providesTags: ["Commissions"],
    }),
    getMyCommissionsSummary: builder.query<SuccessResponse<CommissionSummaryStats>, void>({
      query: () => ({ url: "/commissions/me/summary", method: "GET" }),
      providesTags: ["Commissions"],
    }),
    /** Admins and managers: the summary over everyone's commissions (SAL-171). */
    getCommissionsSummary: builder.query<SuccessResponse<CommissionSummaryStats>, void>({
      query: () => ({ url: "/commissions/summary", method: "GET" }),
      providesTags: ["Commissions"],
    }),
    /** Admins only. Part or all of the due amount, with the payment reference and an optional receipt. */
    payCommission: builder.mutation<SuccessResponse<Commission>, PayCommissionDTO>({
      query: ({ commissionId, amount, reference, receipt }) => {
        if (!receipt) return { url: `/commissions/${commissionId}/pay`, method: "POST", body: { amount, reference } };
        const body = new FormData();
        body.append("amount", String(amount));
        body.append("reference", reference);
        if (receipt) body.append("receiptDocument", receipt);
        return { url: `/commissions/${commissionId}/pay`, method: "POST", body };
      },
      invalidatesTags: ["Commissions", "Salesmen", "Dashboard", "Invoices"],
    }),
    /** Admins only. Pays an amount in the wallet's currency against the oldest unpaid commissions first. */
    withdrawWallet: builder.mutation<SuccessResponse<unknown>, WithdrawWalletDTO>({
      query: ({ salesmanId, amount, reference }) => ({
        url: `/wallets/salesmen/${salesmanId}/withdraw`,
        method: "POST",
        body: { amount, reference },
      }),
      invalidatesTags: ["Commissions", "Salesmen", "Dashboard", "Invoices"],
    }),
  }),
});

export const {
  useGetCommissionsQuery,
  useGetMyCommissionsQuery,
  useGetMyCommissionsSummaryQuery,
  useGetCommissionsSummaryQuery,
  usePayCommissionMutation,
  useWithdrawWalletMutation,
} = commissionsApi;
