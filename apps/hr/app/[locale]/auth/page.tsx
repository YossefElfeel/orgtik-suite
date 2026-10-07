"use client";
import { useEffect, useRef } from "react";
import { useAuthSuccess, useHandoffSession, setClientSession } from "@orgtik/ui/auth";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { SOS_URL, type IUser } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { useRouter } from "@/i18n/routing";
import { SOS_API_URL } from "@/constants";

export default function AuthPage() {
  const t = useTranslations("suite");
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { confirm, success } = useAuthSuccess();
  const first = useRef<{ code: string | null; redirect: string } | null>(null);
  if (!first.current) {
    const path = (params.get("redirect") || "/").replace(/[\t\n\r]/g, "");
    first.current = { code: params.get("code"), redirect: path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path.replace(/^\/(en|ar|de|fr|it)(?=\/|$)/, "") || "/" : "/" };
  }
  const handoff = useHandoffSession<IUser>(SOS_API_URL, "tool:hr", first.current.code);
  const completed = useRef(false);
  useEffect(() => {
    if (!handoff.session || completed.current) return;
    completed.current = true;
    setClientSession(handoff.session);
    dispatch(setUser({ user: mapToAuthUser({ ...handoff.session.user, scopes: handoff.session.scopes }), token: handoff.session.tokens.accessToken }));
    confirm(() => router.replace(first.current!.redirect));
  }, [handoff.session, dispatch, router, confirm]);
  if (success) return success;
  if (handoff.error) return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><ErrorState size="page" titleAs="h1" title={t("handoffTitle")} description={t("handoffBody")} onRetry={handoff.error.status >= 500 ? handoff.retry : undefined} action={<Button onClick={() => window.location.assign(`${SOS_URL}/go/hr_system`)}>{t("backToSuite")}</Button>} /></main>;
  return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><LoadingState label={t("opening")} /></main>;
}