"use client";
import { baseApi } from '@/redux/app/baseApi';
import { platformApi } from './platformApi';
import type { SuccessResponse } from '@/types';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled' | 'superseded';
export type MockMail = {
  id: string; workspaceId: string; workspaceName?: string; to: string; template: string;
  at: string; delivery: 'mock'; invitationId?: string; invitationStatus?: InvitationStatus;
  expiresAt?: string; invitePath?: string; subject?: string; message?: string;
};
export type InvitationDelivery = { invitationId: string; status: InvitationStatus; expiresAt: string; delivery: 'mock'; invitePath?: string };
const recipientApi = baseApi.enhanceEndpoints({ addTagTypes: ['MockMailbox'] }).injectEndpoints({
  endpoints: builder => ({ getRecipientMailbox: builder.query<SuccessResponse<MockMail[]>, void>({ query: () => '/auth/mailbox', providesTags: ['MockMailbox'] }) }),
});
const workspaceMailboxApi = platformApi.injectEndpoints({ endpoints: builder => ({
  getWorkspaceMailbox: builder.query<MockMail[], void>({ query: () => '/mailbox', providesTags: ['Team', 'Notifications'] }),
  getInvitationDelivery: builder.query<InvitationDelivery, string>({ query: id => `/invitations/${encodeURIComponent(id)}/delivery`, providesTags: ['Team'] }),
}) });
export const { useGetRecipientMailboxQuery } = recipientApi;
export const { useGetWorkspaceMailboxQuery, useLazyGetInvitationDeliveryQuery } = workspaceMailboxApi;
