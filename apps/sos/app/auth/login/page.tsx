"use client";

import { useAuthSuccess } from "@orgtik/ui/auth";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Button, Input, PasswordInput } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { safeRedirect, suiteReturn } from "@/lib/safe-redirect";
import { handoffHref } from "@/lib/handoff";
import { API_URL } from "@/constants/env";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useMounted } from "@/hooks/use-mounted";

const EmailField = createRHFField(Input);
const PasswordField = createRHFField(PasswordInput);

export default function LoginPage() {
  const mounted = useMounted();
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const { confirm, success } = useAuthSuccess("OrgTik", true);
  const searchParams = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const next = safeRedirect(searchParams.get("redirect"));
  // After a reset or an accepted invitation, say it worked (it used to land here with no word).
  const welcome = searchParams.get("reset") ? t("passwordChanged") : searchParams.get("invited") ? t("accountReady") : null;

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("invalidEmail")),
        password: z.string().min(PASSWORD_MIN, t("passwordMin")).max(PASSWORD_MAX, t("passwordMax")),
      }),
    [t],
  );
  type LoginData = z.infer<typeof schema>;
  const { control, handleSubmit } = useForm<LoginData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (data: LoginData) => {
    setFormError(null);
    try {
      const response = await login(data).unwrap();
      const user = response?.data?.user;
      // Customers land in their workspace (USR, D-011): Sales is a CRM, opened from the rail.
      // Sent here by another suite app after its session ended: back to that page in that app,
      // through a one-time code (TASKS-021). Only the person's own apps qualify.
      const token = (response?.data as { tokens?: { accessToken?: string } } | undefined)?.tokens?.accessToken;
      const wanted = searchParams.get("redirect");
      const apps =
        token && wanted && /^https?:\/\//i.test(wanted)
          ? await fetch(`${API_URL}/auth/my-scopes`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => (r.ok ? r.json() : null))
              .then((body) => (body?.data ?? []) as { name: string; domain?: string | null; isActive?: boolean }[])
              .catch(() => [])
          : [];
      const back = suiteReturn(wanted, apps.filter((a) => a.isActive !== false));
      if (back && token) {
        try {
          const href = await handoffHref(back.domain, token, { scope: back.scope, locale });
          return window.location.assign(`${href}&fresh=1&redirect=${encodeURIComponent(back.path)}`);
        } catch {
          setFormError(t("failed"));
          return;
        }
      }
      return confirm(() => router.replace(next));
    } catch (err) {
      // The API's own messages are English only; show ours, in the person's language.
      const status = (err as FetchBaseQueryError)?.status;
      setFormError(status === 401 ? t("invalidCredentials") : status === 400 ? t("validationFailed") : t("failed"));
    }
  };

  if (success) return success;

  return (
    <AuthPanel title={t("title")} subtitle={t("subtitle")} error={formError} success={formError ? null : welcome}>
      <form method="post" noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <EmailField control={control} name="email" label={t("email")} type="email" autoComplete="username" placeholder={t("emailPlaceholder")} required disabled={!mounted} />
        <div className="flex flex-col gap-2">
          <PasswordField control={control} name="password" label={t("password")} autoComplete="current-password" required disabled={!mounted} />
          <Link href="/auth/forgot-password" className="self-end rounded-sm text-body-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {t("forgot")}
          </Link>
        </div>

        <Button type="submit" size="lg" loading={isLoading} disabled={!mounted} className="w-full">
          {t("submit")}
        </Button>
      </form>
    </AuthPanel>
  );
}
