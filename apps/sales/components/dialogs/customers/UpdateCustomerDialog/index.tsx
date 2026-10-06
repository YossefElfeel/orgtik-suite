"use client";

// Edit a customer's details. It loads the record itself (house rule 6); a refused save keeps the
// form open with what was typed. The owner is chosen here by admins and managers only.
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ErrorState, Skeleton } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import CustomerFormFields from "@/components/pages/customers/CustomerFormFields";
import { useGetCustomerQuery, useUpdateCustomerMutation } from "@/redux/features/customers/customersApi";
import { customerFormSchema, CUSTOMER_LANGUAGES, type CustomerFormValues } from "@/schemas/customers";
import type { CustomerDetail } from "@/types/customers";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";

type Props = {
  id: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const valuesOf = (c: CustomerDetail): CustomerFormValues => ({
  fullName: c.fullName ?? "",
  email: c.email ?? "",
  phoneNumber: c.phoneNumber ?? "",
  address: c.address ?? "",
  countryCode: (c.countryCode ?? "").toUpperCase(),
  companyName: c.companyName ?? "",
  commercialRegistrationNumber: c.commercialRegistrationNumber ?? "",
  website: c.website ?? "",
  assignedSalesmanId: c.assignedSalesmanId ?? "",
  preferredLanguage: (CUSTOMER_LANGUAGES as readonly string[]).includes(c.preferredLanguage) ? c.preferredLanguage : "en",
  sendInvite: false,
});

export default function UpdateCustomerDialog({ id, trigger, open, onOpenChange }: Props) {
  const t = useTranslations("Customers.edit");
  const tForm = useTranslations("Customers.form");
  const { isAdmin, isManager } = useRole();
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOwn(next));
  const query = useGetCustomerQuery(id, { skip: !isOpen });
  const customer = query.data?.data;
  const [updateCustomer] = useUpdateCustomerMutation();
  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerFormSchema(tForm)), mode: "onTouched" });
  const canAssign = isAdmin || isManager;

  // Filled once per opening, so a refetch while someone types doesn't wipe their changes.
  const filled = useRef(false);
  useEffect(() => {
    if (!isOpen) filled.current = false;
    else if (customer && !filled.current) {
      filled.current = true;
      form.reset(valuesOf(customer));
    }
  }, [isOpen, customer, form]);

  const onSubmit = async () => {
    if (!customer) throw new Error("not loaded");
    let values: CustomerFormValues | null = null;
    await form.handleSubmit((v) => {
      values = v;
    })();
    if (!values) throw new Error("invalid");
    const v = values as CustomerFormValues;
    await updateCustomer({
      id,
      body: {
        fullName: v.fullName,
        email: v.email,
        phoneNumber: v.phoneNumber,
        address: v.address,
        countryCode: v.countryCode,
        companyName: v.companyName,
        commercialRegistrationNumber: v.commercialRegistrationNumber || null,
        website: v.website || null,
        preferredLanguage: v.preferredLanguage,
        ...(canAssign ? { assignedSalesmanId: v.assignedSalesmanId || null } : {}),
      },
    }).unwrap();
  };

  return (
    <FormDialog
      trigger={trigger}
      open={isOpen}
      onOpenChange={setOpen}
      title={t("title")}
      description={customer ? t("description", { name: isolate(customer.fullName) }) : undefined}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
      size="lg"
    >
      {query.isError ? (
        <ErrorState size="compact" title={t("loadFailed")} onRetry={() => void query.refetch()} />
      ) : !customer ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <CustomerFormFields form={form} showOwner={canAssign} showInvite={false} />
      )}
    </FormDialog>
  );
}
