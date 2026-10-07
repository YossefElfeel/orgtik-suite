"use client";
import { useMeQuery } from "@/store/api";
import { useClientSession } from "@orgtik/ui/auth";

/**
 * What the signed-in staff member may do, from /v1/admin/me (spec 02's matrix). The API enforces it
 * again on every call. "x:edit" is also granted by "x:full".
 */
export function useCan() {
  const { data } = useMeQuery();
  const session = useClientSession();
  const verified = session?.workspaceContext ? [] : session?.staffAccess?.permissions.admin || [];
  const set = new Set((data?.permissions ?? []).filter(permission => verified.includes(permission)));
  return (permission: string) => set.has(permission) || (permission.endsWith(":edit") && set.has(permission.replace(/:edit$/, ":full")));
}
