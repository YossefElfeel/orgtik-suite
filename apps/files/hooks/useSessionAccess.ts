"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import type { SessionAccess } from "@/lib/permissions";
import { fileSessionAccess } from "@/lib/session-access";

export function useSessionAccess(): SessionAccess | null {
  const user = useSelector((state: RootState) => state.auth.user);

  return useMemo(() => {
    return fileSessionAccess(user);
  }, [user]);
}
