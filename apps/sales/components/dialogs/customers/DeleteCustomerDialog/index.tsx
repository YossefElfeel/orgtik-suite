"use client";

// Deleting a customer names them and says what goes with them. The title was "Delete Delete
// <name>" (SAL-172). Admins and managers only; the API refuses while the customer can sign in.
import type { ReactElement } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";
import { useDeleteCustomerMutation } from "@/redux/features/customers/customersApi";
import { isolate } from "@/lib/bidi";

type Props = {
  customerId: string;
  name: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleted?: () => void;
};

export default function DeleteCustomerDialog({ customerId, name, trigger, open, onOpenChange, onDeleted }: Props) {
  const t = useTranslations("Customers.delete");
  const [remove] = useDeleteCustomerMutation();
  return (
    <ConfirmDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      irreversible
      title={t("title", { name: isolate(name) })}
      impact={t("impact")}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={async () => {
        await remove(customerId).unwrap();
        onDeleted?.();
      }}
    />
  );
}
