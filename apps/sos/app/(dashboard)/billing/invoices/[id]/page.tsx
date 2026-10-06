import { InvoiceView } from "@/components/workspace/billing/InvoiceView";

// USR-10: one invoice.
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceView id={decodeURIComponent(id)} />;
}
