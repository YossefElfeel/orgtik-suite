"use client";
import { useMeQuery } from "@/store/api";
import { useClientSession } from "@orgtik/ui/auth";

/** What the signed-in person may do, from /v2/admin/me. The API enforces it again on every call. */
export function useCan() {
  const { data } = useMeQuery();
  const session = useClientSession();
  const verified = session?.workspaceContext ? [] : session?.staffAccess?.permissions.wm || [];
  const set = new Set((data?.permissions ?? []).filter(permission => verified.includes(permission)));
  return (permission: string) => set.has(permission);
}
