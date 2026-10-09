"use client";
import { useTranslations } from "next-intl";
import { Card, Skeleton, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";

type Row = { label: string; value: number };
export function RankingChart({
  title,
  description,
  rows,
  valueLabel,
  label,
  loading,
  minRows = 8,
}: {
  title: string;
  description?: string;
  rows: Row[];
  valueLabel: string;
  label: string;
  loading: boolean;
  minRows?: number;
}) {
  const t = useTranslations("Improvements");
  const f = useFormatter();
  const max = Math.max(1, ...rows.map((row) => row.value));
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "label", header: label },
    {
      accessorKey: "value",
      header: valueLabel,
      meta: { numeric: true },
      cell: ({ row }) => f.number(row.original.value),
    },
  ];
  return (
    <Card className="flex min-w-0 flex-col gap-5">
      <header className="flex min-h-16 flex-col gap-1">
        <h3 className="font-display text-title-sm text-fg">{title}</h3>
        <p className="text-body-sm text-fg-muted">
          {description || valueLabel}
        </p>
      </header>
      <div
        aria-label={title}
        role="img"
        className="flex flex-col gap-3"
        style={{ minHeight: minRows * 36 }}
      >
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          rows.map((row, index) => (
            <div
              key={row.label}
              className="grid min-h-6 grid-cols-[minmax(6rem,35%)_1fr] items-center gap-3 text-body-sm"
            >
              <span dir="auto" className="text-end text-fg-muted">
                {row.label}
              </span>
              <div className="pe-12">
                <div
                  className="relative h-6"
                  style={{ width: `${(row.value / max) * 100}%` }}
                >
                  <span
                    className="absolute inset-0 bg-action-primary"
                    style={{
                      opacity: 1 - (index / Math.max(1, rows.length)) * 0.55,
                    }}
                  />
                  <span className="absolute start-full ps-2 font-semibold tabular-nums text-fg">
                    {f.number(row.value)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <details className="mt-auto border-t border-line pt-3">
        <summary className="cursor-pointer text-body-sm text-fg-muted">
          {t("viewData")}
        </summary>
        <DataTable
          empty={{ title: t("noResults") }}
          label={title}
          data={rows}
          columns={columns}
          getRowId={(row) => row.label}
        />
      </details>
    </Card>
  );
}
