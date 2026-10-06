"use client";

// The hand-off from SOS (FS-SAL-3, D-017). SOS sends a one-time code (?code=), never the access
// token: the code is exchanged once with the identity API, the address is cleared at once, and the
// session is checked as before. ?token= still works until SOS lists Sales among the apps that
// take a code (SAL-002). The redirect only follows paths in this app (it followed any address:
// SAL-003), the address is replaced so Back can't reopen the hand-off, and there is no fixed wait.
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, Spinner } from "@orgtik/ui";
import { SOS_URL, UnifiedTokenValidation } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { APP_SCOPE, AUTH_API_URL } from "@/constants";
type IUserScope = { scope: string; roles: string[] };

const LANDING = "/";

const safePath = (v: string | null) => {
  const s = (v ?? "").replace(/[\t\n\r]/g, "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : LANDING;
};

export default function AuthContent() {
  const t = useTranslations("Errors");
  const params = useSearchParams();
  const router = useRouter();
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
    exchange.current ??= fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/handoff/exchange`, {
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
    router.replace(/^\/(en|ar|de|fr|it)(\/|$)/.test(to) ? to : `${base}${to === "/" ? "" : to}` || "/");
  };

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
