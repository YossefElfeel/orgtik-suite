"use client";

// Admins and managers give a lead or customer to a salesperson (or take it back to unassigned).
// The salesperson then sees it in their own inbox.
import { useEffect, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Combobox, Field } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { useGetLeadOwnersQuery, useUpdateCustomerMutation } from "@/redux/features/customers/customersApi";
import { isolate } from "@/lib/bidi";

type Props = {
  customerId: string;
  name: string;
  /** The salesperson now, if any. */
  ownerId?: string | null;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const NONE = "none";

export default function AssignOwnerDialog({ customerId, name, ownerId, trigger, open, onOpenChange }: Props) {
  const t = useTranslations("Customers.assign");
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const [value, setValue] = useState<string>(ownerId ?? NONE);
  const [error, setError] = useState<string | null>(null);
  const owners = useGetLeadOwnersQuery(undefined, { skip: !isOpen });
  const [update] = useUpdateCustomerMutation();

  useEffect(() => {
    if (isOpen) {
      setValue(ownerId ?? NONE);
      setError(null);
    }
  }, [isOpen, ownerId]);

  const options = [
    { value: NONE, label: t("unassigned") },
    ...(owners.data ?? []).map((o) => ({ value: o.id, label: o.fullName, hint: o.email })),
  ];

  return (
    <FormDialog
      trigger={trigger}
      open={isOpen}
      onOpenChange={(next) => (onOpenChange ? onOpenChange(next) : setOwn(next))}
      title={t("title", { name: isolate(name) })}
      description={t("description")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      size="md"
      onSubmit={async () => {
        if (!value) {
          setError(t("required"));
          throw new Error("invalid");
        }
        await update({ id: customerId, body: { assignedSalesmanId: value === NONE ? null : value } }).unwrap();
      }}
    >
      <Field label={t("owner")} required error={error ?? (owners.isError ? t("loadFailed") : undefined)}>
        <Combobox
          options={options}
          value={value}
          onValueChange={(v) => {
            setValue(v ?? "");
            setError(null);
          }}
          placeholder={owners.isLoading ? t("loading") : t("placeholder")}
          emptyText={t("noMatch")}
          disabled={owners.isLoading}
        />
      </Field>
    </FormDialog>
  );
}
