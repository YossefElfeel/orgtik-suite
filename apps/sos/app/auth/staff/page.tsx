"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState, NoPermissionState } from "@orgtik/ui";
import { readClientSession, useHandoffSession } from "@orgtik/ui/auth";
import { API_URL } from "@/constants/env";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { staffRedirect, staffSessionAllowed } from "@/lib/staff-entry";
import type { IUser } from "@/types/user";

/** Cross-app central management uses an explicit one-use administration code. */
export default function StaffEntryPage() {
  const query = useSearchParams(), router = useRouter(), dispatch = useAppDispatch();
  const auth = useTranslations("Auth"), errors = useTranslations("Errors");
  const first = useRef({ code: query.get("code"), redirect: staffRedirect(query.get("redirect")) });
  const sourceToken = useRef(readClientSession()?.tokens.accessToken ?? null);
  const [accountChanged, setAccountChanged] = useState(false);
  const handoff = useHandoffSession<IUser>(API_URL, "staff:admin", first.current.code);
  const completed = useRef(false);
  const session = handoff.session;
  const allowed = session && staffSessionAllowed(session, "admin", "staff:view");
  useEffect(() => {
    if (!session || !allowed || completed.current) return;
    if ((readClientSession()?.tokens.accessToken ?? null) !== sourceToken.current) { setAccountChanged(true); return; }
    completed.current = true;
    dispatch(switchSession({ ...session, scopes: session.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
    router.replace(first.current.redirect);
  }, [session, allowed, dispatch, router]);
  if (accountChanged) return <ErrorState titleAs="h1" title={auth("accountChanged")} action={<Button onClick={() => router.replace("/")}>{errors("toHome")}</Button>} />;
  if (session && !allowed) return <NoPermissionState titleAs="h1" title={errors("noAccessTitle")} description={errors("noAccessBody")} />;
  if (handoff.error) {
    const expired = [400, 401, 403, 410].includes(handoff.error.status);
    return <ErrorState titleAs="h1" title={auth(expired ? "handoffExpired" : "failed")} description={expired ? auth("handoffSignIn") : undefined} onRetry={expired ? undefined : handoff.retry} action={expired ? <Button onClick={() => router.replace(`/auth/login?mode=staff&target=admin&redirect=${encodeURIComponent(first.current.redirect)}`)}>{auth("submit")}</Button> : undefined} />;
  }
  return <LoadingState rows={2} />;
}
