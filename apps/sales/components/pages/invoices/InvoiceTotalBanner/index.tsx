import type { InvoiceDetail } from "@/types/invoices";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { useTranslations } from "next-intl";

type Props = {
  invoice: InvoiceDetail;
  dueLabel: string;
};

export default function InvoiceTotalBanner({ invoice, dueLabel }: Props) {
  const total = invoice.totalAmount ?? invoice.totalPrice;
  const t = useTranslations("invoices");

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/10 px-5 py-5 text-center">
      <p className="text-sm text-secondary">{t("total")}</p>
      <p className="mt-1 text-32 font-semibold tracking-tight text-foreground">
        {formatAmount(total, getInvoiceCurrencyCode(invoice))}
      </p>
      <p className="mt-1 text-sm text-secondary">{dueLabel}</p>
    </div>
  );
}
