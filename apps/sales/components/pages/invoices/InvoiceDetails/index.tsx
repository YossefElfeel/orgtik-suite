"use client";

import type { InvoiceDetail } from "@/types/invoices";
import MainHeader from "@/components/shared/MainHeader";
import InvoiceStatusCell from "@/components/pages/invoices/InvoiceStatusCell";
import InvoiceOverviewCard from "@/components/pages/invoices/InvoiceOverviewCard";
import InvoiceLineItems from "@/components/pages/invoices/InvoiceLineItems";
import InvoiceSummary from "@/components/pages/invoices/InvoiceSummary";
import InvoiceHeaderActions from "@/components/pages/invoices/InvoiceHeaderActions";
import { formatShortDate } from "@/lib/format-date";
import { useTranslations } from "next-intl";

type Props = {
  invoice: InvoiceDetail;
};

export default function InvoiceDetails({ invoice }: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const typeLabel =
    invoice.type === "subscription" ? t("subscriptionInvoice") : t("salesInvoice");
  const issuedAt = invoice.issuedAt ?? invoice.createdAt;

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("invoiceTitleLabel", { id: invoice.invoiceId })}
        backLink={{
          href: "/invoices",
          label: tCommon("back"),
        }}
        subChildren={
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {typeLabel} · {t("issuedDate", { date: formatShortDate(issuedAt) })}
            </p>
            <InvoiceStatusCell status={invoice.status} />
          </div>
        }
      />
      <div className="flex flex-col gap-5">
        <InvoiceOverviewCard
          invoice={invoice}
          dueLabel={t("dueDateText", { date: formatShortDate(invoice.dueDate) })}
        />

        <InvoiceLineItems invoice={invoice} />
        <InvoiceSummary invoice={invoice} />
      </div>
      <InvoiceHeaderActions invoice={invoice} />
    </section>
  );
}
