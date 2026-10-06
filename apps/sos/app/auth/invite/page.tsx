"use client";

// Accepting an invitation (FS-SOS-7). Who invited you, to which tools, until when, in the reader's
// language and dates; then a password under the same policy as sign-in (it took 6 characters:
// SOS-007). A link that's missing, used, expired or wrong says which, and what to do. If you're
// signed in already, you choose: sign out and accept, or go home (you used to be sent home with a
// toast). On success, sign-in says the account is ready.
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, PasswordInput, Spinner, Tag, buttonVariants, useFormatter } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import Link from "next/link";
import { useAcceptInviteMutation, useGetInviteMetadataMutation, useLogoutMutation } from "@/redux/features/auth/authApi";
import { performLogout } from "@/redux/features/auth/authThunks";
import { useAppDispatch } from "@/redux/app/hooks";
import { IInviteMetadata } from "@/types/user";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useAppLabel } from "@/components/suite/useSuiteApps";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

const PasswordField = createRHFField(PasswordInput);
type Problem = "missing" | "invalid" | "used" | "expired" | "failed";

export default function InvitePage() {
  const t = useTranslations("Invite");
  const tr = useTranslations("Recovery");
  const f = useFormatter();
  const appLabel = useAppLabel();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { user } = useUser();

  const [invite, setInvite] = useState<IInviteMetadata | null>(null);
  const [problem, setProblem] = useState<Problem | null>(token ? null : "missing");
  const [step, setStep] = useState<"review" | "password">("review");
  const [error, setError] = useState<string | null>(null);
  const [load, { isLoading: loading }] = useGetInviteMetadataMutation();
  const [accept, { isLoading: accepting }] = useAcceptInviteMutation();
  const [logout] = useLogoutMutation();
  const signedIn = mounted && Boolean(user);

  const { control, handleSubmit, getValues } = useForm<{ password: string; confirm: string }>({ defaultValues: { password: "", confirm: "" }, mode: "onTouched" });

  useEffect(() => {
    if (!token || !mounted || user) return;
    let live = true;
    load({ token })
      .unwrap()
      .then((r) => {
        if (!live) return;
        setInvite(r.data);
        if (new Date(r.data.expiresAt).getTime() < Date.now()) setProblem("expired");
      })
      .catch((e) => live && setProblem((e as { status?: number })?.status === 410 ? "used" : (e as { status?: number })?.status === 404 ? "invalid" : "failed"));
    return () => {
      live = false;
    };
  }, [token, mounted, user, load]);

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await accept({ token, password }).unwrap();
      router.push("/auth/login?invited=1");
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 409) setError(t("alreadyAccount"));
      else if (status === 410) setProblem("used");
      else setError(t("acceptFailed"));
    }
  });

  const tools = useMemo(() => (invite?.invitee.scopes ?? []).filter((s) => s !== "global"), [invite]);
  const signIn = (
    <Link href="/auth/login" className={buttonVariants({ variant: "primary", size: "lg", className: "w-full" })}>
      {tr("backToSignIn")}
    </Link>
  );

  if (!mounted) {
    return (
      <div className="grid min-h-48 place-items-center">
        <Spinner />
      </div>
    );
  }

  if (signedIn && user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    return (
      <AuthPanel title={t("signedInTitle")} subtitle={t("signedInBody", { name })}>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={async () => {
              try {
                await logout().unwrap();
              } catch {
                // Signing out locally still happens.
              }
              dispatch(performLogout());
              router.refresh();
            }}
          >
            {t("signOutAndAccept")}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}>
            {t("goHome")}
          </Link>
        </div>
      </AuthPanel>
    );
  }

  if (problem) {
    const by = invite?.invitedBy?.name;
    const body =
      problem === "expired"
        ? by
          ? t("expiredBodyBy", { name: by })
          : t("expiredBody")
        : problem === "used"
          ? t("usedBody")
          : problem === "missing"
            ? t("missingBody")
            : problem === "invalid"
              ? t("invalidBody")
              : t("failedBody");
    return (
      <AuthPanel title={t(`${problem}Title`)} subtitle={body}>
        {problem === "used" ? signIn : problem === "failed" ? <Button size="lg" className="w-full" onClick={() => location.reload()}>{t("retry")}</Button> : null}
      </AuthPanel>
    );
  }

  if (loading || !invite) {
    return (
      <div role="status" aria-label={t("loading")} className="grid min-h-48 place-items-center">
        <Spinner />
      </div>
    );
  }

  const fullName = [invite.invitee.firstName, invite.invitee.lastName].filter(Boolean).join(" ");

  if (step === "review") {
    return (
      <AuthPanel title={t("reviewTitle", { name: invite.invitee.firstName })} subtitle={invite.invitedBy ? t("reviewBodyBy", { name: invite.invitedBy.name }) : t("reviewBody")}>
        <dl className="mb-6 flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-fg-muted">{t("yourName")}</dt>
            <dd dir="auto" className="text-body font-semibold text-fg">{fullName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-fg-muted">{t("yourEmail")}</dt>
            <dd dir="ltr" className="text-start text-body text-fg">{invite.invitee.email}</dd>
          </div>
          {tools.length ? (
            <div className="flex flex-col gap-2">
              <dt className="text-caption text-fg-muted">{t("tools")}</dt>
              <dd className="flex flex-wrap gap-2">
                {tools.map((s) => (
                  <Tag key={s}>{appLabel(s, s)}</Tag>
                ))}
              </dd>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-fg-muted">{t("expires")}</dt>
            <dd className="text-body text-fg">{f.date(invite.expiresAt, { dateStyle: "long", timeStyle: "short" })}</dd>
          </div>
        </dl>
        <Button size="lg" className="w-full" onClick={() => setStep("password")}>
          {t("accept")}
        </Button>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={t("passwordTitle")} subtitle={t("passwordBody", { email: invite.invitee.email })} error={error}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <PasswordField
          control={control}
          name="password"
          rules={{
            required: tr("passwordRequired"),
            minLength: { value: PASSWORD_MIN, message: tr("passwordMin", { min: PASSWORD_MIN }) },
            maxLength: { value: PASSWORD_MAX, message: tr("passwordMax", { max: PASSWORD_MAX }) },
          }}
          label={tr("newPassword")}
          description={tr("passwordRule", { min: PASSWORD_MIN })}
          autoComplete="new-password"
          required
        />
        <PasswordField
          control={control}
          name="confirm"
          rules={{ validate: (v: string) => v === getValues("password") || tr("passwordMismatch") }}
          label={tr("confirmPassword")}
          autoComplete="new-password"
          required
        />
        <Button type="submit" size="lg" loading={accepting} className="w-full">
          {t("activate")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setStep("review")}>
          {t("back")}
        </Button>
      </form>
    </AuthPanel>
  );
}
