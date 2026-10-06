import type { InvoiceStatus } from "@/types/invoices";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const statusStyles: Record<
  InvoiceStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  paid: "ghost-green",
  partial: "ghost-blue",
  pending: "ghost-yellow",
  overdue: "ghost-red",
  void: "ghost",
};

import { useTranslations } from "next-intl";

type Props = {
  status: InvoiceStatus;
};

export default function InvoiceStatusCell({ status }: Props) {
  const t = useTranslations("invoices");
  
  const statusLabels: Record<InvoiceStatus, string> = {
    paid: t("statusPaid"),
    partial: t("statusPartial"),
    pending: t("statusPending"),
    overdue: t("statusOverdue"),
    void: t("statusVoid"),
  };

  return (
    <Badge variant={statusStyles[status]}>{statusLabels[status]}</Badge>
  );
}
