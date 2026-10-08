"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Badge, Button, PageHeader, type Tone } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { QuoteDialog } from "@/components/customers/QuoteDialog";
import { DateText, Money, useToolName } from "@/components/customers/shared";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useCustomPlansQuery, type CustomPlanRequest } from "@/store/customers";

const TONE: Record<string, Tone> = { new: "info", quoted: "warning", accepted: "success", declined: "neutral", expired: "neutral" };

function CustomPlansPage() {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const toolName = useToolName();
  const sep = useLocale() === "ar" ? "، " : ", ";
  const can = useCan();
  const editable = can("workspaces:edit");
  const { data, isLoading, error, refetch } = useCustomPlansQuery();
  const [quoting, setQuoting] = useState<CustomPlanRequest | null>(null);
  const rows = useMemo(() => (data ?? []).slice().sort((a, b) => Number(b.state === "new") - Number(a.state === "new") || b.createdAt.localeCompare(a.createdAt)), [data]);

  const columns = useMemo<ColumnDef<CustomPlanRequest, unknown>[]>(
    () => [
      {
        id: "workspace",
        header: t("customPlans.colWorkspace"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-start gap-0.5">
            <Link href={`/workspaces/${row.original.workspaceId}`} className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              <bdi dir="auto">{row.original.workspace ?? row.original.workspaceId}</bdi>
            </Link>
            <span className="text-caption text-fg-subtle">
              <DateText value={row.original.createdAt} />
            </span>
          </span>
        ),
      },
      {
        id: "ask",
        header: t("customPlans.colAsk"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="flex min-w-48 flex-col gap-0.5 text-body-sm">
              <span className="text-fg">{r.tools.map(toolName).join(sep)}</span>
              <span className="text-fg-muted">
                {t("customPlans.seats", { count: r.seats })} · {t.has(`cycle.${r.cycle}`) ? t(`cycle.${r.cycle}`) : r.cycle}
              </span>
              {r.notes ? <span className="text-caption text-fg-subtle"><bdi dir="auto">{r.notes}</bdi></span> : null}
            </span>
          );
        },
      },
      {
        id: "state",
        header: t("customPlans.colState"),
        cell: ({ row }) => (
          <Badge size="sm" tone={TONE[row.original.state] ?? "neutral"}>
            {t.has(`customPlans.state.${row.original.state}`) ? t(`customPlans.state.${row.original.state}`) : row.original.state}
          </Badge>
        ),
      },
      {
        id: "quote",
        header: t("customPlans.colQuote"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const q = row.original.quote;
          if (!q) return <span className="text-fg-muted">—</span>;
          return (
            <span className="flex flex-col items-end gap-0.5">
              <Money amount={q.amount} currency={q.currency} className="text-fg" />
              <span className="text-caption text-fg-subtle">
                {t("customPlans.validUntil")} <DateText value={q.validUntil} />
              </span>
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("customPlans.colActions")}</span>,
        meta: { numeric: true },
        cell: ({ row }) =>
          editable && (row.original.state === "new" || row.original.state === "quoted") ? (
            <Button size="sm" variant={row.original.state === "new" ? "primary" : "secondary"} startIcon={<PaperPlaneTilt className="rtl:-scale-x-100" />} onClick={() => setQuoting(row.original)} aria-label={t(row.original.state === "new" ? "customPlans.quoteFor" : "customPlans.requoteFor", { name: row.original.workspace ?? row.original.workspaceId })}>
              {row.original.state === "new" ? t("customPlans.quote") : t("customPlans.requote")}
            </Button>
          ) : null,
      },
    ],
    [t, toolName, sep, editable],
  );
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("customPlans.title")} description={t("customPlans.description")} />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <DataTable
        label={t("customPlans.title")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        status={status}
        onRetry={refetch}
        paginate
        error={{ title: tc("loadFailed"), description: tc("loadFailedBody") }}
        empty={{ title: t("customPlans.empty"), description: t("customPlans.emptyBody") }}
      />
      {quoting ? <QuoteDialog request={quoting} onClose={() => setQuoting(null)} /> : null}
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="workspaces:view">
      <CustomPlansPage />
    </RequirePermission>
  );
}
