"use client";
import { useEffect, useState, type ReactNode } from "react";
import { LoadingState, useSuite } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
/** Reset domain caches and drafts before a new workspace/person/CRM grant renders its records. */
export default function CrmScopeGate({ children }: { children: ReactNode }) {
  const suite = useSuite(),
    context = suite.snapshot,
    dispatch = useAppDispatch(),
    scope = context
      ? JSON.stringify([
          context.realm,
          context.workspace.id,
          context.actor.userId,
          context.actor.effectiveUserId,
          context.actor.readOnly,
          context.member.accessEpoch,
          context.tools.crm?.access,
          context.tools.crm?.roles,
          context.tools.crm?.canWrite,
        ])
      : "",
    [ready, setReady] = useState(scope);
  useEffect(() => {
    if (ready !== scope) {
      dispatch(baseApi.util.resetApiState());
      setReady(scope);
    }
  }, [scope, ready, dispatch]);
  return ready === scope ? <>{children}</> : <LoadingState rows={4} />;
}
