"use client";

import CustomInvoiceHtmlContent from "@/components/dialogs/invoices/CustomInvoiceDetailsDialog/CustomInvoiceHtmlContent";
import { formatAmount } from "@/lib/format-amount";
import type { CustomInvoiceLineItem } from "@/types/invoices";
import { useTranslations } from "next-intl";

type Props = {
  item: CustomInvoiceLineItem;
  currency: string;
};

export default function CustomInvoiceLineItemCard({ item, currency }: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const amount = item.amount ?? Number(item.quantity) * Number(item.unitPrice);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3.5">
      <CustomInvoiceHtmlContent
        html={item.description}
        className="text-foreground"
      />
      <div
        className="flex flex-wrap items-center gap-2.5 border-t border-border pt-2.5 text-xs
       text-muted-foreground"
      >
        <div>
          {t("qty")}: {item.quantity}
        </div>{" "}
        <div>
          {t("unit")}: {formatAmount(item.unitPrice, currency)}
        </div>
        <div>
          {tCommon("amount")}: {formatAmount(amount, currency)}
        </div>
      </div>
    </div>
  );
}
