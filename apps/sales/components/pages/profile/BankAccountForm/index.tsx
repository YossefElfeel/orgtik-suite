"use client";

// A salesperson's own bank account, where commissions are paid. It used to log the IBAN to the
// console and show a success toast without saving anything (SAL-007). Now it reads the
// salesperson's record and saves through PUT /salesman/:id, with its own load, error and save states.
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, Card, CardHeader, EmptyState, ErrorState, Input, LoadingState } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useGetMySalesmanProfileQuery, useUpdateSalesmanMutation } from "@/redux/features/salesman/salesmanApi";
import { errorStatus } from "@/lib/commissions";
import { useRole } from "@/hooks/useRole";
import { bankAccountSchema, type BankAccountFormValues } from "@/schemas/profile";
import type { SalesmanBankDetails } from "@/types/salesman";

const valuesOf = (b: SalesmanBankDetails | null | undefined): BankAccountFormValues => ({
  accountName: b?.accountName ?? "",
  bankName: b?.bankName ?? "",
  iban: b?.iban ?? "",
  swiftBic: b?.swiftBic ?? "",
});

export default function BankAccountForm() {
  const t = useTranslations("Team.profile");
  const tForm = useTranslations("Team.form");
  const { canEdit } = useRole();
  const me = useGetMySalesmanProfileQuery();
  const [update, { isLoading: saving }] = useUpdateSalesmanMutation();
  const schema = useMemo(() => bankAccountSchema(tForm), [tForm]);
  const form = useForm<BankAccountFormValues>({ resolver: zodResolver(schema), defaultValues: valuesOf(null) });
  const record = me.data?.data;
  useEffect(() => {
    if (record) form.reset(valuesOf(record.bankDetails));
  }, [record, form]);

  if (me.isLoading) return <LoadingState rows={3} label={t("bankTitle")} />;
  if (me.isError && errorStatus(me.error) === 404) return <EmptyState title={t("bankNoRecordTitle")} description={t("bankNoRecordBody")} />;
  if (me.isError || !record) return <ErrorState title={t("bankErrorTitle")} description={t("errorBody")} onRetry={() => void me.refetch()} />;

  const submit = form.handleSubmit(async (v) => {
    try {
      await update({
        id: record.id,
        body: { bankDetails: { accountName: v.accountName, bankName: v.bankName, iban: v.iban.replace(/\s+/g, " ").trim(), swiftBic: v.swiftBic || null } },
      }).unwrap();
    } catch {
      // The request says why; the form keeps the edits.
    }
  });

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader title={t("bankTitle")} description={t("bankHint")} />
      <form onSubmit={submit} noValidate>
        <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField control={form.control} name="accountName" label={t("accountName")} required render={(field) => <Input dir="auto" autoComplete="name" {...field} />} />
            <RHFField control={form.control} name="bankName" label={t("bankName")} required render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
            <RHFField
              control={form.control}
              name="iban"
              label={t("iban")}
              description={t("ibanHint")}
              required
              render={(field) => <Input dir="auto" autoComplete="off" spellCheck={false} {...field} />}
            />
            <RHFField
              control={form.control}
              name="swiftBic"
              label={t("swift")}
              optional
              render={(field) => <Input dir="auto" autoComplete="off" spellCheck={false} {...field} />}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
            {form.formState.isDirty ? (
              <Button variant="ghost" disabled={saving} onClick={() => form.reset(valuesOf(record.bankDetails))}>
                {t("discard")}
              </Button>
            ) : null}
            <Button type="submit" variant="primary" loading={saving}>
              {t("saveBank")}
            </Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
