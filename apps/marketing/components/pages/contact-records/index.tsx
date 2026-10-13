"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  ConnectedFeature,
  ErrorState,
  LoadingState,
  Select,
  Toolbar,
  useSuite,
} from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter, usePathname } from "@/i18n/routing";
import { openMarketingSuiteDestination } from "@/lib/suite-navigation";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
import { useMarketingRoles } from "@/lib/permissions";
import { marketingSuiteCommand } from "@/lib/command-recovery";
import { useProjectContext } from "@/lib/project-context";
import type {
  CanonicalDirectory,
  CanonicalContact,
} from "@/types/marketing-v3";
export default function ContactRecords() {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    suite = useSuite(),
    project = useProjectContext(),
    can = useMarketingRoles(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    [data, setData] = useState<CanonicalDirectory>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState<string>(),
    [version, setVersion] = useState(0),
    query = params.get("q") || "";
  const enabled = suite.canConnect("marketing", "crm");
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setError(false);
    suite
      .request<CanonicalDirectory>("/crm/directory")
      .then((value) => {
        if (live) setData(value);
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [enabled, version, suite.request]);
  const updateQuery = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  const rows =
    data?.contacts.filter((row) =>
      `${row.name} ${row.email}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    ) || [];
  const columns = useMemo<ColumnDef<CanonicalContact>[]>(
    () => [
      {
        id: "name",
        header: t("name"),
        cell: ({ row }) => (
          <span dir="auto" className="font-semibold">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "email",
        header: t("email"),
        cell: ({ row }) => <bdi dir="ltr">{row.original.email}</bdi>,
      },
      {
        id: "company",
        header: t("company"),
        cell: ({ row }) => (
          <span dir="auto">
            {data?.companies.find(
              (company) => company.id === row.original.companyId,
            )?.name || "—"}
          </span>
        ),
      },
      {
        id: "consent",
        header: t("consent"),
        cell: ({ row }) => (
          <Badge
            tone={
              row.original.consent.state === "opted_in"
                ? "success"
                : row.original.consent.state === "opted_out"
                  ? "danger"
                  : "neutral"
            }
          >
            {t(row.original.consent.state)}
          </Badge>
        ),
      },
      {
        id: "recorded",
        header: t("recordedAt"),
        cell: ({ row }) =>
          row.original.consent.recordedAt
            ? f.dateTime(new Date(row.original.consent.recordedAt), {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: suite.snapshot?.workspace.timeZone,
              })
            : "—",
      },
      {
        id: "actions",
        header: t("consent"),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            {can.manageAudience && suite.toolState("crm")?.canWrite ? (
              <Select
                label={t("consent")}
                value={row.original.consent.state}
                disabled={busy === row.original.id}
                onValueChange={async (state) => {
                  setBusy(row.original.id);
                  try {
                    await marketingSuiteCommand(
                      project.id,
                      "/crm/consent",
                      {
                        contactId: row.original.id,
                        state,
                        operationId: crypto.randomUUID(),
                      },
                      (body) => suite.mutate("/crm/consent", "POST", body),
                    );
                    setVersion((v) => v + 1);
                  } catch {
                    setError(true);
                  } finally {
                    setBusy(undefined);
                  }
                }}
                options={["unknown", "opted_in", "opted_out"].map((value) => ({
                  value,
                  label: t(value),
                }))}
              />
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const href = `${suite.sosUrl}/go/sales?redirect=${encodeURIComponent(`/customers/${row.original.id}`)}`;
                void openMarketingSuiteDestination(href).catch(() =>
                  setError(true),
                );
              }}
            >
              {t("openCRM")}
            </Button>
          </div>
        ),
      },
    ],
    [t, f, data, busy, can.manageAudience, suite],
  );
  return (
    <MarketingProjectFrame title={t("contacts")}>
      <p className="max-w-prose text-body text-fg-muted">{t("crmHint")}</p>
      <ConnectedFeature
        source="marketing"
        requires="crm"
        write={false}
        settingsHref="/admin/connections"
      >
        {error ? (
          <ErrorState
            title={t("loadError")}
            onRetry={() => {
              setError(false);
              setVersion((v) => v + 1);
            }}
          />
        ) : !data ? (
          <LoadingState rows={5} />
        ) : (
          <>
            <Toolbar
              label={t("contacts")}
              search={{
                value: query,
                onChange: updateQuery,
                label: t("search"),
              }}
            />
            <DataTable<CanonicalContact>
              label={t("contacts")}
              data={rows}
              columns={columns}
              getRowId={(row) => row.id}
              empty={{
                title: t(query ? "noMatch" : "empty"),
                action: (
                  <Button variant="secondary" onClick={() => updateQuery("")}>
                    {t("search")}
                  </Button>
                ),
              }}
            />
          </>
        )}
      </ConnectedFeature>
    </MarketingProjectFrame>
  );
}
