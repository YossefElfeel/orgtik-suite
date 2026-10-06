"use client";

// The customer form's fields, shared by New customer and Edit customer: library fields bound to
// react-hook-form, with the zod messages in the reader's language. The preferred language offers
// all five of the suite's languages, Arabic included (SAL-110).
import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkbox, Combobox, Input, Select } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { CUSTOMER_LANGUAGES, type CustomerFormValues } from "@/schemas/customers";
import { useGetLeadOwnersQuery } from "@/redux/features/customers/customersApi";
import CountryCombobox from "../CountryCombobox";
import { useDisplayNames } from "../leads";

type Props = {
  form: UseFormReturn<CustomerFormValues>;
  /** Admins and managers choose the salesperson; a salesperson's own customers stay theirs. */
  showOwner: boolean;
  /** Only when creating: send the invitation to set a password. */
  showInvite: boolean;
};

const NONE = "none";

export default function CustomerFormFields({ form, showOwner, showInvite }: Props) {
  const t = useTranslations("Customers.form");
  const names = useDisplayNames();
  const owners = useGetLeadOwnersQuery(undefined, { skip: !showOwner });
  const { control } = form;

  return (
    <>
      <section className="flex flex-col gap-4" aria-labelledby="customer-form-contact">
        <h3 id="customer-form-contact" className="text-label text-fg-muted">
          {t("contactSection")}
        </h3>
        <RHFField control={control} name="fullName" label={t("fullName")} required render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <RHFField control={control} name="email" label={t("email")} required render={(field) => <Input type="email" dir="ltr" autoComplete="off" {...field} />} />
          <RHFField control={control} name="phoneNumber" label={t("phone")} required render={(field) => <Input type="tel" dir="ltr" autoComplete="off" {...field} />} />
        </div>
        <RHFField control={control} name="address" label={t("address")} required render={(field) => <Input dir="auto" {...field} />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <RHFField
            control={control}
            name="countryCode"
            label={t("country")}
            required
            render={(field) => (
              <CountryCombobox value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")} placeholder={t("countryPlaceholder")} emptyText={t("noMatch")} />
            )}
          />
          <RHFField
            control={control}
            name="preferredLanguage"
            label={t("language")}
            description={t("languageHint")}
            required
            render={(field) => (
              <Select
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                options={CUSTOMER_LANGUAGES.map((code) => ({ value: code, label: names.language(code) }))}
              />
            )}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="customer-form-business">
        <h3 id="customer-form-business" className="text-label text-fg-muted">
          {t("businessSection")}
        </h3>
        <RHFField control={control} name="companyName" label={t("company")} required render={(field) => <Input dir="auto" {...field} />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <RHFField control={control} name="commercialRegistrationNumber" label={t("register")} optional render={(field) => <Input dir="ltr" {...field} />} />
          <RHFField control={control} name="website" label={t("website")} optional render={(field) => <Input type="url" dir="ltr" placeholder="example.com" {...field} />} />
        </div>
        {showOwner ? (
          <RHFField
            control={control}
            name="assignedSalesmanId"
            label={t("owner")}
            optional
            render={(field) => (
              <Combobox
                options={[{ value: NONE, label: t("unassigned") }, ...(owners.data ?? []).map((o) => ({ value: o.id, label: o.fullName, hint: o.email }))]}
                value={field.value || NONE}
                onValueChange={(v) => field.onChange(!v || v === NONE ? "" : v)}
                placeholder={owners.isLoading ? t("loading") : t("ownerPlaceholder")}
                emptyText={t("noMatch")}
                disabled={owners.isLoading}
              />
            )}
          />
        ) : null}
        <p className="text-caption text-fg-muted">{t("documentsHint")}</p>
      </section>

      {showInvite ? (
        <RHFField
          control={control}
          name="sendInvite"
          render={(field) => (
            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} label={t("sendInvite")} description={t("sendInviteHint")} />
          )}
        />
      ) : null}
    </>
  );
}
