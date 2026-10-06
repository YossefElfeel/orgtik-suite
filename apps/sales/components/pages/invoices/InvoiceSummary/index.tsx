import { FileText } from "lucide-react";

import { SectionCard } from "@/components/shared/SectionCard";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import type { InvoiceDetail } from "@/types/invoices";
import { useTranslations } from "next-intl";

type InvoiceSummaryProps = {
  invoice: InvoiceDetail;
};

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span
        className={
          emphasized
            ? "font-semibold text-foreground"
            : "text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={`text-right ${
          emphasized ? "font-semibold text-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  const t = useTranslations("invoices");
  const method =
    invoice.method ??
    invoice.paymentMethod ??
    invoice.payment?.method ??
    "—";
  const details =
    invoice.details ??
    invoice.paymentReference ??
    invoice.payment?.reference ??
    "—";
  const total = invoice.totalAmount ?? invoice.totalPrice;
  const taxPercent =
    invoice.taxRate > 1 ? invoice.taxRate : (invoice.taxRate || 0) * 100;
  const currencyCode = getInvoiceCurrencyCode(invoice);

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          {t("summaryTitle")}
        </span>
      }
    >
      <div className="space-y-3">
        <SummaryRow
          label={t("subtotal")}
          value={formatAmount(invoice.subtotalAmount, currencyCode)}
        />
        <SummaryRow
          label={t("vatAmount", { percent: Math.round(taxPercent) })}
          value={formatAmount(invoice.taxAmount, currencyCode)}
        />
        <div className="border-t border-border pt-3">
          <SummaryRow
            label={t("total")}
            value={formatAmount(total, currencyCode)}
            emphasized
          />
        </div>
        <SummaryRow label={t("method")} value={method} />
        <SummaryRow label={t("details")} value={details} />
      </div>
    </SectionCard>
  );
}
