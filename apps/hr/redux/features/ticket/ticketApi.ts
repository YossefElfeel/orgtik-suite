import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, PaginationOptions, SuccessResponse } from "@/types";
import { ITicket, ITicketActivity, ITicketDetail, ITicketDTO, ITicketMessage, ITicketStats, TicketStatus } from "@/types/ticket";

const TicketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<SuccessResponse<PaginatedData<ITicket>>, PaginationOptions>({
      query: (params) => ({
        url: "/tickets",
        params,
      }),
      providesTags: ["Ticket"],
    }),
    getTicketById: builder.query<SuccessResponse<ITicketDetail>, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
      }),
      providesTags: ["Ticket"],
    }),
    getMyTickets: builder.query<SuccessResponse<PaginatedData<ITicket>>, PaginationOptions>({
      query: (params) => ({
        url: "/tickets/my",
        params,
      }),
      providesTags: ["Ticket"],
    }),
    getTicketStats: builder.query<SuccessResponse<{ cards: ITicketStats[] }>, void>({
      query: () => ({
        url: "/tickets/stats",
      }),
      providesTags: ["Ticket"],
    }),
    createTicket: builder.mutation<SuccessResponse<ITicket>, FormData>({
      query: (formData) => ({
        url: "/tickets",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Ticket"],
    }),
    deleteTicket: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ticket"],
    }),
    // assign user to ticket
    assignUserToTicket: builder.mutation<SuccessResponse<ITicket>, { ticketId: string; assignedUserIds: string[] }>({
      query: ({ ticketId, assignedUserIds }) => ({
        url: `/tickets/${ticketId}/assign`,
        method: "PATCH",
        body: { assignedUserIds },
      }),
      invalidatesTags: ["Ticket"],
    }),
    // update status of ticket
    updateTicketStatus: builder.mutation<SuccessResponse<ITicket>, { ticketId: string; status: TicketStatus }>({
      query: ({ ticketId, status }) => ({
        url: `/tickets/${ticketId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Ticket"],
    }),

    // ###### message api ######

    addMessageToTicket: builder.mutation<SuccessResponse<ITicketMessage>, { ticketId: string; body: FormData }>({
      query: ({ ticketId, body }) => ({
        url: `/tickets/${ticketId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketMessage"],
    }),
    getMessagesByTicketId: builder.query<SuccessResponse<PaginatedData<ITicketMessage>>, { ticketId: string; paginationOptions: PaginationOptions }>({
      query: ({ ticketId, paginationOptions }) => ({
        url: `/tickets/${ticketId}/messages`,
        params: { ...paginationOptions, order: "desc" },
      }),
      providesTags: ["TicketMessage"],
    }),
    getTicketActivityLogs: builder.query<SuccessResponse<ITicketActivity[]>, string>({
      query: (ticketId) => ({
        url: `/tickets/${ticketId}/activity-logs`,
      }),
      providesTags: ["Ticket"],
    }),

  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useAssignUserToTicketMutation,
  useUpdateTicketStatusMutation,
  useGetTicketStatsQuery,
  useDeleteTicketMutation,
  // ###### message api ######
  useAddMessageToTicketMutation,
  useGetMessagesByTicketIdQuery,
  useGetTicketActivityLogsQuery,
} = TicketApi;
