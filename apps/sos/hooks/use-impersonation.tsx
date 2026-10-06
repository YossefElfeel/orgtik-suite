"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/redux/app/hooks";
import { getImpersonatedByFromToken } from "@/lib/jwt";

function useImpersonation() {
  const accessToken = useAppSelector((state) => state.auth.tokens?.accessToken);
  const user = useAppSelector((state) => state.auth.user);

  const impersonatedBy = useMemo(
    () => getImpersonatedByFromToken(accessToken),
    [accessToken]
  );

  const isImpersonating = impersonatedBy !== null;

  const adminDisplayName = impersonatedBy
    ? [impersonatedBy.firstName, impersonatedBy.lastName].filter(Boolean).join(" ") ||
      impersonatedBy.email ||
      impersonatedBy.username ||
      `Admin #${impersonatedBy.id}`
    : null;

  const targetDisplayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : null;

  return {
    isImpersonating,
    impersonatedBy,
    adminDisplayName,
    targetDisplayName,
  };
}

export default useImpersonation;
