"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoPermissionState,
  PageHeader,
  Select,
  Stat,
} from "@orgtik/ui";
import { useCrmBootstrapQuery } from "@/redux/features/crm-v3/crmApi";
import { crmErrorStatus, crmLabel } from "@/lib/crm-v3";
import { Link } from "@/i18n/routing";
export default function CrmReports() {
  const t = useTranslations("CrmV3"),
    locale = useLocale(),
    f = useFormatter(),
    query = useCrmBootstrapQuery(),
    [currency, setCurrency] = useState<string>();
  if (query.isLoading) return <LoadingState rows={5} />;
  if (!query.data || query.isError)
    return crmErrorStatus(query.error) === 403 ? (
      <NoPermissionState titleAs="h1" title={t("noAccess")} />
    ) : (
      <ErrorState
        titleAs="h1"
        title={t("loadError")}
        onRetry={() => void query.refetch()}
      />
    );
  const data = query.data,
    currencies = [
      ...new Set([
        ...data.contacts.map((row) => row.currency),
        ...data.projects.map((row) => row.currency),
        ...data.targets.map((row) => row.currency),
      ]),
    ],
    selected = currency || currencies[0],
    contacts = data.contacts.filter((row) => row.currency === selected),
    won = data.projects.filter((row) => row.won && row.currency === selected),
    wonTotal = won.reduce((sum, row) => sum + row.value, 0),
    forecast = contacts
      .filter(
        (row) =>
          !["won", "lost", "duplicate", "spam", "unqualified"].includes(
            row.status,
          ),
      )
      .reduce((sum, row) => sum + (row.value * row.probability) / 100, 0),
    period = data.now.slice(0, 7),
    target = data.targets.find(
      (row) => row.currency === selected && row.period === period,
    ),
    monthWon = won
      .filter(
        (row) =>
          (row.latestContract?.approvedAt || row.createdAt).slice(0, 7) ===
          period,
      )
      .reduce((sum, row) => sum + row.value, 0),
    sources = [...new Set(contacts.map((row) => row.source || "manual"))];
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title={t("reportsTitle")}
        description={t("reportsHint")}
        actions={
          <Link
            href="/admin/settings"
            className="text-body-sm text-fg-brand underline"
          >
            {t("configureTargets")}
          </Link>
        }
      />
      <Select
        label={t("currency")}
        value={selected}
        onValueChange={(value) => setCurrency(value || undefined)}
        options={currencies.map((value) => ({ value, label: value }))}
      />
      {!data.contacts.length && !data.projects.length ? (
        <EmptyState
          title={t("emptyReports")}
          action={<Link href="/customers">{t("newContact")}</Link>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label={t("contactsTitle")}
              value={f.number(contacts.length)}
            />
            <Stat
              label={t("weightedForecast")}
              value={f.number(forecast, {
                style: "currency",
                currency: selected,
              })}
            />
            <Stat
              label={t("wonRevenue")}
              value={f.number(wonTotal, {
                style: "currency",
                currency: selected,
              })}
            />
            <Stat
              label={t("monthlyTarget")}
              value={
                target
                  ? f.number(monthWon / Math.max(1, target.amount), {
                      style: "percent",
                      maximumFractionDigits: 1,
                    })
                  : t("notSet")
              }
              hint={
                target
                  ? f.number(target.amount, {
                      style: "currency",
                      currency: selected,
                    })
                  : t("targetHint")
              }
            />
          </div>
          <section className="rounded-card border border-line bg-raised p-4 sm:p-5">
            <h2 className="mb-4 font-display text-title-sm">{t("funnel")}</h2>
            {data.pipelines.map((pipeline) => (
              <div key={pipeline.id} className="mb-5 last:mb-0">
                <h3 dir="auto" className="mb-2 font-semibold text-body">
                  {crmLabel(pipeline.name, locale)}
                </h3>
                <ol className="divide-y divide-line">
                  {pipeline.stages.map((stage) => {
                    const count = contacts.filter(
                      (row) =>
                        row.pipelineId === pipeline.id &&
                        row.stageId === stage.id,
                    ).length;
                    return (
                      <li
                        key={stage.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 text-body-sm"
                      >
                        <span dir="auto">{crmLabel(stage.name, locale)}</span>
                        <span className="tabular-nums">{f.number(count)}</span>
                        <meter
                          aria-label={crmLabel(stage.name, locale)}
                          min={0}
                          max={Math.max(1, contacts.length)}
                          value={count}
                          className="col-span-2 w-full accent-brand"
                        />
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-card border border-line bg-raised p-4 sm:p-5">
              <h2 className="mb-3 font-display text-title-sm">
                {t("sourceReport")}
              </h2>
              <ul className="divide-y divide-line">
                {sources.map((source) => {
                  const rows = contacts.filter(
                    (row) => (row.source || "manual") === source,
                  );
                  return (
                    <li
                      key={source}
                      className="flex justify-between gap-4 py-3 text-body-sm"
                    >
                      <span dir="auto">{source}</span>
                      <span>
                        {f.number(rows.length)} ·{" "}
                        {f.number(
                          rows.filter((row) => row.status === "won").length /
                            rows.length,
                          { style: "percent" },
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="rounded-card border border-line bg-raised p-4 sm:p-5">
              <h2 className="mb-3 font-display text-title-sm">
                {t("lostReasons")}
              </h2>
              {contacts.some((row) => row.status === "lost") ? (
                <ul className="divide-y divide-line">
                  {contacts
                    .filter((row) => row.status === "lost")
                    .map((row) => (
                      <li key={row.id} className="py-3 text-body-sm">
                        <Link
                          href={`/customers?contact=${row.id}`}
                          className="text-fg-brand underline"
                          dir="auto"
                        >
                          {row.fullName}
                        </Link>
                        <p dir="auto" className="mt-1 text-fg-muted">
                          {row.lostReason || t("notSet")}
                        </p>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-body-sm text-fg-muted">
                  {t("noLostContacts")}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
