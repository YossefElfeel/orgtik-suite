"use client";

// Arriving signed in from the public website (or anything else that holds a suite session) with
// a one-time code instead of a token in the address (Q-004). The code is exchanged for the
// session, which is then checked and stored the same way /auth?token= does.
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IUser as SosBarUser, UnifiedTokenValidation } from "@somion/sos-bar";
import { API_URL } from "@/constants/env";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { safeRedirect } from "@/lib/safe-redirect";
import { IScopeItem, IUser } from "@/types/user";

export default function HandoffPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [token, setToken] = useState<string | null>(null);

  // Read once: the address is cleaned straight away, and a code works only once.
  const first = useRef<{ code: string | null; redirect: string } | null>(null);
  if (!first.current) first.current = { code: searchParams.get("code"), redirect: safeRedirect(searchParams.get("redirect")) };
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    const { code } = first.current!;
    if (!code) return router.replace("/auth/login");
    fetch(`${API_URL}/auth/handoff/exchange`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => setToken(body?.data?.accessToken ?? null))
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  const onSuccess = (data: { user: SosBarUser; token: string }) => {
    const scopes: IScopeItem[] = (data.user.scopes || []).map((scope) => ({
      scope: scope.scope,
      roles: [...scope.roles],
      permissions: [],
    }));
    const user: IUser = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.username,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      avatar: data.user.avatar,
      isActive: data.user.isActive,
      isEmailVerified: data.user.isEmailVerified,
      userType: data.user.userType,
      createdAt: data.user.createdAt,
      updatedAt: data.user.updatedAt,
      profile: data.user.profile,
    };
    dispatch(switchSession({ user, tokens: { accessToken: data.token, refreshToken: "", expiresIn: 0 }, scopes }));
    router.replace(first.current!.redirect);
  };

  if (!token) return null;
  return <UnifiedTokenValidation baseApi={API_URL} token={token} onSuccess={onSuccess} />;
}
