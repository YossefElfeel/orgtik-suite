"use client";

// The customer's company: name, commercial register and website, and whether the two KYC
// documents are in (in words and icons, not colour alone).
import { useTranslations } from "next-intl";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { Badge, Card, CardHeader } from "@orgtik/ui";
import type { CustomerDetail } from "@/types/customers";
import DetailList from "../../DetailList";

const href = (site: string) => (/^https?:\/\//i.test(site) ? site : `https://${site}`);

export default function BusinessDetails({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.business");
  const doc = (has: boolean, label: string) => (
    <Badge tone={has ? "success" : "neutral"} size="sm" icon={has ? <CheckCircle weight="bold" /> : <Circle weight="bold" />}>
      {has ? t("docIn", { doc: label }) : t("docMissing", { doc: label })}
    </Badge>
  );

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} />
      <DetailList
        items={[
          { label: t("company"), value: customer.companyName ? <span dir="auto">{customer.companyName}</span> : null },
          { label: t("register"), value: customer.commercialRegistrationNumber ? <bdi dir="ltr">{customer.commercialRegistrationNumber}</bdi> : null },
          {
            label: t("website"),
            value: customer.website ? (
              <a href={href(customer.website)} target="_blank" rel="noreferrer noopener" className="text-fg-brand underline-offset-2 hover:underline">
                <bdi dir="ltr">{customer.website}</bdi>
              </a>
            ) : null,
          },
          {
            label: t("documents"),
            value: (
              <span className="flex flex-wrap gap-2">
                {doc(Boolean(customer.idDocument), t("idDoc"))}
                {doc(Boolean(customer.businessDocument), t("businessDoc"))}
              </span>
            ),
          },
        ]}
      />
    </Card>
  );
}
