"use client";

// Add or edit a person (FS-SOS-6), on library fields bound to react-hook-form. Editing loads the
// person's whole record first, so phone and address show what's saved (they showed blank), and
// only the fields you changed are sent. One password policy with sign-in. Time zone has a field
// now (it was in the schema with none). Email, username and phone read left to right in Arabic too.
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  Combobox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  MultiSelect,
  PasswordInput,
  Select,
  Spinner,
  Textarea,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { IPeopleItem, UserType } from "@/types/user";
import { useCreateUserMutation, useGetUserQuery, useUpdateUserMutation } from "@/redux/features/users/usersApi";
import { useGetAllScopesQuery } from "@/redux/features/scopes/scopesApi";
import { useAppLabel } from "@/components/suite/useSuiteApps";
import { USER_TYPES } from "@/components/dialogs/teams/EditUserTypeDialog";
import { LOCALES } from "@/i18n/config";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  userType: UserType;
  scopes: string[];
  isActive: boolean;
  phone: string;
  language: string;
  timeZone: string;
  address: string;
  city: string;
  country: string;
  bio: string;
};

type Detail = IPeopleItem & { phone?: string | null; address?: string | null; city?: string | null; country?: string | null };

const ENDONYMS: Record<string, string> = { en: "English", ar: "العربية", de: "Deutsch", fr: "Français", it: "Italiano" };
const timeZones = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Africa/Cairo", "Europe/Zurich", "Europe/Berlin", "Europe/Paris", "Europe/Rome", "Asia/Dubai", "Asia/Riyadh"];
  }
})();

const blank: Values = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  userType: UserType.EMPLOYEE,
  scopes: [],
  isActive: true,
  phone: "",
  language: "en",
  timeZone: "Africa/Cairo",
  address: "",
  city: "",
  country: "",
  bio: "",
};

const fromPerson = (p: Detail): Values => ({
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  email: p.email ?? "",
  username: p.username ?? "",
  password: "",
  userType: (p.userType as UserType) ?? UserType.EMPLOYEE,
  scopes: p.scopes ?? [],
  isActive: p.isActive ?? true,
  phone: p.phone ?? "",
  language: p.profile?.language ?? "en",
  timeZone: p.profile?.timeZone ?? "Africa/Cairo",
  address: p.address ?? "",
  city: p.city ?? "",
  country: p.country ?? "",
  bio: p.profile?.about ?? "",
});

export default function AddOrEditUserDialog({ user = null, open, onOpenChange }: { user?: IPeopleItem | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Person");
  const tp = useTranslations("People");
  const appLabel = useAppLabel();
  const isEdit = Boolean(user);
  const { data: detail, isFetching: loadingDetail } = useGetUserQuery(user?.id ?? 0, { skip: !open || !user });
  const { data: scopesData } = useGetAllScopesQuery(undefined, { skip: !open || isEdit });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const form = useForm<Values>({ defaultValues: blank, mode: "onTouched" });
  const ready = !isEdit || (detail && !loadingDetail);

  useEffect(() => {
    if (!open) return;
    if (!isEdit) form.reset(blank);
    else if (detail?.data) form.reset(fromPerson(detail.data as Detail));
  }, [open, isEdit, detail, form]);

  const toolOptions = useMemo(
    () => (scopesData?.data ?? []).filter((s) => s.isActive).map((s) => ({ value: s.name, label: appLabel(s.name, s.displayName || s.name) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopesData],
  );
  const typeOptions = USER_TYPES.map((v) => ({ value: v, label: tp(`types.${v}`) }));
  const languageOptions = LOCALES.map((l) => ({ value: l, label: ENDONYMS[l] }));
  const zoneOptions = timeZones.map((z) => ({ value: z, label: z.replace(/_/g, " ") }));

  const submit = form.handleSubmit(async (v) => {
    const dirty = form.formState.dirtyFields;
    const text = (s: string) => s.trim() || undefined;
    try {
      if (isEdit && user) {
        // Only what changed: an untouched field is never overwritten.
        const data: Record<string, unknown> = {};
        for (const key of Object.keys(dirty) as (keyof Values)[]) {
          if (key === "password") {
            if (v.password) data.password = v.password;
          } else if (key !== "scopes") {
            data[key === "bio" ? "bio" : key] = typeof v[key] === "string" ? (v[key] as string).trim() : v[key];
          }
        }
        if (Object.keys(data).length) await updateUser({ userId: user.id, data }).unwrap();
      } else {
        await createUser({
          email: v.email.trim(),
          username: v.username.trim(),
          password: v.password,
          firstName: v.firstName.trim(),
          lastName: v.lastName.trim(),
          userType: v.userType,
          scopes: v.scopes,
          isActive: v.isActive,
          bio: text(v.bio),
          phone: text(v.phone),
          address: text(v.address),
          city: text(v.city),
          country: text(v.country),
          language: v.language,
        }).unwrap();
      }
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback; the dialog stays open with what was typed.
    }
  });

  const required = { required: t("required") };
  const control = form.control;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{isEdit ? t("editBody") : t("addBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {!ready ? (
            <div className="grid min-h-48 place-items-center">
              <Spinner />
            </div>
          ) : (
            <form id="person-form" onSubmit={submit} noValidate className="flex flex-col gap-6">
              <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <legend className="mb-3 font-display text-title-sm text-fg">{t("account")}</legend>
                <RHFField control={control} name="firstName" rules={required} label={t("firstName")} required render={(f) => <Input dir="auto" autoComplete="off" {...f} />} />
                <RHFField control={control} name="lastName" rules={required} label={t("lastName")} required render={(f) => <Input dir="auto" autoComplete="off" {...f} />} />
                <RHFField
                  control={control}
                  name="email"
                  rules={{ ...required, pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("emailInvalid") } }}
                  label={t("email")}
                  required
                  render={(f) => <Input type="email" dir="ltr" autoComplete="off" {...f} />}
                />
                <RHFField control={control} name="username" rules={required} label={t("username")} required render={(f) => <Input dir="ltr" autoComplete="off" {...f} />} />
                <RHFField
                  control={control}
                  name="password"
                  rules={{
                    validate: (val: string) =>
                      (!isEdit && !val ? t("required") : val && val.length < PASSWORD_MIN ? t("passwordMin", { min: PASSWORD_MIN }) : val.length > PASSWORD_MAX ? t("passwordMax", { max: PASSWORD_MAX }) : true),
                  }}
                  label={t("password")}
                  required={!isEdit}
                  description={isEdit ? t("passwordKeep") : t("passwordRule", { min: PASSWORD_MIN })}
                  render={(f) => <PasswordInput autoComplete="new-password" {...f} />}
                />
                <RHFField control={control} name="userType" label={t("type")} render={(f) => <Select options={typeOptions} value={f.value} onValueChange={(v) => f.onChange(v ?? UserType.EMPLOYEE)} />} />
                {!isEdit ? (
                  <RHFField
                    control={control}
                    name="scopes"
                    label={t("tools")}
                    description={t("toolsHelp")}
                    className="sm:col-span-2"
                    render={(f) => <MultiSelect options={toolOptions} value={f.value} onValueChange={f.onChange} placeholder={t("toolsPlaceholder")} />}
                  />
                ) : null}
                <div className="sm:col-span-2">
                  <RHFField control={control} name="isActive" render={(f) => <Checkbox checked={f.value} onCheckedChange={(c) => f.onChange(c === true)} label={t("canSignIn")} description={t("canSignInHelp")} />} />
                </div>
              </fieldset>

              <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <legend className="mb-3 font-display text-title-sm text-fg">{t("contact")}</legend>
                <RHFField control={control} name="phone" label={t("phone")} optional render={(f) => <Input type="tel" dir="ltr" autoComplete="off" {...f} />} />
                <RHFField control={control} name="language" label={t("language")} render={(f) => <Select options={languageOptions} value={f.value} onValueChange={(v) => f.onChange(v ?? "en")} />} />
                <RHFField control={control} name="timeZone" label={t("timeZone")} render={(f) => <Combobox options={zoneOptions} value={f.value} onValueChange={(v) => f.onChange(v ?? f.value)} />} />
                <RHFField control={control} name="country" label={t("country")} optional render={(f) => <Input dir="auto" {...f} />} />
                <RHFField control={control} name="city" label={t("city")} optional render={(f) => <Input dir="auto" {...f} />} />
                <RHFField control={control} name="address" label={t("address")} optional render={(f) => <Input dir="auto" {...f} />} />
                <RHFField control={control} name="bio" label={t("about")} optional className="sm:col-span-2" render={(f) => <Textarea dir="auto" maxRows={6} {...f} />} />
              </fieldset>
            </form>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {tp("cancel")}
          </Button>
          <Button type="submit" form="person-form" variant="primary" loading={creating || updating} disabled={!ready}>
            {isEdit ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
