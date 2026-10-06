"use client";
// Billing details (USR-12): who the invoices are made out to, where they're sent, and the country
// that sets the tax and, until the first payment, the currency. Once the currency is locked a new
// country isn't applied here: it queues a move for support (R03-C4), and the page says what
// happens next. The tax rule that applies is shown as the platform states it.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { LockSimple, Receipt } from "@phosphor-icons/react";
import { Button, Card, ErrorState, Field, Input, LoadingState, PageHeader, Select, Textarea, toast } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import type { PlatformError } from "@/redux/features/platform/platformApi";
import { useBillingDetailsQuery, useBillingSaveDetailsMutation, type BuyerDetails } from "@/redux/features/platform/billing";
import { COUNTRIES, Notice, useCountryName, useTaxName } from "./shared";

const EMAIL = /^\S+@\S+\.\S+$/;

export function BillingDetailsView() {
  const t = useTranslations("Billing.details");
  const tb = useTranslations("Billing");
  const country = useCountryName();
  const taxName = useTaxName();
  const { data, isLoading, isError, refetch } = useBillingDetailsQuery();
  const [save, { isLoading: saving }] = useBillingSaveDetailsMutation();
  const form = useForm<BuyerDetails>({ defaultValues: { legalName: "", email: "", address: "", taxId: "", country: "" }, mode: "onTouched" });
  const [queued, setQueued] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (data) form.reset({ legalName: data.legalName ?? "", email: data.email ?? "", address: data.address ?? "", taxId: data.taxId ?? "", country: data.country ?? "" });
  }, [data, form]);

  if (isLoading) return <LoadingState rows={6} label={tb("loading")} />;
  if (isError || !data) return <ErrorState titleAs="h1" title={t("failed")} description={tb("tryAgain")} onRetry={refetch} />;

  const chosen = form.watch("country");
  const moving = data.currencyLocked && chosen && chosen !== data.country;
  const countryOptions = [...COUNTRIES].map((c) => ({ value: c, label: country(c) })).sort((a, b) => a.label.localeCompare(b.label));

  const submit = form.handleSubmit(async (v) => {
    setFailed(null);
    setQueued(null);
    const body = { legalName: v.legalName.trim(), email: v.email.trim(), address: v.address.trim(), taxId: v.taxId.trim(), country: v.country };
    try {
      const saved = await save(body).unwrap();
      if (saved.migrationQueued) {
        setQueued(v.country);
        form.reset({ ...body, country: saved.country });
      } else {
        form.reset(body);
        toast.success(saved.currency && saved.currency !== data.currency ? t("savedCurrency", { currency: saved.currency }) : t("saved"));
      }
    } catch (e) {
      const err = e as PlatformError;
      const fe = err?.fieldErrors ?? {};
      if (fe.legalName) form.setError("legalName", { message: t("required") });
      if (fe.email) form.setError("email", { message: t("emailInvalid") });
      if (fe.country) form.setError("country", { message: t("countryInvalid") });
      if (!err?.fieldErrors) setFailed(err?.status === 423 ? t("suspended") : t("saveFailed"));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      {queued ? (
        <Notice tone="info" title={t("queuedTitle", { country: country(queued) })}>
          {t("queuedBody", { from: country(data.country), currency: data.currency, email: data.email })}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField
              control={form.control}
              name="legalName"
              label={t("legalName")}
              description={t("legalNameHelp")}
              required
              className="sm:col-span-2"
              rules={{ validate: (v: string) => Boolean(v.trim()) || t("required") }}
              render={(f) => <Input dir="auto" autoComplete="organization" {...f} />}
            />
            <RHFField
              control={form.control}
              name="email"
              label={t("email")}
              description={t("emailHelp")}
              required
              rules={{ required: t("required"), validate: (v: string) => EMAIL.test(v.trim()) || t("emailInvalid") }}
              render={(f) => <Input dir="ltr" type="email" autoComplete="email" {...f} />}
            />
            <RHFField control={form.control} name="taxId" label={t("taxId")} description={t("taxIdHelp")} optional render={(f) => <Input dir="ltr" autoComplete="off" {...f} />} />
            <RHFField control={form.control} name="address" label={t("address")} optional className="sm:col-span-2" render={(f) => <Textarea dir="auto" maxRows={4} autoComplete="street-address" {...f} />} />
            <Controller
              control={form.control}
              name="country"
              rules={{ required: t("required") }}
              render={({ field, fieldState }) => (
                <Field label={t("country")} required error={fieldState.error?.message} description={data.currencyLocked ? t("countryLockedHelp", { currency: data.currency }) : t("countryHelp")} className="sm:col-span-2">
                  <Select options={countryOptions} value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")} />
                </Field>
              )}
            />
            {moving ? (
              <Notice tone="warning" className="sm:col-span-2" title={t("moveTitle", { country: country(chosen) })}>
                {t("moveBody", { currency: data.currency })}
              </Notice>
            ) : null}
            {failed ? <Notice tone="danger" className="sm:col-span-2" title={failed} /> : null}
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" loading={saving} disabled={!form.formState.isDirty}>
                {moving ? t("saveAndRequest") : t("save")}
              </Button>
            </div>
          </form>
        </Card>

        <aside aria-labelledby="tax-rule" className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <h2 id="tax-rule" className="flex items-center gap-2 font-display text-title-sm text-fg">
              <Receipt aria-hidden="true" className="text-fg-muted" />
              {t("taxTitle")}
            </h2>
            {data.tax ? (
              <>
                <p className="font-display text-title-lg text-fg">{t("taxRule", { name: taxName(data.tax.name), rate: data.tax.rate })}</p>
                <p className="text-body-sm text-fg-muted">{t("taxBody", { country: country(data.tax.country) })}</p>
                {data.tax.b2bReverseCharge ? <p className="text-body-sm text-fg-muted">{t("reverseCharge")}</p> : null}
              </>
            ) : (
              <p className="text-body text-fg-muted">{t("noTax", { country: country(data.country) })}</p>
            )}
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="flex items-center gap-2 font-display text-title-sm text-fg">
              <LockSimple aria-hidden="true" className="text-fg-muted" />
              {t("currencyTitle")}
            </h2>
            <p className="font-display text-title-lg text-fg">
              <span dir="ltr">{data.currency}</span>
            </p>
            <p className="text-body-sm text-fg-muted">{data.currencyLocked ? t("currencyLocked") : t("currencyOpen")}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
