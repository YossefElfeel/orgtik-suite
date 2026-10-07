"use client";

import { useAuthSuccess } from "@orgtik/ui/auth";

// The hand-off from SOS (HR wave, FS-HR-2; FS-SOS-2). SOS sends a one-time code (?code=), never the
// access token: the code is exchanged with the identity API for the session, the address is cleared
// at once, and the session is checked as before. ?token= still works while other launchers send it.
// The redirect only follows paths in HR, and the page is replaced, so Back can't reopen the hand-off.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, Spinner } from "@orgtik/ui";
import { IUser, SOS_URL, UnifiedTokenValidation } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { useRouter } from "@/i18n/routing";
import { SOS_API_URL } from "@/constants";

const safePath = (v: string | null) => {
  const s = (v ?? "").replace(/[\t\n\r]/g, "");
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return "/";
  // Drop a locale prefix: the i18n router adds the reader's own.
  return s.replace(/^\/(en|ar|de|fr|it)(?=\/|$)/, "") || "/";
};

export default function AuthPage() {
  const t = useTranslations("suite");
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

  const onSuccess = (data: { user: IUser; token: string }) => {
    dispatch(setUser({ user: mapToAuthUser(data.user), token: data.token }));
    confirm(() => router.replace(first.current?.redirect ?? "/"));
  };

  if (success) return success;
  if (failed) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          size="page"
          titleAs="h1"
          title={t("handoffTitle")}
          description={t("handoffBody")}
          action={
            <Button variant="primary" onClick={() => window.location.assign(`${SOS_URL}/go/hr_system`)}>
              {t("backToSuite")}
            </Button>
          }
        />
      </main>
    );
  }
  if (first.current.code && !token) {
    return (
      <main role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-canvas p-4">
        <Spinner />
        <span className="sr-only">{t("opening")}</span>
      </main>
    );
  }
  return <UnifiedTokenValidation token={token} onSuccess={onSuccess} redirectOnNoToken={true} />;
}
