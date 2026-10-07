"use client";
// The workspace's purchased capacity, assigned access and pending reservations are separate.
import { platformApi, type WorkspaceRole } from "./platformApi";

export type MemberStatus = "active" | "invited" | "cancelled" | "expired";
export type TeamMember = {
  /** Stable workspace membership ID; person identity and invitations have their own IDs. */
  id: string;
  userKey: string | null;
  name: string;
  email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  /** Explicit current grants; null is accepted only as legacy current-tool selection input. */
  tools: string[] | null;
  joinedAt: string | null;
  invitationId?: string | null;
};
export type PerUserLine = { id: string; tool: string; unit: number; currency: string };
export type SeatModel = "A" | "B";
export type PerToolSeats = { capacity: number | null; assigned: number; reserved: number; available: number | null };
export type Team = {
  items: TeamMember[];
  meta: { seats: number; seatModel: SeatModel; perUserLines: PerUserLine[]; perTool: Record<string, PerToolSeats> };
};
export type InviteBody = { email: string; role: Exclude<WorkspaceRole, "owner">; tools: string[] | null; operationId: string };
export type Invited = { id: string; email: string; role: WorkspaceRole; tools: string[]; status: 'pending' | 'accepted' | 'cancelled' | 'expired'; expiresAt: string; operationId?: string };
export type MemberPatch = { id: string; role?: Exclude<WorkspaceRole, "owner">; tools?: string[] | null; status?: "removed" };

export const teamApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    getTeam: b.query<Team, void>({ query: () => "/team", providesTags: ["Team"] }),
    inviteMember: b.mutation<Invited, InviteBody>({
      query: ({ operationId, ...body }) => ({ url: "/team/invite", method: "POST", headers: { 'Idempotency-Key': operationId }, body }),
      invalidatesTags: ["Team"],
    }),
    getInvitations: b.query<Invited[], void>({ query: () => '/invitations', providesTags: ['Team'] }),
    invitationAction: b.mutation<Invited, { id: string; action: 'resend' | 'cancel'; operationId: string }>({
      query: ({ id, action, operationId }) => ({ url: `/invitations/${encodeURIComponent(id)}/${action}`, method: 'POST', headers: { 'Idempotency-Key': operationId }, body: {} }),
      invalidatesTags: ['Team'],
    }),
    updateMember: b.mutation<TeamMember, MemberPatch>({
      query: ({ id, ...body }) => ({ url: `/team/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: ["Team", "Me"],
    }),
  }),
});

export const { useGetTeamQuery, useInviteMemberMutation, useUpdateMemberMutation, useGetInvitationsQuery, useInvitationActionMutation } = teamApi;
