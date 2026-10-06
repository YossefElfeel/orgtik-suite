"use client";

import { useAuthSuccess } from "@orgtik/ui/auth";

import { useEffect, useRef } from "react";
import { OrgtikProvider } from "@orgtik/ui/provider";
import { useLocale } from "next-intl";
import type { Locale } from "@orgtik/ui";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setLocalLogin } from "@/redux/features/auth/authSlice";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { IUser, UnifiedTokenValidation } from "@somion/sos-bar";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirm, success } = useAuthSuccess();
  const dispatch = useDispatch();

  const first = useRef<{ redirect: string; token: string | null } | null>(null);
  if (!first.current) {
    const requested = (searchParams.get("redirect") ?? "").replace(/[\t\n\r]/g, "");
    const redirect = requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/\\") ? requested : "/";
    first.current = { redirect, token: searchParams.get("token") };
  }
  const { redirect, token } = first.current;
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const onSuccess = (data: { user: IUser; token: string }) => {
    const user = mapToAuthUser(data.user);

    dispatch(setLocalLogin({ user, token: data.token }));
    confirm(() => router.replace(redirect));
  };

  if (success) return success;
  return <UnifiedTokenValidation token={token} onSuccess={onSuccess} />;
}

export default function AuthPage() {
  const locale = useLocale() as Locale;
  return <OrgtikProvider locale={locale}><AuthContent /></OrgtikProvider>;
}
