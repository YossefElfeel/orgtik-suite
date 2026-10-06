"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Select, StatusBadge, useStatusLabel } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { COUNTRIES, Money, TOOLS, useRegionNames, useToolName, useUrlFilters } from "@/components/customers/shared";
import { Link } from "@/i18n/routing";
import { statusOf } from "@/store/api";
import { useWorkspacesQuery, type LineState, type WorkspaceSummary } from "@/store/customers";

const STATES = ["active", "past_due", "suspended", "cancelled"] as const;
// The lines that need someone's attention first.
const LINE_ORDER: LineState[] = ["past_due", "read_only", "trialing", "cancelling", "active", "free", "ended", "deleted"];

/** The workspace's tools, grouped under each line state: "Active: Tasks, Files". */
function ToolLines({ tools }: { tools: WorkspaceSummary["tools"] }) {
  const toolName = useToolName();
  const sep = useLocale() === "ar" ? "، " : ", ";
  const groups = LINE_ORDER.map((s) => ({ s, names: tools.filter((x) => x.state === s).map((x) => toolName(x.tool)) })).filter((g) => g.names.length);
  if (!groups.length) return <span className="text-fg-muted">—</span>;
  return (
    <ul className="flex flex-col gap-1">
      {groups.map((g) => (
        <li key={g.s} className="flex flex-wrap items-center gap-1.5">
          <StatusBadge entity="subscription_line" state={g.s} size="sm" />
          <span className="text-body-sm text-fg-muted">{g.names.join(sep)}</span>
        </li>
      ))}
    </ul>
  );
}

function WorkspacesList() {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const statusLabel = useStatusLabel();
  const toolName = useToolName();
  const names = useRegionNames();
  const url = useUrlFilters();
  const q = url.get("q");
  const state = url.get("state");
  const country = url.get("country");
  const tool = url.get("tool");
  const page = Math.max(1, Number(url.get("page")) || 1);
  const pageSize = Number(url.get("pageSize")) || 25;

  // The search box writes to the address after a pause, not on every key.
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => url.set({ q: search.trim() }), 300);
    return () => clearTimeout(id);
  }, [search, q, url]);

  const { data, isLoading, error, refetch, isFetching } = useWorkspacesQuery({ q: q || undefined, state: state || undefined, country: country || undefined, tool: tool || undefined, page, pageSize });
  const filtered = Boolean(q || state || country || tool);

  const columns = useMemo<ColumnDef<WorkspaceSummary, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("list.colWorkspace"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const w = row.original;
          return (
            <span className="flex min-w-40 flex-col items-start gap-0.5">
              <Link href={`/workspaces/${w.id}`} className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                <bdi dir="auto">{w.name}</bdi>
              </Link>
              <span className="text-caption text-fg-subtle">{names.country(w.country)}</span>
            </span>
          );
        },
      },
      {
        id: "owner",
        header: t("list.colOwner"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const o = row.original.owner;
          if (!o) return <span className="text-fg-muted">—</span>;
          return (
            <span className="flex flex-col items-start gap-0.5">
              <bdi dir="auto" className="text-fg">{o.name}</bdi>
              <span dir="ltr" className="text-caption text-fg-subtle">{o.email}</span>
            </span>
          );
        },
      },
      { id: "state", header: t("list.colState"), cell: ({ row }) => <StatusBadge entity="workspace" state={row.original.state} size="sm" /> },
      { id: "seats", header: t("list.colSeats"), meta: { numeric: true }, cell: ({ row }) => <span className="tabular-nums">{row.original.seats}</span> },
      { id: "tools", header: t("list.colTools"), meta: { wrap: true }, cell: ({ row }) => <ToolLines tools={row.original.tools} /> },
      {
        id: "mrr",
        header: t("list.colMrr"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-end gap-0.5">
            <Money amount={row.original.mrr} currency={row.original.currency} className="text-fg" />
            <Money amount={row.original.mrrUsd} currency="USD" className="text-caption text-fg-subtle" />
          </span>
        ),
      },
    ],
    [t, names],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  const onPagination = (u: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const next = typeof u === "function" ? u({ pageIndex: page - 1, pageSize }) : u;
    url.set({ page: next.pageIndex + 1, pageSize: next.pageSize === 25 ? null : next.pageSize });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("list.title")} description={t("list.description")} />
      <div role="search" aria-label={t("list.filters")} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("list.search")}
          placeholder={t("list.search")}
          startIcon={<MagnifyingGlass className="size-4" />}
          className="w-full sm:w-72"
        />
        <Select
          size="sm"
          aria-label={t("list.state")}
          className="w-full sm:w-44"
          value={state || "all"}
          onValueChange={(v) => url.set({ state: v })}
          options={[{ value: "all", label: t("list.allStates") }, ...STATES.map((s) => ({ value: s, label: statusLabel("workspace", s) }))]}
        />
        <Select
          size="sm"
          aria-label={t("list.country")}
          className="w-full sm:w-48"
          value={country || "all"}
          onValueChange={(v) => url.set({ country: v })}
          options={[{ value: "all", label: t("list.allCountries") }, ...COUNTRIES.map((c) => ({ value: c, label: names.country(c) }))]}
        />
        <Select
          size="sm"
          aria-label={t("list.tool")}
          className="w-full sm:w-44"
          value={tool || "all"}
          onValueChange={(v) => url.set({ tool: v })}
          options={[{ value: "all", label: t("list.allTools") }, ...TOOLS.map((k) => ({ value: k, label: toolName(k) }))]}
        />
        {filtered ? (
          <Button size="sm" variant="ghost" startIcon={<X />} onClick={() => url.set({ q: null, state: null, country: null, tool: null })}>
            {t("list.clear")}
          </Button>
        ) : null}
      </div>
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
            ? { title: t("list.noMatch"), description: t("list.noMatchBody"), action: <Button size="sm" variant="secondary" startIcon={<X />} onClick={() => url.set({ q: null, state: null, country: null, tool: null })}>{t("list.clear")}</Button> }
            : { title: t("list.empty"), description: t("list.emptyBody") }
        }
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="workspaces:view">
      <Suspense>
        <WorkspacesList />
      </Suspense>
    </RequirePermission>
  );
}
