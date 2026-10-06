import type { InvoiceDetail } from "@/types/invoices";
import InvoiceTotalBanner from "@/components/pages/invoices/InvoiceTotalBanner";
import InvoiceBillTo from "@/components/pages/invoices/InvoiceBillTo";
import InvoiceProject from "@/components/pages/invoices/InvoiceProject";
import InvoiceStatusAlert from "@/components/pages/invoices/InvoiceStatusAlert";

type Props = {
  invoice: InvoiceDetail;
  dueLabel: string;
};

export default function InvoiceOverviewCard({ invoice, dueLabel }: Props) {
  const showInlineAlert =
    invoice.status === "overdue" ||
    invoice.status === "pending" ||
    invoice.status === "partial" ||
    invoice.status === "void";
  const billTo = {
    name: invoice.billTo?.name ?? invoice.customer?.name ?? "—",
    email: invoice.billTo?.email ?? invoice.customer?.email ?? "—",
    address: invoice.billTo?.address ?? invoice.customer?.address ?? "—",
  };
  const issuedAt = invoice.issuedAt ?? invoice.createdAt;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 shadow-[0px_10px_25px_rgba(9,25,72,0.04)]">
      <InvoiceTotalBanner invoice={invoice} dueLabel={dueLabel} />

      {showInlineAlert ? (
        <InvoiceStatusAlert
          status={invoice.status}
          dueDate={invoice.dueDate}
          issueDate={issuedAt}
          voidedAt={invoice.voidAt}
          voidReason={invoice.voidReason}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InvoiceBillTo billTo={billTo} />
        <InvoiceProject projectName={invoice.projectName} />
      </div>
    </div>
  );
}
