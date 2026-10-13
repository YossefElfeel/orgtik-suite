"use client";

// Export: a CSV of the table the person is looking at, made in the browser. It replaces
// "Share › Send report", which sent nothing and asked for the format as free text (MKT-069).
import { useTranslations } from "next-intl";
import { Export } from "@phosphor-icons/react";
import { Button, toast, csvCell as cell } from "@orgtik/ui";

export type CsvCell = string | number | null | undefined;

export function downloadCsv(fileName: string, head: string[], rows: CsvCell[][]) {
  // The BOM makes spreadsheet apps read the file as UTF-8 (Arabic names stay readable).
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** A file name from plain parts: "profiles-2026-09-01-2026-09-30.csv". */
export const csvName = (...parts: (string | null | undefined)[]) =>
  parts
    .filter(Boolean)
    .map((p) => String(p).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-") || "export";

export function ExportButton({ fileName, head, rows, label }: { fileName: string; head: string[]; rows: CsvCell[][]; label?: string }) {
  const t = useTranslations("Insights");
  return (
    <Button
      variant="secondary"
      startIcon={<Export />}
      disabled={!rows.length}
      onClick={() => {
        downloadCsv(fileName, head, rows);
        toast.success(t("exported", { count: rows.length }));
      }}
    >
      {label ?? t("export")}
    </Button>
  );
}
