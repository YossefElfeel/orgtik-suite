"use client";

import {
  ActionCell,
  ActionItem,
} from "@/components/shared/Table/cell/ActionCell";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import CreateCustomInvoiceDialog from "@/components/dialogs/invoices/CreateCustomInvoiceDialog";
import SendCustomInvoiceDialog from "@/components/dialogs/invoices/SendCustomInvoiceDialog";
import MarkCustomInvoicePaidDialog from "@/components/dialogs/invoices/MarkCustomInvoicePaidDialog";
import CustomInvoiceDetailsDialog from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/format-amount";
import { getCustomInvoiceTotal } from "@/lib/custom-invoice";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { useDeleteCustomInvoiceMutation } from "@/redux/features/invoices/invoicesApi";
import type { CustomInvoiceListItem } from "@/types/invoices";
import { useTranslations } from "next-intl";

type Props = {
  invoice: CustomInvoiceListItem;
};

export default function CustomInvoiceActions({ invoice }: Props) {
  const [deleteCustomInvoice, { isLoading: isDeleting }] =
    useDeleteCustomInvoiceMutation();
  const t = useTranslations("invoices");

  const amountLabel = formatAmount(
    getCustomInvoiceTotal(invoice),
    getInvoiceCurrencyCode(invoice),
  );
  const canMarkPaid =
    invoice.status !== "paid" && invoice.canMarkPaidManually !== false;

  return (
    <ActionCell>
      <CustomInvoiceDetailsDialog
        invoiceId={invoice.invoiceId}
        trigger={
          <ActionItem icon="solar:eye-linear" label={t("viewDetails")} />
        }
      />
      <CreateCustomInvoiceDialog
        mode="edit"
        invoiceId={invoice.invoiceId}
        trigger={<ActionItem icon="solar:pen-linear" label={t("edit")} />}
      />
      <SendCustomInvoiceDialog
        invoiceId={invoice.invoiceId}
        defaultEmails={
          [invoice.email, invoice.contactEmail].filter(
            (value): value is string => Boolean(value?.trim()),
          )
        }
        trigger={
          <ActionItem icon="solar:letter-linear" label={t("sendByEmail")} />
        }
      />
      {canMarkPaid ? (
        <MarkCustomInvoicePaidDialog
          invoiceId={invoice.invoiceId}
          amountLabel={amountLabel}
          trigger={
            <ActionItem
              icon="solar:check-circle-linear"
              label={t("markAsPaid")}
            />
          }
        />
      ) : null}
      <DeleteDialog
        title={t("deleteCustomInvoice", { id: invoice.invoiceNumber ?? invoice.invoiceId })}
        onConfirm={() => deleteCustomInvoice(invoice.invoiceId).unwrap()}
        isLoading={isDeleting}
        trigger={
          <ActionItem
            icon="solar:trash-bin-trash-linear"
            label={t("delete")}
            destructive
          />
        }
      />
    </ActionCell>
  );
}

export function CustomInvoiceQuickViewButton({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const t = useTranslations("invoices");
  
  return (
    <CustomInvoiceDetailsDialog
      invoiceId={invoiceId}
      trigger={
        <Button
          type="button"
          variant="ghost-primary"
          size="icon-sm"
          aria-label={t("viewInvoice", { id: invoiceId })}
          icon="solar:eye-linear"
        />
      }
    />
  );
}
