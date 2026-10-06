"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useGenerateInvoicePdfMutation } from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
};

export default function InvoiceActions({ invoiceId }: Props) {
  const [generatePdf, { isLoading }] = useGenerateInvoicePdfMutation();
  const t = useTranslations("invoices");

  const handleDownload = async () => {
    const blob = await generatePdf({
      invoiceIds: [invoiceId],
      disposition: "attachment",
    }).unwrap();

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    toast.success(t("invoicePdfDownloaded"));
  };

  return (
    <div className="flex items-center gap-1.5">
      <Link href={`/invoices/${invoiceId}`}>
        <Button
          type="button"
          variant="ghost-primary"
          size="icon-sm"
          aria-label={t("viewInvoice", { id: invoiceId })}
          icon="solar:eye-linear"
        />
      </Link>
      <Button
        type="button"
        size="icon-sm"
        aria-label={t("downloadInvoice", { id: invoiceId })}
        icon="solar:download-minimalistic-linear"
        variant="ghost-green"
        disabled={isLoading}
        onClick={() => {
          void handleDownload();
        }}
      />
    </div>
  );
}
