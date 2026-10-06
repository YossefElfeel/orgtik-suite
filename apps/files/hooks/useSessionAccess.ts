"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import type { SessionAccess } from "@/lib/permissions";

export function useSessionAccess(): SessionAccess | null {
  const user = useSelector((state: RootState) => state.auth.user);

  return useMemo(() => {
    if (user?.id === null || user?.id === undefined) return null;

    const roles = user.roles ?? [];
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = isSuperAdmin || String(user.userType) === "admin";

    return {
      userId: user.id,
      isAdmin,
      isSuperAdmin,
    };
  }, [user]);
}
