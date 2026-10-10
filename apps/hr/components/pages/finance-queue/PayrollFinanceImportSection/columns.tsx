"use client";
import { Eye } from "@phosphor-icons/react";

import type { ColumnDef } from "@tanstack/react-table";
import { IconButton } from "@/components/shared/IconButton";
import type { PayrollFinanceImportBatch } from "@/types/payroll";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

export function useImportBatchColumns() {
  const t = useTranslations("financeQueue.import");
  const format = useFormatter();
  // Date and time in the reader's language (it was British English with am/pm).
  const dateTime = (value: string | null | undefined) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }) : "-";
  };

  return useMemo<ColumnDef<PayrollFinanceImportBatch>[]>(
    () => [
      {
        accessorKey: "filename",
        header: t("columns.filename"),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            <bdi>{row.original.filename}</bdi>
          </span>
        ),
      },
      {
        accessorKey: "format",
        header: t("columns.format"),
        cell: ({ row }) => (
          <span className="uppercase text-secondary"><bdi>{row.original.format}</bdi></span>
        ),
      },
      {
        accessorKey: "runId",
        header: t("columns.runId"),
        cell: ({ row }) => row.original.runId,
      },
      {
        accessorKey: "rowCount",
        header: t("columns.rowCount"),
        cell: ({ row }) => row.original.rowCount,
      },
      {
        accessorKey: "createdCount",
        header: t("columns.createdCount"),
        cell: ({ row }) => row.original.createdCount,
      },
      {
        accessorKey: "errorCount",
        header: t("columns.errorCount"),
        cell: ({ row }) => (
          <span
            className={
              row.original.errorCount > 0 ? "text-destructive font-medium" : ""
            }
          >
            {row.original.errorCount}
          </span>
        ),
      },
      {
        accessorKey: "importedByUserId",
        header: t("columns.importedBy"),
        cell: ({ row }) => row.original.importedByUserId,
      },
      {
        accessorKey: "createdAt",
        header: t("columns.createdAt"),
        cell: ({ row }) => dateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: t("columns.action"),
        cell: ({ row }) => (
          <IconButton
            label={t("actions.view")}
            variant="secondary"
            href={`/finance-queue/${row.original.runId}`}
          >
            <Eye className="size-4 text-primary" />
          </IconButton>
        ),
      },
    ],
    [t, format],
  );
}
