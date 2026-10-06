"use client";

// Contact details. The country and the language are named in the reader's language ("Saudi
// Arabia", "Arabic"), not shown as codes (SAL-109); dates are in the organisation's zone.
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import type { CustomerDetail } from "@/types/customers";
import DetailList from "../../DetailList";
import { useCustomerDates, useDisplayNames } from "../../leads";

export default function CustomerDetailsSection({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.details");
  const dates = useCustomerDates();
  const names = useDisplayNames();

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} />
      <DetailList
        items={[
          { label: t("email"), value: customer.email ? <bdi dir="ltr">{customer.email}</bdi> : null },
          { label: t("phone"), value: customer.phoneNumber ? <bdi dir="ltr">{customer.phoneNumber}</bdi> : null },
          { label: t("address"), value: customer.address ? <span dir="auto">{customer.address}</span> : null, wide: true },
          { label: t("country"), value: customer.countryCode ? names.country(customer.countryCode) : null },
          { label: t("language"), value: names.language(customer.preferredLanguage || "en") },
          { label: t("owner"), value: customer.salesName ? <span dir="auto">{customer.salesName}</span> : <span className="text-fg-subtle">{t("unassigned")}</span> },
          { label: t("created"), value: dates.date(customer.createdAt) },
          ...(customer.createdByUser?.fullName ? [{ label: t("createdBy"), value: <span dir="auto">{customer.createdByUser.fullName}</span> }] : []),
        ]}
      />
    </Card>
  );
}
