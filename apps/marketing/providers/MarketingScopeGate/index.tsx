"use client";
import { useEffect, useState, type ReactNode } from "react";
import { LoadingState, useSuite } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { resetForm } from "@/redux/features/campaigns/campaignFormSlice";
export default function MarketingScopeGate({
  children,
}: {
  children: ReactNode;
}) {
  const suite = useSuite(),
    context = suite.snapshot,
    dispatch = useAppDispatch(),
    scope = context
      ? JSON.stringify([
          context.realm,
          context.workspace.id,
          context.actor.effectiveUserId,
          context.actor.readOnly,
          context.member.accessEpoch,
          context.tools.marketing?.roles,
          context.tools.marketing?.access,
          context.tools.marketing?.canWrite,
        ])
      : "",
    [ready, setReady] = useState(scope);
  useEffect(() => {
    if (ready !== scope) {
      dispatch(baseApi.util.resetApiState());
      dispatch(resetForm());
      setReady(scope);
    }
  }, [ready, scope, dispatch]);
  return ready === scope ? <>{children}</> : <LoadingState rows={4} />;
}
