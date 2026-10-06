"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, Select, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Link } from "@/i18n/routing";
import { typeOfId } from "@/lib/contentTypes";
import { statusOf, useAuditQuery, useMembersQuery, type AuditEvent } from "@/store/api";

const KINDS = ["all", "content", "media", "redirect", "idea", "lead", "settings"] as const;

// Who did what, when: every save, review, publish and setting, newest first. Append-only.
function AuditLog() {
  const t = useTranslations("Audit");
  const f = useFormatter();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [by, setBy] = useState("all");
  const [page, setPage] = useState(1);
  const members = useMembersQuery();
  const type = kind === "all" ? undefined : kind;
  const { data, isLoading, error, refetch } = useAuditQuery({ type, by: by === "all" ? undefined : by, page, pageSize: 25 });

  const columns = useMemo<ColumnDef<AuditEvent, any>[]>(
    () => [
      { id: "at", header: t("colWhen"), cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{f.date(row.original.at, { dateStyle: "medium", timeStyle: "short" })}</span> },
      { id: "by", header: t("colWho"), cell: ({ row }) => <bdi dir="auto">{row.original.by.name ?? t(row.original.by.key === "scheduler" ? "scheduler" : "system")}</bdi> },
      { id: "action", header: t("colWhat"), cell: ({ row }) => <span className="text-fg">{t.has(`actions.${row.original.action}`) ? t(`actions.${row.original.action}`) : row.original.action}</span> },
      {
        id: "entry",
        header: t("colOn"),
        cell: ({ row }) => {
          const a = row.original;
          const ty = typeOfId(a.entry);
          return ty ? (
            <Link href={`/content/${ty.area}/${a.entry}`} dir="ltr" className="font-mono text-body-sm text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {a.entry}
              {a.locale ? ` · ${a.locale}` : ""}
            </Link>
          ) : (
            <span dir="ltr" className="font-mono text-body-sm text-fg-muted">{a.entry}</span>
          );
        },
      },
      { id: "version", header: t("colVersion"), meta: { numeric: true }, cell: ({ row }) => <span className="tabular-nums text-fg-subtle">{row.original.version ? `v${row.original.version}` : ""}</span> },
    ],
    [t, f],
  );
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex flex-wrap items-center gap-3">
        <Select size="sm" aria-label={t("kind")} value={kind} onValueChange={(v) => (setKind((v ?? "all") as (typeof KINDS)[number]), setPage(1))} options={KINDS.map((k) => ({ value: k, label: t(`kinds.${k}`) }))} className="w-52" />
        <Select
          size="sm"
          aria-label={t("colWho")}
          value={by}
          onValueChange={(v) => (setBy(v ?? "all"), setPage(1))}
          options={[{ value: "all", label: t("everyone") }, ...(members.data?.items ?? []).map((m) => ({ value: m.key, label: <bdi dir="auto">{m.name}</bdi> }))]}
          className="w-56"
        />
      </div>
      <DataTable
        label={t("title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => `${r.at}-${r.entry}-${r.action}`}
        status={status}
        onRetry={refetch}
        empty={{ title: t("empty") }}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize: 25 }}
        onPaginationChange={(u) => setPage((typeof u === "function" ? u({ pageIndex: page - 1, pageSize: 25 }) : u).pageIndex + 1)}
      />
    </div>
  );
}

export default function AuditPage() {
  return (
    <RequirePermission permission="settings:view">
      <AuditLog />
    </RequirePermission>
  );
}
