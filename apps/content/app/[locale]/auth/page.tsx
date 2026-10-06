"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setLocalLogin } from "@/redux/features/auth/authSlice";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { IUser, UnifiedTokenValidation } from "@somion/sos-bar";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const redirect = searchParams.get("redirect") || "/";
  const token = searchParams.get("token");

  const onSuccess = (data: { user: IUser; token: string }) => {
    const user = mapToAuthUser(data.user);

    dispatch(setLocalLogin({ user, token: data.token }));
    setTimeout(() => {
      router.push(redirect);
    }, 1000);
  };

  return <UnifiedTokenValidation token={token} onSuccess={onSuccess} />;
}
