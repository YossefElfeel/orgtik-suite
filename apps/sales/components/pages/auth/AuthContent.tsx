"use client";

import { useEffect, useRef } from "react";
import { useAuthSuccess, useHandoffSession, setClientSession } from "@orgtik/ui/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { SOS_URL, type IUser } from "@somion/sos-bar";
import { setUser } from "@/redux/features/auth/authSlice";
import { APP_SCOPE, AUTH_API_URL } from "@/constants";

export default function AuthContent() {
  const t = useTranslations("Errors");
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { confirm, success } = useAuthSuccess();
  const first = useRef<{ code: string | null; redirect: string } | null>(null);
  if (!first.current) {
    const value = (params.get("redirect") || "/").replace(/[\t\n\r]/g, "");
    first.current = { code: params.get("code"), redirect: value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/" };
  }
  const handoff = useHandoffSession<IUser>(AUTH_API_URL, "tool:sales", first.current.code);
  const completed = useRef(false);
  useEffect(() => {
    if (!handoff.session || completed.current) return;
    completed.current = true;
    setClientSession(handoff.session);
    dispatch(setUser({ user: { ...handoff.session.user, scopes: handoff.session.scopes } as IUser, token: handoff.session.tokens.accessToken }));
    const base = window.location.pathname.replace(/\/auth\/?$/, "");
    const to = first.current!.redirect;
    confirm(() => router.replace(/^\/(en|ar|de|fr|it)(\/|$)/.test(to) ? to : `${base}${to === "/" ? "" : to}` || "/"));
  }, [handoff.session, dispatch, router, confirm]);
  if (success) return success;
  if (handoff.error) return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><ErrorState size="page" titleAs="h1" title={t("handoffTitle")} description={t("handoffBody")} onRetry={handoff.error.status >= 500 ? handoff.retry : undefined} action={<Button onClick={() => window.location.assign(`${SOS_URL}/go/${APP_SCOPE}`)}>{t("toSuite")}</Button>} /></main>;
  return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><LoadingState rows={2} /></main>;
}