"use client";

// The person's own details on their suite profile (SOS). It only opens once the profile has
// loaded, so a failed load can no longer save blanks over the stored values (SAL-032). Language,
// time zone and date formats are not here: the CRM writes in the language chosen in the user menu
// and dates in the organisation's time zone, so those settings did nothing here (SAL-031).
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Camera, Trash } from "@phosphor-icons/react";
import { Avatar, Button, Card, CardHeader, ConfirmDialog, Input, Textarea, toast } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useRole } from "@/hooks/useRole";
import { useDeleteAvatarMutation, useUpdateProfileMutation, useUploadAvatarMutation } from "@/redux/features/auth/authSosApi";
import { personalInfoSchema, type PersonalInfoFormValues } from "@/schemas/profile";
import type { ProfileResponse } from "@/types/profile";

const MAX_PHOTO = 2 * 1024 * 1024;

const valuesOf = (p: ProfileResponse): PersonalInfoFormValues => ({
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  phone: p.phone ?? "",
  jobTitle: p.jobTitle ?? "",
  department: p.department ?? "",
  bio: p.bio ?? "",
});

export default function PersonalInformationForm({ profile }: { profile: ProfileResponse }) {
  const t = useTranslations("Team.profile");
  const tForm = useTranslations("Team.form");
  const { canEdit } = useRole();
  const file = useRef<HTMLInputElement>(null);
  const [save, { isLoading: saving }] = useUpdateProfileMutation();
  const [upload, { isLoading: uploading }] = useUploadAvatarMutation();
  const [removePhoto] = useDeleteAvatarMutation();
  const schema = useMemo(() => personalInfoSchema(tForm), [tForm]);
  const form = useForm<PersonalInfoFormValues>({ resolver: zodResolver(schema), defaultValues: valuesOf(profile) });
  useEffect(() => form.reset(valuesOf(profile)), [profile, form]);
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;

  const submit = form.handleSubmit(async (v) => {
    try {
      await save({ firstName: v.firstName, lastName: v.lastName, phone: v.phone, jobTitle: v.jobTitle, department: v.department, bio: v.bio }).unwrap();
    } catch {
      // The request says why; the form keeps the edits.
    }
  });

  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return void toast.error(t("photoType"));
    if (f.size > MAX_PHOTO) return void toast.error(t("photoTooLarge"));
    const body = new FormData();
    body.append("avatar", f);
    try {
      await upload(body).unwrap();
    } catch {
      // The request says why.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <CardHeader title={t("photoTitle")} description={t("photoHint")} />
        <div className="flex flex-wrap items-center gap-4">
          <Avatar size="lg" name={name} src={profile.avatar} />
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={file}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button variant="secondary" startIcon={<Camera />} loading={uploading} onClick={() => file.current?.click()}>
                {profile.avatar ? t("changePhoto") : t("uploadPhoto")}
              </Button>
              {profile.avatar ? (
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" startIcon={<Trash />}>
                      {t("removePhoto")}
                    </Button>
                  }
                  title={t("removePhotoTitle")}
                  impact={t("removePhotoImpact")}
                  confirmLabel={t("removePhoto")}
                  onConfirm={() => removePhoto().unwrap()}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <CardHeader title={t("personalTitle")} description={t("personalHint")} />
        <form onSubmit={submit} noValidate>
          <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFField control={form.control} name="firstName" label={t("firstName")} required render={(field) => <Input dir="auto" autoComplete="given-name" {...field} />} />
              <RHFField control={form.control} name="lastName" label={t("lastName")} required render={(field) => <Input dir="auto" autoComplete="family-name" {...field} />} />
              <div className="flex flex-col gap-1.5">
                <span className="text-label text-fg">{t("email")}</span>
                <p className="flex min-h-control-md items-center rounded-field border border-line bg-sunken px-3 text-body text-fg-muted">
                  <bdi dir="ltr">{profile.email}</bdi>
                </p>
                <span className="text-caption text-fg-muted">{t("emailHint")}</span>
              </div>
              <RHFField control={form.control} name="phone" label={t("phone")} optional render={(field) => <Input type="tel" dir="auto" autoComplete="tel" {...field} />} />
              <RHFField
                control={form.control}
                name="jobTitle"
                label={t("jobTitle")}
                optional
                render={(field) => <Input dir="auto" autoComplete="organization-title" {...field} />}
              />
              <RHFField control={form.control} name="department" label={t("department")} optional render={(field) => <Input dir="auto" {...field} />} />
            </div>
            <RHFField control={form.control} name="bio" label={t("bio")} optional render={(field) => <Textarea dir="auto" rows={3} {...field} />} />
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
              {form.formState.isDirty ? (
                <Button variant="ghost" disabled={saving} onClick={() => form.reset(valuesOf(profile))}>
                  {t("discard")}
                </Button>
              ) : null}
              <Button type="submit" variant="primary" loading={saving}>
                {t("save")}
              </Button>
            </div>
          </fieldset>
        </form>
      </Card>
    </div>
  );
}
