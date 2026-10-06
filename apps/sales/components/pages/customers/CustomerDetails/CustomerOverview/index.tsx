"use client";

// The customer at a glance: projects, what they paid and what is contracted (per currency, in the
// reader's language, each in its own currency), and how long since the last contact. "3 days ago"
// was built by cutting words out of a translated sentence (SAL-111); it is a relative time now.
import { useTranslations } from "next-intl";
import { Warning } from "@phosphor-icons/react";
import { Card, Stat, useFormatter } from "@orgtik/ui";
import type { CustomerDetail } from "@/types/customers";
import { isolate } from "@/lib/bidi";
import { useCustomerDates } from "../../leads";

type Props = {
  customer: CustomerDetail;
};

export default function CustomerOverview({ customer }: Props) {
  const t = useTranslations("Customers.overview");
  const f = useFormatter();
  const dates = useCustomerDates();
  const summary = customer.summary;
  const financials = summary?.financials ?? [];
  const projects = summary?.projects;

  const money = (pick: "totalPaid" | "contractedAmount") =>
    financials.length ? (
      <span className="flex flex-col">
        {financials.map((z) => (
          <span key={`${z.zoneId}-${z.currencyCode}`}>{f.money(Number(z[pick]) || 0, z.currencyCode)}</span>
        ))}
      </span>
    ) : (
      <span className="text-fg-subtle">—</span>
    );

  const collected = financials.length
    ? financials.map((z) => t("collected", { zone: isolate(z.zoneName), percent: f.percent((z.collectedPercentage || 0) / 100) })).join(" · ")
    : t("nothingYet");

  const lastAt = summary?.lastActivity?.at;
  const growth = projects?.growthPercent ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card padding="md">
          <Stat
            label={t("projects")}
            value={f.number(projects?.total ?? 0)}
            hint={t("pending", { count: projects?.pending ?? 0 })}
            change={growth ? { value: growth / 100, against: t("vsLastMonth") } : undefined}
          />
        </Card>
        <Card padding="md">
          <Stat label={t("paid")} value={money("totalPaid")} />
        </Card>
        <Card padding="md">
          <Stat label={t("contracted")} value={money("contractedAmount")} hint={collected} />
        </Card>
        <Card padding="md">
          <Stat label={t("lastActivity")} value={lastAt ? dates.relative(lastAt) : "—"} hint={lastAt ? dates.date(lastAt) : undefined} />
        </Card>
      </div>
      {summary?.contactAttention?.needsCheckIn ? (
        <Card padding="md" className="flex items-start gap-3 bg-warning-subtle">
          <Warning aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-fg">{t("checkInTitle", { count: summary.contactAttention.daysSinceLastActivity })}</p>
            <p className="text-body-sm text-fg-muted">{t("checkInBody")}</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
