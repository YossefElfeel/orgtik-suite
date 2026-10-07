"use client";
import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { useAuthSuccess, useHandoffSession } from "@orgtik/ui/auth";
import { useT } from "@/lib/i18n";
import { SOS_API_URL, SOS_URL, writeSuiteSession, type SuiteUser } from "@/lib/suite-session";

function AuthContent() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const { confirm, success } = useAuthSuccess();
  const first = useRef<{ code: string | null; redirect: string } | null>(null);
  if (!first.current) { const path = (params.get("redirect") || "/hq/office").replace(/[\t\n\r]/g, ""); first.current = { code: params.get("code"), redirect: path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/hq/office" }; }
  const handoff = useHandoffSession<SuiteUser>(SOS_API_URL, "tool:chats", first.current.code);
  const completed = useRef(false);
  useEffect(() => {
    if (!SOS_API_URL) { router.replace(first.current!.redirect); return; }
    if (!handoff.session || completed.current) return;
    completed.current = true;
    const s = handoff.session;
    writeSuiteSession({ token: s.tokens.accessToken, tokens: s.tokens, user: s.user, scopes: s.scopes, workspaceContext: s.workspaceContext, staffAccess: s.staffAccess, readOnly: s.workspaceContext?.actor.readOnly });
    confirm(() => router.replace(first.current!.redirect));
  }, [handoff.session, router, confirm]);
  if (success) return success;
  if (handoff.error) return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><ErrorState size="page" titleAs="h1" title={t("suite.handoffTitle", "This link has expired")} description={t("suite.handoffBody", "Links from the suite work once, for a minute. Open Chats again from OrgTik.")} onRetry={handoff.error.status >= 500 ? handoff.retry : undefined} action={<Button onClick={() => window.location.assign(SOS_URL ? `${SOS_URL}/go/hq` : "/hq/office")}>{t("suite.backToSuite", "Open from OrgTik")}</Button>} /></main>;
  return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><LoadingState label={t("suite.opening", "Opening Chats…")} /></main>;
}
export default function AuthPage() { return <Suspense fallback={<LoadingState rows={2} />}><AuthContent /></Suspense>; }