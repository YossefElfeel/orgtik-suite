"use client";

import { Suspense, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Field, LoadingState, PageHeader, Select, SegmentedControl, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { SR_STATES, SrStatus, useSrStateLabel } from "@/components/services/status";
import { listStatus, usePick, useUrlState } from "@/components/system/kit";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { useServiceRequestsQuery, type ServiceRequest, type SrState } from "@/store/services";

const PAGE_SIZE = 25;

function Requests() {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const pick = usePick();
  const can = useCan();
  const stateLabel = useSrStateLabel();
  const url = useUrlState();
  const state = url.get("state");
  const mine = url.get("mine") === "1";
  const page = Math.max(1, Number(url.get("page")) || 1);
  const { data, isLoading, isFetching, error, refetch } = useServiceRequestsQuery({ state: state || undefined, mine: mine ? 1 : undefined, page, pageSize: PAGE_SIZE });
  const filtered = Boolean(state || mine);

  const columns = useMemo<ColumnDef<ServiceRequest, unknown>[]>(
    () => [
      {
        id: "request",
        header: t("requests.request"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link href={`/service-requests/${row.original.id}`} className="truncate font-medium text-fg hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-focus">
              <span dir="ltr">{row.original.number}</span> · <span dir="auto">{row.original.title}</span>
            </Link>
            <span className="truncate text-caption text-fg-subtle">{pick(row.original.service)}</span>
          </span>
        ),
      },
      {
        id: "workspace",
        header: t("requests.workspace"),
        cell: ({ row }) => <bdi dir="auto">{row.original.workspace ?? row.original.workspaceId}</bdi>,
      },
      { id: "state", header: t("requests.state"), cell: ({ row }) => <SrStatus state={row.original.state} /> },
      {
        id: "assignee",
        header: t("requests.assignee"),
        cell: ({ row }) => (row.original.assigneeName ? <bdi dir="auto">{row.original.assigneeName}</bdi> : <span className="text-fg-subtle">{t("requests.unassigned")}</span>),
      },
      { id: "created", header: t("requests.created"), meta: { numeric: true }, cell: ({ row }) => f.date(row.original.createdAt, { dateStyle: "medium" }) },
    ],
    [t, f, pick],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("requests.title")} description={t("requests.description")} />
      {!can("services:edit") && !can("services:edit:assigned") ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("requests.state")} className="min-w-52">
          <Select
            value={state || "all"}
            onValueChange={(v) => url.set({ state: v === "all" ? null : v })}
            options={[{ value: "all", label: t("requests.allStates") }, ...SR_STATES.map((s) => ({ value: s, label: stateLabel(s as SrState) }))]}
          />
        </Field>
        <SegmentedControl
          label={t("requests.whose")}
          value={mine ? "mine" : "all"}
          onValueChange={(v) => url.set({ mine: v === "mine" ? "1" : null })}
          segments={[
            { value: "all", label: t("requests.everyone") },
            { value: "mine", label: t("requests.mine") },
          ]}
        />
      </div>
      <DataTable
        label={t("requests.title")}
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
        empty={filtered ? { title: t("requests.noneFiltered"), description: t("requests.noneFilteredBody") } : { title: t("requests.none"), description: t("requests.noneBody") }}
      />
      {isFetching && !isLoading ? <span className="sr-only" role="status">{tc("loading")}</span> : null}
    </div>
  );
}

export default function ServiceRequestsPage() {
  return (
    <RequirePermission permission="services:view">
      <Suspense fallback={<LoadingState />}>
        <Requests />
      </Suspense>
    </RequirePermission>
  );
}
