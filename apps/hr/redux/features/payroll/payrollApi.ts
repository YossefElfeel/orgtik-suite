import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import {
  CreatePayrollLoanDto,
  ExportBankFileResponse,
  GetPayrollPayoutsResponse,
  GetPayrollRunItemsParams,
  GetPayrollRunItemsResponse,
  GetPayrollRunsQueryParams,
  GetMyPayslipsParams,
  IPayrollRunByIdAdminResponse,
  IPayrollRunItem,
  IPayrollRunsResponse,
  ISubmitPayrollReviewRequest,
  MyPayslipItem,
  PayrollFinanceImportBatch,
  PayrollFinanceSheetsExportParams,
  PayrollRunSummary,
  PayrollUpdateDto,
  StartPayrollRunDto,
  SubmitPayrollEmployeesDto,
} from "@/types/payroll";

const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Updates an existing payroll record by its ID.
     */
    updatePayroll: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; body: PayrollUpdateDto }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Updates a specific payroll adjustment (bonus or deduction).
     */
    updatePayrollAdjustment: builder.mutation<
      any,
      {
        id: number;
        body: {
          employeeId: number;
          mode: "fixed" | "days" | "percent" | "months";
          value: number;
          reason: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/adjustments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Deletes a specific payroll adjustment (bonus or deduction).
     */
    deletePayrollAdjustment: builder.mutation<any, number>({
      query: (id) => ({
        url: `/payroll/adjustments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Retrieves the details of a specific payroll item by its ID.
     */
    getPayrollItemById: builder.query<any, number>({
      query: (id) => ({
        url: `/payroll/items/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Payroll", id }],
    }),

    /**
     * Retrieves a list of all payroll runs based on optional filter parameters.
     */
    getPayrollRuns: builder.query<
      // SuccessResponse<PayrollRunItem[]>,
      any,
      GetPayrollRunsQueryParams
    >({
      query: (params) => ({
        url: "/payroll/runs",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    /**
     * Initializes/Starts a new payroll run for a selected period (frequency, month, year).
     */
    startPayrollRun: builder.mutation<SuccessResponse<any>, StartPayrollRunDto>(
      {
        query: (body) => ({
          url: "/payroll/runs",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Payroll"],
      },
    ),

    /**
     * Adds a financial adjustment (bonus or deduction) to a specific employee's payroll run.
     */
    addPayrollAdjustment: builder.mutation<
      any,
      {
        runId: number;
        body: {
          employeeId: number;
          type: "bonus" | "deduction";
          mode: "fixed" | "days" | "percent" | "months";
          value: number;
          reason: string;
        };
      }
    >({
      query: ({ runId, body }) => ({
        url: `/payroll/runs/${runId}/adjustments`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Resolves and fetches the active payroll run state for the selected period and frequency.
     * Used to determine if a run exists or if the empty state screen should be displayed.
     */
    getCurrentPayrollRun: builder.query<
      any,
      {
        frequency: "monthly" | "weekly" | "biweekly" | "hourly";
        referenceDate?: string;
        month?: number;
        year?: number;
      }
    >({
      query: (params) => ({
        url: "/payroll/runs/current",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    /**
     * Fetches the general summary details of a specific payroll run by its ID.
     */
    getPayrollRunById: builder.query<PayrollRunSummary, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}`,
        method: "GET",
      }),
      providesTags: ["Payroll"],
    }),

    /**
     * Retrieves the paginated table rows representing individual employee payroll summaries for a specific run.
     */
    getPayrollRunItems: builder.query<
      any,
      GetPayrollRunItemsParams
    >({
      query: ({ id, ...params }) => ({
        url: `/payroll/runs/${id}/items`,
        method: "GET",
        params,
      }),

      providesTags: ["Payroll"],
    }),

    /**
     * Creates a new employee payroll loan application.
     */
    createPayrollLoan: builder.mutation<
      SuccessResponse<any>,
      CreatePayrollLoanDto
    >({
      query: (body) => ({
        url: "/payroll/loans",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Payroll"],
    }),

    /**
     * Adds a loan to a specific payroll run.
     */
    addPayrollLoanToRun: builder.mutation<
      any,
      {
        runId: number;
        body: {
          employeeId: number;
          loanId: number;
          amount: number;
          notes?: string;
        };
      }
    >({
      query: ({ runId, body }) => ({
        url: `/payroll/runs/${runId}/loans`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Update (override) a loan application (applied amount / notes)
     * PATCH /payroll/loan-applications/{applicationId}
     */
    updateLoanApplication: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: { appliedAmount?: number; notes?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/loan-applications/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Freezes an open payroll run, locking it from further manual modifications or additions.
     */
    freezePayrollRun: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}/freeze`,
        method: "PATCH",
      }),

      invalidatesTags: ["Payroll"],
    }),

    /**
     * Reopen a frozen payroll run before submission.
     * PATCH /payroll/runs/{id}/reopen
     */
    reopenPayrollRun: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}/reopen`,
        method: "PATCH",
      }),
      invalidatesTags: ["Payroll"],
    }),

    /**
     * Submits selected employee payroll rows to the administration for review and approval.
     */
    submitPayrollEmployees: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: SubmitPayrollEmployeesDto }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/runs/${id}/submit`,
        method: "POST",
        body,
      }),

      invalidatesTags: ["Payroll"],
    }),

    /**
     * Retrieves all payroll runs that are currently pending admin review and approval.
     */
    getPayrollApprovals: builder.query<PayrollRunSummary[], void>({
      query: () => ({
        url: "/payroll/approvals",
        method: "GET",
      }),
      providesTags: ["Payroll"],
    }),

    /**
     * Approves all submitted employee rows inside a specific payroll run at once.
     */
    approveAllPayroll: builder.mutation<
      SuccessResponse<any>,
      { id: number; body?: { note?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/runs/${id}/approve-all`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, arg) => [
        { type: "Payroll", id: arg.id },
      ],
    }),

    /**
     * Rejects an employee's payroll item row and requests corrections/changes from HR.
     */
    requestPayrollChange: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: { note?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/items/${id}/request-change`,
        method: "POST",
        body,
      }),

      invalidatesTags: ["Payroll"],
    }),

    /**
     * Lists payroll runs that have been fully approved and are ready for bank payout.
     */
    getPayrollPayouts: builder.query<
      GetPayrollPayoutsResponse,
      GetPayrollRunItemsParams
    >({
      query: (params) => ({
        url: "/payroll/payouts",
        method: "GET",
        params,
      }),

      providesTags: ["Payroll"],
    }),

    /**
     * Generates and exports a CSV bank clearing/payout file for the selected payroll run.
     */
    exportBankFile: builder.mutation<ExportBankFileResponse, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}/export-bank-file`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    downloadPayrollFinanceTemplate: builder.query<Blob, void>({
      query: () => ({
        url: "/payroll/finance/sheets/template",
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    importPayrollFinanceSheet: builder.mutation<SuccessResponse<any>, FormData>({
      query: (body) => ({
        url: "/payroll/finance/sheets/import",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    exportPayrollFinanceSheet: builder.query<Blob, PayrollFinanceSheetsExportParams>({
      query: ({ runId, format }) => ({
        url: "/payroll/finance/sheets/export",
        method: "GET",
        params: { runId, format },
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    exportPayrollRunPayslipsZip: builder.query<Blob, number>({
      query: (runId) => ({
        url: `/payroll/finance/runs/${runId}/payslips/export`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    getPayrollFinanceImportBatches: builder.query<
      SuccessResponse<PaginatedData<PayrollFinanceImportBatch>>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/payroll/finance/import-batches",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    /**
     * Marks all approved payroll items within a specific run as officially paid.
     */
    payAllPayroll: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}/pay-all`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    // get payroll approvals admin
    getPayrollApprovalsAdmin: builder.query<
      IPayrollRunsResponse,
      {
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: "ASC" | "DESC";
        frequency?: "monthly" | "biweekly" | "weekly" | "hourly";
        status?:
          | "open"
          | "frozen"
          | "submitted"
          | "partially_approved"
          | "approved"
          | "payout_queued"
          | "partially_paid"
          | "paid"
          | "cancelled";
        periodStart?: string;
        periodEnd?: string;
        reviewState?:
          | "all"
          | "pending_review"
          | "decided"
          | "changed"
          | "payout_ready";
        search?: string;
        month?: number;
        year?: number;
        needsReview?: boolean;
        hasChangeRequests?: boolean;
      }
    >({
      query: (params) => ({
        url: "/payroll/admin/runs",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    // /payroll/admin/runs/{runId}
    getPayrollRunByIdAdmin: builder.query<IPayrollRunByIdAdminResponse, number>(
      {
        query: (id) => ({
          url: `/payroll/admin/runs/${id}`,
          method: "GET",
        }),
        providesTags: ["Payroll"],
      },
    ),

    submitPayrollReview: builder.mutation<
      { success: boolean; message: string },
      { runId: number; body: ISubmitPayrollReviewRequest }
    >({
      query: ({ runId, body }) => ({
        url: `/payroll/runs/${runId}/submit-review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),

    payouts: builder.query<
      SuccessResponse<PaginatedData<IPayrollRunItem>>,
      {
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: "ASC" | "DESC";
        frequency?: "monthly" | "biweekly" | "weekly" | "hourly";
        showAll?: boolean;
      }
    >({
      query: (params) => ({
        url: "/payroll/payouts",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    // Get payroll payout rows
    getPayrollRunItemsPayout: builder.query<
      IPayrollRunByIdAdminResponse,
      {
        id: number;
        page?: number;
        limit?: number;
        q?: string;
        status?: "approved" | "queued" | "paid";
      }
    >({
      query: (params) => ({
        url: `/payroll/runs/${params.id}/payout`,
        method: "GET",
        params: {
          page: params.page,
          limit: params.limit,
          q: params.q,
          status: params.status,
        },
      }),
      providesTags: ["Payroll"],
    }),

    markPayrollItemAsPaid: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/items/${id}/mark-paid`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    payAllroll: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/runs/${id}/queue-all`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    getPayslipPreview: builder.query<Blob, number>({
      query: (id) => ({
        url: `/payroll/items/${id}/payslip/preview`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    downloadPayslip: builder.query<Blob, number>({
      query: (id) => ({
        url: `/payroll/items/${id}/payslip/download`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    sendPayslipEmail: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/payroll/items/${id}/payslip/send`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    sendAllPayslipsEmail: builder.mutation<SuccessResponse<any>, number>({
      query: (runId) => ({
        url: `/payroll/runs/${runId}/payslips/send-all`,
        method: "POST",
      }),
      invalidatesTags: ["Payroll"],
    }),

    getMyPayslips: builder.query<
      SuccessResponse<PaginatedData<MyPayslipItem>>,
      GetMyPayslipsParams
    >({
      query: (params) => ({
        url: "/payroll/me/payslips",
        method: "GET",
        params,
      }),
      providesTags: ["Payroll"],
    }),

    getMyPayslipPreview: builder.query<Blob, number>({
      query: (id) => ({
        url: `/payroll/me/payslips/${id}/preview`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    downloadMyPayslip: builder.query<Blob, number>({
      query: (id) => ({
        url: `/payroll/me/payslips/${id}/download`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useUpdatePayrollMutation,
  useUpdatePayrollAdjustmentMutation,
  useDeletePayrollAdjustmentMutation,
  useGetPayrollRunsQuery,
  useStartPayrollRunMutation,
  useAddPayrollAdjustmentMutation,
  useGetCurrentPayrollRunQuery,
  useGetPayrollItemByIdQuery,
  useGetPayrollRunByIdQuery,
  useGetPayrollRunItemsQuery,
  useCreatePayrollLoanMutation,
  useAddPayrollLoanToRunMutation,
  useUpdateLoanApplicationMutation,
  useReopenPayrollRunMutation,
  useFreezePayrollRunMutation,
  usePayAllPayrollMutation,
  useSubmitPayrollEmployeesMutation,
  useGetPayrollApprovalsQuery,
  useApproveAllPayrollMutation,
  useRequestPayrollChangeMutation,
  useGetPayrollPayoutsQuery,
  useExportBankFileMutation,
  useLazyDownloadPayrollFinanceTemplateQuery,
  useImportPayrollFinanceSheetMutation,
  useLazyExportPayrollFinanceSheetQuery,
  useLazyExportPayrollRunPayslipsZipQuery,
  useGetPayrollFinanceImportBatchesQuery,
  useGetPayrollApprovalsAdminQuery,
  useGetPayrollRunByIdAdminQuery,
  useSubmitPayrollReviewMutation,
  usePayoutsQuery,
  useGetPayrollRunItemsPayoutQuery,
  useMarkPayrollItemAsPaidMutation,
  usePayAllrollMutation,
  useGetPayslipPreviewQuery,
  useDownloadPayslipQuery,
  useLazyDownloadPayslipQuery,
  useSendPayslipEmailMutation,
  useSendAllPayslipsEmailMutation,
  useGetMyPayslipsQuery,
  useGetMyPayslipPreviewQuery,
  useLazyDownloadMyPayslipQuery,
} = payrollApi;
