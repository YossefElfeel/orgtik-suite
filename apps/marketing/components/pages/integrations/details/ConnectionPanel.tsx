"use client";

// What this connection allows: the permissions granted, the features that work, and the resources
// (pages, ad accounts, inboxes) it holds. Read-only; Reconnect changes it. States carry words and an
// icon, not colour alone, and raw enums ("ADS_MANAGEMENT", "SELECTED") are no longer shown.
import { useTranslations } from "next-intl";
import { CheckCircle, MinusCircle, WarningCircle } from "@phosphor-icons/react";
import { Badge, Card, Stat, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { useProjectContext } from "@/lib/project-context";
import type { AccountResource, IntegrationResponse } from "@/types/integrations";
import { useCapabilityLabel } from "../shared";

export function ConnectionPanel({ data }: { data: IntegrationResponse }) {
  const t = useTranslations("IntegrationDetail");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const capabilityLabel = useCapabilityLabel();
  const scopes = data.scopeSummary;
  const resources = data.accountResources ?? [];

  const columns: ColumnDef<AccountResource>[] = [
    {
      id: "name",
      header: t("colResource"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span dir="auto" className="truncate text-fg">
            {row.original.displayName}
          </span>
          <bdi dir="ltr" className="truncate text-caption text-fg-muted">
            {row.original.externalId}
          </bdi>
        </span>
      ),
    },
    { id: "capability", header: t("colUse"), cell: ({ row }) => capabilityLabel(row.original.capability) },
    {
      id: "currency",
      header: t("colCurrency"),
      cell: ({ row }) => (row.original.currency ? <bdi dir="ltr">{row.original.currency}</bdi> : <span className="text-fg-subtle">—</span>),
    },
    {
      id: "selected",
      header: t("colInUse"),
      cell: ({ row }) =>
        row.original.isSelected ? (
          <Badge tone="success" size="sm" icon={<CheckCircle />}>
            {t("inUse")}
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm" icon={<MinusCircle />}>
            {t("notInUse")}
          </Badge>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="cn-perm" className="flex flex-col gap-3">
        <h2 id="cn-perm" className="font-display text-title-sm text-fg">
          {t("permissions")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label={t("scopesGranted")} value={f.number(scopes?.grantedScopesCount ?? 0)} />
          <Stat label={t("scopesRequired")} value={f.number(scopes?.requiredScopesCount ?? 0)} />
          <Stat label={t("scopesMissing")} value={f.number(scopes?.missingScopesCount ?? 0)} hint={scopes?.missingScopesCount ? t("scopesMissingHint") : undefined} />
        </div>
        {data.expiresAt ? <p className="text-body-sm text-fg-muted">{t("expiresOn", { date: f.date(data.expiresAt, { dateStyle: "medium", timeZone }) })}</p> : null}
      </section>

      <section aria-labelledby="cn-features" className="flex flex-col gap-3">
        <h2 id="cn-features" className="font-display text-title-sm text-fg">
          {t("features")}
        </h2>
        <Card padding="md">
          <ul className="flex flex-col divide-y divide-line">
            {(data.featureStatuses ?? []).map((ft) => (
              <li key={ft.feature} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <span className="text-body text-fg">{t.has(`feature_${ft.feature}`) ? t(`feature_${ft.feature}`) : capabilityLabel(ft.feature)}</span>
                {ft.ready ? (
                  <Badge tone="success" size="sm" icon={<CheckCircle />}>
                    {t("featureReady")}
                  </Badge>
                ) : (
                  <Badge tone="warning" size="sm" icon={<WarningCircle />}>
                    {ft.missingScopesCount > 0 ? t("featureMissingScopes", { count: ft.missingScopesCount }) : t("featureNoResource")}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="cn-resources" className="flex flex-col gap-3">
        <h2 id="cn-resources" className="font-display text-title-sm text-fg">
          {t("resources")}
        </h2>
        <DataTable
          label={t("resources")}
          columns={columns}
          data={resources}
          getRowId={(r) => r.id}
          status="ready"
          paginate
          empty={{ title: t("resourcesEmpty") }}
        />
      </section>
    </div>
  );
}
