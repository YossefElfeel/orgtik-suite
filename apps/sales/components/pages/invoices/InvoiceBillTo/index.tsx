import type { InvoiceBillTo as InvoiceBillToData } from "@/types/invoices";
import { useTranslations } from "next-intl";

type Props = {
  billTo: InvoiceBillToData;
};

export default function InvoiceBillTo({ billTo }: Props) {
  const t = useTranslations("invoices");
  
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-16 font-semibold text-foreground">{t("billToTitle")}</p>
      <p className="text-sm font-semibold text-secondary">{billTo.name}</p>
      <p className="text-sm text-secondary">{billTo.email}</p>
      <p className="text-sm text-secondary">{billTo.address}</p>
    </div>
  );
}
