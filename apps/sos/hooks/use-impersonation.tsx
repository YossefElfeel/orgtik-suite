"use client";

import { useAppSelector } from "@/redux/app/hooks";

function useImpersonation() {
  const user = useAppSelector((state) => state.auth.user);
  const context = useAppSelector((state) => state.auth.workspaceContext);
  const impersonatedBy = context?.actor.readOnly && context.actor.userId !== context.actor.effectiveUserId ? { id: context.actor.userId } : null;

  const isImpersonating = impersonatedBy !== null;

  const adminDisplayName = null;

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
