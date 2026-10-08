"use client";
// Support tickets (USR-21..23, spec 05 USR-25): /v1/app/tickets. Admins and the owner see the
// workspace's tickets; everyone else sees the ones they opened. Staff replies come as "OrgTik support".
import { platformApi, type Page } from "./platformApi";

export type TicketCategory = "billing" | "product" | "sales" | "technical" | "other";
export type TicketState = "open" | "in_progress" | "waiting_for_you" | "resolved" | "closed";
export type TicketMessage = { by: "customer" | "staff"; author: string; authorName: string; at: string; text: string };
export type Ticket = {
  id: string;
  number: string;
  openedBy: string;
  subject: string;
  category: TicketCategory;
  priority: string;
  state: TicketState;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reopenUntil?: string;
  autoCloseAt?: string;
  messages: TicketMessage[];
};
export type NewTicket = { subject: string; category: TicketCategory; text: string };

export const supportApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    getTickets: b.query<Page<Ticket>, { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 10 }) => ({ url: "/tickets", params: { page, pageSize } }),
      providesTags: ["Tickets"],
    }),
    getTicket: b.query<Ticket, string>({
      query: (id) => `/tickets/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: "Tickets", id }],
    }),
    createTicket: b.mutation<Ticket, NewTicket>({
      query: (body) => ({ url: "/tickets", method: "POST", body }),
      invalidatesTags: ["Tickets"],
    }),
    ticketAction: b.mutation<Ticket, { id: string; action: "reply"; text: string } | { id: string; action: "resolve" }>({
      query: ({ id, ...body }) => ({ url: `/tickets/${encodeURIComponent(id)}/actions`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Tickets", id }, "Tickets"],
    }),
  }),
});

export const { useGetTicketsQuery, useGetTicketQuery, useCreateTicketMutation, useTicketActionMutation } = supportApi;
