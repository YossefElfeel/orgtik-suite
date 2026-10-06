"use client";
// ADM-26 support tickets (permission tickets:*).
import { api, qs, type ListArgs, type Page } from "./api";

export type TicketState = "open" | "in_progress" | "waiting_for_you" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketMessage = { by: "staff" | "customer"; author: string; authorName?: string; at: string; text: string; internal?: boolean };
export type Ticket = {
  id: string;
  number: string;
  workspaceId: string;
  workspace?: string;
  openedBy: string;
  subject: string;
  category: string;
  priority: TicketPriority | string;
  state: TicketState;
  assignee: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  autoCloseAt?: string;
  resolvedAt?: string;
  reopenUntil?: string;
  messages: TicketMessage[];
};
export type TicketAction =
  | { action: "reply"; text: string; internal?: boolean; waitForCustomer?: boolean }
  | { action: "assign"; assignee: string }
  | { action: "priority"; priority: string }
  | { action: "resolve" | "close" };

const supportApi = api.injectEndpoints({
  endpoints: (b) => ({
    tickets: b.query<Page<Ticket>, ListArgs>({ query: (args) => `/tickets${qs(args)}`, providesTags: ["Tickets"] }),
    ticket: b.query<Ticket, string>({ query: (id) => `/tickets/${id}`, providesTags: (_r, _e, id) => [{ type: "Tickets", id }] }),
    ticketAction: b.mutation<Ticket, { id: string; body: TicketAction }>({
      query: ({ id, body }) => ({ url: `/tickets/${id}/actions`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => ["Tickets", { type: "Tickets", id }, "Overview"],
    }),
  }),
});

export const { useTicketsQuery, useTicketQuery, useTicketActionMutation } = supportApi;
