"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, NoPermissionState, Spinner } from "@orgtik/ui";
import { CenteredState } from "@/components/frame/CenteredState";
import { useRouter } from "@/i18n/routing";
import { SOS_API, SOS_URL, WM_API } from "@/lib/env";
import { getToken, setToken } from "@/lib/session";

type Result = "checking" | "expired" | "forbidden" | "offline";

/**
 * The launcher's hand-off. SOS sends a one-time code (/<locale>/auth?code=…, FS-SOS-2): it's
 * exchanged with the identity API for the access token, in the response body. ?token=… still works
 * for launchers that haven't moved yet. The token is checked against the Website
 * Manager's own API (it answers who you are and whether you're in), stored, and the address is
 * replaced right away, so the token doesn't stay in the URL bar or the history (D-017's part that
 * one app can do alone).
 */
function Handoff() {
  const t = useTranslations("Auth");
  const tn = useTranslations("NoAccess");
  const router = useRouter();
  const params = useSearchParams();
  const [result, setResult] = useState<Result>("checking");
  const [attempt, setAttempt] = useState(0);
  // Read once: removing the token from the address changes the search params (Next syncs its
  // router with history.replaceState), and a second pass would see no token and wrongly send the
  // person to "signed out" while the first answer is still on its way.
  const token = useRef<string | null | undefined>(undefined);
  const code = useRef<string | null | undefined>(undefined);
  if (token.current === undefined) token.current = params.get("token");
  if (code.current === undefined) code.current = params.get("code");
  const hadCode = useRef(Boolean(code.current));
  // Where to land (a deep link through SOS /go/<app>?redirect=…): this app's own path only.
  const landing = useRef<string | null | undefined>(undefined);
  if (landing.current === undefined) {
    const r = (params.get("redirect") ?? "").replace(/\s/g, "");
    landing.current = r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/\\") ? r : null;
  }
  const exchange = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    let live = true;
    // A code is swapped for the token once; a retry after that reuses the token it gave.
    // The exchange is one shared request: React runs effects twice in development, and a second
    // exchange of the spent code would fail.
    const tokenFrom = (): Promise<string | null> => {
      if (token.current || !code.current) return Promise.resolve(token.current ?? null);
      exchange.current ??= fetch(`${SOS_API}/auth/handoff/exchange`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.current }) })
        .then(async (r) => (r.ok ? ((await r.json())?.data?.accessToken ?? null) : null))
        .then((t: string | null) => {
          token.current = t;
          code.current = null;
          return t;
        });
      return exchange.current;
    };
    tokenFrom()
      .then((value) => {
        if (!live) return;
        if (!value) {
          // No token: a code that was used or expired says so; no code at all is just signed out.
          if (getToken()) router.replace("/");
          else if (hadCode.current) setResult("expired");
          else router.replace("/signed-out");
          return;
        }
        return fetch(`${WM_API}/admin/me`, { headers: { Authorization: `Bearer ${value}` } }).then((r) => {
          if (!live) return;
          if (r.ok) {
            setToken(value);
            router.replace(landing.current ?? "/");
          } else setResult(r.status === 403 ? "forbidden" : "expired");
        });
      })
      .catch(() => live && setResult("offline"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (result === "checking") {
    return (
      <div className="flex justify-center py-6">
        <Spinner label={t("checking")} />
      </div>
    );
  }
  if (result === "forbidden") return <NoPermissionState size="compact" title={tn("title")} description={tn("body")} action={<Button variant="secondary" onClick={() => window.location.assign(SOS_URL)}>{tn("back")}</Button>} />;
  if (result === "offline") return <ErrorState size="compact" title={t("offlineTitle")} description={t("offlineBody")} onRetry={() => (setResult("checking"), setAttempt((n) => n + 1))} />;
  return (
    <ErrorState
      size="compact"
      title={t("expiredTitle")}
      description={t("expiredBody")}
      action={<Button onClick={() => window.location.assign(SOS_URL)}>{t("toOrgtik")}</Button>}
    />
  );
}

export default function AuthPage() {
  return (
    <CenteredState>
      <Suspense>
        <Handoff />
      </Suspense>
    </CenteredState>
  );
}
