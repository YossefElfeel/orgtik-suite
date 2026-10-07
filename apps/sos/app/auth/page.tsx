"use client";
import { useEffect, useRef } from "react";
import { useAuthSuccess, useHandoffSession } from "@orgtik/ui/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState } from "@orgtik/ui";
import { API_URL } from "@/constants/env";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { safeRedirect } from "@/lib/safe-redirect";
import type { IUser } from "@/types/user";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("Auth");
  const dispatch = useAppDispatch();
  const { confirm, success } = useAuthSuccess();
  const first = useRef<{ code: string | null; redirect: string } | null>(null);
  if (!first.current) first.current = { code: searchParams.get("code"), redirect: safeRedirect(searchParams.get("redirect")) };
  const handoff = useHandoffSession<IUser>(API_URL, "suite", first.current.code);
  const completed = useRef(false);
  useEffect(() => {
    if (!handoff.session || completed.current) return;
    completed.current = true;
    const value = handoff.session;
    dispatch(switchSession({ ...value, scopes: value.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
    confirm(() => router.replace(first.current!.redirect));
  }, [handoff.session, dispatch, router, confirm]);
  if (success) return success;
  if (handoff.error) {
    const expired = [400, 401, 403, 410].includes(handoff.error.status);
    return <ErrorState size="compact" title={t(expired ? "handoffExpired" : "failed")} description={expired ? t("handoffSignIn") : undefined} onRetry={expired ? undefined : handoff.retry} action={expired ? <Button onClick={() => router.replace("/auth/login?switch=1")}>{t("submit")}</Button> : undefined} />;
  }
  return <LoadingState rows={2} />;
}
