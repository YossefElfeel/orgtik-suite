"use client";

/**
 * CHATS - THE HAND-OFF FROM THE SUITE (Chats wave, FS-CHT-4, FS-SOS-2)
 *
 * SOS's launcher opens Chats at /{locale}/auth?code=…: a one-time code (single use, 60 s), exchanged
 * here for the session. The address is cleared at once, so neither the code nor a token stays in
 * history. ?token= still works while other launchers send it. The redirect only follows paths in
 * Chats, and the page is replaced, so Back can't reopen the hand-off.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { useT } from "@/lib/i18n";
import { SOS_API_URL, SOS_URL, clearSuiteSession, exchangeCode, sessionFor, writeSuiteSession } from "@/lib/suite-session";

const safePath = (v: string | null) => {
  const s = (v ?? "").replace(/[\t\n\r]/g, "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/hq/office";
};

function Handoff() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  // Read once: clearing the address changes the search params.
  const first = useRef<{ code: string | null; token: string | null; redirect: string } | null>(null);
  if (!first.current) first.current = { code: params.get("code"), token: params.get("token"), redirect: safePath(params.get("redirect")) };
  const [failed, setFailed] = useState(false);

  // A code works once: the exchange is one request, shared if the effect runs twice (React runs
  // effects twice in development; a second exchange of the spent code would fail and win).
  const work = useRef<Promise<void> | null>(null);
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    const { code, token, redirect } = first.current ?? { code: null, token: null, redirect: "/hq/office" };
    if (!SOS_API_URL) {
      router.replace(redirect);
      return;
    }
    if (!code && !token) {
      setFailed(true);
      return;
    }
    work.current ??= (code ? exchangeCode(code) : Promise.resolve(token as string))
      .then(sessionFor)
      .then((session) => {
        writeSuiteSession(session);
        router.replace(redirect);
      });
    let live = true;
    work.current.catch(() => {
      if (!live) return;
      clearSuiteSession();
      setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [router]);

  if (failed) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          size="page"
          titleAs="h1"
          title={t("suite.handoffTitle", "This link has expired")}
          description={t("suite.handoffBody", "Links from the suite work once, for a minute. Open Chats again from OrgTik.")}
          action={
            <Button variant="primary" onClick={() => window.location.assign(SOS_URL ? `${SOS_URL}/go/hq` : "/hq/office")}>
              {t("suite.backToSuite", "Open from OrgTik")}
            </Button>
          }
        />
      </main>
    );
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <LoadingState label={t("suite.opening", "Opening Chats…")} />
    </main>
  );
}

export default function SuiteAuthPage() {
  return (
    <Suspense>
      <Handoff />
    </Suspense>
  );
}
