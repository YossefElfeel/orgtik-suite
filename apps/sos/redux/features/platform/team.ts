"use client";
// The workspace's team and seats (USR-13/14, spec 05 USR-20): /v1/app/team. Seats follow the seat
// model switch (G-04, not decided): "A" counts one workspace seat on every per-user line, "B" bills
// each per-user tool only for the people with access to it. Guests are free.
import { platformApi, type WorkspaceRole } from "./platformApi";

export type MemberStatus = "active" | "invited";
export type TeamMember = {
  /** The person's key, or the email for someone who isn't a local sign-in yet. */
  id: string;
  userKey: string | null;
  name: string;
  email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  /** Tool keys the person can use; null means every tool the workspace has. */
  tools: string[] | null;
  joinedAt: string | null;
};
export type PerUserLine = { id: string; tool: string; unit: number; currency: string };
export type SeatModel = "A" | "B";
export type Team = {
  items: TeamMember[];
  meta: { seats: number; seatModel: SeatModel; perUserLines: PerUserLine[] };
};
export type InviteBody = { email: string; role: Exclude<WorkspaceRole, "owner">; tools: string[] | null };
export type Invited = TeamMember & { seatsAfter: number };
export type MemberPatch = { id: string; role?: Exclude<WorkspaceRole, "owner">; tools?: string[] | null; status?: "removed" };

export const teamApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    getTeam: b.query<Team, void>({ query: () => "/team", providesTags: ["Team"] }),
    inviteMember: b.mutation<Invited, InviteBody>({
      query: (body) => ({ url: "/team/invite", method: "POST", body }),
      invalidatesTags: ["Team"],
    }),
    updateMember: b.mutation<TeamMember, MemberPatch>({
      query: ({ id, ...body }) => ({ url: `/team/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: ["Team", "Me"],
    }),
  }),
});

export const { useGetTeamQuery, useInviteMemberMutation, useUpdateMemberMutation } = teamApi;
