"use client";

// The hand-off from SOS (FS-SOS-2). SOS now sends a one-time code (?code=), never the access token:
// the code is exchanged with the identity API for the session (in the response body), the address
// is cleared at once, and the session is checked as before. ?token= still works while other apps'
// launchers send it. The redirect only follows paths in this app, and the address is replaced, so
// Back can't reopen the hand-off.
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, Spinner } from "@orgtik/ui";
import { SOS_URL, UnifiedTokenValidation } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { SOS_API_URL } from "@/constants/env";

const safePath = (v: string | null) => {
  const s = (v ?? "").replace(/[\t\n\r]/g, "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
};

function AuthContent() {
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
    exchange.current ??= fetch(`${SOS_API_URL}/auth/handoff/exchange`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => (body?.data?.accessToken as string | undefined) ?? null);
    let live = true;
    exchange.current.then((t) => live && (t ? setToken(t) : setFailed(true))).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const onSuccess = (data: { user: Record<string, unknown> & { permissions?: unknown }; token: string }) => {
    const { permissions: _ignored, ...lightWeightUser } = data.user;
    dispatch(setUser({ user: lightWeightUser as never, token: data.token }));
    router.replace(first.current?.redirect ?? "/");
  };

  if (failed) {
    return (
      <ErrorState
        titleAs="h1"
        title={t("handoffTitle")}
        description={t("handoffBody")}
        action={
          <Button variant="primary" onClick={() => window.location.assign(SOS_URL)}>
            {t("toSuite")}
          </Button>
        }
      />
    );
  }
  if (first.current.code && !token) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  return <UnifiedTokenValidation token={token} onSuccess={onSuccess as never} redirectOnNoToken={true} />;
}

export default AuthContent;
