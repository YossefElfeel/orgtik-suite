"use client";
import { fetchBaseQuery, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { platformApi, type PlatformError, type WorkspaceRole } from "./platformApi";
import { API_URL } from "@/constants/env";
import type { SessionTokens, WorkspaceContext } from "@orgtik/ui/auth";

export type InvitationMetadata = {
  id: string;
  workspace: { id: string; name: string };
  email: string;
  role: WorkspaceRole;
  tools: string[];
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  requiresSignIn: boolean;
  recipientState: "existing" | "pending_activation" | "new" | "inactive";
};
export type InvitationAcceptance = { workspaceId: string; userId: number; replayed: boolean; tokens: SessionTokens; workspaceContext: WorkspaceContext };
export type AcceptInvitation = { token: string; operationId: string; accessToken?: string; name?: string; password?: string };
const publicQuery = fetchBaseQuery({ baseUrl: `${API_URL.replace(/\/api\/?$/, "")}/v1/public/invitations` });
function failure(error: FetchBaseQueryError): PlatformError {
  if (typeof error.status !== "number") return { status: "offline", code: "offline", message: "" };
  const body = error.data as { code?: string; message?: string; error?: { code?: string; message?: string } } | undefined;
  return { status: error.status, code: body?.error?.code || body?.code || "invitation_unavailable", message: body?.error?.message || body?.message || "" };
}
export const invitationsApi = platformApi.injectEndpoints({
  endpoints: builder => ({
    workspaceInvitation: builder.query<InvitationMetadata, string>({
      // Public lookup must not rotate or erase credentials for an unrelated workspace.
      queryFn: async (token, api, extra) => {
        const result = await publicQuery(`/${encodeURIComponent(token)}`, api, extra);
        if (result.error) return { error: failure(result.error) };
        const data = (result.data as { data?: InvitationMetadata } | undefined)?.data;
        return data ? { data } : { error: { status: 503, code: "invitation_unavailable", message: "" } };
      },
    }),
    acceptWorkspaceInvitation: builder.mutation<InvitationAcceptance, AcceptInvitation>({
      queryFn: async ({ token, operationId, accessToken, name, password }, api, extra) => {
        const args: FetchArgs = { url: `/${encodeURIComponent(token)}/accept`, method: "POST", headers: { "Idempotency-Key": operationId, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: { ...(name ? { name } : {}), ...(password ? { password } : {}) } };
        const result = await publicQuery(args, api, extra);
        if (result.error) return { error: failure(result.error) };
        const data = (result.data as { data?: InvitationAcceptance } | undefined)?.data;
        return data ? { data } : { error: { status: 503, code: "invitation_unavailable", message: "" } };
      },
      // The component stages returned tokens until an explicit Open workspace action.
    }),
  }),
});
export const { useWorkspaceInvitationQuery, useAcceptWorkspaceInvitationMutation } = invitationsApi;
