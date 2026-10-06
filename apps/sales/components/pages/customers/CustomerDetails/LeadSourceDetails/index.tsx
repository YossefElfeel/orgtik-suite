"use client";

// Where the lead came from (D-028). A website lead shows what the website sent: the page, the
// bundle asked about, the campaign (UTM) and the visitor's message, so the first call starts from
// what they wanted. A lead typed in by staff shows only its source.
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import type { CustomerDetail } from "@/types/customers";
import LeadSource from "../../LeadSource";
import DetailList, { type DetailItem } from "../../DetailList";
import { useCustomerDates, useDisplayNames } from "../../leads";

export default function LeadSourceDetails({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.sourceDetails");
  const dates = useCustomerDates();
  const names = useDisplayNames();
  const ctx = customer.sourceContext;
  const utm = Object.entries(ctx?.utm ?? {}).filter(([, v]) => v);
  if (!ctx && (customer.source ?? "manual") === "manual") return null;

  const items: DetailItem[] = [{ label: t("source"), value: <LeadSource lead={customer} /> }];
  if (ctx?.receivedAt) items.push({ label: t("received"), value: dates.shortDateTime(ctx.receivedAt) });
  if (ctx?.page) items.push({ label: t("page"), value: <bdi dir="ltr">{ctx.page}</bdi> });
  if (ctx?.bundle) items.push({ label: t("bundle"), value: <span dir="auto">{ctx.bundle}</span> });
  if (ctx?.locale) items.push({ label: t("language"), value: names.language(ctx.locale) });
  if (utm.length)
    items.push({
      label: t("campaign"),
      wide: true,
      value: (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
          {utm.map(([k, v]) => (
            <li key={k}>
              <span className="text-fg-muted">
                <bdi dir="ltr">{k}</bdi>:
              </span>{" "}
              <bdi dir="ltr">{String(v)}</bdi>
            </li>
          ))}
        </ul>
      ),
    });
  if (ctx?.message)
    items.push({
      label: t("message"),
      wide: true,
      value: (
        <p className="whitespace-pre-line" dir="auto">
          {ctx.message}
        </p>
      ),
    });

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} description={t("description")} />
      <DetailList items={items} />
    </Card>
  );
}
