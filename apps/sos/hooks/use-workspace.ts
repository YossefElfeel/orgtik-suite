"use client";
// The workspace the person is working in (USR-00): who they are there, its tools and the one banner,
// from /v1/app/me. Switching sets the ot-workspace cookie and refetches everything from the
// platform, so no screen shows the previous workspace's data.
import { useCallback } from "react";
import { setCookie } from "cookies-next";
import { useAppDispatch } from "@/redux/app/hooks";
import { platformApi, useAppMeQuery, WORKSPACE_COOKIE } from "@/redux/features/platform/platformApi";
import useUser from "./use-user";

export default function useWorkspace() {
  const { accessToken } = useUser();
  const dispatch = useAppDispatch();
  const me = useAppMeQuery(undefined, { skip: !accessToken });
  const switchTo = useCallback(
    (id: string) => {
      setCookie(WORKSPACE_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      dispatch(platformApi.util.resetApiState());
    },
    [dispatch],
  );
  const role = me.data?.workspace.role;
  return {
    me: me.data,
    isLoading: me.isLoading,
    error: me.error,
    refetch: me.refetch,
    role,
    /** Owner: billing, plans and payments (spec 05 §1). */
    isOwner: role === "owner",
    /** Owner or admin: the team and the workspace's tools. */
    isAdmin: role === "owner" || role === "admin",
    switchTo,
  };
}
