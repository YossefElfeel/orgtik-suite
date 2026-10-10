"use client";

// Exchange once, then validate the profile. Keep the exchanged session for a profile retry:
// consuming another handoff would fail, and an outage must not replace the existing account.
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { API_URL } from "@/constants/env";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { adaptiveEntry } from "@/lib/adaptive-entry";
import { IScopeItem, ITokens, IUser } from "@/types/user";
import type { WorkspaceContext, StaffAccess } from "@orgtik/ui/auth";

export default function HandoffPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("Auth");
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<"expired" | "unavailable" | null>(null);
  const session = useRef<ITokens | null>(null);
  const first = useRef<{ code: string | null; redirect: string | null } | null>(null);
  if (!first.current) first.current = { code: searchParams.get("code"), redirect: searchParams.get("redirect") };
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    window.history.replaceState(null, "", window.location.pathname);
    const complete = async () => {
      setFailure(null);
      if (!session.current) {
        const code = first.current!.code;
        if (!code) throw 400;
        const response = await fetch(`${API_URL}/auth/handoff/exchange`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, audience: "suite" }),
        });
        if (!response.ok) throw response.status;
        const body = await response.json();
        if (!body.data?.accessToken) throw 503;
        session.current = body.data.tokens || { accessToken: body.data.accessToken, refreshToken: "", expiresIn: 0 };
      }
      const tokens = session.current!;
      const response = await fetch(`${API_URL}/auth/me`, { headers: { authorization: `Bearer ${tokens.accessToken}` } });
      if (!response.ok) throw response.status;
      const body = await response.json();
      const { user, scopes, workspaceContext, staffAccess } = body.data as { user: IUser; scopes: IScopeItem[]; workspaceContext: WorkspaceContext | null; staffAccess: StaffAccess | null };
      if (!user?.id || !Array.isArray(scopes)) throw 503;
      dispatch(switchSession({ user, tokens, scopes, workspaceContext, staffAccess }));
      router.replace(adaptiveEntry(workspaceContext, first.current!.redirect));
    };
    complete().catch((status) => setFailure(status === 400 || status === 401 || status === 403 ? "expired" : "unavailable"));
  }, [attempt, dispatch, router]);

  if (failure === "expired") return <ErrorState size="compact" title={t("handoffExpired")} description={t("handoffSignIn")} action={<Button onClick={() => router.replace("/auth/login?switch=1")}>{t("submit")}</Button>} />;
  if (failure) return <ErrorState size="compact" title={t("failed")} onRetry={() => setAttempt((value) => value + 1)} />;
  return <LoadingState rows={2} />;
}
