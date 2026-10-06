"use client";

// My profile (FS-SOS-8, toward USR-23). Four parts, each saved on its own:
// - Photo: change or remove.
// - Personal details: names, job title, department, about. The email is shown, not edited:
//   changing it needs a verification flow the API doesn't have yet.
// - Preferences: the language applies at once and flips the direction (the select had no options
//   and wasn't tied to the app's language); the time zone.
// - Password: current + new + repeat, the same policy as sign-in (the endpoint existed; nothing
//   called it).
// Sessions and two-step verification (USR-23) wait for their endpoints; they aren't drawn as
// screens that do nothing.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Camera, Trash } from "@phosphor-icons/react";
import { Avatar, Button, Card, Combobox, ErrorState, Field, Input, LoadingState, PageHeader, PasswordInput, Select, Textarea, toast, type Locale } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useChangePasswordMutation, useDeleteAvatarMutation, useGetProfileQuery, useUpdateProfileMutation, useUploadAvatarMutation } from "@/redux/features/auth/authApi";
import { LOCALES, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

const ENDONYMS: Record<string, string> = { en: "English", ar: "العربية", de: "Deutsch", fr: "Français", it: "Italiano" };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO = 5 * 1024 * 1024;
const zones = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Africa/Cairo", "Europe/Zurich", "Europe/Berlin", "Europe/Paris", "Europe/Rome"];
  }
})();

type Details = { firstName: string; lastName: string; jobTitle: string; department: string; about: string };
type Passwords = { current: string; next: string; repeat: string };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title-sm text-fg">{title}</h2>
        {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </Card>
  );
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const tr = useTranslations("Recovery");
  const locale = useLocale();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: removing }] = useDeleteAvatarMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const file = useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const user = data?.data.user;
  const details = useForm<Details>({ defaultValues: { firstName: "", lastName: "", jobTitle: "", department: "", about: "" }, mode: "onTouched" });
  const passwords = useForm<Passwords>({ defaultValues: { current: "", next: "", repeat: "" }, mode: "onTouched" });

  useEffect(() => {
    if (!user) return;
    details.reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      jobTitle: user.profile?.jobTitle ?? "",
      department: user.profile?.department ?? "",
      about: user.profile?.about ?? "",
    });
  }, [user, details]);

  if (isLoading) return <LoadingState rows={6} />;
  if (isError || !user) return <ErrorState titleAs="h1" onRetry={refetch} />;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) return toast.error(t("photoType"));
    if (f.size > MAX_PHOTO) return toast.error(t("photoSize"));
    const form = new FormData();
    form.append("avatar", f);
    try {
      await uploadAvatar(form).unwrap();
    } catch {
      // Said by lib/api-feedback.
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  const saveDetails = details.handleSubmit(async (v) => {
    try {
      await updateProfile({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        profile: { jobTitle: v.jobTitle.trim(), department: v.department.trim(), about: v.about.trim() },
      }).unwrap();
      details.reset(v);
    } catch {
      // Said by lib/api-feedback; the form keeps what was typed.
    }
  });

  // The language applies at once: saved with the profile, set in the cookie the app reads (D-033),
  // and the page re-rendered in it, direction included.
  const changeLanguage = async (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    try {
      await updateProfile({ profile: { language: next } }).unwrap();
    } catch {
      // The app still switches; the saved preference follows on the next save.
    }
    router.refresh();
  };

  const savePassword = passwords.handleSubmit(async (v) => {
    setPasswordError(null);
    try {
      await changePassword({ oldPassword: v.current, newPassword: v.next }).unwrap();
      passwords.reset();
      toast.success(t("passwordChanged"));
    } catch (e) {
      setPasswordError((e as { status?: number })?.status === 400 ? t("currentWrong") : t("passwordFailed"));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Section title={t("photo")} description={t("photoHelp")}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} src={user.avatar ?? undefined} size="lg" decorative />
          <input ref={file} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <Button variant="secondary" startIcon={<Camera />} loading={uploading} onClick={() => file.current?.click()}>
            {user.avatar ? t("changePhoto") : t("addPhoto")}
          </Button>
          {user.avatar ? (
            <Button variant="ghost" startIcon={<Trash />} loading={removing} onClick={() => deleteAvatar().unwrap().catch(() => {})}>
              {t("removePhoto")}
            </Button>
          ) : null}
        </div>
      </Section>

      <Section title={t("details")} description={t("detailsHelp")}>
        <form onSubmit={saveDetails} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFField control={details.control} name="firstName" rules={{ required: t("required") }} label={t("firstName")} required render={(f) => <Input dir="auto" {...f} />} />
          <RHFField control={details.control} name="lastName" rules={{ required: t("required") }} label={t("lastName")} required render={(f) => <Input dir="auto" {...f} />} />
          {/* Shown as text, not a field you can't type in. */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-label font-medium text-fg">{t("email")}</span>
            <span dir="ltr" className="text-start text-body text-fg">{user.email}</span>
            <span className="text-caption text-fg-muted">{t("emailHelp")}</span>
          </div>
          <RHFField control={details.control} name="jobTitle" label={t("jobTitle")} optional render={(f) => <Input dir="auto" {...f} />} />
          <RHFField control={details.control} name="department" label={t("department")} optional render={(f) => <Input dir="auto" {...f} />} />
          <RHFField control={details.control} name="about" label={t("about")} optional className="sm:col-span-2" render={(f) => <Textarea dir="auto" maxRows={6} {...f} />} />
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" loading={saving} disabled={!details.formState.isDirty}>
              {t("saveDetails")}
            </Button>
          </div>
        </form>
      </Section>

      <Section title={t("preferences")} description={t("preferencesHelp")}>
        <Field label={t("language")} description={t("languageHelp")}>
          <Select options={LOCALES.map((l) => ({ value: l, label: ENDONYMS[l] }))} value={isLocale(locale) ? locale : "en"} onValueChange={(v) => v && changeLanguage(v as Locale)} />
        </Field>
        <Field label={t("timeZone")} description={t("timeZoneHelp")}>
          <Combobox
            options={zones.map((z) => ({ value: z, label: z.replace(/_/g, " ") }))}
            value={user.profile?.timeZone ?? null}
            onValueChange={(v) => v && updateProfile({ profile: { timeZone: v } }).unwrap().catch(() => {})}
          />
        </Field>
      </Section>

      <Section title={t("password")} description={t("passwordHelp", { min: PASSWORD_MIN })}>
        <form onSubmit={savePassword} noValidate className="flex max-w-md flex-col gap-4">
          {passwordError ? (
            <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
              {passwordError}
            </p>
          ) : null}
          <RHFField control={passwords.control} name="current" rules={{ required: t("required") }} label={t("currentPassword")} required render={(f) => <PasswordInput autoComplete="current-password" {...f} />} />
          <RHFField
            control={passwords.control}
            name="next"
            rules={{
              required: t("required"),
              minLength: { value: PASSWORD_MIN, message: tr("passwordMin", { min: PASSWORD_MIN }) },
              maxLength: { value: PASSWORD_MAX, message: tr("passwordMax", { max: PASSWORD_MAX }) },
            }}
            label={tr("newPassword")}
            required
            render={(f) => <PasswordInput autoComplete="new-password" {...f} />}
          />
          <RHFField
            control={passwords.control}
            name="repeat"
            rules={{ validate: (v: string) => v === passwords.getValues("next") || tr("passwordMismatch") }}
            label={tr("confirmPassword")}
            required
            render={(f) => <PasswordInput autoComplete="new-password" {...f} />}
          />
          <div>
            <Button type="submit" variant="primary" loading={changing}>
              {tr("resetSubmit")}
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
