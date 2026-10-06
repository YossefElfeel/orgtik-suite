"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useGenerateInvoicePdfMutation } from "@/redux/features/invoices/invoicesApi";
import type { SubscriptionInvoiceHistoryDto } from "@/types/subscriptions";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format-date";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { useTranslations } from "next-intl";

type Props = {
  subscriptionId: string;
  items: SubscriptionInvoiceHistoryDto[];
};

export default function SubscriptionPaymentHistory({
  subscriptionId,
  items,
}: Props) {
  const [generatePdf] = useGenerateInvoicePdfMutation();
  const [pendingPdfKeys, setPendingPdfKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const tSub = useTranslations("subscriptions");

  const getPdfPayload = (invoiceId?: string) =>
    invoiceId ? { invoiceIds: [invoiceId] } : { subscriptionId };

  const withPdfPending = async (key: string, run: () => Promise<void>) => {
    setPendingPdfKeys((prev) => new Set(prev).add(key));
    try {
      await run();
    } finally {
      setPendingPdfKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleViewPdf = async (key: string, invoiceId?: string) => {
    await withPdfPending(key, async () => {
      const blob = await generatePdf({
        ...getPdfPayload(invoiceId),
        disposition: "inline",
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    });
  };

  const handleDownloadPdf = async (key: string, invoiceId?: string) => {
    await withPdfPending(key, async () => {
      const blob = await generatePdf({
        ...getPdfPayload(invoiceId),
        disposition: "attachment",
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = invoiceId
        ? `invoice-${invoiceId}.pdf`
        : `subscription-${subscriptionId}-invoices.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success(tSub("invoicePdfDownloaded"));
    });
  };

  return (
    <SectionCard title={tSub("paymentHistory")}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Icon
              icon="solar:bill-list-linear"
              className="size-7 text-secondary"
            />
          </div>
          <p className="text-sm text-secondary">{tSub("noPayments")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, index) => {
            const reference =
              item.invoiceCode || item.createdAt || String(index);
            const invoiceId = item.invoiceId;
            const rowKey = invoiceId ?? reference;
            const viewKey = `view:${rowKey}`;
            const downloadKey = `download:${rowKey}`;
            return (
              <li
                key={reference}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {formatAmount(item.amount, getInvoiceCurrencyCode(item))}
                  </span>
                  <span className="text-xs text-secondary">
                    {item.paymentMethod || "—"} ·{" "}
                    {formatShortDate(item.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost-primary"
                    size="icon-sm"
                    aria-label={tSub("viewPayment")}
                    icon="solar:eye-linear"
                    disabled={pendingPdfKeys.has(viewKey)}
                    onClick={() =>
                      void handleViewPdf(viewKey, invoiceId)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost-green"
                    size="icon-sm"
                    aria-label={tSub("downloadPayment")}
                    icon="solar:download-minimalistic-linear"
                    disabled={pendingPdfKeys.has(downloadKey)}
                    onClick={() =>
                      void handleDownloadPdf(downloadKey, invoiceId)
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
