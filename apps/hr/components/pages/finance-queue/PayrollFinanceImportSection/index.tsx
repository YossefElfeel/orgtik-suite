"use client";
import { CircleNotch as Loader2, DownloadSimple as Download, UploadSimple as Upload } from "@phosphor-icons/react";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/Table";
import {
  useGetPayrollFinanceImportBatchesQuery,
  useImportPayrollFinanceSheetMutation,
  useLazyDownloadPayrollFinanceTemplateQuery,
} from "@/redux/features/payroll/payrollApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { useImportBatchColumns } from "./columns";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function PayrollFinanceImportSection() {
  const t = useTranslations("financeQueue.import");
  const reqWithToaster = useReqWithToaster();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [triggerDownloadTemplate, { isLoading: isDownloadingTemplate }] =
    useLazyDownloadPayrollFinanceTemplateQuery();
  const [importSheet, { isLoading: isImporting }] =
    useImportPayrollFinanceSheetMutation();

  const { data, isLoading, isError, refetch } = useGetPayrollFinanceImportBatchesQuery({
    page,
    limit,
  });

  const columns = useImportBatchColumns();
  const batches = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const handleDownloadTemplate = async () => {
    try {
      const blob = await triggerDownloadTemplate().unwrap();
      downloadBlob(blob, "payroll-finance-import-template.xlsx");
    } catch {
      // handled by baseApi
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await reqWithToaster(t("importing"), async () => {
      await importSheet(formData).unwrap();
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-raised p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">{t("title")}</h2>
          <p className="mt-1 text-sm text-secondary">{t("description")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Download className="me-2 size-4" />
            )}
            {t("downloadTemplate")}
          </Button>
          <Button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Upload className="me-2 size-4" />
            )}
            {t("importFile")}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage={t("empty")}
        pagination={
          meta
            ? {
                currentPage: meta.page,
                totalPages: meta.totalPages,
                limit: meta.limit,
                totalItems: meta.total,
                onPageChange: setPage,
                onLimitChange: (newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                },
              }
            : undefined
        }
      />
    </div>
  );
}
