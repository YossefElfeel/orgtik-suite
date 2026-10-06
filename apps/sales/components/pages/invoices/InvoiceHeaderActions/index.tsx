"use client";

import { toast } from "sonner";
import type { InvoiceDetail } from "@/types/invoices";
import { Button } from "@/components/ui/button";
import MarkPaidDialog from "@/components/dialogs/invoices/MarkPaidDialog";
import VoidInvoiceDialog from "@/components/dialogs/invoices/VoidInvoiceDialog";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import {
  useGenerateInvoicePdfMutation,
  useMarkInvoicePaidMutation,
  useVoidInvoiceMutation,
} from "@/redux/features/invoices/invoicesApi";
import { toMarkInvoicePaidDTO } from "@/schemas/invoices";
import type { MarkPaidFormValues } from "@/schemas/invoices";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

type Props = {
  invoice: InvoiceDetail;
};

export default function InvoiceHeaderActions({ invoice }: Props) {
  const { isCustomer } = useRole();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkInvoicePaidMutation();
  const [voidInvoice, { isLoading: isVoiding }] = useVoidInvoiceMutation();
  const [generatePdf, { isLoading: isGeneratingPdf }] =
    useGenerateInvoicePdfMutation();
  const t = useTranslations("invoices");

  const amountLabel = formatAmount(
    invoice.totalAmount ?? invoice.totalPrice,
    getInvoiceCurrencyCode(invoice),
  );
  const canActOnPayment =
    !isCustomer &&
    (invoice.status === "pending" ||
      invoice.status === "overdue" ||
      invoice.status === "partial");

  const handleViewPdf = async () => {
    const blob = await generatePdf({
      invoiceIds: [invoice.invoiceId],
      disposition: "inline",
    }).unwrap();

    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  };

  const handleDownloadPdf = async () => {
    const blob = await generatePdf({
      invoiceIds: [invoice.invoiceId],
      disposition: "attachment",
    }).unwrap();

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `invoice-${invoice.invoiceId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    toast.success(t("invoicePdfDownloaded"));
  };

  const handleMarkPaid = async (values: MarkPaidFormValues) => {
    await markPaid({
      invoiceId: invoice.invoiceId,
      body: toMarkInvoicePaidDTO(values),
    }).unwrap();
  };

  const handleVoid = async (reason: string) => {
    await voidInvoice({
      invoiceId: invoice.invoiceId,
      body: { reason },
    }).unwrap();
  };

  const pdfButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        icon="solar:eye-linear"
        disabled={isGeneratingPdf}
        onClick={() => {
          void handleViewPdf();
        }}
      >
        {t("view")}
      </Button>
      <Button
        type="button"
        variant="outline"
        icon="solar:download-minimalistic-linear"
        disabled={isGeneratingPdf}
        onClick={() => {
          void handleDownloadPdf();
        }}
      >
        {t("pdf")}
      </Button>
    </>
  );

  if (invoice.status === "paid" || invoice.status === "void" || isCustomer) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {pdfButtons}
      </div>
    );
  }

  if (canActOnPayment) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <VoidInvoiceDialog
          invoiceId={invoice.invoiceId}
          onConfirm={handleVoid}
          isLoading={isVoiding}
          trigger={
            <Button
              type="button"
              variant="outline"
              className="border-red/30 text-red hover:bg-red/5 hover:text-red"
              icon="solar:close-circle-linear"
            >
              {t("voidAction")}
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {pdfButtons}
          <MarkPaidDialog
            invoiceId={invoice.invoiceId}
            amountLabel={amountLabel}
            onConfirm={handleMarkPaid}
            isLoading={isMarkingPaid}
            trigger={
              <Button type="button" icon="solar:check-circle-linear">
                {t("markAsPaidAction")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">{pdfButtons}</div>
  );
}
