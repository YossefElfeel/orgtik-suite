"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, X } from "@phosphor-icons/react";
import { Badge, Button, ConfirmDialog, PageHeader, toast, useFormatter, type Tone } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { DateText, useErrorText, useRegionNames } from "@/components/customers/shared";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useDecideMigrationMutation, useMigrationsQuery, type Migration } from "@/store/customers";

const TONE: Record<string, Tone> = { queued: "warning", scheduled: "info", rejected: "neutral" };

function Decide({ m }: { m: Migration }) {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const errorText = useErrorText();
  const [decide] = useDecideMigrationMutation();
  const [asking, setAsking] = useState<"approve" | "reject" | null>(null);
  const name = m.workspace ?? m.workspaceId;
  const run = (decision: "approve" | "reject", reason?: string) =>
    decide({ id: m.id, decision, reason })
      .unwrap()
      .then(() => toast.success(t(decision === "approve" ? "migrations.approved" : "migrations.rejected", { name })))
      .catch((e) => {
        toast.error(errorText(e));
        throw e;
      });
  return (
    <span className="inline-flex items-center gap-1">
      <Button size="sm" variant="secondary" startIcon={<Check />} onClick={() => setAsking("approve")} aria-label={t("migrations.approveFor", { name })}>
        {t("migrations.approve")}
      </Button>
      <Button size="sm" variant="ghost" startIcon={<X />} onClick={() => setAsking("reject")} aria-label={t("migrations.rejectFor", { name })}>
        {t("migrations.reject")}
      </Button>
      <ConfirmDialog
        open={asking === "approve"}
        onOpenChange={(o) => !o && setAsking(null)}
        tone="primary"
        title={t("migrations.approveTitle", { name })}
        impact={t("migrations.approveImpact", { date: m.effectiveAt ? f.date(m.effectiveAt, { dateStyle: "medium" }) : "—", to: m.to.currency, from: m.from.currency })}
        confirmLabel={t("migrations.approve")}
        onConfirm={() => run("approve")}
      />
      <ConfirmDialog
        open={asking === "reject"}
        onOpenChange={(o) => !o && setAsking(null)}
        tone="danger"
        title={t("migrations.rejectTitle", { name })}
        impact={t("migrations.rejectImpact", { from: m.from.currency })}
        reason={{ label: tc("reason"), required: true }}
        confirmLabel={t("migrations.reject")}
        onConfirm={({ reason }) => run("reject", reason)}
      />
    </span>
  );
}

function MigrationsPage() {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const names = useRegionNames();
  const can = useCan();
  const editable = can("workspaces:edit");
  const { data, isLoading, error, refetch } = useMigrationsQuery();
  // Waiting ones first, then the newest.
  const rows = useMemo(() => (data ?? []).slice().sort((a, b) => Number(b.state === "queued") - Number(a.state === "queued") || b.requestedAt.localeCompare(a.requestedAt)), [data]);

  const columns = useMemo<ColumnDef<Migration, unknown>[]>(
    () => [
      {
        id: "workspace",
        header: t("migrations.colWorkspace"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <Link href={`/workspaces/${row.original.workspaceId}`} className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            <bdi dir="auto">{row.original.workspace ?? row.original.workspaceId}</bdi>
          </Link>
        ),
      },
      {
        id: "change",
        header: t("migrations.colChange"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const m = row.original;
          return (
            <span className="flex flex-wrap items-center gap-1.5 text-body-sm">
              <span>
                {names.country(m.from.country)} · <span dir="ltr">{m.from.currency}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4 text-fg-subtle rtl:-scale-x-100" />
              <span className="sr-only">{t("migrations.to")}</span>
              <span>
                {names.country(m.to.country)} · <span dir="ltr">{m.to.currency}</span>
              </span>
            </span>
          );
        },
      },
      { id: "reason", header: t("migrations.colReason"), meta: { wrap: true }, cell: ({ row }) => <span className="text-body-sm text-fg-muted"><bdi dir="auto">{row.original.reason || "—"}</bdi></span> },
      {
        id: "requested",
        header: t("migrations.colRequested"),
        cell: ({ row }) => (
          <span className="flex flex-col text-body-sm">
            <DateText value={row.original.requestedAt} />
            <bdi dir="auto" className="text-caption text-fg-subtle">{row.original.requestedBy}</bdi>
          </span>
        ),
      },
      { id: "effective", header: t("migrations.colEffective"), cell: ({ row }) => <DateText value={row.original.effectiveAt} /> },
      {
        id: "state",
        header: t("migrations.colState"),
        cell: ({ row }) => (
          <Badge size="sm" tone={TONE[row.original.state] ?? "neutral"}>
            {t.has(`migrations.state.${row.original.state}`) ? t(`migrations.state.${row.original.state}`) : row.original.state}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("migrations.colActions")}</span>,
        meta: { numeric: true },
        cell: ({ row }) => (editable && row.original.state === "queued" ? <Decide m={row.original} /> : null),
      },
    ],
    [t, names, editable],
  );
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("migrations.title")} description={t("migrations.description")} />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <DataTable
        label={t("migrations.title")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        status={status}
        onRetry={refetch}
        paginate={rows.length > 25}
        error={{ title: tc("loadFailed"), description: tc("loadFailedBody") }}
        empty={{ title: t("migrations.empty"), description: t("migrations.emptyBody") }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="workspaces:view">
      <MigrationsPage />
    </RequirePermission>
  );
}
