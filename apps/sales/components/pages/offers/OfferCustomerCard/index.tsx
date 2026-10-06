"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import type { OfferCustomer } from "@/types/offers";

/** Who the offer is for, with a way to their record. */
export default function OfferCustomerCard({ customer }: { customer: OfferCustomer }) {
  const t = useTranslations("Offers");
  const item = (label: string, value: ReactNode) =>
    value ? (
      <div className="flex flex-col gap-0.5">
        <dt className="text-caption text-fg-muted">{label}</dt>
        <dd className="text-body text-fg">{value}</dd>
      </div>
    ) : null;
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={t("customerTitle")}
        actions={
          customer.id ? (
            <ButtonLink href={`/customers/${customer.id}`} variant="ghost">
              {t("openCustomer")}
            </ButtonLink>
          ) : null
        }
      />
      <dl className="grid gap-3 sm:grid-cols-2">
        {item(t("customerName"), <span dir="auto">{customer.fullName}</span>)}
        {item(t("customerCompany"), customer.companyName ? <span dir="auto">{customer.companyName}</span> : null)}
        {item(t("customerEmail"), customer.email ? <bdi dir="ltr">{customer.email}</bdi> : null)}
        {item(t("customerPhone"), customer.phoneNumber ? <bdi dir="ltr">{customer.phoneNumber}</bdi> : null)}
        {item(t("customerAddress"), customer.address ? <span dir="auto">{customer.address}</span> : null)}
      </dl>
    </Card>
  );
}
