"use client";

// The salesperson's details and bank account, read-only here (admins edit them in the dialog).
// Admins also set how the salesperson is doing.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, Select } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import PerformanceBadge from "@/components/pages/salesman/PerformanceBadge";
import { useUpdateSalesmanPerformanceMutation } from "@/redux/features/salesman/salesmanApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTeamFormat } from "@/lib/commissions";
import { SALESMAN_PERFORMANCE, type SalesmanDetail, type SalesmanPerformanceLabel } from "@/types/salesman";

export default function PersonalDetails({ salesman }: { salesman: SalesmanDetail }) {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  const display = useCatalogDisplayText();
  const { isAdmin, canEdit } = useRole();
  const [setPerformance, { isLoading: saving }] = useUpdateSalesmanPerformanceMutation();
  const bank = salesman.bankDetails;
  const performance = salesman.performanceLabel ?? null;

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("email"), value: <bdi dir="ltr">{salesman.email}</bdi> },
    { label: t("phone"), value: salesman.phoneNumber ? <bdi dir="ltr">{salesman.phoneNumber}</bdi> : "—" },
    { label: t("address"), value: salesman.address ? <span dir="auto">{salesman.address}</span> : "—" },
    { label: t("department"), value: salesman.department ? <span dir="auto">{display(salesman.department.name)}</span> : "—" },
    { label: t("zone"), value: salesman.zone?.name ? <span dir="auto">{salesman.zone.name}</span> : "—" },
    { label: t("since"), value: f.date(salesman.createdAt) ?? "—" },
  ];
  const bankRows: { label: string; value: ReactNode }[] = [
    { label: t("accountName"), value: bank?.accountName ? <span dir="auto">{bank.accountName}</span> : "—" },
    { label: t("bankName"), value: bank?.bankName ? <span dir="auto">{bank.bankName}</span> : "—" },
    { label: t("iban"), value: bank?.iban ? <bdi dir="ltr">{bank.iban}</bdi> : "—" },
    { label: t("swift"), value: bank?.swiftBic ? <bdi dir="ltr">{bank.swiftBic}</bdi> : "—" },
  ];
  const list = (items: { label: string; value: ReactNode }[]) => (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((r) => (
        <div key={r.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-caption text-fg-muted">{r.label}</dt>
          <dd className="min-w-0 break-words text-body text-fg">{r.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <CardHeader
          title={t("detailsTitle")}
          actions={
            isAdmin && canEdit ? (
              <Select
                aria-label={t("performanceLabel")}
                size="sm"
                value={performance ?? undefined}
                placeholder={t("performanceLabel")}
                disabled={saving}
                onValueChange={(v) => {
                  if (v && v !== performance) void setPerformance({ id: salesman.id, performance: v as SalesmanPerformanceLabel });
                }}
                options={SALESMAN_PERFORMANCE.map((p) => ({ value: p, label: t(`performance.${p}`) }))}
                className="w-48"
              />
            ) : (
              <PerformanceBadge value={performance} />
            )
          }
        />
        {list(rows)}
      </Card>
      <Card className="flex flex-col gap-4">
        <CardHeader title={t("bankDetails")} description={bank ? undefined : t("noBankDetails")} />
        {list(bankRows)}
      </Card>
    </div>
  );
}
