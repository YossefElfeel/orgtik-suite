"use client";

import { useMemo } from "react";
import type { InvoiceDetail } from "@/types/invoices";
import DataTable from "@/components/shared/Table";
import { SectionCard } from "@/components/shared/SectionCard";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { getInvoiceLineItemColumns } from "./columns";
import { useTranslations } from "next-intl";

type Props = {
  invoice: InvoiceDetail;
};

export default function InvoiceLineItems({ invoice }: Props) {
  const t = useTranslations("invoices");
  const currencyCode = getInvoiceCurrencyCode(invoice);

  const columns = useMemo(
    () => getInvoiceLineItemColumns(currencyCode, t),
    [currencyCode, t],
  );

  return (
    <SectionCard title={t("lineItemsTitle")}>
      <DataTable columns={columns} data={invoice?.lineItems ?? []} />
    </SectionCard>
  );
}
