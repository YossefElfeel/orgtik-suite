import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  CustomInvoicesPaginated,
  CustomInvoicesQueryParams,
  GenerateInvoicePdfDTO,
  ICreateCustomInvoiceDTO,
  ICustomInvoiceResponse,
  InvoiceDetail,
  InvoiceStats,
  InvoiceTableCounts,
  InvoicesPaginated,
  InvoicesQueryParams,
  MarkCustomInvoicePaidDTO,
  MarkInvoicePaidDTO,
  SendCustomInvoiceDTO,
  VoidInvoiceDTO,
} from "@/types/invoices";

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<
      SuccessResponse<InvoicesPaginated>,
      InvoicesQueryParams
    >({
      query: ({ type, page, limit, q, subscriptionId, search }) => ({
        url: "/invoices",
        method: "GET",
        params: {
          type,
          page,
          limit,
          q: q ?? search,
          subscriptionId,
        },
      }),
      providesTags: ["Invoices"],
    }),
    getInvoiceStatusSummary: builder.query<SuccessResponse<InvoiceStats>, void>(
      {
        query: () => ({
          url: "/invoices/status",
          method: "GET",
        }),
        providesTags: ["Invoices"],
      },
    ),
    getInvoice: builder.query<SuccessResponse<InvoiceDetail>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}`,
        method: "GET",
      }),
      providesTags: ["Invoices"],
    }),
    markInvoicePaid: builder.mutation<
      SuccessResponse<InvoiceDetail>,
      { invoiceId: string; body: MarkInvoicePaidDTO }
    >({
      query: ({ invoiceId, body }) => ({
        url: `/invoices/${invoiceId}/mark-paid`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
    voidInvoice: builder.mutation<
      SuccessResponse<InvoiceDetail>,
      { invoiceId: string; body: VoidInvoiceDTO }
    >({
      query: ({ invoiceId, body }) => ({
        url: `/invoices/${invoiceId}/void`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
    generateInvoicePdf: builder.mutation<Blob, GenerateInvoicePdfDTO>({
      query: (body) => ({
        url: "/invoices/generate-pdf",
        method: "POST",
        body,
        responseHandler: (response) => response.blob(),
      }),
      extraOptions: { skipSuccessToast: true },
    }),
    getInvoiceTableCounts: builder.query<
      SuccessResponse<InvoiceTableCounts>,
      void
    >({
      query: () => ({
        url: "/invoices/table-counts",
        method: "GET",
      }),
      providesTags: ["Invoices"],
    }),
    getCustomInvoices: builder.query<
      SuccessResponse<CustomInvoicesPaginated>,
      CustomInvoicesQueryParams
    >({
      query: ({ page, limit, search }) => ({
        url: "/invoices",
        method: "GET",
        params: {
          invoiceType: "custom",
          page,
          limit,
          search,
        },
      }),
      providesTags: ["Invoices"],
    }),
    getCustomInvoice: builder.query<
      SuccessResponse<ICustomInvoiceResponse>,
      { invoiceId: string }
    >({
      query: ({ invoiceId }) => ({
        url: `/invoices/${invoiceId}`,
        method: "GET",
      }),
      providesTags: ["Invoices"],
    }),
    createCustomInvoice: builder.mutation<
      SuccessResponse<ICustomInvoiceResponse>,
      ICreateCustomInvoiceDTO
    >({
      query: (body) => ({
        url: "/invoices/custom",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
    updateCustomInvoice: builder.mutation<
      SuccessResponse<ICustomInvoiceResponse>,
      { invoiceId: string; body: ICreateCustomInvoiceDTO }
    >({
      query: ({ invoiceId, body }) => ({
        url: `/invoices/${invoiceId}/custom`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
    deleteCustomInvoice: builder.mutation<SuccessResponse<void>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/custom`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoices"],
    }),
    markCustomInvoicePaidManually: builder.mutation<
      SuccessResponse<ICustomInvoiceResponse>,
      { invoiceId: string; body: MarkCustomInvoicePaidDTO }
    >({
      query: ({ invoiceId, body }) => {
        const formData = new FormData();
        if (body.paidAt) formData.append("paidAt", body.paidAt);
        if (body.paymentReference) {
          formData.append("paymentReference", body.paymentReference);
        }
        if (body.notes) formData.append("notes", body.notes);
        if (body.paymentProof)
          formData.append("paymentProof", body.paymentProof);

        return {
          url: `/invoices/${invoiceId}/mark-paid-manually`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Invoices"],
    }),
    sendCustomInvoice: builder.mutation<
      SuccessResponse<void>,
      { invoiceId: string; body: SendCustomInvoiceDTO }
    >({
      query: ({ invoiceId, body }) => ({
        url: `/invoices/${invoiceId}/custom/send`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
    downloadCustomInvoicePdf: builder.mutation<Blob, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/custom/generate-pdf`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      extraOptions: { skipSuccessToast: true },
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceStatusSummaryQuery,
  useGetInvoiceQuery,
  useMarkInvoicePaidMutation,
  useVoidInvoiceMutation,
  useGenerateInvoicePdfMutation,
  useGetInvoiceTableCountsQuery,
  useGetCustomInvoicesQuery,
  useGetCustomInvoiceQuery,
  useCreateCustomInvoiceMutation,
  useUpdateCustomInvoiceMutation,
  useDeleteCustomInvoiceMutation,
  useMarkCustomInvoicePaidManuallyMutation,
  useSendCustomInvoiceMutation,
  useDownloadCustomInvoicePdfMutation,
} = invoicesApi;
