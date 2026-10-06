"use client";

import { Suspense, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "@phosphor-icons/react";
import { Button, PageHeader, Select, StatusBadge, useStatusLabel } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { NewInvoiceDialog } from "@/components/billing/NewInvoiceDialog";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { CURRENCIES, DateText, Money, useRegionNames, useUrlFilters } from "@/components/customers/shared";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useInvoicesQuery, type Invoice } from "@/store/billing";
import { useWorkspacesQuery } from "@/store/customers";

const STATES = ["draft", "open", "past_due", "paid", "partially_refunded", "refunded", "void"] as const;

function InvoicesList() {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const statusLabel = useStatusLabel();
  const names = useRegionNames();
  const can = useCan();
  const editable = can("billing:edit");
  const url = useUrlFilters();
  const state = url.get("state");
  const workspaceId = url.get("workspace");
  const currency = url.get("currency");
  const page = Math.max(1, Number(url.get("page")) || 1);
  const pageSize = Number(url.get("pageSize")) || 25;
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error, refetch, isFetching } = useInvoicesQuery({ state: state || undefined, workspaceId: workspaceId || undefined, currency: currency || undefined, page, pageSize });
  const workspaces = useWorkspacesQuery({ pageSize: 100 }, { skip: !can("workspaces:view") });
  const filtered = Boolean(state || workspaceId || currency);
  const pageUsd = (data?.items ?? []).filter((i) => i.state !== "void" && i.state !== "draft").reduce((s, i) => s + (i.totalUsd ?? 0), 0);

  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      {
        id: "number",
        header: t("list.colNumber"),
        cell: ({ row }) => (
          <span className="flex flex-col items-start gap-0.5">
            <Link href={`/invoices/${row.original.id}`} dir="ltr" className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {row.original.number}
            </Link>
            <span className="text-caption text-fg-subtle">{t.has(`kind.${row.original.kind}`) ? t(`kind.${row.original.kind}`) : row.original.kind}</span>
          </span>
        ),
      },
      {
        id: "workspace",
        header: t("list.colWorkspace"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <Link href={`/workspaces/${row.original.workspaceId}`} className="text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            <bdi dir="auto">{row.original.workspace ?? row.original.workspaceId}</bdi>
          </Link>
        ),
      },
      { id: "state", header: t("list.colState"), cell: ({ row }) => <StatusBadge entity="invoice" state={row.original.state} size="sm" /> },
      { id: "issued", header: t("list.colIssued"), cell: ({ row }) => (row.original.issuedAt && row.original.state !== "draft" ? <DateText value={row.original.issuedAt} /> : <span className="text-fg-muted">{t("list.notIssued")}</span>) },
      { id: "due", header: t("list.colDue"), cell: ({ row }) => <DateText value={row.original.dueAt} /> },
      { id: "total", header: t("list.colTotal"), meta: { numeric: true }, cell: ({ row }) => <Money amount={row.original.total} currency={row.original.currency} className="text-fg" /> },
      { id: "usd", header: t("list.colUsd"), meta: { numeric: true }, cell: ({ row }) => <Money amount={row.original.totalUsd} currency="USD" className="text-fg-muted" /> },
    ],
    [t],
  );
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  const onPagination = (u: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const next = typeof u === "function" ? u({ pageIndex: page - 1, pageSize }) : u;
    url.set({ page: next.pageIndex + 1, pageSize: next.pageSize === 25 ? null : next.pageSize });
  };
  const clear = () => url.set({ state: null, workspace: null, currency: null });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          editable ? (
            <Button variant="primary" startIcon={<Plus />} onClick={() => setCreating(true)}>
              {t("create.open")}
            </Button>
          ) : undefined
        }
      />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <div role="search" aria-label={t("list.filters")} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          size="sm"
          aria-label={t("list.state")}
          className="w-full sm:w-48"
          value={state || "all"}
          onValueChange={(v) => url.set({ state: v })}
          options={[{ value: "all", label: t("list.allStates") }, ...STATES.map((s) => ({ value: s, label: statusLabel("invoice", s) }))]}
        />
        {workspaces.data ? (
          <Select
            size="sm"
            aria-label={t("list.workspace")}
            className="w-full sm:w-56"
            value={workspaceId || "all"}
            onValueChange={(v) => url.set({ workspace: v })}
            options={[{ value: "all", label: t("list.allWorkspaces") }, ...workspaces.data.items.map((w) => ({ value: w.id, label: <bdi dir="auto">{w.name}</bdi> }))]}
          />
        ) : null}
        <Select
          size="sm"
          aria-label={t("list.currency")}
          className="w-full sm:w-56"
          value={currency || "all"}
          onValueChange={(v) => url.set({ currency: v })}
          options={[{ value: "all", label: t("list.allCurrencies") }, ...CURRENCIES.map((c) => ({ value: c, label: `${names.currency(c)} (${c})` }))]}
        />
        {filtered ? (
          <Button size="sm" variant="ghost" startIcon={<X />} onClick={clear}>
            {t("list.clear")}
          </Button>
        ) : null}
      </div>
      {data && data.items.length ? (
        <p className="text-body-sm text-fg-muted">
          {t("list.pageTotal")} <Money amount={pageUsd} currency="USD" className="font-semibold text-fg" />
        </p>
      ) : null}
      <DataTable
        label={t("list.title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        onRetry={refetch}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize }}
        onPaginationChange={onPagination}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        error={{ title: tc("loadFailed"), description: tc("loadFailedBody") }}
        empty={
          filtered
            ? { title: t("list.noMatch"), action: <Button size="sm" variant="secondary" startIcon={<X />} onClick={clear}>{t("list.clear")}</Button> }
            : { title: t("list.empty"), description: t("list.emptyBody") }
        }
      />
      {creating ? <NewInvoiceDialog onClose={() => setCreating(false)} workspaceId={workspaceId || undefined} /> : null}
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="billing:view">
      <Suspense>
        <InvoicesList />
      </Suspense>
    </RequirePermission>
  );
}
