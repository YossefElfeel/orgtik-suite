"use client";

import { Suspense, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Field, LoadingState, PageHeader, SegmentedControl, Select, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { PriorityBadge, TICKET_STATES, TicketStatus, useTicketStateLabel } from "@/components/support/status";
import { listStatus, useUrlState } from "@/components/system/kit";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { useTicketsQuery, type Ticket } from "@/store/support";

const PAGE_SIZE = 25;
const CATEGORIES = ["billing", "sales", "product", "technical"];

function Tickets() {
  const t = useTranslations("Support");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const stateLabel = useTicketStateLabel();
  const url = useUrlState();
  const state = url.get("state");
  const mine = url.get("mine") === "1";
  const page = Math.max(1, Number(url.get("page")) || 1);
  const { data, isLoading, error, refetch } = useTicketsQuery({ state: state || undefined, mine: mine ? 1 : undefined, page, pageSize: PAGE_SIZE });

  const columns = useMemo<ColumnDef<Ticket, unknown>[]>(
    () => [
      {
        id: "ticket",
        header: t("list.ticket"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link href={`/tickets/${row.original.id}`} className="truncate font-medium text-fg hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-focus">
              <span dir="ltr">{row.original.number}</span> · <span dir="auto">{row.original.subject}</span>
            </Link>
            <span className="truncate text-caption text-fg-subtle">
              <bdi dir="auto">{row.original.workspace ?? row.original.workspaceId}</bdi> · {CATEGORIES.includes(row.original.category) ? t(`categories.${row.original.category}`) : row.original.category}
            </span>
          </span>
        ),
      },
      { id: "priority", header: t("list.priority"), cell: ({ row }) => <PriorityBadge priority={row.original.priority} /> },
      { id: "state", header: t("list.state"), cell: ({ row }) => <TicketStatus state={row.original.state} /> },
      {
        id: "assignee",
        header: t("list.assignee"),
        cell: ({ row }) => (row.original.assigneeName ? <bdi dir="auto">{row.original.assigneeName}</bdi> : <span className="text-fg-subtle">{t("list.unassigned")}</span>),
      },
      { id: "updated", header: t("list.updated"), meta: { numeric: true }, cell: ({ row }) => f.date(row.original.updatedAt, { dateStyle: "medium" }) },
    ],
    [t, f],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("list.title")} description={t("list.description")} />
      {!can("tickets:edit") ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("list.state")} className="min-w-52">
          <Select value={state || "all"} onValueChange={(v) => url.set({ state: v === "all" ? null : v })} options={[{ value: "all", label: t("list.allStates") }, ...TICKET_STATES.map((s) => ({ value: s, label: stateLabel(s) }))]} />
        </Field>
        <SegmentedControl
          label={t("list.whose")}
          value={mine ? "mine" : "all"}
          onValueChange={(v) => url.set({ mine: v === "mine" ? "1" : null })}
          segments={[
            { value: "all", label: t("list.everyone") },
            { value: "mine", label: t("list.mine") },
          ]}
        />
      </div>
      <DataTable
        label={t("list.title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={listStatus(isLoading, error)}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize: PAGE_SIZE }}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u({ pageIndex: page - 1, pageSize: PAGE_SIZE }) : u;
          url.set({ page: next.pageIndex + 1 === 1 ? null : next.pageIndex + 1 });
        }}
        pageSizes={[PAGE_SIZE]}
        onRetry={refetch}
        empty={state || mine ? { title: t("list.noneFiltered"), description: t("list.noneFilteredBody") } : { title: t("list.none"), description: t("list.noneBody") }}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <RequirePermission permission="tickets:view">
      <Suspense fallback={<LoadingState />}>
        <Tickets />
      </Suspense>
    </RequirePermission>
  );
}
