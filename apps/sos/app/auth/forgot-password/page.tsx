"use client";

// Forgot password, step 1 (FS-SOS-7): the email, then on to the code. The email travels in this
// tab's session, not in the address (it was ?email=, which history and logs keep). The answer is
// the same whether or not an account exists, so the page can't be used to find accounts.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Input } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import { useForgotPasswordMutation } from "@/redux/features/auth/authApi";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { RESET_EMAIL_KEY } from "@/lib/recovery";

const EmailField = createRHFField(Input);

export default function ForgotPasswordPage() {
  const t = useTranslations("Recovery");
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<{ email: string }>({ defaultValues: { email: "" }, mode: "onTouched" });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      try {
        sessionStorage.setItem(RESET_EMAIL_KEY, email.trim());
      } catch {
        // Private mode: the next page asks for the email again.
      }
      router.push("/auth/reset-password");
    } catch {
      setError(t("sendFailed"));
    }
  });

  return (
    <AuthPanel title={t("forgotTitle")} subtitle={t("forgotBody")} error={error}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <EmailField
          control={control}
          name="email"
          rules={{ required: t("emailRequired"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("emailInvalid") } }}
          label={t("email")}
          type="email"
          dir="ltr"
          autoComplete="username"
          required
        />
        <Button type="submit" size="lg" loading={isLoading} className="w-full">
          {t("sendCode")}
        </Button>
        <Link href="/auth/login" className="self-center rounded-sm text-body-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {t("backToSignIn")}
        </Link>
      </form>
    </AuthPanel>
  );
}
