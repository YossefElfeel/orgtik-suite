"use client";

import { useAuthSuccess } from "@orgtik/ui/auth";

// The hand-off from SOS (FS-MKT-3, D-017). SOS sends a one-time code (?code=), never the access
// token: the code is exchanged once with the identity API, the address is cleared at once, and the
// session is checked as before. ?token= still works until SOS lists Marketing among the apps that
// take a code (MKT-002). The redirect only follows paths in this app (it followed any address:
// MKT-001), and the address is replaced so Back can't reopen the hand-off after confirmation.
// Without a redirect the person lands on the dashboard, not the onboarding page (MKT-030).
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, Spinner } from "@orgtik/ui";
import { SOS_URL, UnifiedTokenValidation } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { SOS_API_URL } from "@/constants/env";
import { APP_SCOPE } from "@/constants";
import type { IUserScope } from "@/types/user";

const LANDING = "/dashboard";

const safePath = (v: string | null) => {
  const s = (v ?? "").replace(/[\t\n\r]/g, "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : LANDING;
};

export default function AuthContent() {
  const t = useTranslations("Errors");
  const params = useSearchParams();
  const router = useRouter();
  const { confirm, success } = useAuthSuccess();
  const dispatch = useDispatch();
  // Read once: clearing the address changes the search params.
  const first = useRef<{ code: string | null; token: string | null; redirect: string } | null>(null);
  if (!first.current) first.current = { code: params.get("code"), token: params.get("token"), redirect: safePath(params.get("redirect")) };
  const [token, setToken] = useState<string | null>(first.current.token);
  const [failed, setFailed] = useState(false);

  // A code works once: the exchange is one request, shared if the effect runs twice (React runs
  // effects twice in development; a second exchange of the spent code would fail and win).
  const exchange = useRef<Promise<string | null> | null>(null);
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    const code = first.current?.code;
    if (!code) return;
    exchange.current ??= fetch(`${SOS_API_URL}/auth/handoff/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => (body?.data?.accessToken as string | undefined) ?? null);
    let live = true;
    exchange.current.then((tk) => live && (tk ? setToken(tk) : setFailed(true))).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const onSuccess = (data: { user: Record<string, unknown> & { permissions?: unknown; scopes?: unknown }; token: string }) => {
    const { permissions: _ignored, ...user } = data.user;
    // sos-bar's mapper may give scopes as names; the app (and its proxy) reads {scope, roles}.
    const raw = Array.isArray(user.scopes) ? user.scopes : [];
    const scopes: IUserScope[] = raw.map((s: unknown) => (typeof s === "string" ? { scope: s, roles: [] } : (s as IUserScope)));
    dispatch(setUser({ user: { ...user, scopes } as never, token: data.token }));
    // The redirect is a path in this app, with or without its language.
    const base = window.location.pathname.replace(/\/auth\/?$/, "");
    const to = first.current?.redirect ?? LANDING;
    confirm(() => router.replace(/^\/(en|ar|de|fr|it)(\/|$)/.test(to) ? to : `${base}${to === "/" ? LANDING : to}`));
  };

  if (success) return success;
  if (failed) {
    return (
      <main className="grid min-h-dvh w-full place-items-center bg-canvas p-4">
        <ErrorState
          size="page"
          titleAs="h1"
          title={t("handoffTitle")}
          description={t("handoffBody")}
          action={
            <Button variant="primary" onClick={() => window.location.assign(`${SOS_URL}/go/${APP_SCOPE}`)}>
              {t("toSuite")}
            </Button>
          }
        />
      </main>
    );
  }
  if (first.current.code && !token) {
    return (
      <div role="status" className="grid min-h-dvh w-full place-items-center">
        <Spinner />
      </div>
    );
  }
  return <UnifiedTokenValidation token={token} onSuccess={onSuccess as never} redirectOnNoToken={true} />;
}
