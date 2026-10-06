"use client";

// Adds a salesperson's CRM record, or edits one (admins). A record is what customers and deals are
// assigned to; signing in to the CRM is granted in SOS, so the form no longer asks for a password.
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Input, Select, Skeleton } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateSalesmanMutation, useGetSalesmanQuery, useUpdateSalesmanMutation } from "@/redux/features/salesman/salesmanApi";
import { useGetDepartmentsListQuery } from "@/redux/features/departments/departmentsApi";
import { useGetZonesListQuery } from "@/redux/features/zones/zonesApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { salesmanSchema, type SalesmanFormValues } from "@/schemas/salesman";
import type { SalesmanDetail, SalesmanDialogProps } from "@/types/salesman";

const NONE = "none";
const EMPTY: SalesmanFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  departmentId: "",
  zoneId: "",
  accountName: "",
  bankName: "",
  iban: "",
  swiftBic: "",
};

const valuesOf = (s: SalesmanDetail): SalesmanFormValues => ({
  fullName: s.fullName ?? "",
  email: s.email ?? "",
  phoneNumber: s.phoneNumber ?? "",
  address: s.address ?? "",
  departmentId: s.department?.id ?? s.departmentId ?? "",
  zoneId: s.zone?.id ?? s.zoneId ?? "",
  accountName: s.bankDetails?.accountName ?? "",
  bankName: s.bankDetails?.bankName ?? "",
  iban: s.bankDetails?.iban ?? "",
  swiftBic: s.bankDetails?.swiftBic ?? "",
});

/**
 * The API still asks for a password when a record is created, though it creates no login (access
 * comes from SOS). Send a random one nobody knows rather than ask the admin for a password that
 * does nothing. Reported as an API change.
 */
const unusedPassword = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export default function SalesmanDialog({ id, trigger, open: controlled, onOpenChange }: SalesmanDialogProps) {
  const t = useTranslations("Team.salespeople");
  const tForm = useTranslations("Team.form");
  const display = useCatalogDisplayText();
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const editing = Boolean(id);
  const current = useGetSalesmanQuery(id ?? "", { skip: !open || !id });
  const departments = useGetDepartmentsListQuery({ page: 1, limit: 100 }, { skip: !open });
  const zones = useGetZonesListQuery({ page: 1, limit: 100 }, { skip: !open });
  const [create] = useCreateSalesmanMutation();
  const [update] = useUpdateSalesmanMutation();

  const schema = useMemo(() => salesmanSchema(tForm), [tForm]);
  const form = useForm<SalesmanFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const loaded = current.data?.data;
  useEffect(() => {
    if (open && loaded) form.reset(valuesOf(loaded));
  }, [open, loaded, form]);

  const submit = async () => {
    let failed = false;
    await form.handleSubmit(
      async (v) => {
        const bankDetails = { accountName: v.accountName || null, bankName: v.bankName || null, iban: v.iban || null, swiftBic: v.swiftBic || null };
        const hasBank = Object.values(bankDetails).some(Boolean);
        if (id) {
          await update({
            id,
            body: {
              fullName: v.fullName,
              email: v.email,
              phoneNumber: v.phoneNumber || null,
              address: v.address || null,
              departmentId: v.departmentId || null,
              zoneId: v.zoneId || null,
              bankDetails: hasBank ? bankDetails : null,
            },
          }).unwrap();
        } else {
          await create({
            fullName: v.fullName,
            email: v.email,
            ...(v.phoneNumber ? { phoneNumber: v.phoneNumber } : {}),
            ...(v.address ? { address: v.address } : {}),
            ...(v.departmentId ? { departmentId: v.departmentId } : {}),
            ...(v.zoneId ? { zoneId: v.zoneId } : {}),
            ...(hasBank ? { bankDetails } : {}),
            password: unusedPassword(),
          }).unwrap();
        }
      },
      () => {
        failed = true;
      },
    )();
    if (failed) throw new Error("invalid");
  };

  const loading = editing && current.isLoading;

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      onClosed={() => form.reset(EMPTY)}
      title={editing ? t("editTitle") : t("addTitle")}
      description={editing ? undefined : t("addHint")}
      submitLabel={editing ? t("save") : t("add")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
      size="lg"
    >
      {loading ? (
        <div role="status" aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField control={form.control} name="fullName" label={t("fullName")} required render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
            <RHFField control={form.control} name="email" label={t("email")} required render={(field) => <Input type="email" dir="auto" autoComplete="off" {...field} />} />
            <RHFField control={form.control} name="phoneNumber" label={t("phone")} optional render={(field) => <Input type="tel" dir="auto" autoComplete="off" {...field} />} />
            <RHFField control={form.control} name="address" label={t("address")} optional render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
            <RHFField
              control={form.control}
              name="departmentId"
              label={t("department")}
              optional
              render={(field) => (
                <Select
                  name={field.name}
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v && v !== NONE ? v : "")}
                  options={[{ value: NONE, label: t("noDepartment") }, ...(departments.data?.data?.items ?? []).map((d) => ({ value: d.id, label: display(d.name) }))]}
                />
              )}
            />
            <RHFField
              control={form.control}
              name="zoneId"
              label={t("zone")}
              description={t("zoneHint")}
              optional
              render={(field) => (
                <Select
                  name={field.name}
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v && v !== NONE ? v : "")}
                  options={[{ value: NONE, label: t("noZone") }, ...(zones.data?.data?.items ?? []).map((z) => ({ value: z.id, label: z.name }))]}
                />
              )}
            />
          </div>
          <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 border-t border-line p-0 pt-4">
            <legend className="float-start mb-1 w-full p-0 text-title-sm text-fg">{t("bankDetails")}</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFField control={form.control} name="accountName" label={t("accountName")} optional render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
              <RHFField control={form.control} name="bankName" label={t("bankName")} optional render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
              <RHFField control={form.control} name="iban" label={t("iban")} optional render={(field) => <Input dir="auto" autoComplete="off" spellCheck={false} {...field} />} />
              <RHFField control={form.control} name="swiftBic" label={t("swift")} optional render={(field) => <Input dir="auto" autoComplete="off" spellCheck={false} {...field} />} />
            </div>
          </fieldset>
        </>
      )}
    </FormDialog>
  );
}
