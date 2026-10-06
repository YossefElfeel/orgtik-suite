"use client";

// Forgot password, step 2 (FS-SOS-7): the code from the email and a new password. It says where the
// code went, lets you send it again after a short wait (there was no way to), and takes you back
// to sign-in with "Password changed" (you used to land there with no word). One password policy
// with sign-in (it accepted 6 characters here and refused them there: SOS-007). The password
// suffix used physical sides that broke in Arabic; the library's PasswordInput doesn't.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Input, PasswordInput } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/redux/features/auth/authApi";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";
import { RESEND_SECONDS, RESET_EMAIL_KEY } from "@/lib/recovery";

const TextField = createRHFField(Input);
const PasswordField = createRHFField(PasswordInput);

type Values = { email: string; code: string; password: string; confirm: string };

export default function ResetPasswordPage() {
  const t = useTranslations("Recovery");
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [resend, { isLoading: resending }] = useForgotPasswordMutation();
  const [known, setKnown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_SECONDS);

  const { control, handleSubmit, setValue, getValues } = useForm<Values>({ defaultValues: { email: "", code: "", password: "", confirm: "" }, mode: "onTouched" });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESET_EMAIL_KEY);
      if (saved) {
        setKnown(saved);
        setValue("email", saved);
      }
    } catch {
      // The email field below covers it.
    }
  }, [setValue]);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const sendAgain = async () => {
    setError(null);
    try {
      await resend({ email: getValues("email").trim() }).unwrap();
      setNotice(t("codeResent"));
      setWait(RESEND_SECONDS);
    } catch {
      setError(t("sendFailed"));
    }
  };

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    setNotice(null);
    try {
      await resetPassword({ email: v.email.trim(), otp: v.code.trim(), newPassword: v.password }).unwrap();
      try {
        sessionStorage.removeItem(RESET_EMAIL_KEY);
      } catch {
        // Nothing to clean.
      }
      router.push("/auth/login?reset=1");
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setError(status === 400 ? t("codeInvalid") : t("resetFailed"));
    }
  });

  return (
    <AuthPanel
      title={t("resetTitle")}
      subtitle={known ? t.rich("resetBodyKnown", { email: () => <bdi dir="ltr" className="font-semibold text-fg">{known}</bdi> }) : t("resetBody")}
      error={error}
      success={notice}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {!known ? (
          <TextField
            control={control}
            name="email"
            rules={{ required: t("emailRequired"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("emailInvalid") } }}
            label={t("email")}
            type="email"
            dir="ltr"
            autoComplete="username"
            required
          />
        ) : null}
        <TextField
          control={control}
          name="code"
          rules={{ required: t("codeRequired"), pattern: { value: /^\d{4,8}$/, message: t("codeFormat") } }}
          label={t("code")}
          inputMode="numeric"
          autoComplete="one-time-code"
          dir="ltr"
          maxLength={8}
          required
        />
        <PasswordField
          control={control}
          name="password"
          rules={{
            required: t("passwordRequired"),
            minLength: { value: PASSWORD_MIN, message: t("passwordMin", { min: PASSWORD_MIN }) },
            maxLength: { value: PASSWORD_MAX, message: t("passwordMax", { max: PASSWORD_MAX }) },
          }}
          label={t("newPassword")}
          description={t("passwordRule", { min: PASSWORD_MIN })}
          autoComplete="new-password"
          required
        />
        <PasswordField
          control={control}
          name="confirm"
          rules={{ validate: (v: string) => v === getValues("password") || t("passwordMismatch") }}
          label={t("confirmPassword")}
          autoComplete="new-password"
          required
        />
        <Button type="submit" size="lg" loading={isLoading} className="w-full">
          {t("resetSubmit")}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
          <Button type="button" variant="link" disabled={wait > 0 || resending} onClick={sendAgain}>
            {wait > 0 ? t("resendIn", { seconds: wait }) : t("resend")}
          </Button>
          <Link href="/auth/forgot-password" className="rounded-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {t("otherEmail")}
          </Link>
        </div>
      </form>
    </AuthPanel>
  );
}
