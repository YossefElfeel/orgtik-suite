"use client";

// The customer's two KYC documents: the ID document and the business document.
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import type { CustomerDetail } from "@/types/customers";
import { useRole } from "@/hooks/useRole";
import { CustomerDocumentRow } from "./CustomerDocumentRow";

export default function DocumentsDetails({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.documents");
  const { canEdit } = useRole();
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} description={t("description")} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-label text-fg-muted">{t("idDoc")}</h4>
          <CustomerDocumentRow id={customer.id} type="id" document={customer.idDocument} label={t("idDoc")} canEdit={canEdit} />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label text-fg-muted">{t("businessDoc")}</h4>
          <CustomerDocumentRow id={customer.id} type="business" document={customer.businessDocument} label={t("businessDoc")} canEdit={canEdit} />
        </div>
      </div>
    </Card>
  );
}
