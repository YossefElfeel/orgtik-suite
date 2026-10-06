"use client";

import { useState, type ReactElement } from "react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import CustomInvoiceHtmlContent from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoiceHtmlContent";
import CustomInvoiceInfoField from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoiceInfoField";
import CustomInvoiceLineItemCard from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoiceLineItemCard";
import CustomInvoicePdfPreview from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoicePdfPreview";
import CustomInvoiceSummaryRow from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoiceSummaryRow";
import InvoiceStatusCell from "@/components/pages/invoices/InvoiceStatusCell";
import PillTabs from "@/components/shared/PillTabs";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import {
  formatTaxPercent,
  getCustomInvoiceBillTo,
  getCustomInvoiceSenderContact,
  getCustomInvoiceTotal,
  hasRichText,
} from "@/lib/custom-invoice";
import { formatAmount } from "@/lib/format-amount";
import { formatShortDate } from "@/lib/format-date";
import { pickDisplayData } from "@/lib/api-display";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import {
  useDownloadCustomInvoicePdfMutation,
  useGetCustomInvoiceQuery,
} from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  trigger: ReactElement;
};

type DetailsTab = "details" | "pdfPreview";

export default function CustomInvoiceDetailsDialog({
  invoiceId,
  trigger,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailsTab>("details");
  const { data, isFetching, isLoading } = useGetCustomInvoiceQuery(
    { invoiceId },
    { skip: !open },
  );
  const [downloadPdf, { isLoading: isDownloading }] =
    useDownloadCustomInvoicePdfMutation();

  const invoice = pickDisplayData(data);
  const isInitialLoading = isLoading || (isFetching && !invoice);
  const emptyValue = "—";
  const totalAmount = invoice ? getCustomInvoiceTotal(invoice) : 0;
  const currencyCode = getInvoiceCurrencyCode(invoice);
  const billTo = invoice ? getCustomInvoiceBillTo(invoice) : null;
  const senderContact = invoice
    ? getCustomInvoiceSenderContact(invoice)
    : null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveTab("details");
    }
  };

  const handleDownloadPdf = async () => {
    if (invoice?.invoicePdfUrl) {
      window.open(invoice.invoicePdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const blob = await downloadPdf(invoiceId).unwrap();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileName = invoice?.invoiceNumber ?? invoiceId;
    anchor.href = url;
    anchor.download = `custom-invoice-${fileName}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    toast.success(t("invoicePdfDownloaded"));
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("customInvoiceDetails")}
      description={invoice?.invoiceNumber ?? invoiceId}
      size="2xl"
      expandable
      showFooter
      onCancelText={tCommon("close")}
    >
      {isInitialLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader className="size-6 animate-spin text-secondary" />
        </div>
      ) : invoice ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InvoiceStatusCell status={invoice.status} />
            <Button
              type="button"
              variant="outline"
              icon="solar:download-minimalistic-linear"
              disabled={isDownloading}
              onClick={() => {
                void handleDownloadPdf();
              }}
            >
              {t("downloadPdf")}
            </Button>
          </div>

          <PillTabs
            items={[
              {
                id: "details",
                label: t("details"),
                icon: "solar:document-text-linear",
              },
              {
                id: "pdfPreview",
                label: t("pdfPreview"),
                icon: "solar:file-text-linear",
              },
            ]}
            value={activeTab}
            onValueChange={(id) => setActiveTab(id as DetailsTab)}
            variant="surface"
            size="sm"
            ariaLabel={t("customInvoiceDetailsTabs")}
          />

          {activeTab === "pdfPreview" ? (
            <CustomInvoicePdfPreview
              invoiceId={invoiceId}
              fileName={invoice.invoiceNumber}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-white px-5 py-4 sm:grid-cols-4">
                <CustomInvoiceInfoField
                  label={t("amount")}
                  value={formatAmount(totalAmount, currencyCode)}
                />
                <CustomInvoiceInfoField
                  label={t("columnDueDate")}
                  value={
                    invoice.dueDate
                      ? formatShortDate(invoice.dueDate)
                      : emptyValue
                  }
                />
                <CustomInvoiceInfoField
                  label={t("issued")}
                  value={formatShortDate(invoice.issuedAt ?? invoice.createdAt)}
                />
                <CustomInvoiceInfoField
                  label={t("taxRate")}
                  value={formatTaxPercent(invoice.taxRate)}
                />
              </div>

              <SectionCard title={t("columnBillTo")}>
                {billTo?.hasContent ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      {billTo.name || emptyValue}
                    </p>
                    {billTo.contactPerson ? (
                      <p className="text-sm text-secondary">
                        {billTo.contactPerson}
                      </p>
                    ) : null}
                    {billTo.email ? (
                      <p className="text-sm text-secondary">{billTo.email}</p>
                    ) : null}
                    {billTo.phone ? (
                      <p className="text-sm text-secondary">{billTo.phone}</p>
                    ) : null}
                    <CustomInvoiceHtmlContent html={billTo.address} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{emptyValue}</p>
                )}
              </SectionCard>

              {senderContact?.hasContent ? (
                <SectionCard title={t("contact")}>
                  <div className="flex flex-col gap-1">
                    {senderContact.name ? (
                      <p className="text-sm font-semibold text-foreground">
                        {senderContact.name}
                      </p>
                    ) : null}
                    {senderContact.email ? (
                      <p className="text-sm text-secondary">
                        {senderContact.email}
                      </p>
                    ) : null}
                    {senderContact.phone ? (
                      <p className="text-sm text-secondary">
                        {senderContact.phone}
                      </p>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null}

              {hasRichText(invoice.description) ? (
                <SectionCard title={tCommon("description")}>
                  <CustomInvoiceHtmlContent html={invoice.description} />
                </SectionCard>
              ) : null}

              <SectionCard title={t("lineItems")}>
                {(invoice.lineItems ?? []).length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {(invoice.lineItems ?? []).map((item, index) => (
                      <CustomInvoiceLineItemCard
                        key={`${invoice.invoiceId}-${index}`}
                        item={item}
                        currency={currencyCode}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("noLineItems")}
                  </p>
                )}
              </SectionCard>

              <SectionCard title={t("summary")}>
                <div className="flex flex-col gap-3">
                  <CustomInvoiceSummaryRow
                    label={tCommon("subtotal")}
                    value={formatAmount(
                      invoice.subtotalAmount ?? totalAmount,
                      currencyCode,
                    )}
                  />
                  <CustomInvoiceSummaryRow
                    label={t("tax")}
                    value={formatAmount(
                      invoice.taxAmount ?? 0,
                      currencyCode,
                    )}
                  />
                  <div className="border-t border-border pt-3">
                    <CustomInvoiceSummaryRow
                      label={tCommon("total")}
                      value={formatAmount(totalAmount, currencyCode)}
                      emphasized
                    />
                  </div>
                </div>
              </SectionCard>

              {hasRichText(invoice.closingText) ? (
                <SectionCard title={t("closingText")}>
                  <CustomInvoiceHtmlContent html={invoice.closingText} />
                </SectionCard>
              ) : null}

              {invoice.metadata?.projectReference ||
              invoice.metadata?.notes ? (
                <SectionCard title={t("notes")}>
                  <div className="flex flex-col gap-2 text-sm">
                    {invoice.metadata.projectReference ? (
                      <p>
                        <span className="text-muted-foreground">
                          {t("projectReference")}:{" "}
                        </span>
                        <span className="font-medium text-foreground">
                          {invoice.metadata.projectReference}
                        </span>
                      </p>
                    ) : null}
                    {invoice.metadata.notes ? (
                      <p>
                        <span className="text-muted-foreground">
                          {t("notes")}:{" "}
                        </span>
                        <span className="font-medium text-foreground">
                          {invoice.metadata.notes}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("invoiceDetailsUnavailable")}
        </p>
      )}
    </ReusableDialog>
  );
}
