"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IUser as SosBarUser, UnifiedTokenValidation } from "@somion/sos-bar";
import { API_URL } from "@/constants/env";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { safeRedirect } from "@/lib/safe-redirect";
import { IScopeItem, IUser } from "@/types/user";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Only a path on this site (SOS-002: it followed any address, an open redirect).
  const redirect = safeRedirect(searchParams.get("redirect"));
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");

  useEffect(() => {
    if (!token) {
      router.replace("/auth/login");
    }
  }, [token, router]);

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

    dispatch(
      switchSession({
        user,
        tokens: {
          accessToken: data.token,
          refreshToken: refreshToken || "",
          expiresIn: 0,
        },
        scopes,
      })
    );

    // replace, not push: Back must not reopen the address that carried the token (SOS-002).
    // Customers land in their workspace (USR, D-011): Sales is a CRM, opened from the rail.
    router.replace(redirect);
  };

  if (!token) {
    return null;
  }

  return (
    <UnifiedTokenValidation
      baseApi={API_URL}
      token={token}
      onSuccess={onSuccess}
    />
  );
}
