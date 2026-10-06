import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  CreateSalesmanDTO,
  CreateSalesmanNoteDTO,
  Salesman,
  SalesmanContractsPaginated,
  SalesmanContractsQueryParams,
  SalesmanCustomersPaginated,
  SalesmanCustomersQueryParams,
  SalesmanDetail,
  SalesmanNote,
  SalesmanPerformanceLabel,
  SalesmenPaginated,
  SalesmenQueryParams,
  UpdateSalesmanDTO,
} from "@/types/salesman";

// "Sign in as" (POST /salesman/:id/sign-in-as) is gone: it swapped the admin's session for the
// salesperson's token (SAL-004). Admins use SOS's read-only View as instead.
export const salesmanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesmen: builder.query<SuccessResponse<SalesmenPaginated>, SalesmenQueryParams | void>({
      query: (params) => ({ url: "/salesman", method: "GET", params: params ?? undefined }),
      providesTags: ["Salesmen"],
    }),
    getSalesman: builder.query<SuccessResponse<SalesmanDetail>, string>({
      query: (id) => ({ url: `/salesman/${id}`, method: "GET" }),
      providesTags: ["Salesmen"],
    }),
    /** The signed-in salesperson's own record (their bank account, for the profile page). */
    getMySalesmanProfile: builder.query<SuccessResponse<SalesmanDetail>, void>({
      query: () => ({ url: "/salesman/profile", method: "GET" }),
      providesTags: ["Salesmen"],
    }),
    createSalesman: builder.mutation<SuccessResponse<Salesman>, CreateSalesmanDTO>({
      query: (body) => ({ url: "/salesman", method: "POST", body }),
      invalidatesTags: ["Salesmen", "Staff"],
    }),
    updateSalesman: builder.mutation<SuccessResponse<SalesmanDetail>, { id: string; body: UpdateSalesmanDTO }>({
      query: ({ id, body }) => ({ url: `/salesman/${id}`, method: "PUT", body }),
      invalidatesTags: ["Salesmen", "Staff"],
    }),
    deleteSalesman: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({ url: `/salesman/${id}`, method: "DELETE" }),
      invalidatesTags: ["Salesmen", "Staff", "Customers"],
    }),
    updateSalesmanPerformance: builder.mutation<SuccessResponse<unknown>, { id: string; performance: SalesmanPerformanceLabel }>({
      query: ({ id, performance }) => ({ url: `/admin/staff/${id}/performance`, method: "PATCH", body: { performance } }),
      invalidatesTags: ["Salesmen", "Staff"],
    }),
    getSalesmanNotes: builder.query<SuccessResponse<SalesmanNote[]>, string>({
      query: (id) => ({ url: `/salesman/${id}/notes`, method: "GET" }),
      providesTags: ["SalesmanNotes"],
    }),
    createSalesmanNote: builder.mutation<SuccessResponse<SalesmanNote>, { id: string; body: CreateSalesmanNoteDTO }>({
      query: ({ id, body }) => ({ url: `/salesman/${id}/notes`, method: "POST", body }),
      invalidatesTags: ["SalesmanNotes"],
    }),
    getSalesmanContracts: builder.query<SuccessResponse<SalesmanContractsPaginated>, SalesmanContractsQueryParams>({
      query: ({ id, ...params }) => ({ url: `/salesman/${id}/contracts`, method: "GET", params }),
      providesTags: ["Salesmen", "Contracts"],
    }),
    getSalesmanCustomers: builder.query<SuccessResponse<SalesmanCustomersPaginated>, SalesmanCustomersQueryParams>({
      query: ({ id, ...params }) => ({ url: `/salesman/${id}/customers`, method: "GET", params }),
      providesTags: ["Salesmen", "Customers"],
    }),
  }),
});

export const {
  useGetSalesmenQuery,
  useGetSalesmanQuery,
  useGetMySalesmanProfileQuery,
  useCreateSalesmanMutation,
  useUpdateSalesmanMutation,
  useDeleteSalesmanMutation,
  useUpdateSalesmanPerformanceMutation,
  useGetSalesmanNotesQuery,
  useCreateSalesmanNoteMutation,
  useGetSalesmanContractsQuery,
  useGetSalesmanCustomersQuery,
} = salesmanApi;
