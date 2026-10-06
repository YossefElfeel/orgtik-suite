"use client";
import { useMeQuery } from "@/store/api";

/** What the signed-in person may do, from /v2/admin/me. The API enforces it again on every call. */
export function useCan() {
  const { data } = useMeQuery();
  const set = new Set(data?.permissions ?? []);
  return (permission: string) => set.has(permission);
}
