import { baseApi } from "@/redux/app/baseApi";
import { PaginationOptions, SuccessResponse } from "@/types";
import type {
  AddTicketNoteDTO,
  CreateTicketDTO,
  Ticket,
  TicketAssigneeUser,
  TicketCustomerListItem,
  TicketDetail,
  TicketNote,
  TicketNotesQueryArg,
  TicketsPaginated,
  TicketsQueryParams,
  UpdateTicketDTO,
} from "@/types/tickets";

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get tickets list (scope aware, includes statusCounts in meta)
    getTickets: builder.query<
      SuccessResponse<TicketsPaginated<Ticket>>,
      TicketsQueryParams
    >({
      query: (params) => ({
        url: "/tickets",
        method: "GET",
        params,
      }),
      providesTags: ["Tickets"],
    }),
    // get single ticket details
    getTicket: builder.query<SuccessResponse<TicketDetail>, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),
    // create ticket
    createTicket: builder.mutation<
      SuccessResponse<TicketDetail>,
      CreateTicketDTO
    >({
      query: (body) => ({
        url: "/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tickets"],
    }),
    // update ticket (internal users only)
    updateTicket: builder.mutation<
      SuccessResponse<TicketDetail>,
      { id: string; body: UpdateTicketDTO }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tickets"],
    }),
    // get ticket notes (newest first, paginated from the newest page backwards)
    getTicketNotes: builder.infiniteQuery<
      SuccessResponse<TicketsPaginated<TicketNote>>,
      TicketNotesQueryArg,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPage.data.meta.hasNext ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg: { ticketId, limit }, pageParam }) => ({
        url: `/tickets/${ticketId}/notes`,
        method: "GET",
        params: { page: pageParam, limit },
      }),
      providesTags: ["Tickets"],
    }),
    // add ticket note with an optional attachment (multipart/form-data)
    addTicketNote: builder.mutation<
      SuccessResponse<TicketNote>,
      AddTicketNoteDTO
    >({
      query: ({ ticketId, note, file }) => {
        const formData = new FormData();
        formData.append("note", note);
        if (file) formData.append("file", file);

        return {
          url: `/tickets/${ticketId}/notes`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Tickets"],
    }),
    // list active admins, managers, and employees available for assignment
    getTicketUsers: builder.query<SuccessResponse<TicketAssigneeUser[]>, void>({
      query: () => ({
        url: "/tickets/users",
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),
    // temporary: customer lookup for Open New Ticket (move to customersApi later)
    getTicketCustomers: builder.query<
      SuccessResponse<TicketsPaginated<TicketCustomerListItem>>,
      PaginationOptions
    >({
      query: (params) => ({
        url: "/customers",
        method: "GET",
        params,
      }),
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,

  useGetTicketNotesInfiniteQuery,
  useAddTicketNoteMutation,

  useGetTicketUsersQuery,
  useGetTicketCustomersQuery,
} = ticketsApi;
