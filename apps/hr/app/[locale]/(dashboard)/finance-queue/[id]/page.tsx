"use client";
import { CurrencyCircleDollar as CurrencyCircleDollarIcon, FileArrowDown as FileArrowDownIcon, FileZip as FileZipIcon } from "@phosphor-icons/react";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MainHeader from "@/components/layout/MainHeader";
import {
  useLazyExportPayrollFinanceSheetQuery,
  useLazyExportPayrollRunPayslipsZipQuery,
  useGetPayrollRunItemsPayoutQuery,
  usePayAllPayrollMutation,
} from "@/redux/features/payroll/payrollApi";
import DataTable from "@/components/shared/Table";
import { useColumns } from "./columns";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function FinanceQueue() {
  const t = useTranslations("financeQueue");
  const params = useParams() as { locale: string; id: string };
  const { locale, id } = params;
  const payoutRunId = Number(id);
  const columns = useColumns();
  const [search, setSearch] = useState("");
  const [filteredItems, setFilteredItems] = useState<
    "approved" | "queued" | "paid"
  >();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: payoutItemsResponse, isLoading, isError, refetch } =
    useGetPayrollRunItemsPayoutQuery(
      {
        id: payoutRunId,
        page,
        limit,
        q: search || undefined,
        status: filteredItems,
      },
      {
        skip: Number.isNaN(payoutRunId),
      },
    );

  const items = payoutItemsResponse?.data?.items || [];
  const [triggerExportSheet, { isLoading: isExportingSheet }] =
    useLazyExportPayrollFinanceSheetQuery();
  const [triggerExportPayslips, { isLoading: isExportingPayslips }] =
    useLazyExportPayrollRunPayslipsZipQuery();
  const [payAllPayroll, { isLoading: isPaying }] = usePayAllPayrollMutation();

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSheet = async (runId: number) => {
    try {
      const blob = await triggerExportSheet({ runId, format: "xlsx" }).unwrap();
      downloadBlob(blob, `payroll-finance-run-${runId}.xlsx`);
    } catch (error) {
      console.error("Finance sheet export failed:", error);
    }
  };

  const handleExportPayslipsZip = async (runId: number) => {
    try {
      const blob = await triggerExportPayslips(runId).unwrap();
      downloadBlob(blob, `payroll-run-${runId}-payslips.zip`);
    } catch (error) {
      console.error("Payslips ZIP export failed:", error);
    }
  };

  // const handlePayAll = async (runId: number) => {
  //   try {
  //     await payAllroll(runId).unwrap();
  //   } catch (error) {
  //     console.error("Pay all failed:", error);
  //   }
  // };

  const handlePayAll = (runId: number) => {
    try {
      payAllPayroll(runId).unwrap();
    } catch (error) {
      console.error("Failed to mark payroll as paid:", error);
    }
  };

  return (
    <div>
      <MainHeader
        title={t("detailsTitle", { id: id })}
        backBtn
        backBtnurl="/finance-queue"
      />

      <section className="main-padding flex items-end justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportSheet(payoutRunId)}
            disabled={isExportingSheet}
          >
            <FileArrowDownIcon aria-hidden="true" />
            {t("exportFinanceSheet")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportPayslipsZip(payoutRunId)}
            disabled={isExportingPayslips}
          >
            <FileZipIcon aria-hidden="true" />
            {t("exportPayslipsZip")}
          </Button>
          <Button onClick={() => handlePayAll(payoutRunId)} disabled={isPaying}>
            <CurrencyCircleDollarIcon aria-hidden="true" />
            {t("payAll")}
          </Button>
        </div>
      </section>
      <ToolbarSearchAndFilter
        searchFunctions={{
          search,
          setSearch,
        }}
        filterFunctions={{
          activeFilter: filteredItems as string,
          setActiveFilter: (filter: string | number) =>
            setFilteredItems(filter as "approved" | "queued" | "paid"),
          filterData: [
            { id: "approved", name: t("filters.approved") },
            { id: "queued", name: t("filters.queued") },
            { id: "paid", name: t("filters.paid") },
          ],
        }}
      />
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage={t("table.noItems")}
        pagination={{
          currentPage: page,
          limit: limit,
          totalPages: payoutItemsResponse?.data?.meta?.totalPages || 0,
          onLimitChange: (limit) => {
            setLimit(limit);
            setPage(1); // reset
          },
          onPageChange: (page) => {
            setPage(page);
          },
        }}
      />
    </div>
  );
}

export default FinanceQueue;
