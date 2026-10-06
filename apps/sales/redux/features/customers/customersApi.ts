import type { FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue } from "@reduxjs/toolkit/query";
import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import type {
  Customer,
  CustomerDetail,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  ScheduleMeetingDTO,
  CustomersPaginated,
  LeadOwner,
  UpdateLeadStatusDTO,
} from "@/types/customers";

// Customers and leads (D-028). One record moves through one pipeline.
//
// Cache tags: the list carries { Customers, LIST } and each record { Customers, id }, so a note or
// a document refetches only that customer, not every list on the screen (SAL-182).
const LIST = { type: "Customers" as const, id: "LIST" };
const one = (id: string) => ({ type: "Customers" as const, id });

export type CustomersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  /** Not filtered by the API yet: the inbox filters these itself, and sends them for when it does. */
  source?: string;
  assignedSalesmanId?: string;
};

/** Thrown by the note mutations when the note is gone (someone else deleted it). */
export const NOTE_GONE = "note_gone";

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/customers (a page of customers and leads; salespeople get their own)
    getCustomers: builder.query<SuccessResponse<CustomersPaginated<Customer>>, CustomersQuery>({
      query: (params) => ({
        url: "/customers",
        method: "GET",
        params,
      }),
      providesTags: (result) => [LIST, ...(result?.data?.items ?? []).map((c) => one(c.id))],
    }),

    // GET /api/customers/profile (the signed-in customer's own record)
    getCustomerProfile: builder.query<SuccessResponse<CustomerDetail>, void>({
      query: () => ({
        url: "/customers/profile",
        method: "GET",
      }),
      providesTags: ["Customers"],
    }),

    // GET /api/customers/:id
    getCustomer: builder.query<SuccessResponse<CustomerDetail>, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [one(id)],
    }),

    // GET /api/salesman (the people a lead can be assigned to; admins and managers)
    getLeadOwners: builder.query<LeadOwner[], void>({
      query: () => ({ url: "/salesman", method: "GET", params: { limit: 200 } }),
      transformResponse: (res: SuccessResponse<{ items: LeadOwner[] }>) =>
        (res?.data?.items ?? []).map((s) => ({ id: String(s.id), fullName: s.fullName, email: s.email })),
      providesTags: ["Salesmen"],
    }),

    // POST /api/customers
    createCustomer: builder.mutation<SuccessResponse<CustomerDetail>, CreateCustomerDTO>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: [LIST, "Salesmen", "Dashboard"],
    }),

    // PUT /api/customers/:id (details, or the owner: assignedSalesmanId)
    updateCustomer: builder.mutation<SuccessResponse<CustomerDetail>, { id: string; body: UpdateCustomerDTO }>({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id, body }) => [one(id), LIST, ...("assignedSalesmanId" in body ? (["Salesmen"] as const) : [])],
    }),

    // DELETE /api/customers/:id (admins and managers; refused while the customer has a login)
    deleteCustomer: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [LIST, "Salesmen", "Dashboard"],
    }),

    // PATCH /api/customers/:id/status { status, lostReason } (D-028)
    // The new stage shows at once in every list and on the record; a refused move puts it back.
    updateStatus: builder.mutation<SuccessResponse<CustomerDetail>, UpdateLeadStatusDTO>({
      query: ({ id, status, lostReason }) => ({
        url: `/customers/${id}/status`,
        method: "PATCH",
        body: status === "lost" ? { status, lostReason } : { status },
      }),
      async onQueryStarted({ id, status, lostReason }, { dispatch, getState, queryFulfilled }) {
        const patches = customersApi.util
          .selectInvalidatedBy(getState(), [one(id)])
          .map(({ endpointName, originalArgs }) => {
            if (endpointName === "getCustomers") {
              return dispatch(
                customersApi.util.updateQueryData("getCustomers", originalArgs as CustomersQuery, (draft) => {
                  const row = draft?.data?.items?.find((c) => c.id === id);
                  if (row) Object.assign(row, { status, lostReason: status === "lost" ? lostReason ?? null : null });
                }),
              );
            }
            if (endpointName === "getCustomer") {
              return dispatch(
                customersApi.util.updateQueryData("getCustomer", originalArgs as string, (draft) => {
                  if (draft?.data) Object.assign(draft.data, { status, lostReason: status === "lost" ? lostReason ?? null : null });
                }),
              );
            }
            return null;
          });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p?.undo());
        }
      },
      invalidatesTags: (_r, _e, { id }) => [one(id), LIST, "Salesmen", "Dashboard"],
    }),

    // POST /api/customers/:id/documents/id
    uploadIdDocument: builder.mutation<SuccessResponse<void>, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/customers/${id}/documents/id`, method: "POST", body: formData };
      },
      invalidatesTags: (_r, _e, { id }) => [one(id)],
    }),

    // DELETE /api/customers/:id/documents/id
    deleteIdDocument: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({ url: `/customers/${id}/documents/id`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [one(id)],
    }),

    // POST /api/customers/:id/documents/business
    uploadBusinessDocument: builder.mutation<SuccessResponse<void>, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/customers/${id}/documents/business`, method: "POST", body: formData };
      },
      invalidatesTags: (_r, _e, { id }) => [one(id)],
    }),

    // DELETE /api/customers/:id/documents/business
    deleteBusinessDocument: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({ url: `/customers/${id}/documents/business`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [one(id)],
    }),

    // POST /api/customers/:id/notes
    createNote: builder.mutation<SuccessResponse<CustomerDetail>, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `/customers/${id}/notes`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: (_r, _e, { id }) => [one(id), LIST],
    }),

    // A note is changed by its id (SAL-076). The API still addresses notes by their place in the
    // list, and new notes go on top, so the place is looked up from the record as it is now, just
    // before the change, and the id travels too for an API that reads it.
    updateNote: builder.mutation<SuccessResponse<CustomerDetail>, { id: string; noteId: string; note: string }>({
      async queryFn({ id, noteId, note }, _api, _extra, baseQuery) {
        const index = await noteIndexOf(baseQuery, id, noteId);
        if (typeof index !== "number") return { error: index };
        const result = await baseQuery({ url: `/customers/${id}/notes`, method: "PUT", body: { noteId, noteIndex: index, note } });
        return result.error ? { error: result.error } : { data: result.data as SuccessResponse<CustomerDetail> };
      },
      invalidatesTags: (_r, _e, { id }) => [one(id)],
    }),

    deleteNote: builder.mutation<SuccessResponse<CustomerDetail>, { id: string; noteId: string }>({
      async queryFn({ id, noteId }, _api, _extra, baseQuery) {
        const index = await noteIndexOf(baseQuery, id, noteId);
        if (typeof index !== "number") return { error: index };
        const result = await baseQuery({ url: `/customers/${id}/notes/${index}`, method: "DELETE", params: { noteId } });
        return result.error ? { error: result.error } : { data: result.data as SuccessResponse<CustomerDetail> };
      },
      invalidatesTags: (_r, _e, { id }) => [one(id)],
    }),

    // POST /api/customers/:id/meeting (a meeting is an activity; a new lead becomes contacted)
    scheduleMeeting: builder.mutation<SuccessResponse<CustomerDetail>, { id: string; body: ScheduleMeetingDTO }>({
      query: ({ id, body }) => ({
        url: `/customers/${id}/meeting`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [one(id), LIST],
    }),

    // GET /api/customers/meetings/all
    getAllMeetings: builder.query<SuccessResponse<Customer[]>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: "/customers/meetings/all",
        method: "GET",
        params,
      }),
      providesTags: [LIST],
    }),
  }),
});

type RawResult = QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;
type RawBaseQuery = (arg: string | FetchArgs) => PromiseLike<RawResult> | RawResult;

async function noteIndexOf(baseQuery: RawBaseQuery, id: string, noteId: string): Promise<number | FetchBaseQueryError> {
  const fresh = await baseQuery({ url: `/customers/${id}`, method: "GET" });
  if (fresh.error) return fresh.error;
  const notes = (fresh.data as SuccessResponse<CustomerDetail> | undefined)?.data?.notes ?? [];
  const index = notes.findIndex((n) => String(n.id) === String(noteId));
  return index >= 0 ? index : { status: 404, data: { code: NOTE_GONE } };
}

export const {
  useGetCustomersQuery,
  useGetCustomerProfileQuery,
  useGetCustomerQuery,
  useGetLeadOwnersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useUpdateStatusMutation,
  useUploadIdDocumentMutation,
  useDeleteIdDocumentMutation,
  useUploadBusinessDocumentMutation,
  useDeleteBusinessDocumentMutation,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useScheduleMeetingMutation,
  useGetAllMeetingsQuery,
} = customersApi;
