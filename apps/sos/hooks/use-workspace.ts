"use client";
// The workspace the person is working in (USR-00): who they are there, its tools and the one banner,
// from /v1/app/me. Switching validates membership, receives a new tab-bound family,
// and clears cached data before rendering the selected workspace.
import { useCallback, useEffect, useState } from "react";
import { setCookie } from "cookies-next";
import { useAppDispatch } from "@/redux/app/hooks";
import { useAppMeQuery, WORKSPACE_COOKIE } from "@/redux/features/platform/platformApi";
import useUser from "./use-user";
import { readClientSession, scopesFromContext, switchWorkspace } from "@orgtik/ui/auth";
import { API_URL } from "@/constants/env";
import { switchSession } from "@/redux/features/auth/authThunks";
import type { IUser } from "@/types/user";
import { updateUserAndScopes } from "@/redux/features/auth/authSlice";

export default function useWorkspace() {
  const { accessToken, workspaceContext, user } = useUser();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState(false);
  const dispatch = useAppDispatch();
  const me = useAppMeQuery(undefined, { skip: !accessToken || !workspaceContext, pollingInterval: 30000, refetchOnFocus: true });
  useEffect(() => {
    const fresh = me.data?.workspaceContext;
    if (!fresh || !user || !accessToken || !workspaceContext || readClientSession()?.tokens.accessToken !== accessToken || workspaceContext.workspace.id !== fresh.workspace.id || workspaceContext.actor.userId !== fresh.actor.userId || workspaceContext.actor.effectiveUserId !== fresh.actor.effectiveUserId || workspaceContext.actor.readOnly !== fresh.actor.readOnly || JSON.stringify(fresh) === JSON.stringify(workspaceContext)) return;
    dispatch(updateUserAndScopes({ user, workspaceContext: fresh, scopes: scopesFromContext(fresh).map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
  }, [me.data, accessToken, workspaceContext, user, dispatch]);
  const switchTo = useCallback(
    async (id: string) => {
      if (!accessToken || switching) return;
      setSwitching(true); setSwitchError(false);
      try {
        const session = await switchWorkspace<IUser>(API_URL, accessToken, id);
        if (readClientSession()?.tokens.accessToken !== accessToken) return;
        dispatch(switchSession({ ...session, scopes: session.scopes.map(s => ({ ...s, permissions: s.permissions || [] })) }));
        setCookie(WORKSPACE_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      } catch { setSwitchError(true); }
      finally { setSwitching(false); }
    },
    [dispatch, accessToken, switching],
  );
  // A skipped RTK query can retain its last result after entering staff mode.
  // Only expose data that still belongs to this tab's verified workspace actor.
  const current = workspaceContext && me.data?.workspace.id === workspaceContext.workspace.id &&
    me.data.workspaceContext?.actor.userId === workspaceContext.actor.userId &&
    me.data.workspaceContext.actor.effectiveUserId === workspaceContext.actor.effectiveUserId &&
    me.data.workspaceContext.actor.readOnly === workspaceContext.actor.readOnly ? me.data : undefined;
  const role = workspaceContext?.member.role;
  return {
    me: current,
    isLoading: Boolean(workspaceContext) && me.isLoading,
    error: workspaceContext ? me.error : undefined,
    refetch: me.refetch,
    role,
    /** Owner: billing, plans and payments (spec 05 §1). */
    isOwner: role === "owner",
    /** Owner or admin: the team and the workspace's tools. */
    isAdmin: role === "owner" || role === "admin",
    switchTo,
    switching,
    switchError,
  };
}
