"use client";
import { FileText } from "@phosphor-icons/react";

import { useCallback, useMemo, useState } from "react";
import DataTable from "@/components/bindings/ResourceTable";
import { SectionCard } from "../SectionCard";
import { InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import { Skeleton } from "@orgtik/ui";
import { useGetEmployeePayslipsQuery, useLazyDownloadEmployeePayslipQuery } from "@/redux/features/employee/employeeApi";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getEmployeePayslipColumns } from "./columns";

type PayslipsSectionProps = {
  employeeId: string | number;
  isLoading?: boolean;
};

export function PayslipsSection({
  employeeId,
  isLoading: isEmployeeLoading,
}: PayslipsSectionProps) {
  const t = useTranslations("employees.details.payslips");
  const tPayroll = useTranslations("payroll");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading: isPayslipsLoading, isError: isPayslipsError, refetch: refetchPayslips } = useGetEmployeePayslipsQuery({
    id: employeeId,
    page,
    limit,
    sortBy: "createdAt",
    order: "DESC",
  });

  const [triggerDownload, { isLoading: isDownloading }] =
    useLazyDownloadEmployeePayslipQuery();

  const handleDownload = useCallback(
    async ({
      employeeId: empId,
      payslipId,
      periodTitle,
    }: {
      employeeId: string | number;
      payslipId: number;
      periodTitle: string;
    }) => {
      try {
        const blob = await triggerDownload({
          employeeId: empId,
          payslipId,
        }).unwrap();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `payslip-${periodTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        toast.error(tPayroll("payslip.downloadError"));
      }
    },
    [triggerDownload, tPayroll],
  );

  const columns = useMemo(
    () =>
      getEmployeePayslipColumns(
        employeeId,
        t,
        tPayroll,
        handleDownload,
        isDownloading,
      ),
    [employeeId, t, tPayroll, handleDownload, isDownloading],
  );

  const payslips = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  if (isEmployeeLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </InfoCardSkeleton>
    );
  }

  return (
    <SectionCard title={t("title")} icon={FileText}>
      <DataTable
        columns={columns}
        data={payslips}
        isLoading={isPayslipsLoading}
        isError={isPayslipsError}
        onRetry={refetchPayslips}
        emptyMessage={t("empty")}
        pagination={
          meta
            ? {
                currentPage: meta.page,
                totalPages: meta.totalPages,
                limit: meta.limit,
                totalItems: meta.total,
                onPageChange: setPage,
              }
            : undefined
        }
      />
    </SectionCard>
  );
}
