"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGenerateInvoicePdfMutation } from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
};

export default function SubscriptionInstallmentActions({
  invoiceId,
}: Props) {
  const [generatePdf] = useGenerateInvoicePdfMutation();
  const [pendingAction, setPendingAction] = useState<"view" | "download" | null>(
    null,
  );
  const tSub = useTranslations("subscriptions");

  const withPending = async (
    action: "view" | "download",
    run: () => Promise<void>,
  ) => {
    setPendingAction(action);
    try {
      await run();
    } finally {
      setPendingAction(null);
    }
  };

  const handleView = () =>
    void withPending("view", async () => {
      const blob = await generatePdf({
        invoiceIds: [invoiceId],
        disposition: "inline",
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    });

  const handleDownload = () =>
    void withPending("download", async () => {
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
      toast.success(tSub("invoicePdfDownloaded"));
    });

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost-primary"
        size="icon-sm"
        aria-label={tSub("viewPayment")}
        icon="solar:eye-linear"
        disabled={pendingAction === "view"}
        onClick={handleView}
      />
      <Button
        type="button"
        variant="ghost-green"
        size="icon-sm"
        aria-label={tSub("downloadPayment")}
        icon="solar:download-minimalistic-linear"
        disabled={pendingAction === "download"}
        onClick={handleDownload}
      />
    </div>
  );
}
