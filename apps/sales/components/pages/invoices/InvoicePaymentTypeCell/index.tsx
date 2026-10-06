import type { InvoicePaymentType } from "@/types/invoices";
import { Badge } from "@/components/ui/badge";

import { useTranslations } from "next-intl";

type Props = {
  paymentType: InvoicePaymentType;
};

export default function InvoicePaymentTypeCell({ paymentType }: Props) {
  const t = useTranslations("invoices");
  
  const paymentTypeLabels: Record<InvoicePaymentType, string> = {
    subscription: t("paymentTypeSubscription"),
    custom: t("paymentTypeCustom"),
  };

  return (
    <Badge variant="ghost" className="rounded-full">
      {paymentTypeLabels[paymentType]}
    </Badge>
  );
}
