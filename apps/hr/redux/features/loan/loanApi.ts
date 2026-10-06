import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  ILoan,
  ILoanDetail,
  LoansResponse,
  UpdateLoanDto,
  UpdateLoanStatusDto,
} from "@/types/loans";

export const loanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<
      SuccessResponse<LoansResponse>,
      {
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: "ASC" | "DESC";
        employeeId?: number;
        status?: "active" | "paused" | "closed" | "cancelled";
      }
    >({
      query: (params) => ({
        url: "/payroll/loans",
        method: "GET",
        params,
      }),
      providesTags: ["Loans"],
    }),

    getLoanById: builder.query<SuccessResponse<ILoanDetail>, number>({
      query: (id) => ({
        url: `/payroll/loans/${id}`,
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),

    updateLoanById: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateLoanDto }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/loans/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Loans"],
    }),

    updateLoanStatusById: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateLoanStatusDto }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/loans/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Loans"],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useUpdateLoanByIdMutation,
  useUpdateLoanStatusByIdMutation,
} = loanApi;
